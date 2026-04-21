import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Empty vault bootstrap test
 *
 * Tests FND-01: User can initialize an Obsidian-compatible vault with required LLM Wiki structure
 * From 01-CONTEXT.md success criteria:
 * - User can run init against empty vault and get required folders, schema files, index, log, overview
 */

describe('init empty vault', () => {
  let testVault: string;

  beforeEach(async () => {
    // Create temporary vault directory
    testVault = await mkdtemp(join(tmpdir(), 'llm-wiki-test-'));
  });

  afterEach(async () => {
    // Clean up temporary vault
    await rm(testVault, { recursive: true, force: true });
  });

  it('creates required structure', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');
    const { getRequiredDirs, getRequiredFiles } = await import('../../src/bootstrap/catalog.js');
    const { validateVaultPath } = await import('../../src/validation/init-options.js');

    // Validate vault path
    const validatedPath = validateVaultPath(testVault);
    expect(validatedPath).toBe(testVault);

    // Plan bootstrap for empty vault
    const plan = await planBootstrap(testVault);

    // Verify plan produces all required actions
    const requiredDirs = getRequiredDirs();
    const requiredFiles = getRequiredFiles();

    // All required directories should be in create plan
    expect(plan.create.filter(a => a.kind === 'mkdir').length).toBe(requiredDirs.length);

    // All required files should be in create plan
    expect(plan.create.filter(a => a.kind === 'copy-template').length).toBe(requiredFiles.length);

    // state.db should be created
    expect(plan.create.some(a => a.kind === 'create-db')).toBe(true);

    // Skip should be empty for empty vault
    expect(plan.skip.length).toBe(0);
  });

  it('creates required directories with correct structure', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');
    const { getRequiredDirs } = await import('../../src/bootstrap/catalog.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);
    const requiredDirs = getRequiredDirs();

    // Extract mkdir destinations
    const mkdirActions = plan.create.filter(a => a.kind === 'mkdir');
    const destinations = mkdirActions.map(a => (a as any).dest);

    // Verify three-zone layout
    const wikiDirs = destinations.filter(d => d.startsWith('wiki/'));
    const rawDirs = destinations.filter(d => d.startsWith('raw/'));
    const llmWikiDirs = destinations.filter(d => d.startsWith('.llm-wiki/'));

    expect(wikiDirs.length).toBe(5); // entities, concepts, sources, comparisons, analyses
    expect(rawDirs.length).toBe(2); // sources, assets
    expect(llmWikiDirs.length).toBe(2); // cache, manifests
  });

  it('copies template content correctly', async () => {
    // Import modules
    const { planBootstrap } = await import('../../src/bootstrap/plan.js');
    const { getRequiredFiles } = await import('../../src/bootstrap/catalog.js');

    // Plan bootstrap
    const plan = await planBootstrap(testVault);
    const requiredFiles = getRequiredFiles();

    // Extract copy-template actions
    const copyActions = plan.create.filter(a => a.kind === 'copy-template');

    // Verify correct template sources
    const sources = copyActions.map(a => (a as any).source);
    expect(sources).toContain('templates/vault-CLAUDE.md');
    expect(sources).toContain('templates/index.md');
    expect(sources).toContain('templates/log.md');
    expect(sources).toContain('templates/wiki-overview.md');

    // Verify correct destinations
    const destinations = copyActions.map(a => (a as any).dest);
    expect(destinations).toContain('CLAUDE.md');
    expect(destinations).toContain('index.md');
    expect(destinations).toContain('log.md');
    expect(destinations).toContain('wiki/overview.md');
  });
});