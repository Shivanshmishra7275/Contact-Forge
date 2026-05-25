/**
 * ContactForge — Dashboard Screen
 * 
 * Created by: Shivansh Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 *
 * Shows:
 * - Sync status and last sync time
 * - Quick stats (total contacts, pending duplicates, cleanup issues)
 * - Library health overview
 * - Quick action buttons (sync, scan duplicates, export)
 * - Permission status warning if not granted
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { View, ScrollView, StyleSheet, Alert, InteractionManager, TouchableOpacity, Animated, Easing } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Chip, ProgressBar } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE, APP_NAME } from '../../src/constants';
import {
  requestContactsPermission,
  getContactsPermissionStatus,
  syncContactsToLocal,
} from '../../src/services/contactSyncService';
import { runDuplicateScan } from '../../src/services/duplicateService';
import { applyBulkCleanupFixes, scanAllContactsForIssues } from '../../src/services/cleanupService';
import { getMaintenanceState } from '../../src/services/maintenanceService';
import { countContacts } from '../../src/db/repositories/contactRepository';
import { countPendingDuplicates } from '../../src/db/repositories/duplicateRepository';
import { countExpiredTemporaryContacts } from '../../src/services/temporaryContactService';
import { countContactsWithIssues } from '../../src/services/cleanupService';
import { calculateHealthSummary } from '../../src/services/contactHealthService';
import { getIntelligenceSummary } from '../../src/services/relationshipIntelligenceService';
import { createDailySnapshotIfNeeded, getSnapshotFromDaysAgo } from '../../src/db/repositories/networkSnapshotRepository';
import { countContactsWithSuggestions } from '../../src/services/relationshipCategorizationService';
import { isoToDisplay } from '../../src/utils/normalization';
import type { SyncProgress, SyncResult } from '../../src/services/contactSyncService';
import type { SyncState } from '../../src/types';

export default function DashboardScreen() {
  const sync = useAppStore((s) => s.sync);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const setSyncCounts = useAppStore((s) => s.setSyncCounts);
  const setSyncedAt = useAppStore((s) => s.setSyncedAt);
  const pendingDuplicates = useAppStore((s) => s.pendingDuplicateCount);
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);
  const setGlobalLoading = useAppStore((s) => s.setGlobalLoading);
  const setGlobalLoadingMessage = useAppStore((s) => s.setGlobalLoadingMessage);
  const settings = useAppStore((s) => s.settings);
  const latestSnapshot = useAppStore((s) => s.latestSnapshot);
  const previousSnapshot = useAppStore((s) => s.previousSnapshot);
  const setSnapshots = useAppStore((s) => s.setSnapshots);

  const [totalContacts, setTotalContacts] = useState(0);
  const [expiredTemps, setExpiredTemps] = useState(0);
  const [averageHealth, setAverageHealth] = useState(0);
  const [lowHealthCount, setLowHealthCount] = useState(0);
  const [cleanupIssueCount, setCleanupIssueCount] = useState(0);
  const [followUpsDue, setFollowUpsDue] = useState(0);
  const [highValueInactive, setHighValueInactive] = useState(0);
  const [suggestedCategorizations, setSuggestedCategorizations] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [maintenanceState, setMaintenanceState] = useState(() => getMaintenanceState());
  const entranceValues = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  const animatedTotal = useCountUp(totalContacts);
  const animatedDuplicates = useCountUp(pendingDuplicates);
  const animatedExpired = useCountUp(expiredTemps);
  const needsAttentionCount = pendingDuplicates + cleanupIssueCount + expiredTemps + lowHealthCount + followUpsDue + highValueInactive + suggestedCategorizations;

  const syncBadge = useMemo(
    () => buildSyncBadge({
      status: sync.status,
      lastSyncAt: sync.lastSyncAt,
      errorMessage: sync.errorMessage,
      isSyncing,
      permissionGranted,
    }),
    [sync.status, sync.lastSyncAt, sync.errorMessage, isSyncing, permissionGranted],
  );

  const progressValue = syncProgress
    ? Math.min(1, syncProgress.processed / Math.max(1, syncProgress.total))
    : 0;

  const refreshStats = useCallback(() => {
    setStatsLoading(true);
    try {
      setTotalContacts(countContacts());
      setPendingDuplicateCount(countPendingDuplicates());
      setExpiredTemps(countExpiredTemporaryContacts());
      setCleanupIssueCount(countContactsWithIssues());
      const summary = calculateHealthSummary();
      setAverageHealth(summary.average);
      setLowHealthCount(summary.lowCount);
      setMaintenanceState(getMaintenanceState());

      const intSummary = getIntelligenceSummary();
      setFollowUpsDue(intSummary.dueFollowUps);
      setHighValueInactive(intSummary.highValueInactive);
      setSuggestedCategorizations(countContactsWithSuggestions());

      // Opportunistically create daily snapshot and load comparisons
      const latest = createDailySnapshotIfNeeded();
      const prev = getSnapshotFromDaysAgo(7);
      setSnapshots(latest, prev);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      entranceValues.forEach((value) => value.setValue(0));
      const task = InteractionManager.runAfterInteractions(() => {
        getContactsPermissionStatus().then((status) => {
          if (!cancelled) {
            setPermissionGranted(status === 'granted');
          }
        });
        refreshStats();
        Animated.stagger(
          70,
          entranceValues.map((value) => (
            Animated.timing(value, {
              toValue: 1,
              duration: 200,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          )),
        ).start();
      });

      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [entranceValues, refreshStats]),
  );

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
      const postSyncNotes: string[] = [];
      const result = await syncContactsToLocal((progress) => {
        setSyncProgress(progress);
      });
      const ts = new Date().toISOString();
      setSyncedAt(ts);
      setSyncStatus('idle');
      setSyncCounts(result.synced, countContacts());
      refreshStats();

      if (settings.autoCleanOnSync) {
        setGlobalLoading(true);
        setGlobalLoadingMessage('Auto-cleaning contact issues…');
        const issues = scanAllContactsForIssues();
        const applied = applyBulkCleanupFixes(issues);
        postSyncNotes.push(`Auto-cleaned ${applied} fixes.`);
      }

      if (settings.duplicateScanOnSync) {
        setGlobalLoading(true);
        setGlobalLoadingMessage('Scanning for duplicates…');
        const scanResult = await runDuplicateScan();
        setPendingDuplicateCount(countPendingDuplicates());
        postSyncNotes.push(`Duplicate scan found ${scanResult.found}.`);
      }

      const repairSummary = buildRepairSummary(result);
      const countSummary = buildSyncCountSummary(result);
      const postSyncSummary = postSyncNotes.length > 0 ? `\n${postSyncNotes.join('\n')}` : '';
      Alert.alert(
        'Sync Complete',
        `Synced ${result.synced} contacts${result.errors > 0 ? ` (${result.errors} errors)` : ''}.\n${countSummary}${repairSummary}${postSyncSummary}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSyncStatus('error', msg);
      Alert.alert('Sync Failed', msg);
    } finally {
      setGlobalLoading(false);
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [refreshStats, settings.autoCleanOnSync, settings.duplicateScanOnSync]);

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
        {/* Dashboard Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Home</Text>
          <Text style={styles.tagline}>{APP_NAME} keeps your address book clean and trusted.</Text>
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

        <Animated.View style={[styles.statsRow, getEntranceStyle(entranceValues[0])]}>
          <StatCard
            icon="account-group"
            value={animatedTotal}
            label="Contacts"
            color={COLORS.primary}
          />
          <StatCard
            icon="content-copy"
            value={animatedDuplicates}
            label="Duplicates"
            color={COLORS.error}
            onPress={() => router.push('/(tabs)/duplicates')}
          />
          <StatCard
            icon="timer-sand"
            value={animatedExpired}
            label="Expired"
            color={COLORS.warning}
            onPress={() => router.push('/(tabs)/cleanup')}
          />
        </Animated.View>

        {/* V3: Duplicate Review CTA — shown when candidates exist */}
        {pendingDuplicates > 0 && (
          <Animated.View style={getEntranceStyle(entranceValues[0])}>
            <Card
              style={styles.duplicateCta}
              onPress={() => router.push('/(tabs)/duplicates')}
            >
              <Card.Content style={styles.duplicateCtaContent}>
                <View style={styles.duplicateCtaLeft}>
                  <MaterialCommunityIcons name="cards-outline" size={28} color={COLORS.error} />
                  <View>
                    <Text style={styles.duplicateCtaTitle}>
                      {pendingDuplicates} duplicate{pendingDuplicates !== 1 ? 's' : ''} to review
                    </Text>
                    <Text style={styles.duplicateCtaHint}>
                      Tap to review each pair as a flashcard
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        <Animated.View style={getEntranceStyle(entranceValues[1])}>
          <Card style={styles.healthCard}>
            <Card.Content style={styles.healthContent}>
              <View style={styles.healthLeft}>
                <MaterialCommunityIcons name="heart-pulse" size={28} color={COLORS.primary} />
                <View>
                  <Text style={styles.healthLabel}>Library Health</Text>
                  <Text style={styles.healthValue}>{Math.round(averageHealth)}%</Text>
                </View>
              </View>
              <View style={styles.healthBar}>
                <View style={[styles.healthProgress, { width: `${averageHealth}%` }]} />
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={getEntranceStyle(entranceValues[2])}>
          <Card style={styles.healthCard}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
                <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Weekly Network Health</Text>
              </View>
              {latestSnapshot && previousSnapshot ? (
                <View style={{ gap: SPACING.xs, marginTop: SPACING.sm }}>
                  <TrendRow 
                    label="Overdue follow-ups" 
                    current={latestSnapshot.overdueFollowUps} 
                    previous={previousSnapshot.overdueFollowUps} 
                    invertColors={true}
                  />
                  <TrendRow 
                    label="Stale important contacts" 
                    current={latestSnapshot.staleContacts} 
                    previous={previousSnapshot.staleContacts} 
                    invertColors={true}
                  />
                  <TrendRow 
                    label="Active relationships" 
                    current={latestSnapshot.activeRelationships} 
                    previous={previousSnapshot.activeRelationships} 
                    invertColors={false}
                  />
                </View>
              ) : (
                <Text style={[styles.syncHelper, { marginTop: SPACING.sm }]}>
                  Tracking network trends... Check back in a few days.
                </Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={getEntranceStyle(entranceValues[3])}>
          <Card style={styles.card}>
            <Card.Title
              title="Sync status"
              titleStyle={styles.cardTitle}
              right={() => (
                <Chip style={[styles.statusChip, { backgroundColor: syncBadge.tone + '22' }]} textStyle={{ color: syncBadge.tone }}>
                  {syncBadge.label}
                </Chip>
              )}
            />
            <Card.Content>
              <Text style={styles.syncTime}>
                {sync.lastSyncAt ? isoToDisplay(sync.lastSyncAt) : 'Never synced'}
              </Text>
              <Text style={styles.syncMeta}>
                Device: {sync.totalNativeContacts} • Local: {sync.totalLocalContacts}
              </Text>
              <Text style={styles.syncHelper}>{syncBadge.helper}</Text>
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
              {isSyncing && syncProgress && (
                <ProgressBar progress={progressValue} color={COLORS.primary} style={styles.progressBar} />
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={getEntranceStyle(entranceValues[4])}>
          <Card style={styles.card}>
            <Card.Title title="Maintenance" titleStyle={styles.cardTitle} />
            <Card.Content>
              <Text style={styles.syncTime}>
                {maintenanceState.lastRunAt
                  ? isoToDisplay(maintenanceState.lastRunAt)
                  : 'Not run yet'}
              </Text>
              {maintenanceState.lastSummary && (
                <Text style={styles.maintenanceText}>
                  Cleanup issues: {maintenanceState.lastSummary.cleanupIssues} •
                  Pending duplicates: {maintenanceState.lastSummary.pendingDuplicates}
                </Text>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={getEntranceStyle(entranceValues[5])}>
          <Card style={styles.card}>
            <Card.Title title="Quick actions" titleStyle={styles.cardTitle} />
            <Card.Content style={styles.actionsContent}>
              <QuickActionButton
                mode="contained"
                onPress={handleSync}
                loading={isSyncing}
                disabled={isSyncing || isScanning}
                icon="sync"
                buttonColor={COLORS.primary}
                containerStyle={styles.actionBtn}
              >
                {isSyncing ? 'Syncing…' : 'Sync contacts'}
              </QuickActionButton>
              <QuickActionButton
                mode="outlined"
                onPress={handleScanDuplicates}
                loading={isScanning}
                disabled={isSyncing || isScanning}
                icon="magnify"
                textColor={COLORS.primary}
                containerStyle={styles.actionBtn}
              >
                Scan duplicates
              </QuickActionButton>
              <QuickActionButton
                mode="outlined"
                onPress={() => router.push('/(tabs)/contacts')}
                icon="account-group"
                textColor={COLORS.secondary}
                containerStyle={styles.actionBtn}
              >
                Browse contacts
              </QuickActionButton>
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={getEntranceStyle(entranceValues[6])}>
          <Card style={styles.card}>
            <Card.Title
              title="Needs attention"
              titleStyle={styles.cardTitle}
              right={() => (
                <Chip style={styles.needsChip} textStyle={styles.needsChipText}>
                  {needsAttentionCount}
                </Chip>
              )}
            />
            <Card.Content style={styles.reviewContent}>
              <Text style={styles.reviewHint}>Start where the risk is highest and work down the list.</Text>
              <ReviewRow
                label="Follow-ups due"
                count={followUpsDue}
                color={COLORS.warning}
                onPress={() => router.push('/(tabs)/contacts')}
              />
              <ReviewRow
                label="Stale important contacts"
                count={highValueInactive}
                color={COLORS.accent}
                onPress={() => router.push('/(tabs)/contacts')}
              />
              <ReviewRow
                label="Suggested relationships"
                count={suggestedCategorizations}
                color={COLORS.primary}
                onPress={() => router.push('/(tabs)/contacts')}
              />
              <ReviewRow
                label="Duplicate candidates"
                count={pendingDuplicates}
                color={COLORS.error}
                onPress={() => router.push('/(tabs)/duplicates')}
              />
              <ReviewRow
                label="Cleanup issues"
                count={cleanupIssueCount}
                color={COLORS.warning}
                onPress={() => router.push('/(tabs)/cleanup')}
              />
              <ReviewRow
                label="Expired temporary contacts"
                count={expiredTemps}
                color={COLORS.info}
                onPress={() => router.push('/(tabs)/cleanup')}
              />
              <ReviewRow
                label="Low health contacts"
                count={lowHealthCount}
                color={COLORS.primary}
                onPress={() => router.push({ pathname: '/(tabs)/contacts', params: { filter: 'low_health' } })}
              />
            </Card.Content>
            <Card.Content style={styles.reviewFooter}>
              {statsLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Button mode="text" onPress={refreshStats} textColor={COLORS.primary} compact>
                  Refresh counts
                </Button>
              )}
            </Card.Content>
          </Card>
        </Animated.View>

        <Animated.View style={getEntranceStyle(entranceValues[7])}>
          <Card style={styles.privacyCard}>
            <Card.Content style={styles.privacyContent}>
              <MaterialCommunityIcons name="shield-check" color={COLORS.success} size={18} />
              <Text style={styles.privacyText}>
                Offline by default. Optional online checks never upload contact data.
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrendRow({ label, current, previous, invertColors }: { label: string, current: number, previous: number, invertColors: boolean }) {
  const diff = current - previous;
  const isBetter = invertColors ? diff < 0 : diff > 0;
  const isNeutral = diff === 0;
  
  let color: string = COLORS.textSecondary;
  if (!isNeutral) {
    color = isBetter ? COLORS.success : COLORS.warning;
  }
  
  const icon = isNeutral ? 'minus' : (diff > 0 ? 'arrow-up' : 'arrow-down');
  const displayDiff = Math.abs(diff);

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.sm }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>{current}</Text>
        {!isNeutral && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: color + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginLeft: SPACING.xs }}>
            <MaterialCommunityIcons name={icon as any} size={12} color={color} />
            <Text style={{ color, fontSize: FONT_SIZE.xs, fontWeight: '600', marginLeft: 2 }}>{displayDiff}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function buildSyncBadge(params: {
  status: SyncState['status'];
  lastSyncAt: string | null;
  errorMessage: string | null;
  isSyncing: boolean;
  permissionGranted: boolean | null;
}): { label: string; helper: string; tone: string } {
  if (params.isSyncing) {
    return { label: 'Syncing', helper: 'Refreshing your local mirror.', tone: COLORS.primary };
  }
  if (params.permissionGranted === false) {
    return { label: 'Permission needed', helper: 'Allow contacts access to sync.', tone: COLORS.warning };
  }
  if (params.status === 'error') {
    return { label: 'Sync error', helper: 'Tap Sync to retry.', tone: COLORS.error };
  }
  if (!params.lastSyncAt) {
    return { label: 'Not synced', helper: 'Run a sync to build your local library.', tone: COLORS.warning };
  }

  const lastMs = Date.parse(params.lastSyncAt);
  const hours = Number.isNaN(lastMs) ? 99 : (Date.now() - lastMs) / (60 * 60 * 1000);
  if (hours > 24) {
    return { label: 'Sync recommended', helper: 'Last sync is over 24 hours old.', tone: COLORS.warning };
  }
  return { label: 'Up to date', helper: 'Local mirror is current.', tone: COLORS.success };
}

function getEntranceStyle(value: Animated.Value): { opacity: Animated.Value; transform: { translateY: Animated.AnimatedInterpolation<number> }[] } {
  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };
}

function useCountUp(value: number, duration = 200): number {
  const animated = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const id = animated.addListener(({ value: next }) => {
      setDisplay(Math.round(next));
    });
    return () => animated.removeListener(id);
  }, [animated]);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animated, duration, value]);

  return display;
}

function buildRepairSummary(result: SyncResult): string {
  if (!result.repairs || result.repairs.groups === 0) return '';

  const { groups, mergedContacts, removedContacts } = result.repairs;
  const mergedLabel = mergedContacts === 1 ? 'entry' : 'entries';
  const groupLabel = groups === 1 ? 'group' : 'groups';
  const removedLabel = removedContacts === 1 ? 'record' : 'records';
  return ` Repaired ${mergedContacts} duplicate ${mergedLabel} across ${groups} ${groupLabel} (${removedContacts} ${removedLabel} removed).`;
}

function buildSyncCountSummary(result: SyncResult): string {
  return [
    `Added: ${result.added}`,
    `Updated: ${result.updated}`,
    `Unchanged: ${result.unchanged}`,
    `Removed: ${result.removed}`,
  ].join(' • ');
}

type QuickActionButtonProps = ComponentProps<typeof Button> & {
  containerStyle?: object;
};

function QuickActionButton({ containerStyle, onPressIn, onPressOut, ...props }: QuickActionButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, {
      toValue: 0.98,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}
    >
      <Button
        {...props}
        onPressIn={(event) => {
          handlePressIn();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          handlePressOut();
          onPressOut?.(event);
        }}
      />
    </Animated.View>
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

interface ReviewRowProps {
  label: string;
  count: number;
  color: string;
  onPress?: () => void;
}

function ReviewRow({ label, count, color, onPress }: ReviewRowProps) {
  const Row = onPress ? TouchableOpacity : View;
  return (
    <Row
      style={styles.reviewRow}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.reviewLeft}>
        <View style={[styles.reviewDot, { backgroundColor: color }]} />
        <Text style={styles.reviewLabel}>{label}</Text>
      </View>
      <View style={styles.reviewRight}>
        <Text style={styles.reviewCount}>{count}</Text>
        {onPress && (
          <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textDisabled} />
        )}
      </View>
    </Row>
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
  statusChip: { alignSelf: 'center' },
  syncTime: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  syncMeta: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 4 },
  syncHelper: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, marginTop: 4 },
  maintenanceText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 4 },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm, marginTop: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  progressText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  progressBar: { marginTop: SPACING.sm, height: 4, borderRadius: 4 },
  actionsContent: { gap: SPACING.sm },
  actionBtn: { marginBottom: 0 },
  privacyCard: { backgroundColor: COLORS.surfaceVariant },
  privacyContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  privacyText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, flex: 1 },
  healthCard: { backgroundColor: COLORS.surface, marginBottom: SPACING.md },
  healthContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  healthLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  healthLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  healthValue: { color: COLORS.primary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginTop: 2 },
  healthBar: { height: 4, backgroundColor: COLORS.surfaceVariant, borderRadius: 2, overflow: 'hidden', flex: 1, minWidth: 60 },
  healthProgress: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  reviewContent: { gap: SPACING.sm },
  reviewHint: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  reviewFooter: { paddingTop: 0, alignItems: 'flex-start' },
  needsChip: { alignSelf: 'center', backgroundColor: COLORS.surfaceVariant },
  needsChipText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.xs },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  reviewLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  reviewDot: { width: 8, height: 8, borderRadius: 4 },
  reviewLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  reviewRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  reviewCount: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  // V3: Duplicate Review CTA
  duplicateCta: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error + '44',
    borderRadius: 12,
  },
  duplicateCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duplicateCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  duplicateCtaTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  duplicateCtaHint: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
});
