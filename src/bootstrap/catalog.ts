/**
 * Canonical required directory and file catalog
 *
 * From 01-CONTEXT.md D-05:
 * - Copy from templates/ directory to vault
 * - Fixed asset mapping
 *
 * From 01-RESEARCH.md Pattern 2:
 * - One authoritative catalog
 * - Explicit source->destination mapping
 */

/**
 * Required directories
 *
 * From 01-CONTEXT.md D-05:
 * - wiki/: entities, concepts, sources, comparisons, analyses
 * - raw/: sources, assets
 * - .llm-wiki/: cache, manifests
 */
export const REQUIRED_DIRS = [
  'raw/sources',
  'raw/assets',
  'wiki/entities',
  'wiki/concepts',
  'wiki/sources',
  'wiki/comparisons',
  'wiki/analyses',
  '.llm-wiki/cache',
  '.llm-wiki/manifests',
] as const;

/**
 * Required files with template source mapping
 *
 * From 01-CONTEXT.md D-05:
 * - templates/vault-CLAUDE.md -> CLAUDE.md
 * - templates/index.md -> index.md
 * - templates/log.md -> log.md
 * - templates/wiki-overview.md -> wiki/overview.md
 *
 * From templates/ (Wave 1 canonicalized):
 * - All templates exist under templates/ directory
 */
export const REQUIRED_FILES = [
  { source: 'templates/vault-CLAUDE.md', dest: 'CLAUDE.md' },
  { source: 'templates/index.md', dest: 'index.md' },
  { source: 'templates/log.md', dest: 'log.md' },
  { source: 'templates/wiki-overview.md', dest: 'wiki/overview.md' },
] as const;

/**
 * Get required directories list
 */
export function getRequiredDirs() {
  return REQUIRED_DIRS;
}

/**
 * Get required files list
 */
export function getRequiredFiles() {
  return REQUIRED_FILES;
}