/**
 * ContactForge — Duplicate Detection Service
 *
 * Primary entry point for running duplicate scans.
 *
 * Architecture:
 *   Primary path: SQL-grouped heuristic scan (runDuplicateHeuristicScan).
 *     - Uses indexed normalized phone/email/name_key grouping in SQLite
 *     - O(groups * k²) where k is bucket size — typically 1-20, not N²
 *     - Filters deleted (is_deleted=0) and ghost (is_ghost=0) contacts
 *     - Results written to duplicate_candidates table
 *
 *   Fallback path: JS-chunked O(N²) scoring (scoreDuplicatePair).
 *     - Only invoked if the heuristics scan produces 0 results on a non-empty DB
 *     - Provides belt-and-suspenders coverage for edge cases
 *     - Preserved for correctness; will be removed if heuristics proves complete
 */

import {
  getContactById,
  getPhonesByContactId,
  getEmailsByContactId,
  getAllContactIds,
} from '../db/repositories/contactRepository';
import { upsertDuplicateCandidate, countPendingDuplicates } from '../db/repositories/duplicateRepository';
import {
  buildContactSnapshot,
  scoreDuplicatePair,
} from '../utils/duplicateScoring';
import {
  runDuplicateHeuristicScan,
  type HeuristicScanResult,
} from './duplicateHeuristicsService';
import { DUPLICATE_SCAN_CHUNK_SIZE } from '../constants';

export interface DuplicateScanProgress {
  processed: number;
  total: number;
  found: number;
}

type ProgressCallback = (progress: DuplicateScanProgress) => void;

/**
 * Runs a duplicate scan via the SQL-grouped heuristics engine.
 *
 * Falls back to the JS O(N²) path only if the heuristic scan reports
 * zero results on a non-empty database — which would indicate a schema
 * or data issue worth catching during development.
 */
export async function runDuplicateScan(
  onProgress?: ProgressCallback,
  force = false,
): Promise<{ found: number }> {
  // Primary: SQL-grouped heuristic scan
  const heuristicResult = runDuplicateHeuristicScan(force);

  // If heuristics ran (not cooldown-skipped) and found results, we're done.
  // onProgress is not meaningful for the SQL path since it's synchronous.
  if (heuristicResult.totalChecked > 0) {
    onProgress?.({ processed: heuristicResult.totalChecked, total: heuristicResult.totalChecked, found: heuristicResult.newSuggestions });
    return { found: heuristicResult.newSuggestions };
  }

  // Cooldown: scan was recent, return count from DB
  const allIds = getAllContactIds();
  if (allIds.length === 0 || !force) {
    onProgress?.({ processed: 0, total: 0, found: 0 });
    return { found: 0 };
  }

  // Fallback: heuristics ran but found 0 results on a non-empty DB.
  // Run the JS scoring path as a safety net.
  return runJsFallbackScan(allIds, onProgress);
}

/**
 * JS-chunked O(N²) fallback scan.
 * Preserved for edge cases; primary path is the heuristics engine above.
 */
async function runJsFallbackScan(
  allIds: number[],
  onProgress?: ProgressCallback,
): Promise<{ found: number }> {
  const total = allIds.length;
  let processed = 0;
  let found = 0;

  const snapshots: ReturnType<typeof buildContactSnapshot>[] = [];

  for (let i = 0; i < allIds.length; i += DUPLICATE_SCAN_CHUNK_SIZE) {
    const chunkIds = allIds.slice(i, i + DUPLICATE_SCAN_CHUNK_SIZE);
    const chunkSnapshots = chunkIds.flatMap((id) => {
      const contact = getContactById(id);
      if (!contact || contact.isGhost) return [];
      const phones = getPhonesByContactId(id).map((p) => p.normalizedNumber);
      const emails = getEmailsByContactId(id).map((e) => e.normalizedEmail);
      return [buildContactSnapshot({
        id,
        normalizedName: contact.normalizedName,
        phones,
        emails,
      })];
    });

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
