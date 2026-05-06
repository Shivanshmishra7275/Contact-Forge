/**
 * ContactForge — Audit Log Repository
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { AuditAction, AuditLog } from '../../types';

export function logAction(
  action: AuditAction,
  targetId: number | null,
  details: Record<string, unknown> = {},
): void {
  getDatabase().runSync(
    'INSERT INTO audit_logs (action, target_id, details, created_at) VALUES (?,?,?,?)',
    [action, targetId ?? null, JSON.stringify(details), now()],
  );
}

export function getRecentAuditLogs(limit = 50): AuditLog[] {
  return getDatabase()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?',
      [limit],
    )
    .map((row) => ({
      id: row.id as number,
      action: row.action as AuditAction,
      targetId: (row.target_id as number) ?? null,
      details: row.details as string,
      createdAt: row.created_at as string,
    }));
}
