/**
 * ContactForge — Legal Routes Layout
 *
 * Properly registers legal routes with Expo Router for type-safe navigation.
 * This layout enables TypeScript to recognize legal route paths.
 */

import { Stack } from 'expo-router';
import { COLORS } from '../../src/constants';

export default function LegalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '600',
          color: COLORS.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="privacy" options={{ title: 'Privacy & Data Handling' }} />
      <Stack.Screen name="terms" options={{ title: 'Terms & Conditions' }} />
      <Stack.Screen name="export-warning" options={{ title: 'Export Warning' }} />
      <Stack.Screen name="permissions" options={{ title: 'Permissions Rationale' }} />
    </Stack>
  );
}
