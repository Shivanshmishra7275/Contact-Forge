/**
 * ContactForge — Tab Navigator Layout
 */

import { Tabs, Redirect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/appStore';
import { COLORS } from '../../src/constants';

export default function TabLayout() {
  const pendingDuplicates = useAppStore((s) => s.pendingDuplicateCount);
  const settings = useAppStore((s) => s.settings);

  if (!settings.hasAcceptedTerms) {
    return <Redirect href="/legal/terms" />;
  }

  return (
    <Tabs
      screenOptions={{
        // PERF: lazy=true prevents all 6 screens mounting on first render.
        // Each screen only mounts when the user first navigates to it.
        lazy: true,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        // A11Y: use brighter #7C3AED token (~3.6:1 on dark tab bar) instead of primary #4C1D95 (~2.1:1)
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarLabel: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="duplicates"
        options={{
          title: 'Duplicates',
          tabBarLabel: 'Duplicates',
          tabBarBadge: pendingDuplicates > 0 ? pendingDuplicates : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.error },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="content-copy" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cleanup"
        options={{
          title: 'Cleanup',
          tabBarLabel: 'Cleanup',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="broom" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import Studio',
          tabBarLabel: 'Import',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-import" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
