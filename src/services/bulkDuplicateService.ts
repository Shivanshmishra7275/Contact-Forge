import { getDatabase } from '../db';
import { getPendingDuplicates, resolveDuplicateCandidate, recordMerge } from '../db/repositories/duplicateRepository';
import { 
  getContactWithDetails, 
  updateContact, 
  replacePhonesByContactIdSync,
  deleteEmailsByContactId,
  insertEmail,
  deleteContact
} from '../db/repositories/contactRepository';
import { reassignNotes } from '../db/repositories/noteRepository';
import { reassignRelationships } from '../db/repositories/relationshipRepository';
import { transferTemporaryContact } from '../db/repositories/temporaryContactRepository';
import { recordUndoAction } from '../db/repositories/undoRepository';
import { buildMergeComparison, buildMergeResult, isSafeBulkMerge } from '../features/merge/utils/buildMergeComparison';
import { logAction } from '../db/repositories/auditRepository';
import type { UndoMergePayload, UndoBulkMergePayload } from '../features/undo/types';
import type { DuplicateCandidate } from '../types';

export interface BulkMergeResult {
  mergedCount: number;
  skippedCount: number;
}

export function executeSafeBulkMerge(): BulkMergeResult {
  const db = getDatabase();
  const pendingPairs = getPendingDuplicates();
  
  if (pendingPairs.length === 0) {
    return { mergedCount: 0, skippedCount: 0 };
  }

  let mergedCount = 0;
  let skippedCount = 0;

  db.withTransactionSync(() => {
    const executedMerges: UndoMergePayload[] = [];

    for (const candidate of pendingPairs) {
      const contactA = getContactWithDetails(candidate.contactIdA);
      const contactB = getContactWithDetails(candidate.contactIdB);

      if (!contactA || !contactB) {
        skippedCount++;
        continue;
      }

      const comparisonModel = buildMergeComparison(contactA, contactB);
      const mergeResult = buildMergeResult(comparisonModel, candidate.reasons);
      
      // Phase F: Check if it's safe for bulk merge without user review
      if (!mergeResult.isSafeBulkMergeable) {
        skippedCount++;
        continue;
      }
      
      // Determine actual survivor and absorbed based on mergeResult
      const survivor = mergeResult.survivorId === contactA.id ? contactA : contactB;
      const absorbed = mergeResult.losingId === contactB.id ? contactB : contactA;

      // 1. Record snapshot for rollback
      const snapshot = JSON.stringify({ survivor, absorbed });
      recordMerge({
        survivorContactId: survivor.id,
        mergedContactIds: [absorbed.id],
        snapshotJson: snapshot,
      });

      // Track undo payload
      executedMerges.push({
        survivorPreMerge: survivor,
        absorbedPreMerge: absorbed,
      });

      // 2. Update Survivor Scalar Fields
      const scalarUpdates: any = {
        firstName: mergeResult.firstName,
        lastName: mergeResult.lastName,
        company: mergeResult.company,
        jobTitle: mergeResult.jobTitle,
        notes: mergeResult.notes,
        birthday: mergeResult.birthday,
        imageUri: mergeResult.imageUri,
        hasThumbnail: mergeResult.hasThumbnail,
        isTemporary: survivor.isTemporary,
        tags: mergeResult.tags,
      };
      updateContact(survivor.id, scalarUpdates);

      // 3. Update Phones & Emails (already deduped by buildMergeResult)
      replacePhonesByContactIdSync(survivor.id, mergeResult.phones);
      
      deleteEmailsByContactId(survivor.id);
      for (const e of mergeResult.emails) {
        insertEmail({ contactId: survivor.id, label: e.label ?? undefined, email: e.email });
      }

      // 4. Move notes and relationships
      const movedNotes = reassignNotes(absorbed.id, survivor.id);
      const relationshipResult = reassignRelationships(absorbed.id, survivor.id);
      const movedTemporary = transferTemporaryContact(absorbed.id, survivor.id);

      // 5. Delete the absorbed contact
      deleteContact(absorbed.id);

      // 6. Resolve duplicate candidate
      resolveDuplicateCandidate(candidate.id, 'safe');

      logAction('contacts_merged', survivor.id, {
        survivorId: survivor.id,
        absorbedId: absorbed.id,
        movedNotes,
        relationshipsUpdated: relationshipResult.updated,
        relationshipsRemoved: relationshipResult.removed,
        movedTemporary,
      });

      mergedCount++;
    }

    // Record one consolidated Undo action if any merges were executed
    if (executedMerges.length > 0) {
      const bulkUndoPayload: UndoBulkMergePayload = { merges: executedMerges };
      recordUndoAction({
        actionType: 'bulk_merge',
        actionDataJson: JSON.stringify(bulkUndoPayload),
      });
    }
  });

  return { mergedCount, skippedCount };
}
