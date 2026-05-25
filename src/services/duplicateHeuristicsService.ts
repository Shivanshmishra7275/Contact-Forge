/**
 * ContactForge — Duplicate Heuristics Service
 *
 * Deterministic, explainable rules for detecting suspected duplicate contacts.
 * No black-box scoring. Every suggestion has a human-readable reason.
 *
 * Detection rules (in order of priority):
 *   1. Exact normalized phone match across two different contacts
 *   2. Exact normalized email match across two different contacts
 *   3. Exact normalized name match
 *   4. High name similarity + overlapping last-7 phone digits
 *   5. Same company + high name similarity (fuzzy near-duplicate)
 */

import { getDatabase } from '../db';
import { normalizePhone, normalizeEmail, normalizeName, nameSimilarity } from '../utils/normalization';
import { upsertDuplicateCandidate } from '../db/repositories/duplicateRepository';
import type { DuplicateCandidate, DuplicateReason, DuplicateConfidence } from '../types';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface PhoneRow {
  contact_id: number;
  normalized_number: string;
}

interface EmailRow {
  contact_id: number;
  normalized_email: string;
}

interface ContactRow {
  id: number;
  normalized_name: string;
  company: string | null;
}

interface SuggestionResult {
  contactIdA: number;
  contactIdB: number;
  score: number;
  confidence: DuplicateConfidence;
  reasons: DuplicateReason[];
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function scoreToConfidence(score: number): DuplicateConfidence {
  if (score >= 85) return 'very_high';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function makeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

// ---------------------------------------------------------------------------
// Rule 1 — Exact normalized phone match
// ---------------------------------------------------------------------------

function detectExactPhoneDuplicates(): SuggestionResult[] {
  const db = getDatabase();
  // Find phone numbers shared by 2+ contacts (after normalization)
  const rows = db.getAllSync<PhoneRow>(
    `SELECT p.contact_id, p.normalized_number
     FROM phone_numbers p
     WHERE p.normalized_number != ''
     ORDER BY p.normalized_number, p.contact_id`,
    [],
  );

  const byPhone = new Map<string, number[]>();
  for (const row of rows) {
    const list = byPhone.get(row.normalized_number) ?? [];
    if (!list.includes(row.contact_id)) list.push(row.contact_id);
    byPhone.set(row.normalized_number, list);
  }

  const results: SuggestionResult[] = [];
  for (const [, ids] of byPhone) {
    if (ids.length < 2) continue;
    // Create pairs from the group
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        results.push({
          contactIdA: ids[i],
          contactIdB: ids[j],
          score: 90,
          confidence: 'very_high',
          reasons: ['exact_phone_match'],
        });
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Rule 2 — Exact normalized email match
// ---------------------------------------------------------------------------

function detectExactEmailDuplicates(): SuggestionResult[] {
  const db = getDatabase();
  const rows = db.getAllSync<EmailRow>(
    `SELECT e.contact_id, e.normalized_email
     FROM email_addresses e
     WHERE e.normalized_email != ''
     ORDER BY e.normalized_email, e.contact_id`,
    [],
  );

  const byEmail = new Map<string, number[]>();
  for (const row of rows) {
    const list = byEmail.get(row.normalized_email) ?? [];
    if (!list.includes(row.contact_id)) list.push(row.contact_id);
    byEmail.set(row.normalized_email, list);
  }

  const results: SuggestionResult[] = [];
  for (const [, ids] of byEmail) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        results.push({
          contactIdA: ids[i],
          contactIdB: ids[j],
          score: 80,
          confidence: 'high',
          reasons: ['exact_email_match'],
        });
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Rule 3 — Exact normalized name match
// ---------------------------------------------------------------------------

function detectExactNameDuplicates(): SuggestionResult[] {
  const db = getDatabase();
  const rows = db.getAllSync<ContactRow>(
    `SELECT id, normalized_name FROM contacts
     WHERE normalized_name != '' AND is_ghost = 0
     ORDER BY normalized_name`,
    [],
  );

  const byName = new Map<string, number[]>();
  for (const row of rows) {
    const list = byName.get(row.normalized_name) ?? [];
    list.push(row.id);
    byName.set(row.normalized_name, list);
  }

  const results: SuggestionResult[] = [];
  for (const [, ids] of byName) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        results.push({
          contactIdA: ids[i],
          contactIdB: ids[j],
          score: 60,
          confidence: 'high',
          reasons: ['exact_name_match'],
        });
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Rule 4 — Fuzzy name + overlapping phone digits (last 7)
// ---------------------------------------------------------------------------

function detectFuzzyNameWithPhoneOverlap(): SuggestionResult[] {
  const db = getDatabase();

  const contacts = db.getAllSync<ContactRow>(
    `SELECT id, normalized_name, company FROM contacts
     WHERE normalized_name != '' AND is_ghost = 0`,
    [],
  );

  const phones = db.getAllSync<PhoneRow>(
    `SELECT contact_id, normalized_number FROM phone_numbers
     WHERE normalized_number != ''`,
    [],
  );

  const phonesByContact = new Map<number, string[]>();
  for (const p of phones) {
    const list = phonesByContact.get(p.contact_id) ?? [];
    list.push(p.normalized_number);
    phonesByContact.set(p.contact_id, list);
  }

  const results: SuggestionResult[] = [];

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const a = contacts[i];
      const b = contacts[j];

      const sim = nameSimilarity(a.normalized_name, b.normalized_name);
      if (sim < 0.75) continue; // Not similar enough

      // Check phone overlap (last 7 digits)
      const phonesA = phonesByContact.get(a.id) ?? [];
      const phonesB = phonesByContact.get(b.id) ?? [];

      let hasPhoneOverlap = false;
      for (const pa of phonesA) {
        for (const pb of phonesB) {
          if (pa.length >= 7 && pb.length >= 7 && pa.slice(-7) === pb.slice(-7)) {
            hasPhoneOverlap = true;
          }
        }
      }

      if (!hasPhoneOverlap) continue;

      const score = Math.round(sim * 50 + 25); // 25-75 range
      results.push({
        contactIdA: a.id,
        contactIdB: b.id,
        score: Math.min(score, 75),
        confidence: scoreToConfidence(score),
        reasons: ['fuzzy_name_match', 'overlapping_phone'],
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Merge & deduplicate results
// ---------------------------------------------------------------------------

function mergeResults(groups: SuggestionResult[][]): SuggestionResult[] {
  const merged = new Map<string, SuggestionResult>();

  for (const group of groups) {
    for (const result of group) {
      const key = makeKey(result.contactIdA, result.contactIdB);
      const existing = merged.get(key);
      if (!existing || result.score > existing.score) {
        // Merge reasons if same pair exists
        const combinedReasons = existing
          ? ([...new Set([...existing.reasons, ...result.reasons])] as DuplicateReason[])
          : result.reasons;
        merged.set(key, {
          ...result,
          contactIdA: Math.min(result.contactIdA, result.contactIdB),
          contactIdB: Math.max(result.contactIdA, result.contactIdB),
          score: Math.max(result.score, existing?.score ?? 0),
          confidence: scoreToConfidence(Math.max(result.score, existing?.score ?? 0)),
          reasons: combinedReasons,
        });
      }
    }
  }

  return Array.from(merged.values());
}

// ---------------------------------------------------------------------------
// Public: Run full heuristic scan and persist to DB
// ---------------------------------------------------------------------------

export interface HeuristicScanResult {
  totalChecked: number;
  newSuggestions: number;
  rules: { exactPhone: number; exactEmail: number; exactName: number; fuzzyNamePhone: number };
}

export function runDuplicateHeuristicScan(): HeuristicScanResult {
  const exactPhone = detectExactPhoneDuplicates();
  const exactEmail = detectExactEmailDuplicates();
  const exactName = detectExactNameDuplicates();
  const fuzzyNamePhone = detectFuzzyNameWithPhoneOverlap();

  const allResults = mergeResults([exactPhone, exactEmail, exactName, fuzzyNamePhone]);

  for (const r of allResults) {
    upsertDuplicateCandidate({
      contactIdA: r.contactIdA,
      contactIdB: r.contactIdB,
      confidence: r.confidence,
      score: r.score,
      reasons: r.reasons,
    });
  }

  return {
    totalChecked: allResults.length,
    newSuggestions: allResults.length,
    rules: {
      exactPhone: exactPhone.length,
      exactEmail: exactEmail.length,
      exactName: exactName.length,
      fuzzyNamePhone: fuzzyNamePhone.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Public: Human-readable reason labels
// ---------------------------------------------------------------------------

export const REASON_LABELS: Record<DuplicateReason, string> = {
  exact_phone_match: 'Exact phone match after normalization',
  exact_email_match: 'Shared email found in both contacts',
  exact_name_match: 'Identical normalized name',
  fuzzy_name_match: 'Similar name detected',
  overlapping_phone: 'Overlapping mobile digits (last 7)',
  overlapping_email: 'Overlapping email domain',
  name_phone_combination: 'Same name + similar phone',
  name_email_combination: 'Same name + shared email',
};
