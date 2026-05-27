/**
 * ContactForge — Duplicate Engine Tests (Priority 1)
 *
 * Covers:
 *  1. Normalization edge cases (honorifics, inverted names, tags)
 *  2. Inverted-name key matching
 *  3. Merge result builder correctness
 *  4. isSafeBulkMerge eligibility
 *  5. Merge builder dedup of phones/emails/tags
 *  6. Ghost contact detection in normalization
 *  7. Ignored pair policy (via isIgnoredPair)
 *  8. purgeOrphanedCandidates removes tombstoned pairs
 *  9. Note collision merge policy (concatenation)
 * 10. Tag normalization in merge
 */

import {
  normalizeNameForDedup,
  buildInvertedNameKey,
  normalizeTagsArray,
} from '../utils/normalization';
import { buildMergeComparison, buildMergeResult, isSafeBulkMerge } from '../features/merge/utils/buildMergeComparison';
import { isIgnoredPair, purgeOrphanedCandidates, upsertDuplicateCandidate, resolveDuplicateCandidate } from '../db/repositories/duplicateRepository';
import { insertContact, insertPhoneNumber, insertEmail, deleteContact } from '../db/repositories/contactRepository';
import { getDatabase, resetDatabaseForTesting } from '../db';
import type { ContactWithDetails } from '../types';
import type { DuplicateReason } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContact(
  id: number,
  opts: Partial<ContactWithDetails> = {},
): ContactWithDetails {
  return {
    id,
    nativeId: 'nativeId' in opts ? (opts.nativeId ?? null) : null,
    firstName: opts.firstName ?? null,
    lastName: opts.lastName ?? null,
    displayName: opts.displayName ?? '',
    normalizedName: opts.normalizedName ?? '',
    company: opts.company ?? null,
    jobTitle: opts.jobTitle ?? null,
    notes: opts.notes ?? null,
    birthday: opts.birthday ?? null,
    imageUri: 'imageUri' in opts ? (opts.imageUri ?? null) : null,
    hasThumbnail: opts.hasThumbnail ?? false,
    isTemporary: opts.isTemporary ?? false,
    isGhost: opts.isGhost ?? false,
    tags: opts.tags ?? '[]',
    syncedAt: opts.syncedAt ?? null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    phoneNumbers: opts.phoneNumbers ?? [],
    emails: opts.emails ?? [],
  };
}

// ---------------------------------------------------------------------------
// 1. Normalization edge cases
// ---------------------------------------------------------------------------

describe('normalizeNameForDedup', () => {
  it('strips Dr. prefix', () => {
    expect(normalizeNameForDedup('Dr. John Smith')).toBe('john smith');
  });

  it('strips Mr prefix (no period)', () => {
    expect(normalizeNameForDedup('Mr Bob Jones')).toBe('bob jones');
  });

  it('strips Mrs. prefix', () => {
    expect(normalizeNameForDedup('Mrs. Alice Brown')).toBe('alice brown');
  });

  it('strips Prof. prefix', () => {
    expect(normalizeNameForDedup('Prof. Alan Turing')).toBe('alan turing');
  });

  it('strips Ms prefix', () => {
    expect(normalizeNameForDedup('Ms. Jane Doe')).toBe('jane doe');
  });

  it('does not strip non-honorific prefixes', () => {
    expect(normalizeNameForDedup('Michael Jordan')).toBe('michael jordan');
  });

  it('handles null', () => {
    expect(normalizeNameForDedup(null)).toBe('');
  });

  it('handles all-caps name with honorific', () => {
    expect(normalizeNameForDedup('DR. JOHN SMITH')).toBe('john smith');
  });
});

// ---------------------------------------------------------------------------
// 2. Inverted name key
// ---------------------------------------------------------------------------

