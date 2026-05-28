/**
 * ContactForge — Root Layout
 * 
 * Created by: Shivansh Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 *
 * Initializes:
 * - React Native Paper theme (premium dark mode)
 * - Gesture handler (required for react-navigation)
 * - Safe area context
 * - SQLite database schema
 * - Zustand store hydration from DB
 */

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider, MD3DarkTheme, configureFonts } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { getDatabase } from '../src/db';
import { getAllSettings } from '../src/db/repositories/settingsRepository';
import { countPendingDuplicates } from '../src/db/repositories/duplicateRepository';
import { getSyncState } from '../src/db/repositories/syncStateRepository';
import { useAppStore } from '../src/store/appStore';
import { COLORS, MAINTENANCE_MIN_INTERVAL_MINUTES } from '../src/constants';
import { SplashScreen } from '../src/SplashScreen';
import { maybeRunMaintenance } from '../src/services/maintenanceService';
import {
  registerBackgroundMaintenance,
  unregisterBackgroundMaintenance,
} from '../src/services/backgroundMaintenance';
import {
  registerBackgroundSync,
  unregisterBackgroundSync,
} from '../src/services/BackgroundSyncService';

/**
 * Premium dark theme with Shivansh Mishra's ContactForge brand colours
 * Carefully selected palette for accessibility and aesthetic appeal
 */
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.surfaceVariant,
    error: COLORS.error,
    onBackground: COLORS.textPrimary,
    onSurface: COLORS.textPrimary,
    outline: COLORS.border,
  },
};

import { UndoSnackbar } from '../src/features/undo/components/UndoSnackbar';
import { useShakeToUndo } from '../src/hooks/useShakeToUndo';

export default function RootLayout() {
  useShakeToUndo();
  
  const setSettings = useAppStore((s) => s.setSettings);
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setSyncCounts = useAppStore((s) => s.setSyncCounts);
  const setSyncedAt = useAppStore((s) => s.setSyncedAt);
  const settings = useAppStore((s) => s.settings);
  const [showSplash, setShowSplash] = useState(true);
  const [webUnsupported, setWebUnsupported] = useState(false);

  /**
   * Bootstrap application
   * - Initialize SQLite database schema
   * - Load persisted settings
   * - Hydrate global store with DB state
   * - Show splash screen on first load
   */
  useEffect(() => {
    const isWeb = Platform.OS === 'web';
    const hasSharedArrayBuffer = typeof globalThis.SharedArrayBuffer !== 'undefined';
    const isCrossOriginIsolated =
      typeof globalThis !== 'undefined' &&
      'crossOriginIsolated' in globalThis &&
      (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated === true;

    if (isWeb && (!hasSharedArrayBuffer || !isCrossOriginIsolated)) {
      if (__DEV__) {
        console.warn('[ContactForge] Web SQLite requires SharedArrayBuffer + cross-origin isolation.');
      }
      setWebUnsupported(true);
      return;
    }

    try {
      getDatabase(); // ensures schema is created
      const settings = getAllSettings();
      setSettings(settings);
      const dupeCount = countPendingDuplicates();
      setPendingDuplicateCount(dupeCount);
      const syncState = getSyncState();
      setSyncStatus(syncState.status, syncState.errorMessage ?? undefined);
      setSyncCounts(syncState.totalNativeContacts, syncState.totalLocalContacts);
      if (syncState.lastSyncAt) {
        setSyncedAt(syncState.lastSyncAt);
      }
    } catch (err) {
      if (__DEV__) {
        console.error('[ContactForge] Bootstrap error:', err);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const configure = async () => {
      if (!active) return;
      
      // Maintenance
      if (settings.enableBackgroundMaintenance) {
        await registerBackgroundMaintenance();
      } else {
        await unregisterBackgroundMaintenance();
      }
      
      // WebDAV Sync
      if (settings.enableBackgroundWebDavSync) {
        await registerBackgroundSync();
      } else {
        await unregisterBackgroundSync();
      }
    };

    configure();
    return () => {
      active = false;
    };
  }, [settings.enableBackgroundMaintenance, settings.enableBackgroundWebDavSync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && settings.enableBackgroundMaintenance) {
        // expo-file-system and expo-sharing (used by pruneOldBackups) are unavailable on web.
        // Background maintenance only runs on native platforms.
        if (Platform.OS !== 'web') {
          maybeRunMaintenance('foreground', MAINTENANCE_MIN_INTERVAL_MINUTES).catch(() => undefined);
        }
      }
    });

    return () => subscription.remove();
  }, [settings.enableBackgroundMaintenance]);

  if (webUnsupported) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <View style={styles.webFallback}>
            <Text style={styles.webFallbackTitle}>Web preview limited</Text>
            <Text style={styles.webFallbackBody}>
              ContactForge uses SQLite with WebAssembly. This browser session is not
              cross-origin isolated, so local data cannot be initialized.
            </Text>
            <Text style={styles.webFallbackBody}>
              Run the Expo web dev server with COOP/COEP headers and refresh, or
              use a browser that supports SharedArrayBuffer.
            </Text>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (showSplash) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <SplashScreen onFinish={() => setShowSplash(false)} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.surface },
              headerTintColor: COLORS.textPrimary,
              headerTitleStyle: { color: COLORS.textPrimary },
              contentStyle: { backgroundColor: COLORS.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="contact/[id]" options={{ title: 'Contact Details' }} />
            <Stack.Screen name="contact/new" options={{ title: 'New Contact' }} />
            <Stack.Screen name="merge/[id]" options={{ title: 'Merge Contacts' }} />
            <Stack.Screen name="backups" options={{ title: 'Backup Vault' }} />
            <Stack.Screen name="legal/terms" options={{ title: 'Terms & Conditions' }} />
            <Stack.Screen name="legal/privacy" options={{ title: 'Privacy & Data' }} />
            <Stack.Screen name="legal/export-warning" options={{ title: 'Export Warning' }} />
            <Stack.Screen name="legal/permissions" options={{ title: 'Permissions' }} />
            <Stack.Screen name="permission-denied" options={{ title: 'Contacts Access', headerShown: false }} />
          </Stack>
          <UndoSnackbar />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webFallback: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  webFallbackTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  webFallbackBody: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 20,
  },
});
