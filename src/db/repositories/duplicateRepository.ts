/**
 * ContactForge — Duplicate Repository
 *
 * Database operations for duplicate_candidates and merge_history tables.
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type {
  DuplicateCandidate,
  DuplicateConfidence,
  DuplicateReason,
  MergeHistory,
} from '../../types';

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function rowToCandidate(row: Record<string, unknown>): DuplicateCandidate {
  return {
    id: row.id as number,
    contactIdA: row.contact_id_a as number,
    contactIdB: row.contact_id_b as number,
    confidence: row.confidence as DuplicateConfidence,
    score: row.score as number,
    reasons: JSON.parse(row.reasons as string) as DuplicateReason[],
    status: row.status as DuplicateCandidate['status'],
    detectedAt: row.detected_at as string,
    resolvedAt: (row.resolved_at as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Insert / upsert duplicate candidates
// ---------------------------------------------------------------------------

export function upsertDuplicateCandidate(params: {
  contactIdA: number;
  contactIdB: number;
  confidence: DuplicateConfidence;
  score: number;
  reasons: DuplicateReason[];
}): void {
  // Ensure consistent ordering so (a,b) and (b,a) don't create two rows
  const [idA, idB] = params.contactIdA < params.contactIdB
    ? [params.contactIdA, params.contactIdB]
    : [params.contactIdB, params.contactIdA];

  const db = getDatabase();
  const existing = db.getFirstSync<{ id: number; status: string }>(
    `SELECT id, status FROM duplicate_candidates
      WHERE contact_id_a = ? AND contact_id_b = ?`,
    [idA, idB],
  );

  // Don't overwrite already-resolved entries
  if (existing && existing.status !== 'pending') return;

  if (existing) {
    db.runSync(
      `UPDATE duplicate_candidates
         SET confidence = ?, score = ?, reasons = ?, detected_at = ?
       WHERE id = ?`,
      [params.confidence, params.score, JSON.stringify(params.reasons), now(), existing.id],
    );
  } else {
    db.runSync(
      `INSERT INTO duplicate_candidates
         (contact_id_a, contact_id_b, confidence, score, reasons, status, detected_at)
       VALUES (?,?,?,?,?,?,?)`,
      [idA, idB, params.confidence, params.score, JSON.stringify(params.reasons), 'pending', now()],
    );
  }
}

export function resolveDuplicateCandidate(
  id: number,
  status: 'merged' | 'ignored' | 'safe',
): void {
  updateDuplicateCandidateStatus(getDatabase(), id, status);
}

export function resolveDuplicateCandidatesBulk(
  ids: number[],
  status: 'merged' | 'ignored' | 'safe',
): number {
  if (ids.length === 0) return 0;

  const db = getDatabase();
  db.withTransactionSync(() => {
    for (const id of ids) {
      updateDuplicateCandidateStatus(db, id, status);
    }
  });

  return ids.length;
}

function updateDuplicateCandidateStatus(
  db: ReturnType<typeof getDatabase>,
  id: number,
  status: 'merged' | 'ignored' | 'safe',
): void {
  db.runSync(
    `UPDATE duplicate_candidates SET status = ?, resolved_at = ? WHERE id = ?`,
    [status, now(), id],
  );
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function getPendingDuplicates(): DuplicateCandidate[] {
  return getDatabase()
    .getAllSync<Record<string, unknown>>(
      `SELECT * FROM duplicate_candidates WHERE status = 'pending'
         ORDER BY score DESC, detected_at DESC`,
      [],
    )
    .map(rowToCandidate);
}

export function getDuplicatesByContactId(contactId: number): DuplicateCandidate[] {
  return getDatabase()
    .getAllSync<Record<string, unknown>>(
      `SELECT * FROM duplicate_candidates
        WHERE (contact_id_a = ? OR contact_id_b = ?) AND status = 'pending'
        ORDER BY score DESC`,
      [contactId, contactId],
    )
    .map(rowToCandidate);
}

export function countPendingDuplicates(): number {
  const row = getDatabase().getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM duplicate_candidates WHERE status = 'pending'`,
    [],
  );
  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Merge history
// ---------------------------------------------------------------------------

export function recordMerge(params: {
  survivorContactId: number;
  mergedContactIds: number[];
  snapshotJson: string;
}): void {
  getDatabase().runSync(
    `INSERT INTO merge_history (survivor_contact_id, merged_contact_ids, snapshot_json, merged_at)
     VALUES (?,?,?,?)`,
    [params.survivorContactId, JSON.stringify(params.mergedContactIds), params.snapshotJson, now()],
  );
}

export function getMergeHistory(): MergeHistory[] {
  return getDatabase()
    .getAllSync<Record<string, unknown>>(
      'SELECT * FROM merge_history ORDER BY merged_at DESC',
      [],
    )
    .map((row) => ({
      id: row.id as number,
      survivorContactId: row.survivor_contact_id as number,
      mergedContactIds: row.merged_contact_ids as string,
      snapshotJson: row.snapshot_json as string,
      mergedAt: row.merged_at as string,
    }));
}

// ---------------------------------------------------------------------------
// Ignore memory helpers (Phase D)
// ---------------------------------------------------------------------------

/**
 * Returns true if the pair (idA, idB) has already been resolved
 * (ignored, merged, or marked safe). Order-independent.
 *
 * Uses the composite unique index idx_dupes_pair for O(1) lookup.
 */
export function isIgnoredPair(idA: number, idB: number): boolean {
  const [a, b] = idA < idB ? [idA, idB] : [idB, idA];
  const row = getDatabase().getFirstSync<{ status: string }>(
    `SELECT status FROM duplicate_candidates
      WHERE contact_id_a = ? AND contact_id_b = ?`,
    [a, b],
  );
  if (!row) return false;
  return row.status !== 'pending';
}

/**
 * Removes duplicate_candidates rows where either contact has been tombstoned
 * (is_deleted = 1). Safe to call repeatedly — idempotent.
 *
 * Prevents the candidates table from accumulating dead pairs after contacts
 * are soft-deleted, which would inflate duplicate counts and waste scan work.
 */
export function purgeOrphanedCandidates(): number {
  const db = getDatabase();
  const result = db.runSync(
    `DELETE FROM duplicate_candidates
     WHERE contact_id_a IN (SELECT id FROM contacts WHERE is_deleted = 1)
        OR contact_id_b IN (SELECT id FROM contacts WHERE is_deleted = 1)`,
    [],
  );
  return result.changes;
}
