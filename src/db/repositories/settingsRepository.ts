/**
 * ContactForge — Settings Repository
 */

import { getDatabase } from '..';
import { DEFAULT_SETTINGS } from '../../constants';
import type { AppSettings } from '../../types';

export function getSetting(key: keyof AppSettings): string | null {
  const row = getDatabase().getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export function setSetting(key: keyof AppSettings, value: string): void {
  getDatabase().runSync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)',
    [key, value],
  );
}

export function getAllSettings(): AppSettings {
  const db = getDatabase();
  const rows = db.getAllSync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
    [],
  );

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    defaultCountryCode: map.defaultCountryCode ?? DEFAULT_SETTINGS.defaultCountryCode,
    enableAppLock: (map.enableAppLock ?? String(DEFAULT_SETTINGS.enableAppLock)) === 'true',
    autoCleanOnSync: (map.autoCleanOnSync ?? String(DEFAULT_SETTINGS.autoCleanOnSync)) === 'true',
    duplicateScanOnSync: (map.duplicateScanOnSync ?? String(DEFAULT_SETTINGS.duplicateScanOnSync)) === 'true',
    exportIncludeNotes: (map.exportIncludeNotes ?? String(DEFAULT_SETTINGS.exportIncludeNotes)) === 'true',
  };
}

export function saveAllSettings(settings: AppSettings): void {
  const db = getDatabase();
  db.withTransactionSync(() => {
    for (const [key, value] of Object.entries(settings)) {
      db.runSync(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)',
        [key, String(value)],
      );
    }
  });
}
