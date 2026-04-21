/**
 * Minimal SQLite state.db bootstrap
 *
 * From 01-CONTEXT.md D-04:
 * - state.db is persistent machine state
 * - Phase 1 creates minimal schema/version marker only
 * - Richer tables deferred to later phases
 *
 * From CLAUDE.md:
 * - Use better-sqlite3, NOT node:sqlite
 */

import Database from 'better-sqlite3';
import { getStateDbPath } from './paths.js';

/**
 * Bootstrap minimal state.db
 *
 * Creates database with schema version marker only.
 * No Phase 2+ tables yet.
 */
export function initStateDb(vaultPath: string): void {
  const dbPath = getStateDbPath(vaultPath);

  // Create database
  const db = new Database(dbPath);

  // Create minimal schema version table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    INSERT INTO schema_version (version, created_at)
    VALUES (1, datetime('now'));
  `);

  // Close database
  db.close();
}

/**
 * Check if state.db exists
 */
export function stateDbExists(vaultPath: string): boolean {
  const dbPath = getStateDbPath(vaultPath);

  try {
    const db = new Database(dbPath, { fileMustExist: true });
    db.close();
    return true;
  } catch {
    return false;
  }
}