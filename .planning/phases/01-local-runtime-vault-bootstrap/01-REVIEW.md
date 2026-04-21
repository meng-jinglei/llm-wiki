---
phase: 01-local-runtime-vault-bootstrap
reviewed: 2026-04-21T12:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/bootstrap/apply.ts
  - src/bootstrap/catalog.ts
  - src/bootstrap/plan.ts
  - src/bootstrap/report.ts
  - src/cli/commands/init.ts
  - src/cli/program.ts
  - src/shared/types.ts
  - src/state/init-db.ts
  - src/state/paths.ts
  - src/validation/init-options.ts
  - tests/init/init-empty-vault.test.ts
  - tests/init/init-idempotent.test.ts
  - tests/init/init-layout.test.ts
  - tests/init/init-local-only.test.ts
  - tests/init/init-partial-vault.test.ts
findings:
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-21T12:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Reviewed Phase 1 implementation of local runtime vault bootstrap. The codebase demonstrates solid architecture with plan-then-apply pattern, idempotent behavior, and good test coverage. However, one critical issue in database initialization will cause crashes on repeated runs, and several security gaps in path validation could allow path traversal in edge cases.

The implementation follows the documented design well, but needs fixes before merge.

## Critical Issues

### CR-01: Database initialization violates idempotency and crashes on repeated runs

**File:** `src/state/init-db.ts:35-37`
**Issue:** The `initStateDb()` function uses `CREATE TABLE IF NOT EXISTS` followed by an unconditional `INSERT INTO schema_version`. This violates the idempotent design principle and will crash on second run when the version row already exists (primary key constraint violation).

The function should check if the schema_version table already has a row before inserting. Currently:
1. First run: Creates table, inserts version=1 - succeeds
2. Second run: Table exists (IF NOT EXISTS), tries to insert version=1 again - **CRASH** (duplicate primary key)

**Fix:**
```typescript
export function initStateDb(vaultPath: string): void {
  const dbPath = getStateDbPath(vaultPath);
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      created_at TEXT NOT NULL
    );
  `);

  // Check if schema_version already has a row before inserting
  const existingVersion = db.prepare('SELECT version FROM schema_version LIMIT 1').get();
  
  if (!existingVersion) {
    db.exec(`
      INSERT INTO schema_version (version, created_at)
      VALUES (1, datetime('now'));
    `);
  }

  db.close();
}
```

## Warnings

### WR-01: Path validation incomplete - misses URL-encoded traversal sequences

**File:** `src/validation/init-options.ts:50-57`
**Issue:** The `containsPathEscape()` function only checks for literal `..` sequences. It misses URL-encoded variants like `%2e%2e` (URL-encoded `..`) which could bypass validation before being decoded by filesystem operations. While `normalize()` may resolve some of these, defense-in-depth requires checking for encoded variants.

**Fix:**
```typescript
function containsPathEscape(path: string): boolean {
  // Check for literal .. sequences
  if (path.includes('..')) {
    return true;
  }

  // Check for URL-encoded .. variants
  const decodedVariants = [
    '%2e%2e',     // URL-encoded ..
    '%2e%2e%2f',  // URL-encoded ../
    '%2e%2e%5c',  // URL-encoded ..\\
  ];

  const lowerPath = path.toLowerCase();
  return decodedVariants.some(variant => lowerPath.includes(variant));
}
```

### WR-02: System directory blacklist incomplete and platform-dependent

**File:** `src/validation/init-options.ts:62-89`
**Issue:** The `isAbsolutePathToSystemDir()` function has hardcoded Unix and Windows paths but misses:
- Platform-specific directories (e.g., `/usr/local` on Unix, `D:\` on Windows)
- Relative paths that could resolve to system dirs (though `resolve()` helps here)
- The check for Windows paths won't work on Unix/Linux systems where they're just regular paths

Additionally, the dual-check approach (resolved path + raw path) creates confusion and potential gaps.

**Fix:**
```typescript
function isAbsolutePathToSystemDir(path: string): boolean {
  const resolved = resolve(path);
  const normalizedResolved = normalized.toLowerCase();

  // Platform-specific system directories
  const isWindows = process.platform === 'win32';
  
  const systemDirs = isWindows
    ? [
        'c:\\windows',
        'c:\\program files',
        'c:\\program files (x86)',
        'c:\\system32',
      ]
    : [
        '/etc',
        '/bin',
        '/usr',
        '/var',
        '/root',
        '/home',  // Could be too restrictive
      ];

  return systemDirs.some(sysDir =>
    normalizedResolved.startsWith(sysDir.toLowerCase())
  );
}
```

Or better: Reject paths outside a configurable allowed base directory instead of maintaining a blacklist.

## Info

### IN-01: Unused `dest` parameter in BootstrapAction.create-db

**File:** `src/shared/types.ts:20`
**Issue:** The `create-db` action type includes a `dest` field that's never used in the codebase. `init-db.ts:36` calls `initStateDb(vaultPath)` directly without using the action's `dest`. The `dest` appears in plan.ts:59,61 and report.ts:54 but serves no functional purpose.

This creates minor confusion but isn't a bug. Consider removing it or making it useful.

**Fix:**
```typescript
export type BootstrapAction =
  | { kind: 'mkdir'; dest: string }
  | { kind: 'copy-template'; source: string; dest: string }
  | { kind: 'create-db' }; // Remove unused dest field
```

### IN-02: Missing error handling in CLI action handler

**File:** `src/cli/program.ts:33-36`
**Issue:** The `action` handler for the init command is async but has no try-catch. Errors from `initCommand()` or `formatInitResult()` will crash the CLI process with an unhandled promise rejection. Commander supports async actions, but errors should be caught for user-friendly error messages.

**Fix:**
```typescript
.action(async (options) => {
  try {
    const result = await initCommand(options.vault);
    console.log(formatInitResult(result));
  } catch (error) {
    console.error('Init failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
```

### IN-03: Template source files not validated at plan time

**File:** `src/bootstrap/catalog.ts:45-50`
**Issue:** The catalog references template files (`templates/vault-CLAUDE.md`, etc.) but doesn't verify these files exist. If a template is missing, `apply.ts:32` will fail with `ENOENT` during `copyFile`. This should be caught during plan phase to provide better error context.

**Fix:**
```typescript
export async function getRequiredFiles() {
  const files = REQUIRED_FILES;
  
  // Validate template sources exist
  for (const file of files) {
    try {
      await access(file.source, constants.F_OK);
    } catch {
      throw new Error(`Template source missing: ${file.source}`);
    }
  }
  
  return files;
}
```

---

_Reviewed: 2026-04-21T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_