/**
 * ContactForge — Permission Denied Screen
 *
 * Shown when the user denies contacts permission.
 * Explains why permission is needed and provides a clear path to grant it.
 */

import { useCallback } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { requestContactsPermission } from '../src/services/contactSyncService';
import { COLORS, SPACING, FONT_SIZE, APP_NAME } from '../src/constants';

export default function PermissionDeniedScreen() {
  const handleRetry = useCallback(async () => {
    const granted = await requestContactsPermission();
    if (granted) {
      router.replace('/(tabs)');
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="account-lock"
          size={72}
          color={COLORS.warning}
          style={styles.icon}
        />

        <Text style={styles.title}>Contacts Access Needed</Text>

        <Text style={styles.body}>
          {APP_NAME} needs permission to read your contacts in order to:
        </Text>

        <View style={styles.bulletList}>
          {[
            'Sync your contacts to a local private database',
            'Detect and help you resolve duplicates',
            'Identify contacts that need cleanup',
            'Create safe local backups',
          ].map((item) => (
            <View key={item} style={styles.bullet}>
              <MaterialCommunityIcons name="check-circle" color={COLORS.success} size={16} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.privacyBox}>
          <MaterialCommunityIcons name="shield-check" color={COLORS.success} size={18} />
          <Text style={styles.privacyText}>
            Your contacts never leave your device. {APP_NAME} has no server, no analytics,
            and no internet dependency. Everything stays local.
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handleRetry}
          icon="account-check"
          buttonColor={COLORS.primary}
          style={styles.btn}
        >
          Grant Permission
        </Button>

        <Button
          mode="outlined"
          onPress={handleOpenSettings}
          icon="cog"
          textColor={COLORS.textSecondary}
          style={styles.btn}
        >
          Open App Settings
        </Button>

        <Button
          mode="text"
          onPress={() => router.replace('/(tabs)')}
          textColor={COLORS.textDisabled}
        >
          Continue Without Access
        </Button>

        <Text style={styles.note}>
          Without permission, ContactForge can only manage contacts you add manually.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  icon: { marginBottom: SPACING.sm },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  body: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bulletList: {
    alignSelf: 'stretch',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  bulletText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 20,
  },
  privacyBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 10,
    padding: SPACING.md,
    alignSelf: 'stretch',
  },
  privacyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 18,
  },
  btn: { alignSelf: 'stretch' },
  note: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDisabled,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
