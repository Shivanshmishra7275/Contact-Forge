/**
 * ContactForge — Offline Relationship Categorization Service
 *
 * Deterministic NLP tag suggestions based on local heuristics.
 * No AI. No cloud. No embeddings.
 */

import type { LocalContact } from '../types';
import { getContactContext } from '../db/repositories/contactContextRepository';
import { getNotesByContactId } from '../db/repositories/noteRepository';
import { getAllContactIds, getContactById, getEmailsByContactId } from '../db/repositories/contactRepository';

export interface CategorySuggestion {
  category: string;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

const DOMAIN_HEURISTICS: Record<string, string> = {
  'university.edu': 'Education',
  'stanford.edu': 'Education',
  'harvard.edu': 'Education',
  'nhs.net': 'Healthcare',
  'gov': 'Government',
};

const KEYWORD_HEURISTICS: Array<{ category: string; keywords: string[] }> = [
  { category: 'Family', keywords: ['mom', 'dad', 'brother', 'sister', 'uncle', 'aunt', 'cousin', 'wife', 'husband', 'spouse'] },
  { category: 'Friend', keywords: ['friend', 'college roommate', 'high school', 'buddy'] },
  { category: 'Colleague', keywords: ['coworker', 'colleague', 'manager', 'boss', 'team', 'work'] },
  { category: 'Recruiter', keywords: ['recruiter', 'hiring', 'talent', 'acquisition', 'hr'] },
  { category: 'Investor', keywords: ['investor', 'vc', 'venture', 'angel', 'seed'] },
  { category: 'Founder', keywords: ['founder', 'ceo', 'startup', 'co-founder'] },
  { category: 'Client', keywords: ['client', 'customer', 'buyer', 'contract'] },
  { category: 'Vendor', keywords: ['vendor', 'supplier', 'contractor', 'agency', 'service'] },
  { category: 'Healthcare', keywords: ['doctor', 'nurse', 'dentist', 'clinic', 'hospital', 'therapist', 'physician'] },
];

export function suggestCategories(contact: LocalContact): CategorySuggestion[] {
  const suggestions = new Map<string, CategorySuggestion>();

  const addSuggestion = (category: string, reason: string, weight: number) => {
    const existing = suggestions.get(category);
    if (existing) {
      existing.reasons.push(reason);
      if (existing.reasons.length >= 2) existing.confidence = 'high';
      else if (existing.reasons.length === 1 && weight > 1) existing.confidence = 'high';
      else existing.confidence = 'medium';
    } else {
      suggestions.set(category, {
        category,
        confidence: weight > 1 ? 'high' : 'medium',
        reasons: [reason],
      });
    }
  };

  // 1. Check Company & Job Title
  const jobString = ((contact.jobTitle || '') + ' ' + (contact.company || '')).toLowerCase();
  for (const h of KEYWORD_HEURISTICS) {
    for (const kw of h.keywords) {
      if (jobString.includes(kw)) {
        addSuggestion(h.category, `Matches job/company: "${kw}"`, 2);
        break; // one match per category is enough here
      }
    }
  }

  // 2. Check Context (where met, next actions)
  const context = getContactContext(contact.id);
  if (context) {
    const contextStr = ((context.whereMet || '') + ' ' + (context.nextAction || '') + ' ' + (context.notesPlain || '')).toLowerCase();
    for (const h of KEYWORD_HEURISTICS) {
      for (const kw of h.keywords) {
        if (contextStr.includes(kw)) {
          addSuggestion(h.category, `Context mentions: "${kw}"`, 1);
          break;
        }
      }
    }
  }

  // 3. Check Notes
  const notes = getNotesByContactId(contact.id);
  const notesStr = notes.map(n => n.content).join(' ').toLowerCase();
  for (const h of KEYWORD_HEURISTICS) {
    for (const kw of h.keywords) {
      if (notesStr.includes(kw)) {
        addSuggestion(h.category, `Notes mention: "${kw}"`, 1);
        break;
      }
    }
  }

  // 4. Check Emails for Domain matches
  const emails = getEmailsByContactId(contact.id);
  for (const email of emails) {
    const parts = email.normalizedEmail.split('@');
    if (parts.length === 2) {
      const domain = parts[1];
      
      // Exact domain match
      if (DOMAIN_HEURISTICS[domain]) {
        addSuggestion(DOMAIN_HEURISTICS[domain], `Email domain match: ${domain}`, 2);
      } else {
        // TLD match like .gov
        const tld = domain.split('.').pop();
        if (tld && DOMAIN_HEURISTICS[tld]) {
          addSuggestion(DOMAIN_HEURISTICS[tld], `Email TLD match: .${tld}`, 1);
        }
      }
    }
  }

  // Filter out suggestions that the user already has as a tag
  let existingTags: string[] = [];
  try {
    existingTags = JSON.parse(contact.tags || '[]');
  } catch {
    // ignore
  }
  
  const existingLower = existingTags.map(t => t.toLowerCase());
  
  return Array.from(suggestions.values())
    .filter(s => !existingLower.includes(s.category.toLowerCase()))
    .sort((a, b) => {
      // Sort High -> Medium -> Low
      const score = (c: string) => (c === 'high' ? 3 : c === 'medium' ? 2 : 1);
      return score(b.confidence) - score(a.confidence);
    });
}



export function countContactsWithSuggestions(): number {
  let count = 0;
  try {
    const ids = getAllContactIds();
    for (const id of ids) {
      const contact = getContactById(id);
      if (!contact) continue;
      // Skip if they already have tags to keep it fast
      let existingTags: string[] = [];
      try {
        existingTags = JSON.parse(contact.tags || '[]');
      } catch {}
      if (existingTags.length > 0) continue;

      const suggestions = suggestCategories(contact);
      if (suggestions.length > 0) count++;
    }
  } catch (err) {
    console.error('Failed to count suggestions', err);
  }
  return count;
}
