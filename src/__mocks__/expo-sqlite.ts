/**
 * Mock for expo-sqlite in Jest tests.
 */

const mockDb = {
  execSync: jest.fn(),
  runSync: jest.fn().mockReturnValue({ lastInsertRowId: 1, changes: 1 }),
  getFirstSync: jest.fn().mockReturnValue(null),
  getAllSync: jest.fn().mockReturnValue([]),
  withTransactionSync: jest.fn((fn: () => void) => fn()),
  closeSync: jest.fn(),
};

export const openDatabaseSync = jest.fn().mockReturnValue(mockDb);
export const SQLiteDatabase = jest.fn();
