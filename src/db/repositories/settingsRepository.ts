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

export function getRawSetting(key: string): string | null {
  const row = getDatabase().getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export function setRawSetting(key: string, value: string): void {
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

  const backupRetentionRaw = Number.parseInt(
    map.backupRetentionCount ?? String(DEFAULT_SETTINGS.backupRetentionCount),
    10,
  );

  return {
    defaultCountryCode: map.defaultCountryCode ?? DEFAULT_SETTINGS.defaultCountryCode,
    enableAppLock: (map.enableAppLock ?? String(DEFAULT_SETTINGS.enableAppLock)) === 'true',
    autoCleanOnSync: (map.autoCleanOnSync ?? String(DEFAULT_SETTINGS.autoCleanOnSync)) === 'true',
    duplicateScanOnSync: (map.duplicateScanOnSync ?? String(DEFAULT_SETTINGS.duplicateScanOnSync)) === 'true',
    exportIncludeNotes: (map.exportIncludeNotes ?? String(DEFAULT_SETTINGS.exportIncludeNotes)) === 'true',
    enableBackgroundMaintenance: (map.enableBackgroundMaintenance ?? String(DEFAULT_SETTINGS.enableBackgroundMaintenance)) === 'true',
    autoPurgeExpiredTemporary: (map.autoPurgeExpiredTemporary ?? String(DEFAULT_SETTINGS.autoPurgeExpiredTemporary)) === 'true',
    backupRetentionCount: Number.isFinite(backupRetentionRaw) ? backupRetentionRaw : DEFAULT_SETTINGS.backupRetentionCount,
    enableOnlineFeatures: (map.enableOnlineFeatures ?? String(DEFAULT_SETTINGS.enableOnlineFeatures)) === 'true',
    syncProviderId: map.syncProviderId ?? DEFAULT_SETTINGS.syncProviderId,
    syncWebDavEndpoint: map.syncWebDavEndpoint ?? DEFAULT_SETTINGS.syncWebDavEndpoint,
    syncWebDavUser: map.syncWebDavUser ?? DEFAULT_SETTINGS.syncWebDavUser,
    syncWebDavPass: map.syncWebDavPass ?? DEFAULT_SETTINGS.syncWebDavPass,
    lastSyncTime: map.lastSyncTime ?? DEFAULT_SETTINGS.lastSyncTime,
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