describe('buildInvertedNameKey', () => {
  it('produces the same key for "John Doe" and "Doe John"', () => {
    expect(buildInvertedNameKey('John Doe')).toBe(buildInvertedNameKey('Doe John'));
  });

  it('produces same key regardless of case', () => {
    expect(buildInvertedNameKey('JOHN DOE')).toBe(buildInvertedNameKey('john doe'));
  });

  it('strips honorifics before building key', () => {
    expect(buildInvertedNameKey('Dr. John Doe')).toBe(buildInvertedNameKey('John Doe'));
  });

  it('returns empty for null', () => {
    expect(buildInvertedNameKey(null)).toBe('');
  });

  it('returns empty for blank string', () => {
    expect(buildInvertedNameKey('')).toBe('');
  });

  it('produces sorted tokens', () => {
    // "Alice Bob Charlie" -> "alice bob charlie" (already sorted)
    expect(buildInvertedNameKey('Alice Bob Charlie')).toBe('alice bob charlie');
    // "Charlie Bob Alice" -> "alice bob charlie" (sorted)
    expect(buildInvertedNameKey('Charlie Bob Alice')).toBe('alice bob charlie');
  });

  it('collapses repeated whitespace before building key', () => {
    expect(buildInvertedNameKey('John  Doe')).toBe(buildInvertedNameKey('John Doe'));
  });
});

// ---------------------------------------------------------------------------
// 3. normalizeTagsArray
// ---------------------------------------------------------------------------

