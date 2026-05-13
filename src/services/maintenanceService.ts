/**
 * ContactForge — Maintenance Service
 *
 * Runs lightweight local maintenance tasks on a best-effort basis.
 * Background execution is OS-governed and may be deferred or skipped.
 */

import { countPendingDuplicates } from '../db/repositories/duplicateRepository';
import { logAction } from '../db/repositories/auditRepository';
import { getAllSettings, getRawSetting, setRawSetting } from '../db/repositories/settingsRepository';
import { countContactsWithIssues } from './cleanupService';
import { countExpiredTemporaryContacts, reviewAndPurgeExpired } from './temporaryContactService';
import { pruneOldBackups } from './exportService';
import { now } from '../utils/normalization';
import { MAINTENANCE_MIN_INTERVAL_MINUTES } from '../constants';

const MAINTENANCE_LAST_RUN_KEY = 'maintenance_last_run_at';
const MAINTENANCE_LAST_SUMMARY_KEY = 'maintenance_last_summary';

export interface MaintenanceSummary {
  expiredTemporary: number;
  purgedTemporary: number;
  cleanupIssues: number;
  pendingDuplicates: number;
  backupsPruned: number;
}

export interface MaintenanceState {
  lastRunAt: string | null;
  lastSummary: MaintenanceSummary | null;
}

export function getMaintenanceState(): MaintenanceState {
  const lastRunAt = getRawSetting(MAINTENANCE_LAST_RUN_KEY);
  const summaryRaw = getRawSetting(MAINTENANCE_LAST_SUMMARY_KEY);

  if (!summaryRaw) {
    return { lastRunAt: lastRunAt ?? null, lastSummary: null };
  }

  try {
    const parsed = JSON.parse(summaryRaw) as MaintenanceSummary;
    return { lastRunAt: lastRunAt ?? null, lastSummary: parsed };
  } catch {
    return { lastRunAt: lastRunAt ?? null, lastSummary: null };
  }
}

export function shouldRunMaintenance(minIntervalMinutes = MAINTENANCE_MIN_INTERVAL_MINUTES): boolean {
  const lastRunAt = getRawSetting(MAINTENANCE_LAST_RUN_KEY);
  if (!lastRunAt) return true;
  const lastMs = Date.parse(lastRunAt);
  if (Number.isNaN(lastMs)) return true;
  const elapsedMinutes = (Date.now() - lastMs) / (60 * 1000);
  return elapsedMinutes >= minIntervalMinutes;
}

export async function runMaintenance(
  reason: 'foreground' | 'background' | 'manual' = 'foreground',
): Promise<MaintenanceSummary> {
  const settings = getAllSettings();

  const expiredTemporary = countExpiredTemporaryContacts();
  const purgedTemporary =
    reason !== 'background' && settings.autoPurgeExpiredTemporary
      ? reviewAndPurgeExpired()
      : 0;

  const cleanupIssues = reason === 'background' ? 0 : countContactsWithIssues();
  const pendingDuplicates = countPendingDuplicates();
  const backupsPruned = reason === 'background'
    ? 0
    : await pruneOldBackups(settings.backupRetentionCount);

  const summary: MaintenanceSummary = {
    expiredTemporary,
    purgedTemporary,
    cleanupIssues,
    pendingDuplicates,
    backupsPruned,
  };

  setRawSetting(MAINTENANCE_LAST_RUN_KEY, now());
  setRawSetting(MAINTENANCE_LAST_SUMMARY_KEY, JSON.stringify(summary));
  logAction('maintenance_run', null, { reason, summary });

  return summary;
}

export async function maybeRunMaintenance(
  reason: 'foreground' | 'background' | 'manual' = 'foreground',
  minIntervalMinutes = MAINTENANCE_MIN_INTERVAL_MINUTES,
): Promise<MaintenanceSummary | null> {
  if (!shouldRunMaintenance(minIntervalMinutes)) return null;
  return runMaintenance(reason);
}
