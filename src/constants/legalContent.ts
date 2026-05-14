/**
 * ContactForge — Legal content
 * Centralized, versioned copy for in-app legal and info screens.
 */

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  id: 'terms' | 'privacy' | 'export-warning' | 'permissions';
  title: string;
  version: string;
  updatedAt: string;
  summary: string[];
  sections: LegalSection[];
  footer?: string[];
};

export const LEGAL_VERSION = '2026-05-14';
export const LEGAL_UPDATED_AT = 'May 14, 2026';

export const EXPORT_WARNING_DIALOG = {
  title: 'Export warning',
  message:
    'Exported files can contain sensitive contact data. Keep exports local, review before sharing, and delete files you no longer need.',
};

export const LEGAL_DOCUMENTS: Record<LegalDocument['id'], LegalDocument> = {
  terms: {
    id: 'terms',
    title: 'Terms & Conditions',
    version: LEGAL_VERSION,
    updatedAt: LEGAL_UPDATED_AT,
    summary: [
      'ContactForge is provided as an offline-first utility for managing contacts locally on your device.',
      'By using the app, you agree to these terms and to use the app responsibly.',
    ],
    sections: [
      {
        title: 'Acceptable use',
        paragraphs: [
          'Do not use ContactForge to process data you do not have the right to access or share.',
          'You are responsible for how you handle exports and any data you choose to share.',
        ],
      },
      {
        title: 'Local-only processing',
        paragraphs: [
          'ContactForge performs contact cleanup and deduplication locally on your device.',
          'The app does not transmit contact data to any server or third-party service.',
        ],
      },
      {
        title: 'No warranty',
        paragraphs: [
          'ContactForge is provided "as is" without warranties of any kind.',
          'You are responsible for reviewing merges, deletions, and exports before confirming them.',
        ],
      },
      {
        title: 'Changes to the terms',
        paragraphs: [
          'If the terms change in future versions, the in-app version and updated date will reflect the latest text.',
        ],
      },
    ],
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy & Data Handling',
    version: LEGAL_VERSION,
    updatedAt: LEGAL_UPDATED_AT,
    summary: [
      'ContactForge is built for privacy-first, offline-only contact management.',
      'Your data stays on your device unless you explicitly export or share it.',
    ],
    sections: [
      {
        title: 'What data is stored',
        paragraphs: [
          'ContactForge mirrors device contacts into a local SQLite database for faster search and cleanup workflows.',
          'Optional metadata such as notes, relationships, and tags are stored locally on-device.',
        ],
      },
      {
        title: 'No backend or analytics',
        paragraphs: [
          'ContactForge does not use a backend, analytics, or telemetry.',
          'No contact data is uploaded or synced to a remote server.',
        ],
      },
      {
        title: 'Optional online features',
        paragraphs: [
          'If you enable optional online features, the app may check release updates or open documentation links.',
          'These actions never include your contact data.',
        ],
      },
      {
        title: 'Exports and sharing',
        paragraphs: [
          'Exports are generated locally and remain on your device until you share them.',
          'Review exports before sharing and delete files you no longer need.',
        ],
      },
    ],
  },
  'export-warning': {
    id: 'export-warning',
    title: 'Export Warning',
    version: LEGAL_VERSION,
    updatedAt: LEGAL_UPDATED_AT,
    summary: [
      'Exports can include names, phone numbers, emails, and notes.',
      'Treat exported files as sensitive data.',
    ],
    sections: [
      {
        title: 'Before exporting',
        paragraphs: [
          'Make sure you understand what is included in the export and where the file will be stored.',
          'If you include notes, they will be written into the export file as plain text.',
        ],
      },
      {
        title: 'After exporting',
        paragraphs: [
          'Store exports securely and only share them with trusted recipients.',
          'Delete old exports from your device if they are no longer needed.',
        ],
      },
    ],
  },
  permissions: {
    id: 'permissions',
    title: 'Permissions Rationale',
    version: LEGAL_VERSION,
    updatedAt: LEGAL_UPDATED_AT,
    summary: [
      'ContactForge requests only the permissions needed for core features.',
      'Permissions are never used to upload or share your data without consent.',
    ],
    sections: [
      {
        title: 'Contacts permission',
        paragraphs: [
          'Contacts access is required to read and manage your device contacts.',
          'This enables local cleanup, duplicate detection, and contact updates.',
        ],
      },
      {
        title: 'Camera permission',
        paragraphs: [
          'Camera access is used only when you open the QR scanner to import a contact card.',
          'The camera is never used in the background and no footage is stored or uploaded.',
        ],
      },
    ],
  },
};
