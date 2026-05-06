/**
 * ContactForge — App-wide constants.
 */

// App meta
export const APP_NAME = 'ContactForge';
export const APP_VERSION = '1.0.0';

// Database
export const DB_NAME = 'contactforge.db';
export const DB_VERSION = 1;

// Pagination defaults
export const PAGE_SIZE = 50;
export const DUPLICATE_SCAN_CHUNK_SIZE = 100;
export const SYNC_CHUNK_SIZE = 50;

// Duplicate scoring thresholds
export const SCORE_VERY_HIGH = 85;
export const SCORE_HIGH = 65;
export const SCORE_MEDIUM = 40;
export const SCORE_LOW = 20;

// Score weights for duplicate detection
export const SCORE_EXACT_PHONE = 80;
export const SCORE_EXACT_EMAIL = 70;
export const SCORE_EXACT_NAME = 50;
export const SCORE_FUZZY_NAME = 30;
export const SCORE_OVERLAPPING_PHONE = 60;
export const SCORE_OVERLAPPING_EMAIL = 55;

// Default settings
export const DEFAULT_COUNTRY_CODE = '+1';
export const DEFAULT_SETTINGS = {
  defaultCountryCode: DEFAULT_COUNTRY_CODE,
  enableAppLock: false,
  autoCleanOnSync: false,
  duplicateScanOnSync: true,
  exportIncludeNotes: true,
} as const;

// Contact tags
export const CONTACT_TAGS = [
  'Frequent Unknown',
  'Needs Naming',
  'Temporary',
  'Possibly Promotional',
  'Review Later',
] as const;

// Colors — dark-mode focused palette
export const COLORS = {
  background: '#0f0f1a',
  surface: '#1a1a2e',
  surfaceVariant: '#252540',
  primary: '#7c6af7',
  primaryLight: '#9c8fff',
  secondary: '#4ecdc4',
  accent: '#f7a76c',
  error: '#e05252',
  warning: '#f0c040',
  success: '#4caf80',
  textPrimary: '#f0f0f5',
  textSecondary: '#9090b0',
  textDisabled: '#505070',
  border: '#2a2a45',
  divider: '#1e1e38',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

// Typography sizes
export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 30,
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Radius
export const RADIUS = {
  sm: 6,
  md: 12,
  lg: 18,
  full: 999,
} as const;
