/**
 * ContactForge — Contact Health Score Service
 *
 * Calculates explainable quality scores for contacts (Phase 8).
 */

import { getContactById, getPhonesByContactId, getEmailsByContactId, getAllContactIds } from '../db/repositories/contactRepository';
import { getNotesByContactId } from '../db/repositories/noteRepository';
import { getRelationshipsByContactId } from '../db/repositories/relationshipRepository';
import { getDuplicatesByContactId } from '../db/repositories/duplicateRepository';
import { getTemporaryContactEntry } from './temporaryContactService';
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

export function getContactsNeedingCuration(): number[] {
  // Return contacts with health score < 40
  // This is simplified; in production, you'd query all and batch-score
  return [];
}

export function calculateHealthSummary(threshold = 60): {
  average: number;
  lowCount: number;
  total: number;
} {
  try {
    const ids = getAllContactIds();
    if (ids.length === 0) return { average: 0, lowCount: 0, total: 0 };

    let totalScore = 0;
    let lowCount = 0;

    for (const id of ids) {
      const health = calculateContactHealthScore(id);
      if (!health) continue;
      totalScore += health.score;
      if (health.score < threshold) lowCount++;
    }

    return {
      average: totalScore / ids.length,
      lowCount,
      total: ids.length,
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
