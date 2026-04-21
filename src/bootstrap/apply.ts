/**
 * Apply bootstrap plan actions
 *
 * From 01-CONTEXT.md D-06:
 * - Non-destructive: only create missing files
 * - Never overwrite existing files
 * - Preserve user modifications
 */

import { mkdir, copyFile } from 'fs/promises';
import { join } from 'path';
import { BootstrapAction } from '../shared/types.js';
import { initStateDb } from '../state/init-db.js';

/**
 * Apply bootstrap actions
 *
 * Creates directories, copies templates, and initializes state.db.
 * Never overwrites existing files.
 */
export async function applyBootstrap(
  vaultPath: string,
  actions: BootstrapAction[]
): Promise<void> {
  for (const action of actions) {
    switch (action.kind) {
      case 'mkdir':
        await mkdir(join(vaultPath, action.dest), { recursive: true });
        break;

      case 'copy-template':
        await copyFile(action.source, join(vaultPath, action.dest));
        break;

      case 'create-db':
        await initStateDb(vaultPath);
        break;
    }
  }
}