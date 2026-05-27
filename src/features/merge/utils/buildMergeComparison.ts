/**
 * ContactForge — Merge Comparison & Result Builder
 *
 * Provides two distinct functions:
 *
 * 1. buildMergeComparison(a, b)
 *    Produces a MergeComparisonModel: a structured view of how two contacts
 *    differ field-by-field. Used by the merge review UI to display choices.
 *
 * 2. buildMergeResult(model, reasons?)
 *    Takes a resolved MergeComparisonModel (after the user has chosen which
 *    side wins for each conflict) and produces a MergeResult — the single
 *    executable plan for what gets written to SQLite.
 *
 * This is the ONLY place merge logic lives. The merge screen and any bulk
 * merge path must both go through buildMergeResult(), never implement their
 * own field-resolution logic.
 *
 * Edge case policy:
 *  - Different phones:  union, deduplicated by normalizedNumber
 *  - Different emails:  union, deduplicated by normalizedEmail
 *  - Note collisions:   concatenated with '\n---\n' separator (never lost)
 *  - Tags:             set union, case-insensitive dedup, sorted
 *  - nativeId:         survivor's wins; promotes loser's if survivor lacks one
 *  - imageUri:         survivor's wins; promotes loser's if survivor lacks one
 *  - Soft-deleted:     active contact always wins (caller must not pass deleted contacts)
 *  - Ghost contacts:   excluded upstream; not handled here
 */

import type { ContactWithDetails } from '../../../types';
import type { DuplicateReason } from '../../../types';
import { normalizeTagsArray } from '../../../utils/normalization';
import type {
  FieldComparison,
  FieldSource,
  FieldComparisonState,
  MergeComparisonModel,
  MergeResult,
  BulkMergeIneligibilityReason,
} from '../types';

interface FieldConfig {
  key: keyof ContactWithDetails;
  label: string;
  type: 'scalar' | 'array';
}

const SCALAR_FIELDS: FieldConfig[] = [
  { key: 'firstName', label: 'First Name', type: 'scalar' },
  { key: 'lastName', label: 'Last Name', type: 'scalar' },
  { key: 'company', label: 'Company', type: 'scalar' },
  { key: 'jobTitle', label: 'Job Title', type: 'scalar' },
  { key: 'birthday', label: 'Birthday', type: 'scalar' },
  { key: 'notes', label: 'Notes', type: 'scalar' },
];

// ---------------------------------------------------------------------------
// buildMergeComparison
// ---------------------------------------------------------------------------

export function buildMergeComparison(
  contactA: ContactWithDetails,
  contactB: ContactWithDetails
): MergeComparisonModel {
  const fields: FieldComparison[] = [];

  for (const config of SCALAR_FIELDS) {
    const valA = contactA[config.key] as string | boolean | null;
    const valB = contactB[config.key] as string | boolean | null;

    const isEmptyA = valA === null || valA === '';
    const isEmptyB = valB === null || valB === '';

    let state: FieldComparisonState;
    let selectedSource: FieldSource;
    let resolvedValue: string | boolean | null;

    if (valA === valB) {
      state = 'match';
      selectedSource = 'a';
      resolvedValue = valA;
    } else if (isEmptyA && !isEmptyB) {
      state = 'single-source';
      selectedSource = 'b';
      resolvedValue = valB;
    } else if (!isEmptyA && isEmptyB) {
      state = 'single-source';
      selectedSource = 'a';
      resolvedValue = valA;
    } else {
      state = 'conflict';
      // Default to A for conflicts; UI presents the choice
      selectedSource = 'a';
      resolvedValue = valA;
    }

    fields.push({
      type: 'scalar',
      key: config.key,
      label: config.label,
      valueA: valA,
      valueB: valB,
      state,
      selectedSource,
      resolvedValue,
    });
  }

  // Tags: set union with normalization
  const tagsA = parseTagsArray(contactA.tags);
  const tagsB = parseTagsArray(contactB.tags);
  const mergedTags = normalizeTagsArray([...tagsA, ...tagsB]);
  const isTagsMatch = JSON.stringify(normalizeTagsArray(tagsA)) === JSON.stringify(normalizeTagsArray(tagsB));

  fields.push({
    type: 'array',
    key: 'tags',
    label: 'Tags',
    valueA: tagsA,
    valueB: tagsB,
    state: isTagsMatch ? 'match' : 'mergeable',
    selectedSource: 'combined',
    resolvedValue: mergedTags,
  });

  // Phones: union — dedup by normalizedNumber
  const mergedPhones = deduplicatePhones([...contactA.phoneNumbers, ...contactB.phoneNumbers]);

  fields.push({
    type: 'array',
    key: 'phoneNumbers',
    label: 'Phone Numbers',
    valueA: contactA.phoneNumbers,
    valueB: contactB.phoneNumbers,
    state: 'mergeable',
    selectedSource: 'combined',
    resolvedValue: mergedPhones,
  });

  // Emails: union — dedup by normalizedEmail
  const mergedEmails = deduplicateEmails([...contactA.emails, ...contactB.emails]);

  fields.push({
    type: 'array',
    key: 'emails',
    label: 'Email Addresses',
    valueA: contactA.emails,
    valueB: contactB.emails,
    state: 'mergeable',
    selectedSource: 'combined',
    resolvedValue: mergedEmails,
  });

  return { contactA, contactB, fields };
}

// ---------------------------------------------------------------------------
// buildMergeResult — single executable merge plan
// ---------------------------------------------------------------------------

