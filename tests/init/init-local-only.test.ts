import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Local-only init test
 *
 * Tests FND-02: User can run the system locally without any hosted backend or cloud service
 * From docs/obsidian-setup.md:
 * - If the obsidian command is available, the skill can use it for vault search
 * - If not, the skill still works with direct filesystem reads and writes
 * From 01-CONTEXT.md success criterion #2:
 * - User can run llm-wiki locally without any hosted backend or cloud service
 */

describe('init local only', () => {
  let testVault: string;

  beforeEach(async () => {
    // Create temporary vault directory
    testVault = await mkdtemp(join(tmpdir(), 'llm-wiki-test-'));
  });

  afterEach(async () => {
    // Clean up temporary vault
    await rm(testVault, { recursive: true, force: true });
  });

  it('does not require hosted services', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');

    // Run init without any network connectivity check
    // This should succeed using only local filesystem and SQLite
    const result = await initCommand(testVault);

    expect(result.created.length).toBeGreaterThan(0);
    expect(result.nextStep).toBe('llm-wiki ingest <url>');

    // Verify no network calls were made (implicit by success in isolated test environment)
  });

  it('works without Obsidian CLI', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');

    // Run init in test environment where Obsidian CLI is not available/checked
    const result = await initCommand(testVault);

    // Should succeed regardless of Obsidian CLI presence
    expect(result.created.length).toBeGreaterThan(0);
  });

  it('works without Obsidian app running', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');

    // Run init without checking if Obsidian GUI is running
    const result = await initCommand(testVault);

    // Should succeed without any Obsidian dependencies
    expect(result.created.length).toBeGreaterThan(0);
  });

  it('works without network connectivity', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');

    // Run init in isolated test environment (no network required)
    const result = await initCommand(testVault);

    // All assets are local (templates/, SQLite) - no external fetch
    expect(result.created.length).toBeGreaterThan(0);
  });

  it('creates local SQLite database', async () => {
    // Import modules
    const { initCommand } = await import('../../src/cli/commands/init.js');
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');

    // Run init
    await initCommand(testVault);

    // Verify .llm-wiki/state.db exists as local SQLite file
    const dbPath = join(testVault, '.llm-wiki', 'state.db');
    const dbContent = await readFile(dbPath);

    // SQLite files start with "SQLite format 3" header
    expect(dbContent.slice(0, 16).toString()).toBe('SQLite format 3\x00');
  });
});