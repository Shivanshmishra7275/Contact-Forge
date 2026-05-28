/**
 * ContactForge — Contact Health Score Service
 *
 * Calculates explainable quality scores for contacts (Phase 8).
 */

import { getContactById, getPhonesByContactId, getEmailsByContactId } from '../db/repositories/contactRepository';
import { getNotesByContactId } from '../db/repositories/noteRepository';
import { getRelationshipsByContactId } from '../db/repositories/relationshipRepository';
import { getDuplicatesByContactId } from '../db/repositories/duplicateRepository';
import { getTemporaryContactEntry } from './temporaryContactService';
import { getDatabase } from '../db';
import type { ContactHealthScore } from '../types';

export function calculateContactHealthScore(contactId: number): ContactHealthScore | null {
  const contact = getContactById(contactId);
  if (!contact) return null;

  const phones = getPhonesByContactId(contactId);
  const emails = getEmailsByContactId(contactId);
  const notes = getNotesByContactId(contactId);
  const relationships = getRelationshipsByContactId(contactId);
  const duplicates = getDuplicatesByContactId(contactId);
  const tempEntry = getTemporaryContactEntry(contactId);

  // Score components
  let score = 0;
  let fieldsPresent = 0;

  // Field presence scoring (max 50 points)
  if (contact.firstName) { score += 10; fieldsPresent++; }
  if (contact.lastName) { score += 10; fieldsPresent++; }
  if (phones.length > 0) { score += 10; fieldsPresent++; }
  if (emails.length > 0) { score += 10; fieldsPresent++; }
  if (contact.company) { score += 5; fieldsPresent++; }
  if (contact.jobTitle) { score += 5; fieldsPresent++; }

  // Curation scoring (max 50 points)
  const hasNotes = notes.length > 0;
  if (hasNotes) score += 15;

  if (relationships.length > 0) score += 10;

  // Recency check (updated in last 30 days)
  const isRecent = contact.updatedAt
    ? (Date.now() - new Date(contact.updatedAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;
  if (isRecent) score += 10;

  // Duplicate risk check (specific to this contact)
  const isDuplicate = duplicates.length > 0;
  if (!isDuplicate) score += 5;

  // Temporary contact penalty
  const isTemporary = contact.isTemporary || tempEntry !== null;
  if (!isTemporary) score += 5;

  // Ghost contact penalty (missing name AND phone)
  const isGhost = contact.isGhost || (!contact.firstName && !contact.lastName && phones.length === 0);
  if (!isGhost) score += 3;

  // Construct detailed reasons
  const reasons: string[] = [];
  if (fieldsPresent >= 5) reasons.push('✓ Complete contact info');
  if (hasNotes) reasons.push(`✓ Has ${notes.length} memory note${notes.length !== 1 ? 's' : ''}`);
  if (relationships.length > 0) reasons.push(`✓ ${relationships.length} linked relationship${relationships.length !== 1 ? 's' : ''}`);
  if (isRecent) reasons.push('✓ Recently reviewed');
  if (!isDuplicate) reasons.push('✓ No duplicate risk');
  if (!isTemporary) reasons.push('✓ Permanent contact');
  if (!isGhost) reasons.push('✓ Has name or phone');

  // Add suggestions for improvement
  const suggestions: string[] = [];
  if (!contact.firstName || !contact.lastName) suggestions.push('Add first and last name');
  if (phones.length === 0) suggestions.push('Add a phone number');
  if (emails.length === 0) suggestions.push('Add an email address');
  if (!contact.company) suggestions.push('Add company information');
  if (!contact.jobTitle) suggestions.push('Add job title');
  if (!hasNotes) suggestions.push('Add contextual notes to improve engagement');

  return {
    contactId,
    score: Math.min(100, Math.max(0, score)),
    fieldsPresent,
    hasNotes,
    isDuplicate,
    isRecent,
    isTemporary,
    isGhost,
    noteCount: notes.length,
    relationshipCount: relationships.length,
    duplicateCount: duplicates.length,
    explanation: reasons.length > 0 ? reasons.join(' • ') : 'Contact needs review',
    suggestions,
  };
}

export function getContactsNeedingCuration(threshold = 60): number[] {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<{ id: number }>('SELECT id FROM contacts WHERE is_ghost = 0 ORDER BY id', []);
    if (rows.length === 0) return [];

    const scored: Array<{ id: number; score: number }> = [];
    for (const row of rows) {
      const health = calculateContactHealthScore(row.id);
      if (!health) continue;
      if (health.score < threshold) {
        scored.push({ id: row.id, score: health.score });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    return scored.map((entry) => entry.id);
  } catch {
    return [];
  }
}

export function calculateHealthSummary(threshold = 60): {
  average: number;
  lowCount: number;
  total: number;
} {
  try {
    const db = getDatabase();

    // Single-pass SQL health score: weighted field presence
    // phone (+35), first+last name (+25), company (+15), email (+15) = max 90 for typical contact
    // Normalize to 100 with a ghost penalty baked in
    const row = db.getFirstSync<{
      total: number;
      avg_score: number;
      low_count: number;
    }>(`
      SELECT
        COUNT(*) as total,
        AVG(
          CASE WHEN (SELECT COUNT(*) FROM phone_numbers WHERE contact_id = contacts.id) > 0 THEN 35 ELSE 0 END +
          CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 15 ELSE 0 END +
          CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 10 ELSE 0 END +
          CASE WHEN company IS NOT NULL AND company != '' THEN 15 ELSE 0 END +
          CASE WHEN (SELECT COUNT(*) FROM emails WHERE contact_id = contacts.id) > 0 THEN 15 ELSE 0 END +
          CASE WHEN notes IS NOT NULL AND notes != '' THEN 5 ELSE 0 END +
          CASE WHEN has_thumbnail = 1 THEN 5 ELSE 0 END
        ) as avg_score,
        SUM(CASE WHEN (
          CASE WHEN (SELECT COUNT(*) FROM phone_numbers WHERE contact_id = contacts.id) > 0 THEN 35 ELSE 0 END +
          CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 15 ELSE 0 END +
          CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 10 ELSE 0 END +
          CASE WHEN company IS NOT NULL AND company != '' THEN 15 ELSE 0 END +
          CASE WHEN (SELECT COUNT(*) FROM emails WHERE contact_id = contacts.id) > 0 THEN 15 ELSE 0 END +
          CASE WHEN notes IS NOT NULL AND notes != '' THEN 5 ELSE 0 END +
          CASE WHEN has_thumbnail = 1 THEN 5 ELSE 0 END
        ) < ? THEN 1 ELSE 0 END) as low_count
      FROM contacts
      WHERE is_ghost = 0
    `, [threshold]);

    if (!row || row.total === 0) return { average: 0, lowCount: 0, total: 0 };

    // Scale from 0–100 range (max raw score is 100)
    const average = Math.min(100, Math.round(row.avg_score ?? 0));
    return {
      average,
      lowCount: row.low_count ?? 0,
      total: row.total,
    };
  } catch {
    return { average: 0, lowCount: 0, total: 0 };
  }
}

export function calculateAverageContactHealth(): number {
  return calculateHealthSummary().average;
}

export function getContactHealthGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
