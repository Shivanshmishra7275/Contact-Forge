/**
 * Tests for transactional bulk cleanup fixes.
 */

jest.mock('../db', () => ({
  getDatabase: jest.fn(),
}));

jest.mock('../db/repositories/contactRepository', () => ({
  getContactById: jest.fn(),
  getPhonesByContactId: jest.fn(),
  replacePhonesByContactId: jest.fn(),
  replacePhonesByContactIdSync: jest.fn(),
  updateContact: jest.fn(),
  deleteContact: jest.fn(),
  listContacts: jest.fn(),
}));

jest.mock('../db/repositories/auditRepository', () => ({
  logAction: jest.fn(),
}));

import { applyBulkCleanupFixesByContactIds } from '../services/cleanupService';
import { getDatabase } from '../db';
import { getContactById, getPhonesByContactId, replacePhonesByContactIdSync, updateContact } from '../db/repositories/contactRepository';
import type { LocalContact } from '../types';

describe('applyBulkCleanupFixesByContactIds', () => {
  const mockDb = {
    withTransactionSync: jest.fn((fn: () => void) => fn()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getDatabase as jest.Mock).mockReturnValue(mockDb);
  });

  it('wraps selected cleanup fixes in a single transaction', () => {
    const contact = {
      id: 7,
      nativeId: null,
      firstName: 'john',
      lastName: 'doe',
      displayName: 'john doe',
      normalizedName: 'john doe',
      company: null,
      jobTitle: null,
      notes: null,
      birthday: null,
      imageUri: null,
      hasThumbnail: false,
      isTemporary: false,
      isGhost: false,
      tags: '[]',
      syncedAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    } as LocalContact;

    (getContactById as jest.Mock).mockReturnValue(contact);
    (getPhonesByContactId as jest.Mock).mockReturnValue([{ label: 'mobile', number: '(555) 123-4567' }]);

    const count = applyBulkCleanupFixesByContactIds([7]);

    expect(mockDb.withTransactionSync).toHaveBeenCalledTimes(1);
    expect(getContactById).toHaveBeenCalledWith(7);
    expect(updateContact).toHaveBeenCalled();
    expect(replacePhonesByContactIdSync).toHaveBeenCalled();
    expect(count).toBeGreaterThan(0);
  });
});
