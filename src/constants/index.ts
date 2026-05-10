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

// --- PHASE 8: PREMIUM DESIGN TOKENS ---

// Premium Color Palette (Dark Mode First)
export const COLORS = {
  // Neutral layers
  background: '#0a0e1a',
  backgroundAlt: '#0f1219',
  surface: '#121722',
  surfaceElevated: '#161d2e',
  surfaceHover: '#1a2234',
  surfaceOverlay: '#0a0e1a88',

  // Brand accent colors (refined)
  primary: '#8b7eff',
  primaryDim: '#6a5dd0',
  primaryLight: '#a9a1ff',

  secondary: '#5ed9c9',
  accent: '#f5a85d',

  // Semantic colors (muted)
  success: '#5cba82',
  warning: '#f5c842',
  error: '#e86c6c',
  info: '#6db3e8',

  // Text hierarchy
  textPrimary: '#f5f7fa',
  textSecondary: '#a8b3c1',
  textTertiary: '#707a88',
  textDisabled: '#50576a',

  // Borders and dividers
  border: '#1f2a3a',
  divider: '#161d2e',
  borderFocus: '#8b7eff44',

  // Feedback and overlays
  overlay: 'rgba(0,0,0,0.5)',
  overlayDark: 'rgba(0,0,0,0.75)',
} as const;

// Typography
export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 40,
} as const;

export const FONT_WEIGHT = {
  light: '300' as any,
  normal: '400' as any,
  medium: '500' as any,
  semibold: '600' as any,
  bold: '700' as any,
  extrabold: '800' as any,
} as const;

// Spacing
export const SPACING = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  giant: 64,
} as const;

// Radius
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

// Elevation/Shadow depth
export const ELEVATION = {
  none: 0,
  low: 2,
  standard: 4,
  medium: 8,
  high: 12,
  overlay: 16,
} as const;

// Motion system
export const MOTION = {
  duration: {
    instant: 0,
    quick: 150,
    fast: 250,
    normal: 400,
    slow: 600,
    deliberate: 1000,
  },
  spring: {
    quick: { damping: 12, mass: 1, stiffness: 100 },
    standard: { damping: 10, mass: 1, stiffness: 80 },
    gentle: { damping: 8, mass: 1, stiffness: 60 },
    bouncy: { damping: 6, mass: 1, stiffness: 80 },
  },
} as const;
