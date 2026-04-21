/**
 * Vault path validation with zod
 *
 * From 01-RESEARCH.md threat model:
 * - Reject path escapes before any write
 * - Normalize vault root
 * - Validate all destinations
 *
 * From CLAUDE.md:
 * - Use zod for schema-based validation
 */

import { z } from 'zod';
import { resolve, normalize } from 'path';

/**
 * Vault path schema
 */
const VaultPathSchema = z.string()
  .min(1, 'Vault path must not be empty')
  .refine(
    (path) => !containsPathEscape(path),
    'Vault path must not contain path traversal sequences'
  )
  .refine(
    (path) => !isAbsolutePathToSystemDir(path),
    'Vault path must not target system directories'
  );

/**
 * Validate vault path
 *
 * Throws on invalid paths.
 * Returns normalized absolute path.
 */
export function validateVaultPath(vaultPath: string): string {
  // Parse and validate
  const parsed = VaultPathSchema.parse(vaultPath);

  // Normalize and resolve to absolute path
  const normalized = normalize(parsed);
  const absolute = resolve(normalized);

  return absolute;
}

/**
 * Check for path escape sequences
 */
function containsPathEscape(path: string): boolean {
  // Check for ../ and ..\\ patterns in the raw path
  if (path.includes('..')) {
    return true;
  }

  return false;
}

/**
 * Check for system directory targets
 */
function isAbsolutePathToSystemDir(path: string): boolean {
  // Resolve to absolute path first
  const resolved = resolve(path);

  // Reject known system directories (Windows and Unix)
  const systemDirs = [
    '/etc',
    '/bin',
    '/usr',
    '/var',
    'C:\\Windows',
    'C:\\Program Files',
  ];

  // Check if resolved path starts with any system dir
  const isSystemDir = systemDirs.some(sysDir =>
    resolved.toLowerCase().startsWith(sysDir.toLowerCase())
  );

  // Also check raw path for Unix-style absolute paths
  // On Windows, paths like /etc get resolved to C:\etc, but we should still reject them
  const unixSystemPaths = ['/etc', '/bin', '/usr', '/var'];
  const isUnixSystemPath = unixSystemPaths.some(sysPath =>
    path.startsWith(sysPath)
  );

  return isSystemDir || isUnixSystemPath;
}

/**
 * Init command options schema
 */
export const InitOptionsSchema = z.object({
  vault: VaultPathSchema,
});

/**
 * Validate init command options
 */
export function validateInitOptions(options: unknown): z.infer<typeof InitOptionsSchema> {
  return InitOptionsSchema.parse(options);
}