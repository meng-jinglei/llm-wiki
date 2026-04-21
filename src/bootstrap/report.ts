/**
 * Bootstrap result reporting
 *
 * From 01-CONTEXT.md D-02:
 * - Report vault-relative touched paths
 * - Include guided next-step suggestion
 *
 * From 01-RESEARCH.md Pattern 3:
 * - Separate created, repaired, skipped groups
 * - Always show next command
 */

import { InitResult } from '../shared/types.js';
import { BootstrapAction } from '../shared/types.js';

/**
 * Create init result from plan actions
 */
export function createInitResult(
  createActions: BootstrapAction[],
  skipActions: BootstrapAction[]
): InitResult {
  // Determine if this is first-time creation or repair
  // If there are skip actions, some files existed, so create actions are repairs
  // If there are no skip actions, vault was empty, so create actions are creations
  const isRepair = skipActions.length > 0;

  const vaultRelativePaths = createActions.map(action => getVaultRelativePath(action));

  const created = isRepair ? [] : vaultRelativePaths;
  const repaired = isRepair ? vaultRelativePaths : [];
  const skipped = skipActions.map(action => getVaultRelativePath(action));

  return {
    created,
    repaired,
    skipped,
    nextStep: 'llm-wiki ingest <url>',
  };
}

/**
 * Get vault-relative path from action
 */
function getVaultRelativePath(action: BootstrapAction): string {
  switch (action.kind) {
    case 'mkdir':
      return action.dest;

    case 'copy-template':
      return action.dest;

    case 'create-db':
      return '.llm-wiki/state.db';
  }
}

/**
 * Format init result for CLI output
 */
export function formatInitResult(result: InitResult): string {
  const lines: string[] = [];

  if (result.created.length > 0) {
    lines.push('Created:');
    for (const path of result.created) {
      lines.push(`  ${path}`);
    }
  }

  if (result.repaired.length > 0) {
    lines.push('Repaired:');
    for (const path of result.repaired) {
      lines.push(`  ${path}`);
    }
  }

  if (result.skipped.length > 0) {
    lines.push('Skipped:');
    for (const path of result.skipped) {
      lines.push(`  ${path}`);
    }
  }

  lines.push('');
  lines.push(`Next: ${result.nextStep}`);

  return lines.join('\n');
}