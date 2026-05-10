/**
 * ContactForge — Root Layout
 * 
 * Created by: T.G.S Mishra
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
import { StyleSheet } from 'react-native';
import { getDatabase } from '../src/db';
import { getAllSettings } from '../src/db/repositories/settingsRepository';
import { countPendingDuplicates } from '../src/db/repositories/duplicateRepository';
import { useAppStore } from '../src/store/appStore';
import { COLORS } from '../src/constants';
import { SplashScreen } from '../src/SplashScreen';

/**
 * Premium dark theme with T.G.S Mishra's ContactForge brand colours
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

export default function RootLayout() {
  const setSettings = useAppStore((s) => s.setSettings);
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);
  const [showSplash, setShowSplash] = useState(true);

  /**
   * Bootstrap application
   * - Initialize SQLite database schema
   * - Load persisted settings
   * - Hydrate global store with DB state
   * - Show splash screen on first load
   */
  useEffect(() => {
    try {
      getDatabase(); // ensures schema is created
      const settings = getAllSettings();
      setSettings(settings);
      const dupeCount = countPendingDuplicates();
      setPendingDuplicateCount(dupeCount);
      
      // Log startup (development only)
      if (__DEV__) {
        console.log('[ContactForge] App initialized by T.G.S Mishra');
      }
    } catch (err) {
      console.error('[ContactForge] Bootstrap error:', err);
    }
  }, []);

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
            <Stack.Screen name="permission-denied" options={{ title: 'Contacts Access', headerShown: false }} />
          </Stack>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
