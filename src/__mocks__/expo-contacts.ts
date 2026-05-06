/**
 * Mock for expo-contacts in Jest tests.
 */

export const PermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  UNDETERMINED: 'undetermined',
};

export const ContactTypes = {
  Person: 'person',
  Company: 'company',
};

export const Fields = {
  ID: 'id',
  FirstName: 'firstName',
  LastName: 'lastName',
  Company: 'company',
  JobTitle: 'jobTitle',
  PhoneNumbers: 'phoneNumbers',
  Emails: 'emails',
  Note: 'note',
  Birthday: 'birthday',
  Image: 'image',
};

export const requestPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const getPermissionsAsync = jest.fn().mockResolvedValue({ status: 'granted' });
export const getContactsAsync = jest.fn().mockResolvedValue({
  data: [],
  hasNextPage: false,
  total: 0,
});
export const addContactAsync = jest.fn().mockResolvedValue('mock-native-id-123');
export const updateContactAsync = jest.fn().mockResolvedValue(undefined);
export const removeContactAsync = jest.fn().mockResolvedValue(undefined);
