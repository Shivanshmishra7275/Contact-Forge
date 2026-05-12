/**
 * ContactForge — Sync State Repository
 *
 * Reads persisted sync_state info for UI hydration.
 */

import { getDatabase } from '..';
import type { SyncState } from '../../types';

const DEFAULT_SYNC_STATE: SyncState = {
  id: 1,
  lastSyncAt: null,
  totalNativeContacts: 0,
  totalLocalContacts: 0,
  status: 'idle',
  errorMessage: null,
};

export function getSyncState(): SyncState {
  const row = getDatabase().getFirstSync<Record<string, unknown>>(
    'SELECT * FROM sync_state WHERE id = 1',
    [],
  );

  if (!row) return { ...DEFAULT_SYNC_STATE };

  return {
    id: row.id as number,
    lastSyncAt: (row.last_sync_at as string) ?? null,
    totalNativeContacts: (row.total_native_contacts as number) ?? 0,
    totalLocalContacts: (row.total_local_contacts as number) ?? 0,
    status: (row.status as SyncState['status']) ?? 'idle',
    errorMessage: (row.error_message as string) ?? null,
  };
}
