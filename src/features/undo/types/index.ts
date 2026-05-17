import type { ContactWithDetails } from '../../../types';

export type UndoActionType = 'archive' | 'merge' | 'delete' | 'bulk_delete' | 'import';

export interface UndoRecord {
  id: number;
  actionType: UndoActionType;
  actionDataJson: string;
  contactId?: number;
  createdAt: string;
  expiresAt: string;
}

// Payloads serialized into actionDataJson
export interface UndoDeletePayload {
  contact: ContactWithDetails;
}

export interface UndoBulkDeletePayload {
  contacts: ContactWithDetails[];
}

export interface UndoMergePayload {
  survivorPreMerge: ContactWithDetails;
  absorbedPreMerge: ContactWithDetails;
}
