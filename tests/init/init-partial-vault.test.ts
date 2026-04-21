import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Partial vault repair test
 *
 * Tests FND-01 idempotent repair behavior
 * From 01-CONTEXT.md D-06 and success criterion #4:
 * - User can re-run init against partial vault and recover missing required assets without duplicate scaffolding
 * - Idempotent behavior: only create missing files, do not overwrite existing files (preserve user modifications)
 */

describe('init partial vault', () => {
  let testVault: string;

  beforeEach(async () => {
    // Create temporary vault directory
    testVault = await mkdtemp(join(tmpdir(), 'llm-wiki-test-'));
  });

  afterEach(async () => {
    // Clean up temporary vault
    await rm(testVault, { recursive: true, force: true });
  });

  it('repairs missing assets', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');
    const { getRequiredDirs, getRequiredFiles } = await import('../../src/bootstrap/catalog.js');

    // Setup: Create partial vault with some required assets
    await mkdir(join(testVault, 'wiki'), { recursive: true });
    await writeFile(join(testVault, 'CLAUDE.md'), 'user content');
    await writeFile(join(testVault, 'index.md'), 'user content');
    // Missing: wiki/overview.md, log.md, wiki/entities/, .llm-wiki/

    // Plan bootstrap
    const plan = await planBootstrap(testVault);

    // Verify: missing assets are marked for creation
    const createActions = plan.create;
    expect(createActions.some(a => a.kind === 'copy-template' && (a as any).dest === 'log.md')).toBe(true);
    expect(createActions.some(a => a.kind === 'copy-template' && (a as any).dest === 'wiki/overview.md')).toBe(true);
    expect(createActions.some(a => a.kind === 'mkdir' && (a as any).dest === 'wiki/entities')).toBe(true);

    // Verify: existing assets are marked as skipped
    const skipActions = plan.skip;
    expect(skipActions.some(a => a.kind === 'copy-template' && (a as any).dest === 'CLAUDE.md')).toBe(true);
    expect(skipActions.some(a => a.kind === 'copy-template' && (a as any).dest === 'index.md')).toBe(true);
  });

  it('does not overwrite user-modified files', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Setup: Create vault with existing CLAUDE.md that has user modifications
    const userContent = '# Custom user schema\n\nThis is my custom content.';
    await writeFile(join(testVault, 'CLAUDE.md'), userContent);

    // Plan bootstrap
    const plan = await planBootstrap(testVault);

    // Verify: CLAUDE.md should be skipped, not created
    const createClaude = plan.create.some(a => a.kind === 'copy-template' && (a as any).dest === 'CLAUDE.md');
    const skipClaude = plan.skip.some(a => a.kind === 'copy-template' && (a as any).dest === 'CLAUDE.md');

    expect(createClaude).toBe(false);
    expect(skipClaude).toBe(true);
  });

  it('recreates missing directories without duplication', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Setup: Create vault with some directories existing
    await mkdir(join(testVault, 'wiki', 'entities'), { recursive: true });
    // Missing: wiki/concepts/, raw/sources/, .llm-wiki/cache/

    // Plan bootstrap
    const plan = await planBootstrap(testVault);

    // Verify: missing directories are created, existing ones skipped
    const createDirs = plan.create.filter(a => a.kind === 'mkdir').map(a => (a as any).dest);
    const skipDirs = plan.skip.filter(a => a.kind === 'mkdir').map(a => (a as any).dest);

    expect(createDirs).toContain('wiki/concepts');
    expect(createDirs).toContain('raw/sources');
    expect(skipDirs).toContain('wiki/entities');
  });

  it('creates missing .llm-wiki sidecar state', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');

    // Setup: Create vault with human-facing files but missing .llm-wiki/
    await mkdir(join(testVault, 'wiki'), { recursive: true });
    await writeFile(join(testVault, 'CLAUDE.md'), 'content');
    // Missing: .llm-wiki/state.db, .llm-wiki/cache/, .llm-wiki/manifests/

    // Plan bootstrap
    const plan = await planBootstrap(testVault);

    // Verify: sidecar directories and DB are created
    const createDirs = plan.create.filter(a => a.kind === 'mkdir').map(a => (a as any).dest);
    const createDb = plan.create.some(a => a.kind === 'create-db');

    expect(createDirs).toContain('.llm-wiki/cache');
    expect(createDirs).toContain('.llm-wiki/manifests');
    expect(createDb).toBe(true);
  });
});