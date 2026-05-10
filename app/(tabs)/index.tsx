/**
 * ContactForge — Dashboard Screen
 *
 * Shows:
 * - Sync status and last sync time
 * - Quick stats (total contacts, pending duplicates, cleanup issues)
 * - Quick action buttons (sync, scan duplicates, export)
 * - Permission status warning if not granted
 */

import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Divider, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE, APP_NAME } from '../../src/constants';
import {
  requestContactsPermission,
  getContactsPermissionStatus,
  syncContactsToLocal,
} from '../../src/services/contactSyncService';
import { runDuplicateScan } from '../../src/services/duplicateService';
import { countContacts } from '../../src/db/repositories/contactRepository';
import { countPendingDuplicates } from '../../src/db/repositories/duplicateRepository';
import { countExpiredTemporaryContacts } from '../../src/services/temporaryContactService';
import { isoToDisplay } from '../../src/utils/normalization';
import type { SyncProgress } from '../../src/services/contactSyncService';

export default function DashboardScreen() {
  const sync = useAppStore((s) => s.sync);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setSyncCounts = useAppStore((s) => s.setSyncCounts);
  const setSyncedAt = useAppStore((s) => s.setSyncedAt);
  const pendingDuplicates = useAppStore((s) => s.pendingDuplicateCount);
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);
  const setGlobalLoading = useAppStore((s) => s.setGlobalLoading);
  const setGlobalLoadingMessage = useAppStore((s) => s.setGlobalLoadingMessage);

  const [totalContacts, setTotalContacts] = useState(0);
  const [expiredTemps, setExpiredTemps] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const refreshStats = useCallback(() => {
    setTotalContacts(countContacts());
    setPendingDuplicateCount(countPendingDuplicates());
    setExpiredTemps(countExpiredTemporaryContacts());
  }, []);

  useEffect(() => {
    getContactsPermissionStatus().then((status) => {
      setPermissionGranted(status === 'granted');
    });
    refreshStats();
  }, []);

  const handleSync = useCallback(async () => {
    const granted = await requestContactsPermission();
    if (!granted) {
      router.push('/permission-denied');
      return;
    }
    setPermissionGranted(true);
    setIsSyncing(true);
    setSyncStatus('running');
    setSyncProgress(null);

    try {
      const result = await syncContactsToLocal((progress) => {
        setSyncProgress(progress);
      });
      const ts = new Date().toISOString();
      setSyncedAt(ts);
      setSyncStatus('idle');
      refreshStats();
      Alert.alert('Sync Complete', `Synced ${result.synced} contacts${result.errors > 0 ? ` (${result.errors} errors)` : ''}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSyncStatus('error', msg);
      Alert.alert('Sync Failed', msg);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [refreshStats]);

  const handleScanDuplicates = useCallback(async () => {
    if (totalContacts === 0) {
      Alert.alert('No contacts', 'Sync your contacts first before scanning for duplicates.');
      return;
    }
    setIsScanning(true);
    setGlobalLoading(true);
    setGlobalLoadingMessage('Scanning for duplicates…');

    try {
      const result = await runDuplicateScan((progress) => {
        setGlobalLoadingMessage(
          `Scanning… ${progress.processed}/${progress.total} (${progress.found} found)`,
        );
      });
      setPendingDuplicateCount(countPendingDuplicates());
      Alert.alert('Scan Complete', `Found ${result.found} duplicate candidates.`);
    } catch (err) {
      Alert.alert('Scan Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsScanning(false);
      setGlobalLoading(false);
    }
  }, [totalContacts]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Privacy-first contact management</Text>
        </View>

        {/* Permission warning */}
        {permissionGranted === false && (
          <Card style={styles.warningCard}>
            <Card.Content style={styles.warningContent}>
              <MaterialCommunityIcons name="alert-circle" color={COLORS.warning} size={20} />
              <Text style={styles.warningText}>
                Contacts permission not granted. Tap Sync to request access.
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="account-group"
            value={totalContacts}
            label="Contacts"
            color={COLORS.primary}
          />
          <StatCard
            icon="content-copy"
            value={pendingDuplicates}
            label="Duplicates"
            color={COLORS.error}
            onPress={() => router.push('/(tabs)/duplicates')}
          />
          <StatCard
            icon="timer-sand"
            value={expiredTemps}
            label="Expired"
            color={COLORS.warning}
            onPress={() => router.push('/(tabs)/cleanup')}
          />
        </View>

        {/* Sync status */}
        <Card style={styles.card}>
          <Card.Title title="Last Sync" titleStyle={styles.cardTitle} />
          <Card.Content>
            <Text style={styles.syncTime}>
              {sync.lastSyncAt
                ? isoToDisplay(sync.lastSyncAt)
                : 'Never synced'}
            </Text>
            {sync.status === 'error' && (
              <Text style={styles.errorText}>{sync.errorMessage}</Text>
            )}
            {isSyncing && syncProgress && (
              <View style={styles.progressRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.progressText}>
                  {syncProgress.processed} / {syncProgress.total}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick actions */}
        <Card style={styles.card}>
          <Card.Title title="Quick Actions" titleStyle={styles.cardTitle} />
          <Card.Content style={styles.actionsContent}>
            <Button
              mode="contained"
              onPress={handleSync}
              loading={isSyncing}
              disabled={isSyncing || isScanning}
              icon="sync"
              style={styles.actionBtn}
              buttonColor={COLORS.primary}
            >
              {isSyncing ? 'Syncing…' : 'Sync Contacts'}
            </Button>
            <Button
              mode="outlined"
              onPress={handleScanDuplicates}
              loading={isScanning}
              disabled={isSyncing || isScanning}
              icon="magnify"
              style={styles.actionBtn}
              textColor={COLORS.primary}
            >
              Scan Duplicates
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.push('/(tabs)/contacts')}
              icon="account-group"
              style={styles.actionBtn}
              textColor={COLORS.secondary}
            >
              Browse Contacts
            </Button>
          </Card.Content>
        </Card>

        {/* Privacy note */}
        <Card style={styles.privacyCard}>
          <Card.Content style={styles.privacyContent}>
            <MaterialCommunityIcons name="shield-check" color={COLORS.success} size={18} />
            <Text style={styles.privacyText}>
              100% offline. No data ever leaves your device.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
}

function StatCard({ icon, value, label, color, onPress }: StatCardProps) {
  return (
    <Card style={[styles.statCard, { borderColor: color }]} onPress={onPress}>
      <Card.Content style={styles.statContent}>
        <MaterialCommunityIcons name={icon as any} color={color} size={28} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.lg },
  appName: {
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  warningCard: { backgroundColor: '#2a2010', marginBottom: SPACING.md },
  warningContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  warningText: { color: COLORS.warning, fontSize: FONT_SIZE.sm, flex: 1 },
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: 12,
  },
  statContent: { alignItems: 'center', paddingVertical: SPACING.sm },
  statValue: { fontSize: FONT_SIZE.xxl, fontWeight: '700', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
  card: { backgroundColor: COLORS.surface, marginBottom: SPACING.md },
  cardTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  syncTime: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  progressText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  actionsContent: { gap: SPACING.sm },
  actionBtn: { marginBottom: 0 },
  privacyCard: { backgroundColor: COLORS.surfaceVariant },
  privacyContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  privacyText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, flex: 1 },
});
