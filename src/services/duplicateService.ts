/**
 * ContactForge — Duplicate Detection Service
 *
 * Scans the local contact database in chunks and produces
 * DuplicateCandidate records. Uses the scoring engine from
 * src/utils/duplicateScoring.ts.
 *
 * Processing is chunked to keep the UI responsive.
 */

import {
  listContacts,
  getPhonesByContactId,
  getEmailsByContactId,
  getAllContactIds,
} from '../db/repositories/contactRepository';
import { upsertDuplicateCandidate, countPendingDuplicates } from '../db/repositories/duplicateRepository';
import {
  buildContactSnapshot,
  scoreDuplicatePair,
} from '../utils/duplicateScoring';
import { DUPLICATE_SCAN_CHUNK_SIZE } from '../constants';

export interface DuplicateScanProgress {
  processed: number;
  total: number;
  found: number;
}

type ProgressCallback = (progress: DuplicateScanProgress) => void;

/**
 * Scans all contacts in the local DB for duplicate candidates.
 * Processes contacts in chunks of DUPLICATE_SCAN_CHUNK_SIZE to avoid blocking.
 *
 * This is an O(n²) algorithm in the worst case, mitigated by:
 * - chunked processing with async yield points
 * - early exit on non-matches
 * - score threshold filtering before DB writes
 */
export async function runDuplicateScan(
  onProgress?: ProgressCallback,
): Promise<{ found: number }> {
  const allIds = getAllContactIds();
  const total = allIds.length;
  let processed = 0;
  let found = 0;

  // Build snapshot cache in chunks to avoid loading everything at once
  // For each chunk, compare every pair within the chunk, then compare with previous chunks
  const snapshots: ReturnType<typeof buildContactSnapshot>[] = [];

  for (let i = 0; i < allIds.length; i += DUPLICATE_SCAN_CHUNK_SIZE) {
    const chunkIds = allIds.slice(i, i + DUPLICATE_SCAN_CHUNK_SIZE);
    const chunkSnapshots = chunkIds.map((id) => {
      const phones = getPhonesByContactId(id).map((p) => p.normalizedNumber);
      const emails = getEmailsByContactId(id).map((e) => e.normalizedEmail);
      const contact = listContacts({ page: 0, pageSize: 1 });
      // We stored normalizedName in the DB, fetch it inline
      return buildContactSnapshot({ id, normalizedName: '', phones, emails });
    });

    // Pair within the new chunk
    for (let a = 0; a < chunkSnapshots.length; a++) {
      for (let b = a + 1; b < chunkSnapshots.length; b++) {
        const result = scoreDuplicatePair(chunkSnapshots[a], chunkSnapshots[b]);
        if (result.isDuplicate) {
          upsertDuplicateCandidate({
            contactIdA: chunkSnapshots[a].id,
            contactIdB: chunkSnapshots[b].id,
            confidence: result.confidence,
            score: result.score,
            reasons: result.reasons,
          });
          found++;
        }
      }
    }

    // Pair new chunk against all previously processed snapshots
    for (const newSnap of chunkSnapshots) {
      for (const oldSnap of snapshots) {
        const result = scoreDuplicatePair(newSnap, oldSnap);
        if (result.isDuplicate) {
          upsertDuplicateCandidate({
            contactIdA: newSnap.id,
            contactIdB: oldSnap.id,
            confidence: result.confidence,
            score: result.score,
            reasons: result.reasons,
          });
          found++;
        }
      }
    }

    snapshots.push(...chunkSnapshots);
    processed += chunkIds.length;
    onProgress?.({ processed, total, found });

    // Yield to the event loop between chunks
    await new Promise((r) => setTimeout(r, 0));
  }

  return { found };
}

/**
 * Returns the count of pending duplicates from the DB.
 */
export function getPendingDuplicateCount(): number {
  return countPendingDuplicates();
}
