/**
 * Mock for expo-sharing in Jest tests.
 */

export const isAvailableAsync = jest.fn().mockResolvedValue(true);
export const shareAsync = jest.fn().mockResolvedValue(undefined);