/**
 * Produces a MergeResult from a resolved MergeComparisonModel.
 *
 * The survivor is always contactA (the one with the lower ID, per the
 * convention in duplicateRepository). The loser is contactB.
 *
 * @param model    A MergeComparisonModel with all conflict fields resolved
 *                 (selectedSource set by the user or by bulk-merge heuristics).
 * @param reasons  Optional DuplicateReasons for this pair — used to compute
 *                 isSafeBulkMergeable.
 */
export function buildMergeResult(
  model: MergeComparisonModel,
  reasons: DuplicateReason[] = [],
): MergeResult {
  const { contactA, contactB, fields } = model;

  const scalarGet = (key: keyof ContactWithDetails): string | null => {
    const field = fields.find((f) => f.key === key);
    if (!field || field.type !== 'scalar') return null;
    const val = field.resolvedValue;
    return typeof val === 'string' ? (val || null) : null;
  };

  // Notes: if both non-empty and different, concatenate deterministically
  const notesA = (contactA.notes ?? '').trim();
  const notesB = (contactB.notes ?? '').trim();
  let resolvedNotes: string | null = null;
  if (notesA && notesB && notesA !== notesB) {
    resolvedNotes = `${notesA}\n---\n${notesB}`;
  } else if (notesA || notesB) {
    resolvedNotes = notesA || notesB;
  }

  // Phones: union, deduplicated by normalizedNumber
  const phonesField = fields.find((f) => f.key === 'phoneNumbers');
  const mergedPhones = phonesField && Array.isArray(phonesField.resolvedValue)
    ? deduplicatePhones(phonesField.resolvedValue)
    : deduplicatePhones([...contactA.phoneNumbers, ...contactB.phoneNumbers]);

  // Emails: union, deduplicated by normalizedEmail
  const emailsField = fields.find((f) => f.key === 'emails');
  const mergedEmails = emailsField && Array.isArray(emailsField.resolvedValue)
    ? deduplicateEmails(emailsField.resolvedValue)
    : deduplicateEmails([...contactA.emails, ...contactB.emails]);

  // Tags: set union, normalized
  const tagsField = fields.find((f) => f.key === 'tags');
  const tagsA = parseTagsArray(contactA.tags);
  const tagsB = parseTagsArray(contactB.tags);
  const mergedTags = tagsField && Array.isArray(tagsField.resolvedValue)
    ? normalizeTagsArray(tagsField.resolvedValue as string[])
    : normalizeTagsArray([...tagsA, ...tagsB]);

  // Identity: survivor wins; promote loser's if survivor lacks one
  const nativeId = contactA.nativeId ?? contactB.nativeId ?? null;
  const imageUri = contactA.imageUri ?? contactB.imageUri ?? null;
  const hasThumbnail = contactA.hasThumbnail || contactB.hasThumbnail;

  const hasConflicts = fields.some((f) => f.type === 'scalar' && f.state === 'conflict');

  const isSafeBulkMergeable = computeIsSafeBulkMergeable(hasConflicts, reasons);

  return {
    survivorId: contactA.id,
    losingId: contactB.id,
    firstName: scalarGet('firstName'),
    lastName: scalarGet('lastName'),
    company: scalarGet('company'),
    jobTitle: scalarGet('jobTitle'),
    birthday: scalarGet('birthday'),
    notes: resolvedNotes,
    phones: mergedPhones,
    emails: mergedEmails,
    tags: mergedTags,
    nativeId,
    imageUri,
    hasThumbnail,
    hasConflicts,
    isSafeBulkMergeable,
  };
}

// ---------------------------------------------------------------------------
// isSafeBulkMerge — eligibility check for bulk (no-review) merge
// ---------------------------------------------------------------------------

/**
 * Returns true if a candidate pair qualifies for bulk merge without user review.
 *
 * Criteria (ALL must hold):
 *  1. Reasons include exact_phone_match OR exact_email_match (strong identifier)
 *  2. Reasons include exact_name_match OR one side has no meaningful name
 *     (name ambiguity = require review)
 *  3. No scalar conflicts in the merge comparison
 *
 * Conservative by design: if any condition is borderline, require review.
 */
export function isSafeBulkMerge(
  reasons: DuplicateReason[],
  hasConflicts: boolean,
): { eligible: boolean; reason?: BulkMergeIneligibilityReason } {
  if (hasConflicts) {
    return { eligible: false, reason: 'has_scalar_conflicts' };
  }

  const hasExactId = reasons.includes('exact_phone_match') || reasons.includes('exact_email_match');
  if (!hasExactId) {
    return { eligible: false, reason: 'no_exact_identifier_match' };
  }

  const hasNameConfidence =
    reasons.includes('exact_name_match') ||
    reasons.includes('name_phone_combination') ||
    reasons.includes('name_email_combination');

  if (!hasNameConfidence) {
    // Exact phone/email match but names differ — require review (family/shared-number risk)
    return { eligible: false, reason: 'low_confidence' };
  }

  return { eligible: true };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function computeIsSafeBulkMergeable(hasConflicts: boolean, reasons: DuplicateReason[]): boolean {
  return isSafeBulkMerge(reasons, hasConflicts).eligible;
}

function deduplicatePhones(
  phones: Array<{ label: string | null; number: string; normalizedNumber: string }>,
): Array<{ label: string | null; number: string; normalizedNumber: string }> {
  const seen = new Set<string>();
  return phones.filter((p) => {
    const key = p.normalizedNumber || p.number;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateEmails(
  emails: Array<{ label: string | null; email: string; normalizedEmail: string }>,
): Array<{ label: string | null; email: string; normalizedEmail: string }> {
  const seen = new Set<string>();
  return emails.filter((e) => {
    const key = e.normalizedEmail || e.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseTagsArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
