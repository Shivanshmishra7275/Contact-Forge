/**
 * ContactForge — SQLite Database Bootstrap
 *
 * Opens the database, runs schema migrations, and exports a singleton
 * database instance. All repository modules import from here.
 *
 * We use expo-sqlite's synchronous openDatabaseSync API because:
 * - It avoids async race conditions on first launch
 * - All queries run on the JS thread which is acceptable for this app's scale
 * - The db is opened once and reused throughout the app lifecycle
 */

import * as SQLite from 'expo-sqlite';
import { DB_NAME } from '../constants';
import { ALL_CREATE_STATEMENTS } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the open database instance, initialising schema on first call.
 * Safe to call multiple times — returns the same instance.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (_db) return _db;

  _db = SQLite.openDatabaseSync(DB_NAME);

  // Enable WAL mode for better concurrent read performance
  _db.execSync('PRAGMA journal_mode = WAL;');
  // Enforce foreign key constraints
  _db.execSync('PRAGMA foreign_keys = ON;');

  initSchema(_db);

  return _db;
}

/**
 * Runs all CREATE TABLE and CREATE INDEX statements.
 * Idempotent — uses IF NOT EXISTS on every statement.
 */
function initSchema(db: SQLite.SQLiteDatabase): void {
  db.withTransactionSync(() => {
    for (const sql of ALL_CREATE_STATEMENTS) {
      db.execSync(sql);
    }

    // Seed sync_state row if absent
    db.execSync(`
      INSERT OR IGNORE INTO sync_state (id, status, last_sync_at, total_native_contacts, total_local_contacts)
      VALUES (1, 'idle', NULL, 0, 0)
    `);
  });
}

/**
 * Tears down the database connection.
 * Only needed in tests or explicit reset flows.
 */
export function closeDatabase(): void {
  if (_db) {
    _db.closeSync();
    _db = null;
  }
}

/**
 * Drops and recreates all tables. USE WITH EXTREME CAUTION.
 * Only exposed for testing.
 */
export function resetDatabaseForTesting(): void {
  if (_db) {
    _db.execSync(`
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS sync_state;
      DROP TABLE IF EXISTS settings;
      DROP TABLE IF EXISTS temporary_contacts;
      DROP TABLE IF EXISTS merge_history;
      DROP TABLE IF EXISTS duplicate_groups;
      DROP TABLE IF EXISTS duplicate_candidates;
      DROP TABLE IF EXISTS emails;
      DROP TABLE IF EXISTS phone_numbers;
      DROP TABLE IF EXISTS contacts;
    `);
    initSchema(_db);
  }
}
