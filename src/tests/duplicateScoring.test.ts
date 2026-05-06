/**
 * Tests for the duplicate scoring engine.
 */

import {
  scoreDuplicatePair,
  buildContactSnapshot,
} from '../utils/duplicateScoring';
import type { ContactSnapshot } from '../utils/duplicateScoring';

function makeSnapshot(
  id: number,
  name: string,
  phones: string[],
  emails: string[],
): ContactSnapshot {
  return buildContactSnapshot({ id, normalizedName: name, phones, emails });
}

describe('scoreDuplicatePair', () => {
  it('returns very_high confidence for exact phone match', () => {
    const a = makeSnapshot(1, 'john doe', ['5551234567'], []);
    const b = makeSnapshot(2, 'john doe', ['5551234567'], []);
    const result = scoreDuplicatePair(a, b);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe('very_high');
    expect(result.reasons).toContain('exact_phone_match');
  });

  it('returns very_high confidence for exact email match', () => {
    const a = makeSnapshot(1, 'jane smith', [], ['jane@example.com']);
    const b = makeSnapshot(2, 'jane smith', [], ['jane@example.com']);
    const result = scoreDuplicatePair(a, b);
    expect(result.isDuplicate).toBe(true);
    expect(result.reasons).toContain('exact_email_match');
  });

  it('detects exact name match', () => {
    const a = makeSnapshot(1, 'alice johnson', [], []);
    const b = makeSnapshot(2, 'alice johnson', [], []);
    const result = scoreDuplicatePair(a, b);
    expect(result.reasons).toContain('exact_name_match');
  });

  it('detects fuzzy name match for similar names', () => {
    const a = makeSnapshot(1, 'john doe', ['+15551234567'], []);
    const b = makeSnapshot(2, 'jon doe', ['+15551234567'], []);
    const result = scoreDuplicatePair(a, b);
    expect(result.isDuplicate).toBe(true);
    expect(result.reasons).toContain('fuzzy_name_match');
  });

  it('detects overlapping phone (one has country code)', () => {
    const a = makeSnapshot(1, 'bob', ['5551234567'], []);
    const b = makeSnapshot(2, 'bob', ['15551234567'], []);
    const result = scoreDuplicatePair(a, b);
    // Should detect as overlapping phone (one ends with the other)
    expect(result.isDuplicate).toBe(true);
  });

  it('returns isDuplicate=false for completely different contacts', () => {
    const a = makeSnapshot(1, 'alice jones', ['5551110000'], ['alice@a.com']);
    const b = makeSnapshot(2, 'zach brown', ['9998887777'], ['zach@z.com']);
    const result = scoreDuplicatePair(a, b);
    expect(result.isDuplicate).toBe(false);
  });

  it('caps score at 100', () => {
    const a = makeSnapshot(1, 'test user', ['5551234567', '5559876543'], ['test@test.com']);
    const b = makeSnapshot(2, 'test user', ['5551234567', '5559876543'], ['test@test.com']);
    const result = scoreDuplicatePair(a, b);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('score is always >= 0', () => {
    const a = makeSnapshot(1, '', [], []);
    const b = makeSnapshot(2, '', [], []);
    const result = scoreDuplicatePair(a, b);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('includes name_phone_combination reason for name+phone match', () => {
    const a = makeSnapshot(1, 'john doe', ['5551234567'], []);
    const b = makeSnapshot(2, 'john doe', ['5551234567'], []);
    const result = scoreDuplicatePair(a, b);
    expect(result.reasons).toContain('name_phone_combination');
  });

  it('returns reasons array with at least one entry for duplicates', () => {
    const a = makeSnapshot(1, 'john doe', ['5551234567'], []);
    const b = makeSnapshot(2, 'john doe', ['5551234567'], []);
    const result = scoreDuplicatePair(a, b);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

describe('buildContactSnapshot', () => {
  it('normalizes phone numbers', () => {
    const snap = buildContactSnapshot({
      id: 1,
      normalizedName: 'john doe',
      phones: ['(555) 123-4567'],
      emails: [],
    });
    expect(snap.phoneNumbers[0]).toBe('5551234567');
  });

  it('normalizes email addresses', () => {
    const snap = buildContactSnapshot({
      id: 1,
      normalizedName: 'john doe',
      phones: [],
      emails: ['JOHN@EXAMPLE.COM'],
    });
    expect(snap.emails[0]).toBe('john@example.com');
  });

  it('filters out empty phones', () => {
    const snap = buildContactSnapshot({
      id: 1,
      normalizedName: 'test',
      phones: ['', '5551234567'],
      emails: [],
    });
    expect(snap.phoneNumbers).toHaveLength(1);
  });
});
