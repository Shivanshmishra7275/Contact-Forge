import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { UndoActionType, UndoRecord } from '../../features/undo/types';

export function recordUndoAction(params: {
  actionType: UndoActionType;
  actionDataJson: string;
  contactId?: number;
}): number {
  const db = getDatabase();
  const ts = now();
  
  // Set expiration to 30 days from now (rough approximation in ms)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const result = db.runSync(
    `INSERT INTO undo_history (action_type, action_data_json, contact_id, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      params.actionType,
      params.actionDataJson,
      params.contactId ?? null,
      ts,
      expiresAt,
    ],
  );

  return result.lastInsertRowId;
}

export function getLatestUndoableAction(): UndoRecord | null {
  const ts = now();
  const row = getDatabase().getFirstSync<Record<string, unknown>>(
    `SELECT * FROM undo_history
     WHERE expires_at > ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [ts]
  );

  if (!row) return null;

  return {
    id: row.id as number,
    actionType: row.action_type as UndoActionType,
    actionDataJson: row.action_data_json as string,
    contactId: row.contact_id ? (row.contact_id as number) : undefined,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
  };
}

export function deleteUndoRecord(id: number): void {
  getDatabase().runSync('DELETE FROM undo_history WHERE id = ?', [id]);
}

export function clearExpiredUndoRecords(): void {
  const ts = now();
  getDatabase().runSync('DELETE FROM undo_history WHERE expires_at <= ?', [ts]);
}
