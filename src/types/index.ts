/**
 * ContactForge — Core Type Definitions
 *
 * All shared domain types used across the application.
 * No business logic lives here — only data shapes.
 */

// ---------------------------------------------------------------------------
// Contact types
// ---------------------------------------------------------------------------

export interface LocalContact {
  id: number;
  nativeId: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  normalizedName: string;
  company: string | null;
  jobTitle: string | null;
  notes: string | null;
  birthday: string | null;
  imageUri: string | null;
  hasThumbnail: boolean;
  isTemporary: boolean;
  isGhost: boolean;
  tags: string; // JSON-encoded string[]
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhoneNumber {
  id: number;
  contactId: number;
  label: string | null;
  number: string;
  normalizedNumber: string;
}

export interface EmailAddress {
  id: number;
  contactId: number;
  label: string | null;
  email: string;
  normalizedEmail: string;
}

export interface ContactWithDetails extends LocalContact {
  phoneNumbers: PhoneNumber[];
  emails: EmailAddress[];
}

// ---------------------------------------------------------------------------
// Duplicate detection types
// ---------------------------------------------------------------------------

export type DuplicateReason =
  | 'exact_phone_match'
  | 'exact_email_match'
  | 'exact_name_match'
  | 'fuzzy_name_match'
  | 'inverted_name_match'
  | 'overlapping_phone'
  | 'overlapping_email'
  | 'name_phone_combination'
  | 'name_email_combination';

export type DuplicateConfidence = 'very_high' | 'high' | 'medium' | 'low';

export interface DuplicateCandidate {
  id: number;
  contactIdA: number;
  contactIdB: number;
  confidence: DuplicateConfidence;
  score: number; // 0–100
  reasons: DuplicateReason[];
  status: 'pending' | 'merged' | 'ignored' | 'safe';
  detectedAt: string;
  resolvedAt: string | null;
}

export interface DuplicateGroup {
  id: number;
  representativeContactId: number;
  contactIds: number[]; // JSON-encoded
  status: 'pending' | 'merged' | 'ignored';
  createdAt: string;
}

export interface MergeHistory {
  id: number;
  survivorContactId: number;
  mergedContactIds: string; // JSON-encoded number[]
  snapshotJson: string; // serialized pre-merge state
  mergedAt: string;
}

// ---------------------------------------------------------------------------
// Cleanup types
// ---------------------------------------------------------------------------

export type CleanupIssueKind =
  | 'missing_name'
  | 'missing_phone'
  | 'missing_email'
  | 'malformed_phone'
  | 'uncapitalized_name'
  | 'extra_whitespace'
  | 'no_country_code'
  | 'ghost_contact'
  | 'duplicate_numbers';

export interface CleanupIssue {
  contactId: number;
  kind: CleanupIssueKind;
  field: string;
  currentValue: string | null;
  suggestedValue: string | null;
}

// ---------------------------------------------------------------------------
// Temporary / unknown contact types
// ---------------------------------------------------------------------------

export type ContactTag =
  | 'Frequent Unknown'
  | 'Needs Naming'
  | 'Temporary'
  | 'Possibly Promotional'
  | 'Review Later';

export interface TemporaryContact {
  id: number;
  contactId: number;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Sync / ingestion types
// ---------------------------------------------------------------------------

export interface SyncState {
  id: number;
  lastSyncAt: string | null;
  totalNativeContacts: number;
  totalLocalContacts: number;
  status: 'idle' | 'running' | 'error';
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// Export types
// ---------------------------------------------------------------------------

export type ExportFormat = 'csv' | 'vcf';

export interface ExportJob {
  format: ExportFormat;
  contactIds: number[] | 'all';
  includeNotes: boolean;
  filename: string;
}

// ---------------------------------------------------------------------------
// Settings types
// ---------------------------------------------------------------------------

export interface AppSettings {
  defaultCountryCode: string;
  enableAppLock: boolean;
  autoCleanOnSync: boolean;
  duplicateScanOnSync: boolean;
  exportIncludeNotes: boolean;
  enableBackgroundMaintenance: boolean;
  autoPurgeExpiredTemporary: boolean;
  backupRetentionCount: number;
  enableOnlineFeatures: boolean;
  syncProviderId: string;
  syncWebDavEndpoint: string;
  syncWebDavUser: string;
  syncWebDavPass: string;
  lastSyncTime: string | null;
  hasAcceptedTerms: boolean;
  enableBackgroundWebDavSync: boolean;
  lastAutomatedSyncTime: string | null;
}

// ---------------------------------------------------------------------------
// Audit log types
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'contact_created'
  | 'contact_updated'
  | 'contact_deleted'
  | 'contacts_merged'
  | 'contacts_synced'
  | 'maintenance_run'
  | 'cleanup_applied'
  | 'export_created'
  | 'backup_created';

export interface AuditLog {
  id: number;
  action: AuditAction;
  targetId: number | null;
  details: string; // JSON string
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Phase 8: Premium Features
// ---------------------------------------------------------------------------

export interface ContactNote {
  id: number;
  contactId: number;
  category: 'where_met' | 'important_dates' | 'family' | 'work' | 'custom';
  title: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactRelationship {
  id: number;
  contactIdFrom: number;
  contactIdTo: number;
  relationshipType: 'spouse' | 'child' | 'parent' | 'sibling' | 'colleague' | 'manager' | 'emergency_contact' | 'referral' | 'assistant' | 'friend' | 'custom';
  direction: 'bidirectional' | 'one_way_from' | 'one_way_to';
  notes: string | null;
  createdAt: string;
}

export interface ProfileCard {
  id: number;
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactHealthScore {
  contactId: number;
  score: number; // 0-100
  fieldsPresent: number;
  hasNotes: boolean;
  noteCount: number;
  isDuplicate: boolean;
  duplicateCount: number;
  isRecent: boolean;
  isTemporary: boolean;
  isGhost: boolean;
  relationshipCount: number;
  explanation: string;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Phase 10: Relationship Intelligence
// ---------------------------------------------------------------------------

export type RelationshipStrength = 'close' | 'active' | 'neutral' | 'dormant' | 'fading';

export interface ContactContext {
  id: number;
  contactId: number;
  whereMet: string | null;
  relationshipStrength: RelationshipStrength;
  warmth: number; // 0-100
  lastInteractionAt: string | null;
  nextAction: string | null;
  notesPlain: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReminderStatus = 'pending' | 'done' | 'snoozed' | 'dismissed';

export interface ContactReminder {
  id: number;
  contactId: number;
  title: string;
  dueAt: string;       // ISO date string
  intervalDays: number | null;
  status: ReminderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderWithContact extends ContactReminder {
  contactDisplayName: string;
  contactId: number;
}

// ---------------------------------------------------------------------------
// Phase 11: Network Insights & Groups
// ---------------------------------------------------------------------------

export interface Group {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface ContactGroup {
  id: number;
  contactId: number;
  groupId: number;
  assignedAt: string;
}

export interface NetworkSnapshot {
  id: number;
  totalContacts: number;
  importantContacts: number;
  staleContacts: number;
  overdueFollowUps: number;
  activeRelationships: number;
  warmRelationships: number;
  coldRelationships: number;
  createdAt: string; // ISO date string
}

// ---------------------------------------------------------------------------
// Backup / Sync Types
// ---------------------------------------------------------------------------

export interface ContactForgeBackup {
  version: number;
  exportedAt: string;
  contacts: any[];
  notes: any[];
  relationships: any[];
  emails: any[];
  phoneNumbers: any[];
  contexts: any[];
  reminders: any[];
  snapshots: any[];
}
