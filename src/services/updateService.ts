/**
 * ContactForge — Optional Update Check Service
 *
 * This is opt-in and only runs when the user requests it.
 */

import { RELEASES_API_URL, RELEASES_URL, APP_VERSION } from '../constants';
import { getRawSetting, setRawSetting } from '../db/repositories/settingsRepository';
import { now } from '../utils/normalization';

const UPDATE_LAST_CHECK_KEY = 'update_last_check_at';
const UPDATE_LAST_RESULT_KEY = 'update_last_result';

export interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string | null;
  isUpdateAvailable: boolean;
  releaseUrl: string;
  releaseNotes: string | null;
}

export interface UpdateState {
  lastCheckedAt: string | null;
  lastResult: UpdateCheckResult | null;
}

function normalizeVersion(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().replace(/^v/i, '').split('-')[0];
}

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10));
  const pb = b.split('.').map((n) => Number.parseInt(n, 10));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

export function getUpdateState(): UpdateState {
  const lastCheckedAt = getRawSetting(UPDATE_LAST_CHECK_KEY);
  const lastResultRaw = getRawSetting(UPDATE_LAST_RESULT_KEY);

  if (!lastResultRaw) {
    return { lastCheckedAt: lastCheckedAt ?? null, lastResult: null };
  }

  try {
    const parsed = JSON.parse(lastResultRaw) as UpdateCheckResult;
    return { lastCheckedAt: lastCheckedAt ?? null, lastResult: parsed };
  } catch {
    return { lastCheckedAt: lastCheckedAt ?? null, lastResult: null };
  }
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const response = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch release info. Please try again later.');
  }

  const data = await response.json();
  const latestRaw = normalizeVersion(data?.tag_name ?? data?.name ?? '');
  const current = normalizeVersion(APP_VERSION);
  const isUpdateAvailable = latestRaw ? compareSemver(latestRaw, current) > 0 : false;

  const result: UpdateCheckResult = {
    currentVersion: current,
    latestVersion: latestRaw || null,
    isUpdateAvailable,
    releaseUrl: data?.html_url ?? RELEASES_URL,
    releaseNotes: data?.body ?? null,
  };

  setRawSetting(UPDATE_LAST_CHECK_KEY, now());
  setRawSetting(UPDATE_LAST_RESULT_KEY, JSON.stringify(result));

  return result;
}
