/**
 * ContactForge — Profile Card Repository
 *
 * Database operations for profile_cards table (Phase 8).
 * Manages user's own contact card for QR generation.
 */

import { getDatabase } from '..';
import { now } from '../../utils/normalization';
import type { ProfileCard } from '../../types';

function rowToProfileCard(row: Record<string, unknown>): ProfileCard {
  return {
    id: row.id as number,
    userId: (row.user_id as number) ?? null,
    firstName: (row.first_name as string) ?? null,
    lastName: (row.last_name as string) ?? null,
    jobTitle: (row.job_title as string) ?? null,
    company: (row.company as string) ?? null,
    phone: (row.phone as string) ?? null,
    email: (row.email as string) ?? null,
    address: (row.address as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function getMyProfileCard(): ProfileCard | null {
  const db = getDatabase();
  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM profile_cards WHERE user_id IS NULL OR user_id = 1 LIMIT 1`,
  );
  return row ? rowToProfileCard(row) : null;
}

export function createOrUpdateProfileCard(params: {
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}): ProfileCard {
  const db = getDatabase();
  const existing = getMyProfileCard();
  const timestamp = now();

  if (existing) {
    db.runSync(
      `UPDATE profile_cards 
       SET first_name = ?, last_name = ?, job_title = ?, company = ?, phone = ?, email = ?, address = ?, updated_at = ?
       WHERE id = ?`,
      [
        params.firstName ?? existing.firstName,
        params.lastName ?? existing.lastName,
        params.jobTitle ?? existing.jobTitle,
        params.company ?? existing.company,
        params.phone ?? existing.phone,
        params.email ?? existing.email,
        params.address ?? existing.address,
        timestamp,
        existing.id,
      ],
    );
    const updated = db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM profile_cards WHERE id = ?`,
      [existing.id],
    );
    return updated ? rowToProfileCard(updated) : existing;
  }

  db.runSync(
    `INSERT INTO profile_cards (user_id, first_name, last_name, job_title, company, phone, email, address, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      null,
      params.firstName ?? null,
      params.lastName ?? null,
      params.jobTitle ?? null,
      params.company ?? null,
      params.phone ?? null,
      params.email ?? null,
      params.address ?? null,
      timestamp,
      timestamp,
    ],
  );

  const row = db.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM profile_cards WHERE user_id IS NULL OR user_id = 1 ORDER BY id DESC LIMIT 1`,
  );
  return row ? rowToProfileCard(row) : null as any;
}

export function deleteProfileCard(cardId: number): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM profile_cards WHERE id = ?`, [cardId]);
}

export function getProfileCardAsVCF(card: ProfileCard): string {
  const fn = [card.firstName, card.lastName].filter(Boolean).join(' ') || 'User';
  const tel = card.phone ? `TEL:${card.phone}` : '';
  const email = card.email ? `EMAIL:${card.email}` : '';
  const org = card.company ? `ORG:${card.company}` : '';
  const title = card.jobTitle ? `TITLE:${card.jobTitle}` : '';
  const adr = card.address ? `ADR:;;${card.address};;;;` : '';

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${fn}`,
    ...(card.firstName ? [`N:${card.lastName || ''};${card.firstName};;;`] : []),
    ...(tel ? [tel] : []),
    ...(email ? [email] : []),
    ...(org ? [org] : []),
    ...(title ? [title] : []),
    ...(adr ? [adr] : []),
    'END:VCARD',
  ].join('\r\n');
}
