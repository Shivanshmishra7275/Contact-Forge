/**
 * ContactForge — Root Layout
 *
 * Initializes:
 * - React Native Paper theme (dark)
 * - Gesture handler (required for react-navigation)
 * - Safe area context
 * - SQLite database schema
 * - Zustand store hydration from DB
 */

import { useEffect } from 'react';
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

// Custom dark theme with ContactForge brand colours
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

  useEffect(() => {
    // Bootstrap DB and hydrate store from persisted state
    try {
      getDatabase(); // ensures schema is created
      const settings = getAllSettings();
      setSettings(settings);
      const dupeCount = countPendingDuplicates();
      setPendingDuplicateCount(dupeCount);
    } catch (err) {
      console.error('[ContactForge] Bootstrap error:', err);
    }
  }, []);

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
            <Stack.Screen name="contact/edit/[id]" options={{ title: 'Edit Contact' }} />
            <Stack.Screen name="merge/[id]" options={{ title: 'Merge Contacts' }} />
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
