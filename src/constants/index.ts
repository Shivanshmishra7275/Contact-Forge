/**
 * ContactForge — App-wide constants.
 */

// App meta
export const APP_NAME = 'ContactForge';
export const APP_VERSION = '3.0.0';
export const REPO_OWNER = 'Shivanshmishra7275';
export const REPO_NAME = 'Contact-Forge';
export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;
export const RELEASES_URL = `${REPO_URL}/releases`;
export const RELEASES_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

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
  enableBackgroundMaintenance: true,
  autoPurgeExpiredTemporary: false,
  backupRetentionCount: 20,
  enableOnlineFeatures: false,
  syncProviderId: '',
  syncWebDavEndpoint: '',
  syncWebDavUser: '',
  syncWebDavPass: '',
  lastSyncTime: null,
  hasAcceptedTerms: false,
  enableBackgroundWebDavSync: false,
  lastAutomatedSyncTime: null,
} as const;

export const MAINTENANCE_MIN_INTERVAL_MINUTES = 60;

// Contact tags
export const CONTACT_TAGS = [
  'Frequent Unknown',
  'Needs Naming',
  'Temporary',
  'Possibly Promotional',
  'Review Later',
] as const;

// --- PHASE 8: PREMIUM DESIGN TOKENS ---

// Premium Color Palette (Cinematic Dark Mode)
export const COLORS = {
  // Neutral layers
  background: '#05050A',
  backgroundAlt: '#0A0A12',
  surface: 'rgba(20, 20, 30, 0.4)', // Frosted glass default
  surfaceElevated: 'rgba(30, 30, 45, 0.6)',
  surfaceHover: 'rgba(40, 40, 60, 0.8)',
  surfaceVariant: 'rgba(255, 255, 255, 0.03)',
  surfaceOverlay: 'rgba(5, 5, 10, 0.7)',

  // Brand accent colors (refined)
  primary: '#4C1D95',
  primaryDim: '#3B1578',
  primaryLight: '#6D28D9',

  secondary: '#0891B2',
  accent: '#10B981',

  // Semantic colors (muted)
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Text hierarchy
  textPrimary: '#F8FAFC',
  textSecondary: '#a8b3c1',
  // WCAG AA fix: raised from #707a88 (~2.6:1) → #8a95a3 (~3.8:1) on #05050A
  textTertiary: '#8a95a3',
  // WCAG AA fix: raised from #50576a (~2.1:1) → #636d7e (~3.1:1) on #05050A (non-interactive)
  textDisabled: '#636d7e',

  // Interactive label on primary-colored contained buttons (WCAG AA on #4C1D95)
  onPrimary: '#FFFFFF',
  // Accessible active tab indicator: #7C3AED ≈ 3.6:1 on rgba(20,20,30,0.4) effective dark bg
  tabBarActive: '#7C3AED',

  // Borders and dividers
  border: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.05)',
  borderFocus: 'rgba(76, 29, 149, 0.5)',

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
