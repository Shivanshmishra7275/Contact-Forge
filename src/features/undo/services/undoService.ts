import { getDatabase } from '../../../db';
import { getLatestUndoableAction, deleteUndoRecord } from '../../../db/repositories/undoRepository';
import { 
  restoreContactWithDetailsSync, 
  updateContact, 
  replacePhonesByContactIdSync,
  replaceEmailsByContactIdSync
} from '../../../db/repositories/contactRepository';
import { upsertDuplicateCandidate } from '../../../db/repositories/duplicateRepository';
import type { UndoRecord, UndoDeletePayload, UndoBulkDeletePayload, UndoMergePayload } from '../types';

export interface UndoResult {
  success: boolean;
  actionType?: string;
  restoredCount?: number;
  message?: string;
  warnings?: string[];
}

export function executeUndo(): UndoResult {
  const latestAction = getLatestUndoableAction();

  if (!latestAction) {
    return { success: false, message: 'No recent actions to undo.' };
  }

  const db = getDatabase();

  try {
    let restoredCount = 0;
    const warnings: string[] = [];

    db.withTransactionSync(() => {
      switch (latestAction.actionType) {
        case 'delete':
          restoredCount = rollbackDelete(latestAction);
          break;
        case 'bulk_delete':
          restoredCount = rollbackBulkDelete(latestAction);
          break;
        case 'merge':
          restoredCount = rollbackMerge(latestAction, warnings);
          break;
        default:
          throw new Error(`Unsupported undo action type: ${latestAction.actionType}`);
      }

      // Remove the record so it can't be undone twice
      deleteUndoRecord(latestAction.id);
    });

    return {
      success: true,
      actionType: latestAction.actionType,
      restoredCount,
      message: `Successfully undid ${latestAction.actionType.replace('_', ' ')}.`,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during undo execution.',
    };
  }
}

function rollbackDelete(action: UndoRecord): number {
  const payload = JSON.parse(action.actionDataJson) as UndoDeletePayload;
  if (!payload.contact) throw new Error('Invalid undo payload for delete');
  
  restoreContactWithDetailsSync(payload.contact);
  return 1;
}

function rollbackBulkDelete(action: UndoRecord): number {
  const payload = JSON.parse(action.actionDataJson) as UndoBulkDeletePayload;
  if (!payload.contacts || !Array.isArray(payload.contacts)) {
    throw new Error('Invalid undo payload for bulk delete');
  }

  for (const contact of payload.contacts) {
    restoreContactWithDetailsSync(contact);
  }

  return payload.contacts.length;
}

function rollbackMerge(action: UndoRecord, warnings: string[]): number {
  const payload = JSON.parse(action.actionDataJson) as UndoMergePayload;
  
  if (!payload.survivorPreMerge || !payload.absorbedPreMerge) {
    throw new Error('Invalid undo payload for merge');
  }

  const { survivorPreMerge, absorbedPreMerge } = payload;

  // 1. Re-insert the absorbed contact exactly as it was
  restoreContactWithDetailsSync(absorbedPreMerge);

  // 2. Revert the survivor's scalar fields to their pre-merge state
  updateContact(survivorPreMerge.id, {
    firstName: survivorPreMerge.firstName,
    lastName: survivorPreMerge.lastName,
    company: survivorPreMerge.company,
    jobTitle: survivorPreMerge.jobTitle,
    notes: survivorPreMerge.notes,
    birthday: survivorPreMerge.birthday,
    imageUri: survivorPreMerge.imageUri,
    hasThumbnail: survivorPreMerge.hasThumbnail,
    isTemporary: survivorPreMerge.isTemporary,
    isGhost: survivorPreMerge.isGhost,
    tags: JSON.parse(survivorPreMerge.tags || '[]'),
    syncedAt: survivorPreMerge.syncedAt || undefined,
  });

  // 3. Revert phones and emails
  replacePhonesByContactIdSync(survivorPreMerge.id, survivorPreMerge.phoneNumbers);
  replaceEmailsByContactIdSync(survivorPreMerge.id, survivorPreMerge.emails);

  // 4. Re-establish them as duplicates so the user can see them in the UI again
  upsertDuplicateCandidate({
    contactIdA: survivorPreMerge.id,
    contactIdB: absorbedPreMerge.id,
    confidence: 'high',
    score: 95,
    reasons: ['fuzzy_name_match'],
  });

  warnings.push('Notes and relationship links moved during merge could not be fully un-moved.');

  return 2; // Two contacts restored/reverted
}
