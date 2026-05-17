import type { CleanupIssue, LocalContact, DuplicateCandidate, TemporaryContact } from '../../../types';

export type CleanupCategory = 'all' | 'duplicates' | 'incomplete' | 'formatting' | 'temporary';

export interface DuplicatePair {
  candidate: DuplicateCandidate;
  contactA: LocalContact | null;
  contactB: LocalContact | null;
}

export interface UnifiedCleanupItem {
  id: string; // E.g. `dup_${candidate.id}` or `issue_${contact.id}` or `temp_${contact.id}`
  category: 'duplicates' | 'incomplete' | 'formatting' | 'temporary';
  title: string;
  subtitle: string;
  icon: string;
  contactId: number;
  
  // Specific data objects
  contactIssues?: {
    contact: LocalContact;
    issues: CleanupIssue[];
  };
  duplicatePair?: DuplicatePair;
  tempContact?: TemporaryContact;
}
