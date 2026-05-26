/**
 * ContactForge — Settings Screen
 * 
 * Created by: Shivansh Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 * 
 * Features:
 * - App settings (country code, sync preferences)
 * - Export & backup management
 * - Privacy information
 * - Developer portfolio branding
 * - Hidden developer menu (5-tap Easter egg)
 * - QR business card management
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Linking } from 'react-native';
import { Text, Switch, Button, TextInput, Divider, Card, Portal } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllSettings, saveAllSettings } from '../../src/db/repositories/settingsRepository';
import { createFullBackup, shareFile } from '../../src/services/exportService';
import { getMaintenanceState, runMaintenance } from '../../src/services/maintenanceService';
import { checkForUpdates, getUpdateState } from '../../src/services/updateService';
import { exportEncryptedBackup, restoreEncryptedBackup } from '../../src/services/backupService';
import { syncAdapter } from '../../src/services/syncAdapter';
import { registerBackgroundSync, unregisterBackgroundSync } from '../../src/services/BackgroundSyncService';
import * as SecureStore from 'expo-secure-store';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE, APP_NAME, APP_VERSION, DEFAULT_SETTINGS, RELEASES_URL } from '../../src/constants';
import { EXPORT_WARNING_DIALOG } from '../../src/constants/legalContent';
import { isoToDisplay } from '../../src/utils/normalization';
import type { AppSettings } from '../../src/types';
import { QRBusinessCard } from '../../src/QRBusinessCard';

export default function SettingsScreen() {
  const setStoreSettings = useAppStore((s) => s.setSettings);
  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [isExporting, setIsExporting] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [versionTaps, setVersionTaps] = useState(0);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showQRCard, setShowQRCard] = useState(false);
  const [maintenanceState, setMaintenanceState] = useState(() => getMaintenanceState());
  const [updateState, setUpdateState] = useState(() => getUpdateState());

  useEffect(() => {
    const s = getAllSettings();
    setSettings(s);
    setStoreSettings(s);
    setMaintenanceState(getMaintenanceState());
    setUpdateState(getUpdateState());
  }, []);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    saveAllSettings(settings);
    setStoreSettings(settings);
    Alert.alert('Saved', 'Settings saved successfully.');
  }, [settings]);

  const confirmExport = useCallback((onConfirm: () => void) => {
    Alert.alert(EXPORT_WARNING_DIALOG.title, EXPORT_WARNING_DIALOG.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: onConfirm },
    ]);
  }, []);

  const runExportCSV = useCallback(async () => {
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

  const handleExportCSV = useCallback(() => {
    confirmExport(() => {
      void runExportCSV();
    });
  }, [confirmExport, runExportCSV]);

  const runExportVCF = useCallback(async () => {
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

  const handleExportVCF = useCallback(() => {
    confirmExport(() => {
      void runExportVCF();
    });
  }, [confirmExport, runExportVCF]);

  const handleExportBackup = useCallback(async () => {
    if (!passphrase) {
      Alert.alert('Error', 'Please enter a passphrase to encrypt your backup.');
      return;
    }
    setIsExporting(true);
    try {
      const success = await exportEncryptedBackup(passphrase);
      if (success) Alert.alert('Success', 'Encrypted backup created and saved.');
    } catch (e) {
      Alert.alert('Error', 'Failed to create backup.');
    } finally {
      setIsExporting(false);
    }
  }, [passphrase]);

  const handleRestoreBackup = useCallback(async () => {
    if (!passphrase) {
      Alert.alert('Error', 'Please enter your passphrase to decrypt the backup.');
      return;
    }
    setIsRestoring(true);
    try {
      const result = await restoreEncryptedBackup(passphrase);
      Alert.alert(result.success ? 'Success' : 'Error', result.message);
    } catch (e) {
      Alert.alert('Error', 'Failed to restore backup.');
    } finally {
      setIsRestoring(false);
    }
  }, [passphrase]);

  const handlePushBackup = useCallback(async () => {
    if (!passphrase) {
      Alert.alert('Error', 'Please enter your passphrase to encrypt the push.');
      return;
    }
    if (!settings.syncWebDavEndpoint || !settings.syncWebDavUser || !settings.syncWebDavPass) {
      Alert.alert('Configuration Error', 'Please configure WebDAV settings before pushing.');
      return;
    }
    setIsSyncing(true);
    try {
      // Need to save settings first so provider sees them
      handleSave();
      const result = await syncAdapter.pushBackup(passphrase);
      if (result.success) {
        update('lastSyncTime', new Date().toISOString());
        // Save the new timestamp
        saveAllSettings({ ...settings, lastSyncTime: new Date().toISOString() });
      }
      Alert.alert(result.success ? 'Success' : 'Error', result.message);
    } catch (e) {
      Alert.alert('Error', 'Failed to push to WebDAV.');
    } finally {
      setIsSyncing(false);
    }
  }, [passphrase, settings, handleSave, update]);

  const handlePullBackup = useCallback(async () => {
    if (!passphrase) {
      Alert.alert('Error', 'Please enter your passphrase to decrypt the pull.');
      return;
    }
    if (!settings.syncWebDavEndpoint || !settings.syncWebDavUser || !settings.syncWebDavPass) {
      Alert.alert('Configuration Error', 'Please configure WebDAV settings before pulling.');
      return;
    }
    setIsSyncing(true);
    try {
      handleSave();
      const result = await syncAdapter.pullBackup(passphrase);
      if (result.success) {
        update('lastSyncTime', new Date().toISOString());
        saveAllSettings({ ...settings, lastSyncTime: new Date().toISOString() });
      }
      Alert.alert(result.success ? 'Success' : 'Error', result.message);
    } catch (e) {
      Alert.alert('Error', 'Failed to pull from WebDAV.');
    } finally {
      setIsSyncing(false);
    }
  }, [passphrase, settings, handleSave, update]);

  const handleRunMaintenance = useCallback(async () => {
    setIsRunningMaintenance(true);
    try {
      const summary = await runMaintenance('manual');
      setMaintenanceState(getMaintenanceState());
      const prunedText = summary.backupsPruned > 0
        ? `\nBackups pruned: ${summary.backupsPruned}`
        : '';
      Alert.alert(
        'Maintenance complete',
        `Cleanup issues: ${summary.cleanupIssues}\nExpired temporary: ${summary.expiredTemporary}${prunedText}`,
      );
    } catch (err) {
      Alert.alert('Maintenance failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunningMaintenance(false);
    }
  }, []);

  const handleCheckUpdates = useCallback(async () => {
    if (!settings.enableOnlineFeatures) {
      Alert.alert('Offline mode', 'Enable optional online features to check for updates.');
      return;
    }
    setIsCheckingUpdate(true);
    try {
      const result = await checkForUpdates();
      setUpdateState(getUpdateState());
      if (result.isUpdateAvailable) {
        Alert.alert(
          'Update available',
          `Latest version: ${result.latestVersion ?? 'Unknown'}\nCurrent version: ${result.currentVersion}`,
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Open Release', onPress: () => Linking.openURL(result.releaseUrl) },
          ],
        );
      } else {
        Alert.alert('Up to date', `You are on the latest version (${result.currentVersion}).`);
      }
    } catch (err) {
      Alert.alert('Update check failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [settings.enableOnlineFeatures]);

  const handleOpenReleases = useCallback(() => {
    Linking.openURL(RELEASES_URL).catch(() => {
      Alert.alert('Link unavailable', 'Unable to open releases right now.');
    });
  }, []);

  const handleOpenGithub = useCallback(() => {
    Linking.openURL('https://github.com/Shivanshmishra7275').catch(() => {
      Alert.alert('Link unavailable', 'Unable to open the GitHub profile right now.');
    });
  }, []);

  const handleVersionTap = useCallback(() => {
    const newTaps = versionTaps + 1;
    setVersionTaps(newTaps);
    if (newTaps === 5) {
      setShowDevMenu(true);
      setVersionTaps(0);
    }
  }, [versionTaps]);

  const handleRetentionChange = useCallback((value: string) => {
    const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
    update('backupRetentionCount', Number.isFinite(parsed) ? parsed : 0);
  }, [update]);

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
              
              <View style={{ marginTop: SPACING.md, marginBottom: SPACING.sm }}>
                <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs }}>
                  Encrypted Backup Passphrase
                </Text>
                <TextInput
                  mode="outlined"
                  secureTextEntry
                  value={passphrase}
                  onChangeText={setPassphrase}
                  placeholder="Enter a strong passphrase"
                  style={{ backgroundColor: COLORS.surface }}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.exportButtons}>
                <Button
                  mode="outlined"
                  onPress={handleExportBackup}
                  loading={isExporting}
                  disabled={isExporting || isRestoring}
                  icon="shield-lock"
                  textColor={COLORS.primary}
                  style={styles.exportBtn}
                >
                  Backup
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleRestoreBackup}
                  loading={isRestoring}
                  disabled={isExporting || isRestoring}
                  icon="restore"
                  textColor={COLORS.accent}
                  style={styles.exportBtn}
                >
                  Restore
                </Button>
              </View>

              <Divider style={[styles.divider, { marginVertical: SPACING.md }]} />

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

        {/* Sync */}
        <SectionHeader title="Encrypted Sync" icon="cloud-sync-outline" />
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardDesc}>
              Optional encrypted WebDAV transport. ContactForge pushes and pulls an AES-encrypted backup. Your provider never sees your data in plaintext.
            </Text>
            
            <SettingRow label="WebDAV Endpoint URL">
              <TextInput
                value={settings.syncWebDavEndpoint}
                onChangeText={(v) => update('syncWebDavEndpoint', v)}
                style={styles.longInput}
                mode="outlined"
                dense
                autoCapitalize="none"
                placeholder="https://example.com/remote.php/webdav/"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                textColor={COLORS.textPrimary}
              />
            </SettingRow>
            
            <SettingRow label="Username">
              <TextInput
                value={settings.syncWebDavUser}
                onChangeText={(v) => update('syncWebDavUser', v)}
                style={styles.longInput}
                mode="outlined"
                dense
                autoCapitalize="none"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                textColor={COLORS.textPrimary}
              />
            </SettingRow>

            <SettingRow label="App Password">
              <TextInput
                value={settings.syncWebDavPass}
                onChangeText={(v) => update('syncWebDavPass', v)}
                style={styles.longInput}
                mode="outlined"
                secureTextEntry
                dense
                autoCapitalize="none"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                textColor={COLORS.textPrimary}
              />
            </SettingRow>

            <View style={{ marginTop: SPACING.sm, marginBottom: SPACING.md }}>
              <Text style={{ fontSize: FONT_SIZE.xs, color: COLORS.textSecondary }}>
                Enter the 'Encrypted Backup Passphrase' above to sync.
              </Text>
            </View>

            <View style={styles.exportButtons}>
              <Button
                mode="outlined"
                onPress={handlePushBackup}
                loading={isSyncing}
                disabled={isSyncing || isExporting}
                icon="cloud-upload"
                textColor={COLORS.primary}
                style={styles.exportBtn}
              >
                Push
              </Button>
              <Button
                mode="outlined"
                onPress={handlePullBackup}
                loading={isSyncing}
                disabled={isSyncing || isExporting}
                icon="cloud-download"
                textColor={COLORS.secondary}
                style={styles.exportBtn}
              >
                Pull
              </Button>
            </View>
            <Divider style={[styles.divider, { marginVertical: SPACING.md }]} />
            <SettingRow label="Automated Background Sync">
              <Switch
                value={settings.enableBackgroundWebDavSync}
                onValueChange={async (v) => {
                  if (v) {
                    if (!passphrase || !settings.syncWebDavEndpoint || !settings.syncWebDavUser || !settings.syncWebDavPass) {
                      Alert.alert('Configuration Error', 'Please enter your WebDAV credentials and backup passphrase before enabling background sync.');
                      return;
                    }
                    try {
                      await SecureStore.setItemAsync('webdav_user', settings.syncWebDavUser);
                      await SecureStore.setItemAsync('webdav_pass', settings.syncWebDavPass);
                      await SecureStore.setItemAsync('webdav_passphrase', passphrase);
                      await registerBackgroundSync();
                      update('enableBackgroundWebDavSync', true);
                    } catch (e) {
                      Alert.alert('Error', 'Failed to enable background sync.');
                    }
                  } else {
                    await unregisterBackgroundSync();
                    update('enableBackgroundWebDavSync', false);
                  }
                }}
                color={COLORS.primary}
              />
            </SettingRow>
            {settings.lastSyncTime && (
              <Text style={[styles.maintenanceNote, { marginTop: SPACING.md }]}>
                Last manual sync: {isoToDisplay(settings.lastSyncTime)}
              </Text>
            )}
            {settings.lastAutomatedSyncTime && (
              <Text style={styles.maintenanceNote}>
                Last automated sync: {isoToDisplay(settings.lastAutomatedSyncTime)}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Maintenance */}
        <SectionHeader title="Maintenance & Automation" icon="sync" />
        <Card style={styles.card}>
          <Card.Content>
            <SettingRow label="Background maintenance (best-effort)">
              <Switch
                value={settings.enableBackgroundMaintenance}
                onValueChange={(v) => update('enableBackgroundMaintenance', v)}
                color={COLORS.primary}
              />
            </SettingRow>
            <Divider style={styles.divider} />
            <SettingRow label="Auto purge expired temporary contacts">
              <Switch
                value={settings.autoPurgeExpiredTemporary}
                onValueChange={(v) => update('autoPurgeExpiredTemporary', v)}
                color={COLORS.primary}
              />
            </SettingRow>
            <Divider style={styles.divider} />
            <SettingRow label="Backup retention (count)">
              <TextInput
                value={String(settings.backupRetentionCount)}
                onChangeText={handleRetentionChange}
                style={styles.smallInput}
                mode="outlined"
                dense
                keyboardType="number-pad"
                outlineColor={COLORS.border}
                activeOutlineColor={COLORS.primary}
                textColor={COLORS.textPrimary}
              />
            </SettingRow>
            <Divider style={styles.divider} />
            <View style={styles.maintenanceMeta}>
              <Text style={styles.maintenanceLabel}>Last maintenance</Text>
              <Text style={styles.maintenanceValue}>
                {maintenanceState.lastRunAt ? isoToDisplay(maintenanceState.lastRunAt) : 'Never'}
              </Text>
              {maintenanceState.lastSummary && (
                <Text style={styles.maintenanceNote}>
                  Cleanup issues: {maintenanceState.lastSummary.cleanupIssues} •
                  Pending duplicates: {maintenanceState.lastSummary.pendingDuplicates}
                </Text>
              )}
            </View>
            <Button
              mode="outlined"
              onPress={handleRunMaintenance}
              loading={isRunningMaintenance}
              disabled={isRunningMaintenance}
              icon="broom"
              textColor={COLORS.primary}
              style={styles.maintenanceButton}
            >
              Run Maintenance Now
            </Button>
          </Card.Content>
        </Card>

        {/* Optional online */}
        <SectionHeader title="Optional Online" icon="cloud-outline" />
        <Card style={styles.card}>
          <Card.Content>
            <SettingRow label="Enable optional online features">
              <Switch
                value={settings.enableOnlineFeatures}
                onValueChange={(v) => update('enableOnlineFeatures', v)}
                color={COLORS.primary}
              />
            </SettingRow>
            <Divider style={styles.divider} />
            <Text style={styles.cardDesc}>
              When enabled, ContactForge can check for release updates and open docs or community links.
              No contact data is ever uploaded.
            </Text>
            <Button
              mode="outlined"
              onPress={handleCheckUpdates}
              loading={isCheckingUpdate}
              disabled={isCheckingUpdate}
              icon="cloud-check"
              textColor={COLORS.primary}
              style={styles.maintenanceButton}
            >
              Check for Updates
            </Button>
            <Button
              mode="text"
              onPress={handleOpenReleases}
              icon="open-in-new"
              textColor={COLORS.secondary}
              style={styles.releasesLink}
            >
              Open Releases Page
            </Button>
            {updateState.lastCheckedAt && (
              <Text style={styles.maintenanceNote}>
                Last checked: {isoToDisplay(updateState.lastCheckedAt)}
              </Text>
            )}
            {updateState.lastResult?.latestVersion && (
              <Text style={styles.maintenanceNote}>
                Latest version: {updateState.lastResult.latestVersion}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* QR Business Card */}
        <SectionHeader title="My QR Card" icon="qrcode" />
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardDesc}>
              Create and share your contact QR code. Fully offline.
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowQRCard(true)}
              style={styles.qrBtn}
              buttonColor={COLORS.secondary}
              icon="qrcode"
            >
              Open QR Card
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
                The app operates offline by default. Optional online features are
                opt-in and limited to update checks or docs links.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Legal & Permissions */}
        <SectionHeader title="Legal & Permissions" icon="file-document-outline" />
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardDesc}>
              Review privacy, terms, export safety, and permission rationale in one place.
            </Text>
            <Button
              mode="text"
              onPress={() => router.push('/legal/privacy')}
              icon="shield-lock"
              textColor={COLORS.primary}
              style={styles.legalLink}
            >
              Privacy & Data Handling
            </Button>
            <Button
              mode="text"
              onPress={() => router.push('/legal/terms')}
              icon="file-document"
              textColor={COLORS.primary}
              style={styles.legalLink}
            >
              Terms & Conditions
            </Button>
            <Button
              mode="text"
              onPress={() => router.push('/legal/export-warning')}
              icon="alert-circle-outline"
              textColor={COLORS.secondary}
              style={styles.legalLink}
            >
              Export Warning
            </Button>
            <Button
              mode="text"
              onPress={() => router.push('/legal/permissions')}
              icon="lock-open-variant"
              textColor={COLORS.primary}
              style={styles.legalLink}
            >
              Permissions Rationale
            </Button>
          </Card.Content>
        </Card>

        {/* Developer */}
        <SectionHeader title="About the Creator" icon="account-tie" />
        <Card style={styles.card}>
          <Card.Content>
            {/* Shivansh Mishra Branding */}
            <View style={styles.developerHeader}>
              <View style={styles.developerAvatar}>
                <MaterialCommunityIcons name="star-circle" color={COLORS.primary} size={30} />
              </View>
              <View style={styles.developerMeta}>
                <Text style={styles.creatorBrand}>Crafted by Shivansh Mishra</Text>
                <Text style={styles.developerTitle}>
                  Privacy-first, offline-first contact manager
                </Text>
                <Text style={styles.versionNote}>V3 release</Text>
              </View>
            </View>
            <Divider style={[styles.divider, { marginVertical: SPACING.md }]} />
            <Button
              mode="outlined"
              onPress={handleOpenGithub}
              icon="github"
              textColor={COLORS.primary}
              style={styles.githubButton}
            >
              View GitHub: Shivansh Mishra
            </Button>
            <Text style={styles.brandMessage}>
              Crafted by Shivansh Mishra with a focus on trust, speed, and offline-first workflows.
            </Text>
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
        <Text
          style={styles.version}
          onPress={handleVersionTap}
        >
          {APP_NAME} v{APP_VERSION}
        </Text>

        {showDevMenu && (
          <Card style={[styles.card, styles.devMenuCard]}>
            <Card.Content>
              <Text style={styles.devMenuTitle}>Developer Menu</Text>
              <Button
                mode="text"
                onPress={() => Alert.alert('Architecture', 'ContactForge runs on Phase 0-8 stack: Expo, React Native, React Navigation, Reanimated 3, SQLite, and offline-first domain logic.')}
                textColor={COLORS.primary}
              >
                📐 Architecture Summary
              </Button>
              <Button
                mode="text"
                onPress={() => Alert.alert('Schema', '16 tables (contacts, notes, relationships, duplicate tracking, audit logs, settings, temp contacts, sync state, profile cards)')}
                textColor={COLORS.primary}
              >
                🗄️ Schema Diagram
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* QR Card Modal */}
        {showQRCard && (
          <Portal>
            <QRBusinessCard onClose={() => setShowQRCard(false)} />
          </Portal>
        )}
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
  longInput: {
    flex: 1,
    marginLeft: SPACING.md,
    backgroundColor: COLORS.surface,
    fontSize: FONT_SIZE.sm,
  },
  divider: { backgroundColor: COLORS.divider },
  exportButtons: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.sm },
  exportBtn: { flex: 1 },
  backupLink: { marginTop: SPACING.sm },
  maintenanceMeta: { paddingVertical: SPACING.sm },
  maintenanceLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  maintenanceValue: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, marginTop: SPACING.xs },
  maintenanceNote: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },
  maintenanceButton: { marginTop: SPACING.sm, alignSelf: 'flex-start' },
  releasesLink: { alignSelf: 'flex-start' },
  legalLink: { alignSelf: 'flex-start' },
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
  developerHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  developerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceVariant,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  developerMeta: { flex: 1 },
  developerTitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginTop: 2 },
  githubButton: { alignSelf: 'flex-start' },
  saveBtn: { marginTop: SPACING.lg },
  version: {
    color: COLORS.textDisabled,
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  devMenuCard: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceVariant,
  },
  devMenuTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  qrBtn: { marginTop: SPACING.sm },
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.md,
  },
  creatorBrand: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  versionNote: {
    color: COLORS.secondary,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  brandMessage: {
    color: COLORS.textDisabled,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.md,
    lineHeight: 18,
  },
});
