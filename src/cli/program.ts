/**
 * Commander CLI root program
 *
 * From 01-CONTEXT.md D-01:
 * - Multi-command entrypoint
 * - init, ingest, query, lint commands
 *
 * From 01-RESEARCH.md:
 * - Commander 14.x for CLI parsing
 * - Future commands will be added as they're implemented
 */

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { formatInitResult } from '../bootstrap/report.js';

/**
 * Create CLI program
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('llm-wiki')
    .description('LLM Wiki local runtime')
    .version('1.0.0');

  // Init command (Phase 1)
  program
    .command('init')
    .description('Initialize an LLM Wiki vault')
    .requiredOption('--vault <path>', 'Vault directory path')
    .action(async (options) => {
      const result = await initCommand(options.vault);
      console.log(formatInitResult(result));
    });

  // Future commands (placeholder, not implemented in Phase 1)
  program
    .command('ingest')
    .description('Ingest a new source into the wiki')
    .argument('<url>', 'Source URL')
    .action(() => {
      console.log('ingest: Not implemented in Phase 1');
    });

  program
    .command('query')
    .description('Query the wiki')
    .argument('[query]', 'Query string')
    .action(() => {
      console.log('query: Not implemented in Phase 1');
    });

  program
    .command('lint')
    .description('Lint wiki for issues')
    .action(() => {
      console.log('lint: Not implemented in Phase 1');
    });

  return program;
}

/**
 * Main CLI entrypoint
 */
export async function main(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}