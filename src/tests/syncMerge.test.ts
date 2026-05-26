/**
 * ContactForge — Sync merge semantics tests
 *
 * Validates the importBackupBundle logic by observing the SQLite queries.
 */

import { getDatabase } from '../db';
import { importBackupBundle } from '../services/backupService';
import type { ContactForgeBackup } from '../types';

// Mock expo-sqlite
jest.mock('expo-sqlite');

function makeBundle(contacts: unknown[]): ContactForgeBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    contacts: contacts as ContactForgeBackup['contacts'],
    notes: [], relationships: [], emails: [], phoneNumbers: [],
    contexts: [], reminders: [], snapshots: [],
  };
}

describe('importBackupBundle — merge semantics', () => {
  let mockDb: any;

  beforeEach(() => {
    // Clear all previous mock calls and implementations
    jest.clearAllMocks();

    mockDb = getDatabase();
  });

  it('inserts a new contact that does not exist locally', () => {
    mockDb.getFirstSync.mockReturnValueOnce(null); // Local row doesn't exist

    const bundle = makeBundle([{
      id: 9001,
      updated_at: '2025-01-01T00:00:00.000Z',
      is_deleted: 0,
    }]);

    importBackupBundle(bundle);

    const runSyncCalls = mockDb.runSync.mock.calls;
    const insertCall = runSyncCalls.find((call: any[]) =>
      call[0].includes('INSERT OR REPLACE INTO contacts') && call[1][0] === 9001
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1][18]).toBe(0); // is_deleted
  });

  it('updates local contact when remote is newer', () => {
    // Local exists and is older
    mockDb.getFirstSync.mockReturnValueOnce({ updated_at: '2024-01-01T00:00:00.000Z', is_deleted: 0 });

    const bundle = makeBundle([{
      id: 9002,
      updated_at: '2025-06-01T00:00:00.000Z', // newer
      is_deleted: 0,
    }]);

    importBackupBundle(bundle);

    const runSyncCalls = mockDb.runSync.mock.calls;
    const insertCall = runSyncCalls.find((call: any[]) =>
      call[0].includes('INSERT OR REPLACE INTO contacts') && call[1][0] === 9002
    );
    expect(insertCall).toBeDefined();
  });

  it('does NOT overwrite local contact when remote is older', () => {
    // Local exists and is newer
    mockDb.getFirstSync.mockReturnValueOnce({ updated_at: '2025-06-01T00:00:00.000Z', is_deleted: 0 });

    const bundle = makeBundle([{
      id: 9003,
      updated_at: '2025-01-02T00:00:00.000Z', // older
      is_deleted: 0,
    }]);

    importBackupBundle(bundle);

    const runSyncCalls = mockDb.runSync.mock.calls;
    const insertCall = runSyncCalls.find((call: any[]) =>
      call[0].includes('INSERT OR REPLACE INTO contacts') && call[1][0] === 9003
    );
    expect(insertCall).toBeUndefined(); // Should skip
  });

  it('propagates remote delete (tombstone) when remote is newer', () => {
    mockDb.getFirstSync.mockReturnValueOnce({ updated_at: '2024-01-01T00:00:00.000Z', is_deleted: 0 });

    const bundle = makeBundle([{
      id: 9004,
      updated_at: '2025-06-01T00:00:00.000Z', // newer
      is_deleted: 1, // TOMBSTONE
    }]);

    importBackupBundle(bundle);

    const runSyncCalls = mockDb.runSync.mock.calls;
    const ftsDeleteCall = runSyncCalls.find((call: any[]) => call[0].includes('DELETE FROM contacts_fts') && call[1][0] === 9004);
    const deleteCall = runSyncCalls.find((call: any[]) => call[0].includes('DELETE FROM contacts') && call[1][0] === 9004);
    const insertCall = runSyncCalls.find((call: any[]) => call[0].includes('INSERT OR REPLACE INTO contacts') && call[1][0] === 9004);

    expect(ftsDeleteCall).toBeDefined();
    expect(deleteCall).toBeDefined();
    expect(insertCall).toBeUndefined();
  });

  it('does NOT delete local contact when remote tombstone is older than local edit', () => {
    mockDb.getFirstSync.mockReturnValueOnce({ updated_at: '2025-09-01T00:00:00.000Z', is_deleted: 0 });

    const bundle = makeBundle([{
      id: 9005,
      updated_at: '2025-03-01T00:00:00.000Z', // older
      is_deleted: 1,
    }]);

    importBackupBundle(bundle);

    const runSyncCalls = mockDb.runSync.mock.calls;
    const deleteCall = runSyncCalls.find((call: any[]) => call[0].includes('DELETE FROM contacts') && call[1][0] === 9005);
    expect(deleteCall).toBeUndefined(); // Should skip entirely
  });

  it('ignores remote tombstone for contact that does not exist locally', () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    const bundle = makeBundle([{
      id: 9007,
      updated_at: '2025-01-01T00:00:00.000Z',
      is_deleted: 1,
    }]);

    importBackupBundle(bundle);

    const runSyncCalls = mockDb.runSync.mock.calls;
    const deleteCall = runSyncCalls.find((call: any[]) => call[0].includes('DELETE FROM contacts') && call[1][0] === 9007);
    const insertCall = runSyncCalls.find((call: any[]) => call[0].includes('INSERT OR REPLACE INTO contacts') && call[1][0] === 9007);
    
    expect(deleteCall).toBeUndefined();
    expect(insertCall).toBeUndefined();
  });
});
