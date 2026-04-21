/**
 * Bootstrap plan computation
 *
 * From 01-CONTEXT.md D-06:
 * - Idempotent: only create missing files
 * - Never overwrite existing files
 * - Preserve user modifications
 *
 * From 01-RESEARCH.md Pattern 1:
 * - Plan-then-apply approach
 * - Compute actions before writing
 */

import { join } from 'path';
import { access } from 'fs/promises';
import { constants } from 'fs';
import { BootstrapAction, BootstrapPlan } from '../shared/types.js';
import { getRequiredDirs, getRequiredFiles } from './catalog.js';

/**
 * Plan bootstrap actions for vault
 *
 * Computes create/skip actions based on existing assets.
 * Never plans overwrite actions.
 */
export async function planBootstrap(vaultPath: string): Promise<BootstrapPlan> {
  const create: BootstrapAction[] = [];
  const skip: BootstrapAction[] = [];

  // Plan directories
  for (const dir of getRequiredDirs()) {
    const destPath = join(vaultPath, dir);
    const exists = await directoryExists(destPath);

    if (exists) {
      skip.push({ kind: 'mkdir', dest: dir });
    } else {
      create.push({ kind: 'mkdir', dest: dir });
    }
  }

  // Plan files
  for (const file of getRequiredFiles()) {
    const destPath = join(vaultPath, file.dest);
    const exists = await fileExists(destPath);

    if (exists) {
      skip.push({ kind: 'copy-template', source: file.source, dest: file.dest });
    } else {
      create.push({ kind: 'copy-template', source: file.source, dest: file.dest });
    }
  }

  // Plan state.db
  const dbPath = join(vaultPath, '.llm-wiki', 'state.db');
  const dbExists = await fileExists(dbPath);

  if (dbExists) {
    skip.push({ kind: 'create-db', dest: '.llm-wiki/state.db' });
  } else {
    create.push({ kind: 'create-db', dest: '.llm-wiki/state.db' });
  }

  return { create, skip };
}

/**
 * Check if directory exists
 */
async function directoryExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}