/**
 * Shared types for Phase 1 bootstrap pipeline
 *
 * From 01-CONTEXT.md D-03, D-04, D-06:
 * - Three-zone layout: wiki/, raw/, .llm-wiki/
 * - Idempotent behavior: create missing, skip existing
 */

/**
 * Bootstrap action types
 *
 * From 01-RESEARCH.md Pattern 1:
 * - mkdir: create directory
 * - copy-template: copy template file to vault
 * - create-db: create state.db
 */
export type BootstrapAction =
  | { kind: 'mkdir'; dest: string }
  | { kind: 'copy-template'; source: string; dest: string }
  | { kind: 'create-db'; dest: string };

/**
 * Bootstrap plan result
 *
 * From 01-RESEARCH.md Pattern 1:
 * - create: actions to create missing assets
 * - skip: actions for existing assets (no-op)
 */
export type BootstrapPlan = {
  create: BootstrapAction[];
  skip: BootstrapAction[];
};

/**
 * Init command result
 *
 * From 01-RESEARCH.md Pattern 3:
 * - created: newly created vault-relative paths
 * - repaired: repaired missing paths
 * - skipped: skipped existing paths
 * - nextStep: guided next command per D-02
 */
export type InitResult = {
  created: string[];
  repaired: string[];
  skipped: string[];
  nextStep: 'llm-wiki ingest <url>';
};