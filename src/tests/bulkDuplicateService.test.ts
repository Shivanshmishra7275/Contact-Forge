import { executeSafeBulkMerge } from '../services/bulkDuplicateService';
import * as duplicateRepo from '../db/repositories/duplicateRepository';
import * as contactRepo from '../db/repositories/contactRepository';
import * as buildMergeComparison from '../features/merge/utils/buildMergeComparison';
import { getDatabase } from '../db';

// Mock everything
jest.mock('../db', () => ({
  getDatabase: jest.fn().mockReturnValue({
    withTransactionSync: jest.fn((cb) => cb()),
  }),
}));
jest.mock('../db/repositories/duplicateRepository');
jest.mock('../db/repositories/contactRepository');
jest.mock('../db/repositories/noteRepository');
jest.mock('../db/repositories/relationshipRepository');
jest.mock('../db/repositories/temporaryContactRepository');
jest.mock('../db/repositories/undoRepository');
jest.mock('../features/merge/utils/buildMergeComparison');
jest.mock('../db/repositories/auditRepository');

describe('executeSafeBulkMerge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips unsafe pairs and merges safe pairs', () => {
    // Setup mocks
    (duplicateRepo.getPendingDuplicates as jest.Mock).mockReturnValue([
      { id: 1, contactIdA: 10, contactIdB: 11, reasons: ['exact_phone_match'] },
      { id: 2, contactIdA: 20, contactIdB: 21, reasons: ['fuzzy_name_match'] },
    ]);

    (contactRepo.getContactWithDetails as jest.Mock).mockImplementation((id) => ({
      id,
      firstName: `Contact${id}`,
      phoneNumbers: [],
      emails: [],
    }));

    (buildMergeComparison.buildMergeComparison as jest.Mock).mockImplementation((cA, cB) => ({
      contactA: cA,
      contactB: cB,
      fields: [],
    }));

    // Mock isSafeBulkMerge: true for first, false for second
    (buildMergeComparison.isSafeBulkMerge as jest.Mock).mockImplementation((model) => {
      return model.contactA.id === 10;
    });

    (buildMergeComparison.buildMergeResult as jest.Mock).mockReturnValue({
      survivorId: 10,
      losingId: 11,
      firstName: 'Contact10',
      phones: [],
      emails: [],
    });

    const relationshipRepo = require('../db/repositories/relationshipRepository');
    (relationshipRepo.reassignRelationships as jest.Mock).mockReturnValue({
      updated: 0,
      removed: 0,
    });

    const result = executeSafeBulkMerge();

    expect(result.mergedCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    
    // Check that updateContact and deleteContact were called for the merged pair
    expect(contactRepo.updateContact).toHaveBeenCalledWith(10, expect.any(Object));
    expect(contactRepo.deleteContact).toHaveBeenCalledWith(11);
    
    // Check that resolveDuplicateCandidate was called as safe
    expect(duplicateRepo.resolveDuplicateCandidate).toHaveBeenCalledWith(1, 'safe');
    
    // Ensure the unsafe one was not touched
    expect(contactRepo.updateContact).not.toHaveBeenCalledWith(20, expect.any(Object));
  });
});
