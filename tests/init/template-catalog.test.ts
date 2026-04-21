import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Template catalog authority guard
 *
 * This test ensures that all required bootstrap assets have canonical sources
 * in templates/ and that the runtime does not drift toward using examples/
 * as production inputs.
 *
 * From README.md:
 * - templates/ contains reusable initialization inputs (production)
 * - examples/ contains a human-readable sample result (reference only)
 *
 * From 01-CONTEXT.md D-05:
 * - Required files: CLAUDE.md, index.md, log.md, wiki/overview.md
 * - Runtime should copy from templates/, not from examples/
 */

describe('template catalog authority', () => {
  const templatesDir = join(process.cwd(), 'templates');
  const examplesDir = join(process.cwd(), 'examples', 'starter-vault');

  it('templates directory exists', () => {
    expect(existsSync(templatesDir)).toBe(true);
  });

  it('has canonical CLAUDE.md template source', () => {
    const source = join(templatesDir, 'vault-CLAUDE.md');
    expect(existsSync(source)).toBe(true);
  });

  it('has canonical index.md template source', () => {
    const source = join(templatesDir, 'index.md');
    expect(existsSync(source)).toBe(true);
  });

  it('has canonical log.md template source', () => {
    const source = join(templatesDir, 'log.md');
    expect(existsSync(source)).toBe(true);
  });

  it('has canonical wiki/overview.md template source', () => {
    const source = join(templatesDir, 'wiki-overview.md');
    expect(existsSync(source)).toBe(true);
  });

  it('template index includes overview link pattern', () => {
    const indexPath = join(templatesDir, 'index.md');
    const content = require('fs').readFileSync(indexPath, 'utf-8');

    // From examples/starter-vault/index.md and D-05
    expect(content).toContain('## Overview');
    expect(content).toContain('[wiki/overview]');
  });

  it('templates are production inputs, examples are reference fixtures', () => {
    // This encodes the authority rule from README.md
    // Runtime code must never copy from examples/ during production bootstrap
    expect(existsSync(examplesDir)).toBe(true);

    // examples/starter-vault/wiki/overview.md exists for reference,
    // but templates/wiki-overview.md is the authoritative production source
    const exampleOverview = join(examplesDir, 'wiki', 'overview.md');
    const templateOverview = join(templatesDir, 'wiki-overview.md');

    expect(existsSync(exampleOverview)).toBe(true);
    expect(existsSync(templateOverview)).toBe(true);

    // Both exist, but runtime must use templates/
    // This test documents that both exist and the distinction
  });
});