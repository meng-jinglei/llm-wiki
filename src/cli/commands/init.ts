/**
 * Init command implementation
 *
 * From 01-CONTEXT.md D-01:
 * - Multi-command CLI entrypoint
 * - Guided workflow with next-step suggestion
 *
 * From 01-CONTEXT.md D-06:
 * - Idempotent: only create missing files
 * - Non-destructive bootstrap
 */

import { planBootstrap } from '../../bootstrap/plan.js';
import { applyBootstrap } from '../../bootstrap/apply.js';
import { createInitResult } from '../../bootstrap/report.js';
import { validateVaultPath } from '../../validation/init-options.js';
import { InitResult } from '../../shared/types.js';

/**
 * Execute init command
 *
 * Validates vault path, plans bootstrap actions, applies them,
 * and returns vault-relative result.
 */
export async function initCommand(vaultPath: string): Promise<InitResult> {
  // Validate vault path
  const validatedPath = validateVaultPath(vaultPath);

  // Plan bootstrap actions
  const plan = await planBootstrap(validatedPath);

  // Apply only create actions (skip actions are informational)
  await applyBootstrap(validatedPath, plan.create);

  // Create result
  const result = createInitResult(plan.create, plan.skip);

  return result;
}