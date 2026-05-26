/**
 * ContactForge — FTS Runtime Compatibility Probe
 *
 * Determines which SQLite full-text search mode is available in the
 * current runtime (expo-sqlite on iOS/Android/Web bundles different SQLite
 * builds; FTS5 is NOT guaranteed on all platforms).
 *
 * Strategy:
 *   1. Create a TEMP virtual table using FTS5 and run a real MATCH query.
 *      If both succeed → 'fts5'.
 *   2. Otherwise try FTS4 the same way → 'fts4'.
 *   3. If neither works → 'none' (falls back to LIKE-based search).
 *
 * Result is cached after first call so the probe runs exactly once per
 * DB session.
 */

import type * as SQLiteTypes from 'expo-sqlite';

export type FtsMode = 'fts5' | 'fts4' | 'none';

let _cachedMode: FtsMode | null = null;

/**
 * Probes the open database for FTS5/FTS4 support.
 * Runs synchronously; safe to call at DB init time.
 * Returns the best available FTS mode.
 */
export function probeFtsMode(db: SQLiteTypes.SQLiteDatabase): FtsMode {
  if (_cachedMode !== null) return _cachedMode;

  // ── FTS5 probe ──────────────────────────────────────────────────────────
  try {
    // Use temp schema so the probe never pollutes the user database
    db.execSync('DROP TABLE IF EXISTS temp._cf_fts5_probe');
    db.execSync(
      "CREATE VIRTUAL TABLE temp._cf_fts5_probe USING fts5(body, tokenize='ascii')",
    );
    db.execSync("INSERT INTO temp._cf_fts5_probe(body) VALUES ('contactforge fts5 probe')");
    const row = db.getFirstSync<{ body: string }>(
      "SELECT body FROM temp._cf_fts5_probe WHERE body MATCH 'contactforge'",
    );
    db.execSync('DROP TABLE IF EXISTS temp._cf_fts5_probe');

    if (row?.body?.startsWith('contactforge')) {
      _cachedMode = 'fts5';
      // Safe to log — no user data involved
      console.log('[ContactForge FTS] FTS5 verified. Using FTS5 indexed search.');
      return 'fts5';
    }
  } catch {
    // FTS5 unavailable or MATCH failed — try FTS4
  }

  // ── FTS4 probe ──────────────────────────────────────────────────────────
  try {
    db.execSync('DROP TABLE IF EXISTS temp._cf_fts4_probe');
    db.execSync(
      'CREATE VIRTUAL TABLE temp._cf_fts4_probe USING fts4(body)',
    );
    db.execSync("INSERT INTO temp._cf_fts4_probe(body) VALUES ('contactforge fts4 probe')");
    const row = db.getFirstSync<{ body: string }>(
      "SELECT body FROM temp._cf_fts4_probe WHERE body MATCH 'contactforge'",
    );
    db.execSync('DROP TABLE IF EXISTS temp._cf_fts4_probe');

    if (row?.body?.startsWith('contactforge')) {
      _cachedMode = 'fts4';
      console.log('[ContactForge FTS] FTS5 unavailable. FTS4 verified. Using FTS4 indexed search.');
      return 'fts4';
    }
  } catch {
    // FTS4 also unavailable
  }

  // ── No FTS support ───────────────────────────────────────────────────────
  _cachedMode = 'none';
  console.log(
    '[ContactForge FTS] Neither FTS5 nor FTS4 available in this SQLite build. ' +
    'Falling back to LIKE-based search. Performance will degrade on large datasets.',
  );
  return 'none';
}

/** Returns the cached probe result, or null if probe has not run yet. */
export function getCachedFtsMode(): FtsMode | null {
  return _cachedMode;
}

/** Force-resets the cached result (test use only). */
export function resetFtsModeCache(): void {
  _cachedMode = null;
}
