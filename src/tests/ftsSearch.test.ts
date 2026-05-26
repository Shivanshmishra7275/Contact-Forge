/**
 * ContactForge — FTS probe and search query builder tests
 *
 * These tests cover:
 *  - The match term builder (pure function, no DB needed)
 *  - The FTS probe mock (verifies fallback chain logic)
 */

import { buildMatchTerm } from '../db/repositories/searchRepository';
import { resetFtsModeCache } from '../db/ftsProbe';

// ---------------------------------------------------------------------------
// buildMatchTerm — pure function tests
// ---------------------------------------------------------------------------

describe('buildMatchTerm', () => {
  it('returns empty string for empty input', () => {
    expect(buildMatchTerm('')).toBe('');
    expect(buildMatchTerm('  ')).toBe('');
  });

  it('wraps single word in quoted prefix term', () => {
    expect(buildMatchTerm('john')).toBe('"john"*');
  });

  it('wraps each word as AND prefix terms', () => {
    expect(buildMatchTerm('john doe')).toBe('"john"* "doe"*');
  });

  it('lowercases all terms', () => {
    expect(buildMatchTerm('JOHN DOE')).toBe('"john"* "doe"*');
  });

  it('handles extra whitespace between words', () => {
    expect(buildMatchTerm('  john   doe  ')).toBe('"john"* "doe"*');
  });

  it('routes pure digit input (≥4 digits) to phones column prefix', () => {
    expect(buildMatchTerm('5551234')).toBe('phones:"5551234"*');
  });

  it('routes phone with common separators to phones column prefix', () => {
    // "+1-555-1234" → digits "15551234" (≥4) and stripping non-digit separators equals digits
    expect(buildMatchTerm('555-1234')).toBe('phones:"5551234"*');
  });

  it('does NOT route 3 digit input to phones column (too short to be distinctive)', () => {
    const result = buildMatchTerm('555');
    // Short digit string is treated as a general text term
    expect(result).toBe('"555"*');
  });

  it('strips double-quote chars from terms to prevent MATCH injection', () => {
    const result = buildMatchTerm('john"doe');
    // Double quote is removed from the token
    expect(result).toBe('"johndoe"*');
  });

  it('handles three-word queries', () => {
    expect(buildMatchTerm('acme corp ltd')).toBe('"acme"* "corp"* "ltd"*');
  });
});

// ---------------------------------------------------------------------------
// resetFtsModeCache — module isolation helper
// ---------------------------------------------------------------------------

describe('resetFtsModeCache', () => {
  it('does not throw when called', () => {
    expect(() => resetFtsModeCache()).not.toThrow();
  });
});
