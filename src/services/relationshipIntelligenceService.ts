/**
 * ContactForge — Relationship Intelligence Service
 *
 * Deterministic, explainable relationship quality signals.
 * No AI, no cloud. All computed locally from SQLite data.
 */

import { getAllContactIds, getContactById } from '../db/repositories/contactRepository';
import { getNotesByContactId } from '../db/repositories/noteRepository';
import { getRelationshipsByContactId } from '../db/repositories/relationshipRepository';
import { getContactContext } from '../db/repositories/contactContextRepository';
import { getDueReminders, countDueReminders } from '../db/repositories/reminderRepository';
import type { ReminderWithContact } from '../types';

export interface RelationshipSignal {
  contactId: number;
  displayName: string;
  signalType: 'stale' | 'high_value_inactive' | 'missing_context' | 'due_followup' | 'no_interaction_logged';
  label: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
}

/**
 * Returns contacts that haven't been interacted with in X days,
 * but have a warmth >= threshold (meaning they're valuable).
 */
export function getHighValueInactiveContacts(inactiveDays = 60, minWarmth = 60): RelationshipSignal[] {
  const signals: RelationshipSignal[] = [];
  try {
    const ids = getAllContactIds();
    const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

    for (const id of ids) {
      const context = getContactContext(id);
      if (!context) continue;
      if (context.warmth < minWarmth) continue;

      const lastInteraction = context.lastInteractionAt
        ? new Date(context.lastInteractionAt)
        : null;

      const isInactive = !lastInteraction || lastInteraction < cutoff;
      if (!isInactive) continue;

      const contact = getContactById(id);
      if (!contact) continue;

      const daysSince = lastInteraction
        ? Math.floor((Date.now() - lastInteraction.getTime()) / (24 * 60 * 60 * 1000))
        : null;

      signals.push({
        contactId: id,
        displayName: contact.displayName,
        signalType: 'high_value_inactive',
        label: 'High-value contact going cold',
        detail: daysSince
          ? `Warmth ${context.warmth}/100 • ${daysSince} days since last interaction`
          : `Warmth ${context.warmth}/100 • No interaction logged`,
        severity: context.warmth >= 80 ? 'high' : 'medium',
      });
    }
  } catch {
    // Return empty on error
  }
  return signals;
}

/**
 * Returns contacts with no context filled in at all
 * (no where_met, no warmth set by user, no last_interaction).
 */
export function getContactsMissingContext(limit = 20): RelationshipSignal[] {
  const signals: RelationshipSignal[] = [];
  try {
    const ids = getAllContactIds();
    let count = 0;

    for (const id of ids) {
      if (count >= limit) break;
      const context = getContactContext(id);
      const notes = getNotesByContactId(id);
      const relationships = getRelationshipsByContactId(id);

      // Has context row or has notes or has relationships = skip
      if (context || notes.length > 0 || relationships.length > 0) continue;

      const contact = getContactById(id);
      if (!contact) continue;
      // Skip ghost contacts
      if (contact.isGhost) continue;

      signals.push({
        contactId: id,
        displayName: contact.displayName,
        signalType: 'missing_context',
        label: 'No relationship context',
        detail: 'No notes, context, or relationships recorded',
        severity: 'low',
      });
      count++;
    }
  } catch {
    // Return empty on error
  }
  return signals;
}

/**
 * Returns all due follow-up reminders as signals.
 */
export function getDueFollowUpSignals(): ReminderWithContact[] {
  try {
    return getDueReminders();
  } catch {
    return [];
  }
}

export function countDueFollowUps(): number {
  try {
    return countDueReminders();
  } catch {
    return 0;
  }
}

/**
 * Full intelligence summary for the dashboard card.
 */
export function getIntelligenceSummary(): {
  dueFollowUps: number;
  highValueInactive: number;
  missingContext: number;
} {
  return {
    dueFollowUps: countDueFollowUps(),
    highValueInactive: getHighValueInactiveContacts().length,
    missingContext: getContactsMissingContext(5).length,
  };
}
