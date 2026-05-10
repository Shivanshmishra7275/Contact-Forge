/**
 * ContactForge — Settings Screen
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Switch, Button, TextInput, Divider, Card } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllSettings, saveAllSettings } from '../../src/db/repositories/settingsRepository';
import { createFullBackup, shareFile } from '../../src/services/exportService';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE, APP_NAME, APP_VERSION } from '../../src/constants';
import type { AppSettings } from '../../src/types';

export default function SettingsScreen() {
  const setStoreSettings = useAppStore((s) => s.setSettings);
  const [settings, setSettings] = useState<AppSettings>({
    defaultCountryCode: '+1',
    enableAppLock: false,
    autoCleanOnSync: false,
    duplicateScanOnSync: true,
    exportIncludeNotes: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const s = getAllSettings();
    setSettings(s);
    setStoreSettings(s);
  }, []);

  const handleSave = useCallback(() => {
    saveAllSettings(settings);
    setStoreSettings(settings);
    Alert.alert('Saved', 'Settings saved successfully.');
  }, [settings]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await createFullBackup('csv', settings.exportIncludeNotes);
      Alert.alert(
        'Backup Created',
        `Exported ${result.rowCount} contacts. Share?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: () => shareFile(result.filePath) },
        ],
      );
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  }, [settings.exportIncludeNotes]);

  const handleExportVCF = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await createFullBackup('vcf', settings.exportIncludeNotes);
      Alert.alert(
        'VCF Backup Created',
        `Exported ${result.rowCount} contacts. Share?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: () => shareFile(result.filePath) },
        ],
      );
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsExporting(false);
    }
  }, [settings.exportIncludeNotes]);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* General */}
        <SectionHeader title="General" icon="tune" />
        <Card style={styles.card}>
          <Card.Content>
            <SettingRow label="Default Country Code">
              <TextInput
                value={settings.defaultCountryCode}
                onChangeText={(v) => update('defaultCountryCode', v)}
                style={styles.smallInput}
                mode="outlined"
                dense
                maxLength={6}
                keyboardType="phone-pad"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                textColor={COLORS.textPrimary}
              />
            </SettingRow>
            <Divider style={styles.divider} />
            <SettingRow label="Duplicate Scan on Sync">
              <Switch
                value={settings.duplicateScanOnSync}
                onValueChange={(v) => update('duplicateScanOnSync', v)}
                color={COLORS.primary}
              />
            </SettingRow>
            <Divider style={styles.divider} />
            <SettingRow label="Auto Clean on Sync">
              <Switch
                value={settings.autoCleanOnSync}
                onValueChange={(v) => update('autoCleanOnSync', v)}
                color={COLORS.primary}
              />
            </SettingRow>
          </Card.Content>
        </Card>

        {/* Export */}
        <SectionHeader title="Export & Backup" icon="export" />
        <Card style={styles.card}>
          <Card.Content>
            <SettingRow label="Include Notes in Export">
              <Switch
                value={settings.exportIncludeNotes}
                onValueChange={(v) => update('exportIncludeNotes', v)}
                color={COLORS.primary}
              />
            </SettingRow>
            <Divider style={styles.divider} />
            <View style={styles.exportButtons}>
              <Button
                mode="outlined"
                onPress={handleExportCSV}
                loading={isExporting}
                disabled={isExporting}
                icon="file-delimited"
                textColor={COLORS.primary}
                style={styles.exportBtn}
              >
                Export CSV
              </Button>
              <Button
                mode="outlined"
                onPress={handleExportVCF}
                loading={isExporting}
                disabled={isExporting}
                icon="card-account-phone"
                textColor={COLORS.secondary}
                style={styles.exportBtn}
              >
                Export VCF
              </Button>
            </View>
            <Button
              mode="text"
              onPress={() => router.push('/backups')}
              textColor={COLORS.primary}
              style={styles.backupLink}
              icon="archive"
            >
              Open Backup Vault
            </Button>
          </Card.Content>
        </Card>

        {/* Privacy */}
        <SectionHeader title="Privacy" icon="shield-lock" />
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.privacyRow}>
              <MaterialCommunityIcons name="shield-check" color={COLORS.success} size={20} />
              <Text style={styles.privacyText}>
                ContactForge stores all data exclusively on this device.
                No contacts, phone numbers, or metadata are ever sent to any server,
                cloud service, or analytics platform.
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.privacyRow}>
              <MaterialCommunityIcons name="wifi-off" color={COLORS.textSecondary} size={20} />
              <Text style={styles.privacyText}>
                The app operates 100% offline. No internet connection is required
                or used for any feature.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Save button */}
        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          buttonColor={COLORS.primary}
        >
          Save Settings
        </Button>

        {/* About */}
        <Text style={styles.version}>{APP_NAME} v{APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon as any} color={COLORS.primary} size={16} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: { backgroundColor: COLORS.surface, marginBottom: SPACING.xs },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  settingLabel: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, flex: 1 },
  smallInput: {
    width: 80,
    backgroundColor: COLORS.surface,
    fontSize: FONT_SIZE.sm,
  },
  divider: { backgroundColor: COLORS.divider },
  exportButtons: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.sm },
  exportBtn: { flex: 1 },
  backupLink: { marginTop: SPACING.sm },
  privacyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  privacyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 20,
  },
  saveBtn: { marginTop: SPACING.lg },
  version: {
    color: COLORS.textDisabled,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
