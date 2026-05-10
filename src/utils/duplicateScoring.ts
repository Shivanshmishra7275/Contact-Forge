/**
 * ContactForge — Duplicate Scoring Engine
 *
 * Produces explainable, confidence-scored duplicate candidates.
 * No black-box decisions — every match carries a reasons list.
 *
 * Scoring is additive and capped at 100.
 * The reason list is human-readable and surfaced in the UI.
 */

import {
  normalizePhone,
  normalizeName,
  normalizeEmail,
  nameSimilarity,
} from './normalization';
import {
  SCORE_EXACT_PHONE,
  SCORE_EXACT_EMAIL,
  SCORE_EXACT_NAME,
  SCORE_FUZZY_NAME,
  SCORE_OVERLAPPING_PHONE,
  SCORE_OVERLAPPING_EMAIL,
  SCORE_VERY_HIGH,
  SCORE_HIGH,
  SCORE_MEDIUM,
} from '../constants';
import type {
  DuplicateReason,
  DuplicateConfidence,
} from '../types';

export interface ContactSnapshot {
  id: number;
  normalizedName: string;
  phoneNumbers: string[]; // normalized phone strings
  emails: string[];       // normalized email strings
}

export interface DuplicateScoreResult {
  score: number;
  confidence: DuplicateConfidence;
  reasons: DuplicateReason[];
  isDuplicate: boolean;
}

const FUZZY_NAME_THRESHOLD = 0.75; // similarity score that counts as "fuzzy match"
const MIN_SCORE_TO_FLAG = SCORE_MEDIUM;

/**
 * Scores a pair of contacts for duplicate likelihood.
 * Returns an explainable result with score, confidence, and reason list.
 */
export function scoreDuplicatePair(
  a: ContactSnapshot,
  b: ContactSnapshot,
): DuplicateScoreResult {
  const reasons: DuplicateReason[] = [];
  let score = 0;

  const aPhones = new Set(a.phoneNumbers.filter(Boolean));
  const bPhones = new Set(b.phoneNumbers.filter(Boolean));
  const aEmails = new Set(a.emails.filter(Boolean));
  const bEmails = new Set(b.emails.filter(Boolean));

  // --- Phone matching ---
  let exactPhoneMatch = false;
  for (const p of aPhones) {
    if (bPhones.has(p)) {
      exactPhoneMatch = true;
      break;
    }
  }
  if (exactPhoneMatch) {
    reasons.push('exact_phone_match');
  } else {
    // Check for overlapping (partial) phones — e.g. one has country code, other doesn't
    let overlapping = false;
    for (const p of aPhones) {
      for (const q of bPhones) {
        if (p && q && (p.endsWith(q) || q.endsWith(p))) {
          overlapping = true;
          break;
        }
      }
      if (overlapping) break;
    }
    if (overlapping) {
      score += SCORE_OVERLAPPING_PHONE;
      reasons.push('overlapping_phone');
    }
  }

  const exactNameMatch = Boolean(a.normalizedName && b.normalizedName && a.normalizedName === b.normalizedName);

  // Strict duplicate detection: both exact name AND exact phone must match for auto-flagging as duplicate
  if (exactNameMatch && exactPhoneMatch) {
    return {
      score: 100,
      confidence: 'very_high',
      reasons: ['exact_phone_match', 'exact_name_match', 'name_phone_combination'],
      isDuplicate: true,
    };
  }

  // If only exact phone matches (without name), score it high but don't auto-flag as duplicate yet
  // This allows user review before merging
  if (exactPhoneMatch) {
    score += SCORE_EXACT_PHONE;
  }

  // --- Email matching ---
  let exactEmailMatch = false;
  for (const e of aEmails) {
    if (bEmails.has(e)) {
      exactEmailMatch = true;
      break;
    }
  }
  if (exactEmailMatch) {
    score += SCORE_EXACT_EMAIL;
    reasons.push('exact_email_match');
  } else {
    let overlappingEmail = false;
    for (const e of aEmails) {
      for (const f of bEmails) {
        if (e && f && (e.includes(f) || f.includes(e))) {
          overlappingEmail = true;
          break;
        }
      }
      if (overlappingEmail) break;
    }
    if (overlappingEmail) {
      score += SCORE_OVERLAPPING_EMAIL;
      reasons.push('overlapping_email');
    }
  }

  // --- Name matching ---
  if (a.normalizedName && b.normalizedName) {
    if (exactNameMatch) {
      score += SCORE_EXACT_NAME;
      reasons.push('exact_name_match');
    } else {
      const similarity = nameSimilarity(a.normalizedName, b.normalizedName);
      if (similarity >= FUZZY_NAME_THRESHOLD) {
        score += Math.round(SCORE_FUZZY_NAME * similarity);
        reasons.push('fuzzy_name_match');
      }
    }
  }

  // --- Combination bonuses ---
  if (reasons.includes('exact_name_match') && reasons.includes('exact_phone_match')) {
    reasons.push('name_phone_combination');
    score = Math.min(100, score + 10);
  }
  if (reasons.includes('exact_name_match') && reasons.includes('exact_email_match')) {
    reasons.push('name_email_combination');
    score = Math.min(100, score + 10);
  }

  score = Math.min(100, score);

  const confidence = toConfidence(score);
  const isDuplicate = score >= MIN_SCORE_TO_FLAG;

  return { score, confidence, reasons, isDuplicate };
}

function toConfidence(score: number): DuplicateConfidence {
  if (score >= SCORE_VERY_HIGH) return 'very_high';
  if (score >= SCORE_HIGH) return 'high';
  if (score >= SCORE_MEDIUM) return 'medium';
  return 'low';
}

/**
 * Prepares a ContactSnapshot from raw data for use in scoring.
 */
export function buildContactSnapshot(params: {
  id: number;
  normalizedName: string;
  phones: string[];
  emails: string[];
}): ContactSnapshot {
  return {
    id: params.id,
    normalizedName: normalizeName(params.normalizedName),
    phoneNumbers: params.phones.map(normalizePhone).filter(Boolean),
    emails: params.emails.map(normalizeEmail).filter(Boolean),
  };
}
