/**
 * ContactForge — Contact Health Score Service
 *
 * Calculates explainable quality scores for contacts (Phase 8).
 */

import { getContactById, getPhonesByContactId, getEmailsByContactId, getAllContactIds } from '../db/repositories/contactRepository';
import { getNotesByContactId } from '../db/repositories/noteRepository';
import { getRelationshipsByContactId } from '../db/repositories/relationshipRepository';
import { countPendingDuplicates } from '../db/repositories/duplicateRepository';
import type { ContactHealthScore } from '../types';

export function calculateContactHealthScore(contactId: number): ContactHealthScore | null {
  const contact = getContactById(contactId);
  if (!contact) return null;

  const phones = getPhonesByContactId(contactId);
  const emails = getEmailsByContactId(contactId);
  const notes = getNotesByContactId(contactId);
  const relationships = getRelationshipsByContactId(contactId);

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

  // Duplicate risk check
  const pendingDupeCount = countPendingDuplicates();
  const isDuplicate = pendingDupeCount > 0; // Simplified; could be more precise
  if (!isDuplicate) score += 5;

  if (!contact.isTemporary) score += 5;

  // Construct explanation
  const reasons: string[] = [];
  if (fieldsPresent >= 5) reasons.push('Complete contact info');
  if (hasNotes) reasons.push('Has contextual notes');
  if (relationships.length > 0) reasons.push('Linked relationships');
  if (isRecent) reasons.push('Recently reviewed');
  if (!isDuplicate) reasons.push('No duplicate risk');

  return {
    contactId,
    score: Math.min(100, score),
    fieldsPresent,
    hasNotes,
    isDuplicate,
    isRecent,
    explanation: reasons.length > 0 ? reasons.join(' • ') : 'Contact needs review',
  };
}

export function getContactsNeedingCuration(): number[] {
  // Return contacts with health score < 40
  // This is simplified; in production, you'd query all and batch-score
  return [];
}

export function calculateAverageContactHealth(): number {
  // Calculate average health score for all contacts
  try {
    const ids = getAllContactIds();
    if (ids.length === 0) return 0;
    
    let totalScore = 0;
    for (const id of ids) {
      const health = calculateContactHealthScore(id);
      if (health) totalScore += health.score;
    }
    return totalScore / ids.length;
  } catch {
    return 0;
  }
}

export function getContactHealthGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
