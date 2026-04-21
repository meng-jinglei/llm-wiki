/**
 * Path helpers for .llm-wiki sidecar state
 *
 * From 01-CONTEXT.md D-03, D-04:
 * - .llm-wiki/ contains state.db, cache/, manifests/
 * - Separated from human-facing vault markdown
 */

import { join } from 'path';

/**
 * Get .llm-wiki directory path for vault
 */
export function getLlmWikiDir(vaultPath: string): string {
  return join(vaultPath, '.llm-wiki');
}

/**
 * Get state.db path for vault
 */
export function getStateDbPath(vaultPath: string): string {
  return join(vaultPath, '.llm-wiki', 'state.db');
}

/**
 * Get cache directory path for vault
 */
export function getCacheDir(vaultPath: string): string {
  return join(vaultPath, '.llm-wiki', 'cache');
}

/**
 * Get manifests directory path for vault
 */
export function getManifestsDir(vaultPath: string): string {
  return join(vaultPath, '.llm-wiki', 'manifests');
}

/**
 * Check if path is under .llm-wiki/
 */
export function isLlmWikiPath(path: string): boolean {
  return path.includes('.llm-wiki');
}