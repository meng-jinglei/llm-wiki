import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Idempotent init test
 *
 * Tests FND-01/FND-03 idempotent behavior
 * From 01-CONTEXT.md success criterion #4:
 * - Re-running init repairs missing required files instead of creating duplicate scaffolding
 */

describe('init idempotent', () => {
  let testVault: string;

  beforeEach(async () => {
    // Create temporary vault directory
    testVault = await mkdtemp(join(tmpdir(), 'llm-wiki-test-'));
  });

  afterEach(async () => {
    // Clean up temporary vault
    await rm(testVault, { recursive: true, force: true });
  });

  it('is idempotent', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');

    // First run: init empty vault
    const result1 = await initCommand(testVault);
    expect(result1.created.length).toBeGreaterThan(0);
    expect(result1.skipped.length).toBe(0);
    expect(result1.nextStep).toBe('llm-wiki ingest <url>');

    // Second run: init same vault
    const result2 = await initCommand(testVault);
    expect(result2.created.length).toBe(0);
    expect(result2.skipped.length).toBeGreaterThan(0);
    expect(result2.nextStep).toBe('llm-wiki ingest <url>');
  });

  it('second run produces skipped output', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');

    // Run init twice
    await initCommand(testVault);
    const result = await initCommand(testVault);

    // Verify all paths are skipped, not created
    expect(result.created.length).toBe(0);
    expect(result.repaired.length).toBe(0);
    expect(result.skipped.length).toBeGreaterThan(0);
  });

  it('second run does not modify existing content', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');
    const { readFile } = await import('fs/promises');

    // First run
    await initCommand(testVault);

    // Read content after first run
    const claude1 = await readFile(join(testVault, 'CLAUDE.md'), 'utf-8');

    // Modify content manually
    await writeFile(join(testVault, 'CLAUDE.md'), 'MODIFIED CONTENT');

    // Second run
    await initCommand(testVault);

    // Read content after second run
    const claude2 = await readFile(join(testVault, 'CLAUDE.md'), 'utf-8');

    // Verify content was not overwritten
    expect(claude2).toBe('MODIFIED CONTENT');
  });

  it('handles partial deletion between runs', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');
    const { rm } = await import('fs/promises');

    // First run: create complete vault
    await initCommand(testVault);

    // Delete some files/directories
    await rm(join(testVault, 'wiki', 'overview.md'));
    await rm(join(testVault, 'wiki', 'entities'), { recursive: true, force: true });

    // Second run: repair missing assets
    const result = await initCommand(testVault);

    // Verify missing assets are repaired, existing ones skipped
    expect(result.repaired.length).toBeGreaterThan(0);
    expect(result.repaired).toContain('wiki/overview.md');
    expect(result.repaired).toContain('wiki/entities');
    expect(result.skipped.length).toBeGreaterThan(0);
  });
});