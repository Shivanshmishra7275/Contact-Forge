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
        lazy: true,
        tabBarStyle: {
          backgroundColor: '#13131F',
          borderTopColor: 'rgba(255,255,255,0.08)',
          borderTopWidth: 1,
          elevation: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.tabBarActive,
        tabBarInactiveTintColor: COLORS.textDisabled,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: -2 },
        headerStyle: { backgroundColor: '#13131F', borderBottomColor: 'rgba(255,255,255,0.07)', borderBottomWidth: 1 },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
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
