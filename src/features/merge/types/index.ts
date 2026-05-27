import type { ContactWithDetails, PhoneNumber, EmailAddress } from '../../../types';

export type FieldComparisonState = 'match' | 'single-source' | 'conflict' | 'mergeable';
export type FieldSource = 'a' | 'b' | 'combined';

export interface ScalarFieldComparison {
  type: 'scalar';
  key: keyof ContactWithDetails;
  label: string;
  valueA: string | boolean | null;
  valueB: string | boolean | null;
  state: FieldComparisonState;
  selectedSource: FieldSource;
  resolvedValue: string | boolean | null;
}

export interface ArrayFieldComparison {
  type: 'array';
  key: keyof ContactWithDetails;
  label: string;
  valueA: any[];
  valueB: any[];
  state: FieldComparisonState;
  selectedSource: FieldSource;
  resolvedValue: any[];
}

export type FieldComparison = ScalarFieldComparison | ArrayFieldComparison;

export interface MergeComparisonModel {
  contactA: ContactWithDetails;
  contactB: ContactWithDetails;
  fields: FieldComparison[];
}

// ---------------------------------------------------------------------------
// MergeResult — single source of truth for merge preview and execution
// ---------------------------------------------------------------------------

/**
 * The resolved, executable plan for a merge operation.
 * Produced by buildMergeResult() from a resolved MergeComparisonModel.
 *
 * This is what actually gets written to SQLite — no other merge logic should
 * exist outside this type and the function that produces it.
 */
export interface MergeResult {
  /** ID of the contact that will survive (winner). */
  survivorId: number;
  /** ID of the contact that will be deleted (loser). */
  losingId: number;

  // Scalar fields — all resolved to a single value
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  jobTitle: string | null;
  birthday: string | null;
  /** Deterministic: if both non-empty and different, joined with '\n---\n' separator. */
  notes: string | null;

  // Arrays — union with deduplication
  /** Deduplicated by normalizedNumber. Display format from whichever side provides it. */
  phones: Array<{ label: string | null; number: string; normalizedNumber: string }>;
  /** Deduplicated by normalizedEmail. */
  emails: Array<{ label: string | null; email: string; normalizedEmail: string }>;
  /** Deduplicated case-insensitively, sorted alphabetically. */
  tags: string[];

  // Identity preservation
  /** Survivor's nativeId if present; falls back to loser's if survivor has none. */
  nativeId: string | null;
  /** Survivor's imageUri; falls back to loser's if survivor has none. */
  imageUri: string | null;
  hasThumbnail: boolean;

  // Metadata flags
  /** True if there were scalar conflicts (different non-empty values for same field). */
  hasConflicts: boolean;
  /**
   * True only for pairs eligible for auto-merge without user review:
   *  - has exact_phone_match OR exact_email_match reason
   *  - AND has exact_name_match OR one side has no name
   *  - AND has no scalar conflicts
   */
  isSafeBulkMergeable: boolean;
}

/**
 * Reasons why a pair is NOT eligible for bulk merge.
 * Used for dry-run summaries.
 */
export type BulkMergeIneligibilityReason =
  | 'has_scalar_conflicts'
  | 'low_confidence'
  | 'no_exact_identifier_match'
  | 'already_resolved';