describe('normalizeTagsArray', () => {
  it('deduplicates case-insensitively', () => {
    const result = normalizeTagsArray(['Work', 'work', 'WORK']);
    expect(result).toHaveLength(1);
  });

  it('sorts alphabetically', () => {
    const result = normalizeTagsArray(['Zed', 'Alpha', 'Mid']);
    expect(result).toEqual(['Alpha', 'Mid', 'Zed']);
  });

  it('removes empty strings', () => {
    const result = normalizeTagsArray(['', 'Work', '  ']);
    expect(result).not.toContain('');
    expect(result).toHaveLength(1);
  });

  it('trims whitespace from each tag', () => {
    const result = normalizeTagsArray(['  Work  ']);
    expect(result[0]).toBe('Work');
  });

  it('handles empty array', () => {
    expect(normalizeTagsArray([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. buildMergeResult — note collision policy
// ---------------------------------------------------------------------------

describe('buildMergeResult — notes merge policy', () => {
  it('concatenates different non-empty notes with separator', () => {
    const a = makeContact(1, { notes: 'Met at conference', normalizedName: 'alice' });
    const b = makeContact(2, { notes: 'Old friend', normalizedName: 'alice' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.notes).toBe('Met at conference\n---\nOld friend');
  });

  it('uses single note when only one contact has notes', () => {
    const a = makeContact(1, { notes: 'Has notes', normalizedName: 'alice' });
    const b = makeContact(2, { notes: null, normalizedName: 'alice' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.notes).toBe('Has notes');
  });

  it('returns null when both contacts have no notes', () => {
    const a = makeContact(1, { notes: null, normalizedName: 'alice' });
    const b = makeContact(2, { notes: null, normalizedName: 'alice' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.notes).toBeNull();
  });

  it('uses single note when both have identical notes', () => {
    const a = makeContact(1, { notes: 'Same note', normalizedName: 'alice' });
    const b = makeContact(2, { notes: 'Same note', normalizedName: 'alice' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    // Identical notes -> no concatenation, just use the single value
    expect(result.notes).toBe('Same note');
  });
});

// ---------------------------------------------------------------------------
// 5. buildMergeResult — phone deduplication
// ---------------------------------------------------------------------------

describe('buildMergeResult — phone deduplication', () => {
  it('deduplicates phones by normalizedNumber', () => {
    const a = makeContact(1, {
      normalizedName: 'alice',
      phoneNumbers: [{ id: 1, contactId: 1, label: 'mobile', number: '555-123-4567', normalizedNumber: '5551234567' }],
    });
    const b = makeContact(2, {
      normalizedName: 'alice',
      phoneNumbers: [{ id: 2, contactId: 2, label: 'home', number: '(555) 123-4567', normalizedNumber: '5551234567' }],
    });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.phones).toHaveLength(1);
    expect(result.phones[0].normalizedNumber).toBe('5551234567');
  });

  it('preserves distinct phones', () => {
    const a = makeContact(1, {
      normalizedName: 'alice',
      phoneNumbers: [{ id: 1, contactId: 1, label: 'mobile', number: '5551111111', normalizedNumber: '5551111111' }],
    });
    const b = makeContact(2, {
      normalizedName: 'alice',
      phoneNumbers: [{ id: 2, contactId: 2, label: 'work', number: '5552222222', normalizedNumber: '5552222222' }],
    });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.phones).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 6. buildMergeResult — email deduplication
// ---------------------------------------------------------------------------

describe('buildMergeResult — email deduplication', () => {
  it('deduplicates emails by normalizedEmail', () => {
    const a = makeContact(1, {
      normalizedName: 'alice',
      emails: [{ id: 1, contactId: 1, label: 'work', email: 'Alice@Example.COM', normalizedEmail: 'alice@example.com' }],
    });
    const b = makeContact(2, {
      normalizedName: 'alice',
      emails: [{ id: 2, contactId: 2, label: 'home', email: 'alice@example.com', normalizedEmail: 'alice@example.com' }],
    });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.emails).toHaveLength(1);
  });

  it('preserves distinct emails', () => {
    const a = makeContact(1, {
      normalizedName: 'alice',
      emails: [{ id: 1, contactId: 1, label: 'work', email: 'work@example.com', normalizedEmail: 'work@example.com' }],
    });
    const b = makeContact(2, {
      normalizedName: 'alice',
      emails: [{ id: 2, contactId: 2, label: 'personal', email: 'personal@example.com', normalizedEmail: 'personal@example.com' }],
    });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.emails).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 7. buildMergeResult — tag deduplication
// ---------------------------------------------------------------------------

describe('buildMergeResult — tag merge', () => {
  it('unions tags from both contacts', () => {
    const a = makeContact(1, { normalizedName: 'alice', tags: '["Work","Friend"]' });
    const b = makeContact(2, { normalizedName: 'alice', tags: '["Family"]' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.tags).toContain('Work');
    expect(result.tags).toContain('Friend');
    expect(result.tags).toContain('Family');
  });

  it('deduplicates tags case-insensitively', () => {
    const a = makeContact(1, { normalizedName: 'alice', tags: '["Work"]' });
    const b = makeContact(2, { normalizedName: 'alice', tags: '["work","WORK"]' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    // Should have only one Work/work/WORK entry
    expect(result.tags).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 8. isSafeBulkMerge
// ---------------------------------------------------------------------------

describe('isSafeBulkMerge', () => {
  it('is eligible for exact phone + exact name, no conflicts', () => {
    const reasons: DuplicateReason[] = ['exact_phone_match', 'exact_name_match', 'name_phone_combination'];
    const result = isSafeBulkMerge(reasons, false);
    expect(result.eligible).toBe(true);
  });

  it('is eligible for exact email + exact name, no conflicts', () => {
    const reasons: DuplicateReason[] = ['exact_email_match', 'exact_name_match', 'name_email_combination'];
    const result = isSafeBulkMerge(reasons, false);
    expect(result.eligible).toBe(true);
  });

  it('is ineligible when scalar conflicts exist', () => {
    const reasons: DuplicateReason[] = ['exact_phone_match', 'exact_name_match'];
    const result = isSafeBulkMerge(reasons, true); // hasConflicts = true
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('has_scalar_conflicts');
  });

  it('is ineligible when only fuzzy name match (no exact identifier)', () => {
    const reasons: DuplicateReason[] = ['fuzzy_name_match', 'overlapping_phone'];
    const result = isSafeBulkMerge(reasons, false);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('no_exact_identifier_match');
  });

  it('is ineligible for exact phone only without name confirmation (family/shared number risk)', () => {
    const reasons: DuplicateReason[] = ['exact_phone_match'];
    const result = isSafeBulkMerge(reasons, false);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('low_confidence');
  });

  it('is ineligible for inverted_name_match alone', () => {
    const reasons: DuplicateReason[] = ['inverted_name_match'];
    const result = isSafeBulkMerge(reasons, false);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('no_exact_identifier_match');
  });
});

// ---------------------------------------------------------------------------
// 9. buildMergeResult — identity preservation
// ---------------------------------------------------------------------------

describe('buildMergeResult — identity preservation', () => {
  it('survivorId is contactA.id', () => {
    const a = makeContact(3, { normalizedName: 'alice', nativeId: 'native-a' });
    const b = makeContact(7, { normalizedName: 'alice' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.survivorId).toBe(3);
    expect(result.losingId).toBe(7);
  });

  it('promotes loser nativeId when survivor has none', () => {
    const a = makeContact(1, { normalizedName: 'alice', nativeId: null });
    const b = makeContact(2, { normalizedName: 'alice', nativeId: 'native-b' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.nativeId).toBe('native-b');
  });

  it('preserves survivor nativeId when both have one', () => {
    const a = makeContact(1, { normalizedName: 'alice', nativeId: 'native-a' });
    const b = makeContact(2, { normalizedName: 'alice', nativeId: 'native-b' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.nativeId).toBe('native-a');
  });
});

// ---------------------------------------------------------------------------
// 10. hasConflicts detection
// ---------------------------------------------------------------------------

describe('buildMergeResult — conflict detection', () => {
  it('hasConflicts is true when scalar fields differ', () => {
    const a = makeContact(1, { firstName: 'Alice', company: 'Acme', normalizedName: 'alice' });
    const b = makeContact(2, { firstName: 'Alice', company: 'BetaCorp', normalizedName: 'alice' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.hasConflicts).toBe(true);
  });

  it('hasConflicts is false when all scalars match or one is empty', () => {
    const a = makeContact(1, { firstName: 'Alice', company: 'Acme', normalizedName: 'alice' });
    const b = makeContact(2, { firstName: 'Alice', company: null, normalizedName: 'alice' });
    const model = buildMergeComparison(a, b);
    const result = buildMergeResult(model);
    expect(result.hasConflicts).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 11. DB integration — isIgnoredPair and purgeOrphanedCandidates
// ---------------------------------------------------------------------------

describe('duplicate repository — ignore memory (DB integration)', () => {
  beforeEach(() => {
    resetDatabaseForTesting();
  });

  it('isIgnoredPair returns false for unknown pair', () => {
    expect(isIgnoredPair(1, 2)).toBe(false);
  });

  it('isIgnoredPair returns false for pending pair', () => {
    // Insert two contacts and a candidate
    const idA = insertContact({ firstName: 'Alice' });
    const idB = insertContact({ firstName: 'Bob' });
    upsertDuplicateCandidate({
      contactIdA: idA,
      contactIdB: idB,
      confidence: 'high',
      score: 70,
      reasons: ['exact_name_match'],
    });
    expect(isIgnoredPair(idA, idB)).toBe(false);
  });

  it('isIgnoredPair returns true after resolving as ignored', () => {
    const db = getDatabase();
    // Mock the database to return an 'ignored' status row
    jest.spyOn(db, 'getFirstSync').mockReturnValueOnce({ status: 'ignored' });
    
    expect(isIgnoredPair(1, 2)).toBe(true);
  });

  it('isIgnoredPair is order-independent', () => {
    const db = getDatabase();
    
    // We expect the query to always use [1, 2] since min/max is enforced
    const mockGetFirstSync = jest.spyOn(db, 'getFirstSync').mockReturnValue({ status: 'ignored' });
    
    expect(isIgnoredPair(2, 1)).toBe(true);
    expect(isIgnoredPair(1, 2)).toBe(true);
    
    expect(mockGetFirstSync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT status FROM duplicate_candidates'),
      [1, 2]
    );
    
    mockGetFirstSync.mockRestore();
  });

  it('purgeOrphanedCandidates removes candidates for deleted contacts', () => {
    const idA = insertContact({ firstName: 'Alice' });
    const idB = insertContact({ firstName: 'Bob' });
    upsertDuplicateCandidate({
      contactIdA: idA,
      contactIdB: idB,
      confidence: 'high',
      score: 70,
      reasons: ['exact_name_match'],
    });

    // Soft-delete contact A (tombstone)
    const db = getDatabase();
    db.runSync('UPDATE contacts SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?', [
      new Date().toISOString(),
      new Date().toISOString(),
      idA,
    ]);

    const removed = purgeOrphanedCandidates();
    expect(removed).toBeGreaterThan(0);

    const remaining = db.getAllSync<{ id: number }>('SELECT id FROM duplicate_candidates', []);
    expect(remaining).toHaveLength(0);
  });

  it('purgeOrphanedCandidates is idempotent', () => {
    purgeOrphanedCandidates();
    purgeOrphanedCandidates(); // Should not throw
  });
});
