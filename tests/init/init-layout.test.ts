import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, readdir, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Vault layout test
 *
 * Tests FND-03: Human-facing artifacts as normal markdown, machine state under .llm-wiki/
 * From 01-CONTEXT.md D-07:
 * - wiki/ = Human-readable wiki pages (entities, concepts, sources, analyses)
 * - raw/ = Immutable raw sources (captured content)
 * - .llm-wiki/ = Machine state (SQLite database, cache, manifests)
 * - Users understand different zones by browsing directory organization
 */

describe('init layout', () => {
  let testVault: string;

  beforeEach(async () => {
    // Create temporary vault directory
    testVault = await mkdtemp(join(tmpdir(), 'llm-wiki-test-'));
  });

  afterEach(async () => {
    // Clean up temporary vault
    await rm(testVault, { recursive: true, force: true });
  });

  describe('path validation', () => {
    it('rejects path escapes in vault target', async () => {
      // Import modules
      const { validateVaultPath } = await import('../../src/validation/init-options.js');

      // Test path traversal attempts
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/etc/passwd',
        'C:\\Windows\\System32',
      ];

      for (const malicious of maliciousPaths) {
        expect(() => validateVaultPath(malicious)).toThrow();
      }
    });

    it('rejects invalid vault targets', async () => {
      // Import modules
      const { validateVaultPath } = await import('../../src/validation/init-options.js');

      // Test invalid targets
      expect(() => validateVaultPath('')).toThrow();
      expect(() => validateVaultPath(null as any)).toThrow();
      expect(() => validateVaultPath(undefined as any)).toThrow();
    });

    it('accepts valid vault paths', async () => {
      // Import modules
      const { validateVaultPath } = await import('../../src/validation/init-options.js');

      // Test valid paths
      const validPaths = [
        testVault,
        '/home/user/wiki',
        'C:\\Users\\wiki',
        './my-wiki',
      ];

      for (const valid of validPaths) {
        const result = validateVaultPath(valid);
        expect(result).toBeDefined();
      }
    });
  });

  it('separates markdown and sidecar state', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');
    const { getRequiredDirs, getRequiredFiles } = await import('../../src/bootstrap/catalog.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);

    // Verify three-zone separation
    const mkdirActions = plan.create.filter(a => a.kind === 'mkdir');
    const copyActions = plan.create.filter(a => a.kind === 'copy-template');

    // Human-facing destinations: wiki/, raw/, root files
    const humanMkdirs = mkdirActions.filter(a => !(a as any).dest.startsWith('.llm-wiki/'));
    const humanCopies = copyActions.filter(a => !(a as any).dest.startsWith('.llm-wiki/'));

    // Machine state: .llm-wiki/ only
    const machineMkdirs = mkdirActions.filter(a => (a as any).dest.startsWith('.llm-wiki/'));
    const machineDb = plan.create.filter(a => a.kind === 'create-db');

    // Verify: human zones have wiki/ and raw/ dirs
    expect(humanMkdirs.some(a => (a as any).dest.startsWith('wiki/'))).toBe(true);
    expect(humanMkdirs.some(a => (a as any).dest.startsWith('raw/'))).toBe(true);

    // Verify: machine zone has .llm-wiki/ dirs and state.db
    expect(machineMkdirs.some(a => (a as any).dest.startsWith('.llm-wiki/'))).toBe(true);
    expect(machineDb.length).toBe(1);

    // Verify: no markdown files in .llm-wiki/
    const llmWikiCopies = copyActions.filter(a => (a as any).dest.startsWith('.llm-wiki/'));
    expect(llmWikiCopies.length).toBe(0);
  });

  it('human-facing markdown in vault root and wiki/', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);
    const copyActions = plan.create.filter(a => a.kind === 'copy-template');

    // Verify human-facing files are in root or wiki/
    const humanFiles = copyActions.map(a => (a as any).dest);
    expect(humanFiles).toContain('CLAUDE.md'); // root
    expect(humanFiles).toContain('index.md'); // root
    expect(humanFiles).toContain('log.md'); // root
    expect(humanFiles).toContain('wiki/overview.md'); // wiki/
  });

  it('raw sources in raw/', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);
    const mkdirActions = plan.create.filter(a => a.kind === 'mkdir');

    // Verify raw/ directories exist
    const rawDirs = mkdirActions.filter(a => (a as any).dest.startsWith('raw/'));
    expect(rawDirs.some(a => (a as any).dest === 'raw/sources')).toBe(true);
    expect(rawDirs.some(a => (a as any).dest === 'raw/assets')).toBe(true);
  });

  it('machine state in .llm-wiki/', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);
    const mkdirActions = plan.create.filter(a => a.kind === 'mkdir');
    const dbActions = plan.create.filter(a => a.kind === 'create-db');

    // Verify .llm-wiki/ directories
    const llmWikiDirs = mkdirActions.filter(a => (a as any).dest.startsWith('.llm-wiki/'));
    expect(llmWikiDirs.some(a => (a as any).dest === '.llm-wiki/cache')).toBe(true);
    expect(llmWikiDirs.some(a => (a as any).dest === '.llm-wiki/manifests')).toBe(true);

    // Verify state.db is created
    expect(dbActions.length).toBe(1);
  });

  it('no markdown files under .llm-wiki/', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);
    const copyActions = plan.create.filter(a => a.kind === 'copy-template');

    // Verify no markdown files planned for .llm-wiki/
    const llmWikiMarkdown = copyActions.filter(a => (a as any).dest.startsWith('.llm-wiki/') && (a as any).dest.endsWith('.md'));
    expect(llmWikiMarkdown.length).toBe(0);
  });

  it('no state.db outside .llm-wiki/', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);
    const dbActions = plan.create.filter(a => a.kind === 'create-db');

    // Verify state.db destination is always under .llm-wiki/
    expect(dbActions.length).toBe(1);
    const dbDest = (dbActions[0] as any).dest;
    expect(dbDest).toContain('.llm-wiki/');
    expect(dbDest).not.toMatch(/^(wiki|raw)/);
  });
});