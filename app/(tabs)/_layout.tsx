/**
 * ContactForge — Tab Navigator Layout
 */

import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/appStore';
import { COLORS } from '../../src/constants';

export default function TabLayout() {
  const pendingDuplicates = useAppStore((s) => s.pendingDuplicateCount);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.primary,
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
