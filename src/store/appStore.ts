/**
 * ContactForge — App-wide Zustand Store
 *
 * Holds transient UI state and derived counters.
 * Persisted data lives in SQLite; this store is rebuilt on launch.
 */

import { create } from 'zustand';
import type { AppSettings, SyncState, NetworkSnapshot } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

interface AppStore {
  // Sync state
  sync: SyncState;
  setSyncStatus: (status: SyncState['status'], error?: string) => void;
  setSyncCounts: (native: number, local: number) => void;
  setSyncedAt: (at: string) => void;

  // Settings (loaded from DB on boot)
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;

  // Duplicate badge count
  pendingDuplicateCount: number;
  setPendingDuplicateCount: (n: number) => void;

  // Whether onboarding has completed
  isOnboarded: boolean;
  setOnboarded: (v: boolean) => void;

  // Global loading state (for heavy operations)
  isGlobalLoading: boolean;
  setGlobalLoading: (v: boolean) => void;
  globalLoadingMessage: string;
  setGlobalLoadingMessage: (msg: string) => void;

  // Session Insights (Network Health)
  latestSnapshot: NetworkSnapshot | null;
  previousSnapshot: NetworkSnapshot | null;
  setSnapshots: (latest: NetworkSnapshot | null, previous: NetworkSnapshot | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  sync: {
    id: 1,
    lastSyncAt: null,
    totalNativeContacts: 0,
    totalLocalContacts: 0,
    status: 'idle',
    errorMessage: null,
  },
  setSyncStatus: (status, error) =>
    set((s) => ({
      sync: { ...s.sync, status, errorMessage: error ?? null },
    })),
  setSyncCounts: (native, local) =>
    set((s) => ({
      sync: { ...s.sync, totalNativeContacts: native, totalLocalContacts: local },
    })),
  setSyncedAt: (at) =>
    set((s) => ({
      sync: { ...s.sync, lastSyncAt: at },
    })),

  settings: { ...DEFAULT_SETTINGS },
  setSettings: (settings) => set({ settings }),

  pendingDuplicateCount: 0,
  setPendingDuplicateCount: (n) => set({ pendingDuplicateCount: n }),

  isOnboarded: false,
  setOnboarded: (v) => set({ isOnboarded: v }),

  isGlobalLoading: false,
  setGlobalLoading: (v) => set({ isGlobalLoading: v }),
  globalLoadingMessage: '',
  setGlobalLoadingMessage: (msg) => set({ globalLoadingMessage: msg }),

  latestSnapshot: null,
  previousSnapshot: null,
  setSnapshots: (latest, previous) => set({ latestSnapshot: latest, previousSnapshot: previous }),
}));
