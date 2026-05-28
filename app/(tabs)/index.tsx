/**
 * ContactForge — Dashboard Screen
 * 
 * Created by: Shivansh Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { View, ScrollView, StyleSheet, Alert, InteractionManager, TouchableOpacity } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Chip, ProgressBar } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE, APP_NAME, RADIUS } from '../../src/constants';
import {
  requestContactsPermission,
  getContactsPermissionStatus,
  syncContactsToLocal,
  syncCleanedContactsToDevice,
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
import type { SyncState, Group } from '../../src/types';
import { AuroraBackground } from '../../src/components/AuroraBackground';
import { GroupRepository } from '../../src/db/repositories/groupRepository';
import { ManageGroupsModal } from '../../src/features/groups/components/ManageGroupsModal';

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
  const [isWritingBack, setIsWritingBack] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [maintenanceState, setMaintenanceState] = useState(() => getMaintenanceState());

  const [groups, setGroups] = useState<Group[]>([]);
  const [isGroupsModalVisible, setIsGroupsModalVisible] = useState(false);

  // Force re-render of entrances on focus
  const [entranceKey, setEntranceKey] = useState(0);

  // Prevent redundant DB thrash on rapid tab switches or re-focus within a short window
  const lastRefreshAtRef = useRef<number>(0);

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
    setTotalContacts(countContacts());
    setPendingDuplicateCount(countPendingDuplicates());
    setExpiredTemps(countExpiredTemporaryContacts());
    setCleanupIssueCount(countContactsWithIssues());
    setMaintenanceState(getMaintenanceState());
    
    try {
      setGroups(GroupRepository.getAllGroups());
    } catch (e) {
      console.warn('Groups not initialized yet', e);
    }

    Promise.resolve().then(() => {
      try {
        const summary = calculateHealthSummary();
        setAverageHealth(summary.average);
        setLowHealthCount(summary.lowCount);
      } catch { }
    }).then(() => {
      try {
        const intSummary = getIntelligenceSummary();
        setFollowUpsDue(intSummary.dueFollowUps);
        setHighValueInactive(intSummary.highValueInactive);
        setSuggestedCategorizations(countContactsWithSuggestions());
      } catch { }
    }).then(() => {
      try {
        const latest = createDailySnapshotIfNeeded();
        const prev = getSnapshotFromDaysAgo(7);
        setSnapshots(latest, prev);
      } catch { }
    }).finally(() => {
      setStatsLoading(false);
    });
  }, [setPendingDuplicateCount, setSnapshots]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const task = InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;

        // PERF: skip full DB refresh if data is less than 2s old (rapid tab switching guard)
        const now = Date.now();
        const isStale = now - lastRefreshAtRef.current > 2000;

        getContactsPermissionStatus().then((status) => {
          if (!cancelled) {
            setPermissionGranted(status === 'granted');
          }
        });

        if (isStale) {
          lastRefreshAtRef.current = now;
          refreshStats();
          setEntranceKey((k) => k + 1);
        }
      });

      return () => {
        cancelled = true;
        task.cancel();
      };
    }, [refreshStats]),
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

  const handleWriteBack = useCallback(async () => {
    Alert.alert(
      'Write Back to Phone',
      'This will update your native OS contacts (iPhone/Android) with all the merges, fixes, and cleanups from Contact-Forge. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Write Back', 
          style: 'destructive',
          onPress: async () => {
            setIsWritingBack(true);
            setGlobalLoading(true);
            setGlobalLoadingMessage('Writing to native contacts...');
            try {
              await syncCleanedContactsToDevice((progress) => {
                setGlobalLoadingMessage(`Writing... ${progress.processed}/${progress.total}`);
              });
              Alert.alert('Success', 'Your native phone contacts have been perfectly synced with Contact-Forge!');
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : String(err));
            } finally {
              setIsWritingBack(false);
              setGlobalLoading(false);
            }
          }
        }
      ]
    );
  }, [setGlobalLoading, setGlobalLoadingMessage]);

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
      <AuroraBackground />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} key={entranceKey}>
        
        {/* Dashboard Header */}
        <Animated.View style={styles.header} entering={FadeInUp.delay(50).springify().stiffness(100).damping(15)}>
          <Text style={styles.appName}>Mission Control</Text>
          <Text style={styles.tagline}>{APP_NAME} active and protecting your network.</Text>
        </Animated.View>

        {/* Permission warning */}
        {permissionGranted === false && (
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(100).damping(15)}>
            <Card style={styles.warningCard}>
              <Card.Content style={styles.warningContent}>
                <MaterialCommunityIcons name="alert-circle" color={COLORS.warning} size={20} />
                <Text style={styles.warningText}>
                  Contacts permission not granted. Tap Sync to request access.
                </Text>
              </Card.Content>
            </Card>
          </Animated.View>
        )}

        <Animated.View style={styles.statsRow} entering={FadeInUp.delay(150).springify().stiffness(100).damping(15)}>
          <StatCard
            icon="account-group"
            value={totalContacts}
            label="Contacts"
            color={COLORS.primaryLight}
          />
          <StatCard
            icon="content-copy"
            value={pendingDuplicates}
            label="Duplicates"
            color={pendingDuplicates > 0 ? COLORS.error : COLORS.primaryLight}
            onPress={() => router.push('/(tabs)/duplicates')}
            needsAttention={pendingDuplicates > 0}
          />
          <StatCard
            icon="alert-circle-outline"
            value={expiredTemps}
            label="Incomplete"
            color={expiredTemps > 0 ? COLORS.warning : COLORS.primaryLight}
            onPress={() => router.push('/(tabs)/cleanup')}
            needsAttention={expiredTemps > 0}
          />
        </Animated.View>

        {/* Quick Filters / Tags */}
        <Animated.View entering={FadeInUp.delay(180).springify().stiffness(100).damping(15)} style={{ marginBottom: SPACING.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Quick Filters</Text>
            <TouchableOpacity onPress={() => setIsGroupsModalVisible(true)}>
              <Text style={{ color: '#06b6d4', fontSize: FONT_SIZE.xs, fontWeight: '600' }}>Manage Tags</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.sm, paddingRight: SPACING.md }}>
            <TouchableOpacity style={[styles.glassCard, { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }]}>
              <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>All Contacts</Text>
            </TouchableOpacity>
            {groups.map(group => (
              <TouchableOpacity key={group.id} style={[styles.glassCard, { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: group.color + '1A', borderColor: group.color + '33' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: group.color, shadowColor: group.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }} />
                  <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>{group.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {pendingDuplicates > 0 && (
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(100).damping(15)}>
            <PulseCard style={styles.duplicateCta} onPress={() => router.push('/(tabs)/duplicates')} color={COLORS.error}>
              <Card.Content style={styles.duplicateCtaContent}>
                <View style={styles.duplicateCtaLeft}>
                  <MaterialCommunityIcons name="cards-outline" size={28} color={COLORS.error} />
                  <View>
                    <Text style={[styles.duplicateCtaTitle, { color: COLORS.error }]}>
                      {pendingDuplicates} duplicate{pendingDuplicates !== 1 ? 's' : ''} to review
                    </Text>
                    <Text style={styles.duplicateCtaHint}>
                      Tap to review each pair as a flashcard
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </Card.Content>
            </PulseCard>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(250).springify().stiffness(100).damping(15)}>
          <GlassCard style={styles.healthCard}>
            <Card.Content style={styles.healthContent}>
              <View style={styles.healthLeft}>
                <MaterialCommunityIcons name="heart-pulse" size={28} color={COLORS.success} />
                <View>
                  <Text style={styles.healthLabel}>Library Health</Text>
                  <Text style={[styles.healthValue, { color: COLORS.success }]}>{Math.round(averageHealth)}%</Text>
                </View>
              </View>
              <View style={styles.healthBar}>
                <View style={[styles.healthProgress, { width: `${averageHealth}%`, backgroundColor: COLORS.success }]} />
              </View>
            </Card.Content>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).springify().stiffness(100).damping(15)}>
          <GlassCard style={styles.card}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs }}>
                <MaterialCommunityIcons name="chart-timeline-variant" size={20} color={COLORS.primaryLight} style={{ marginRight: SPACING.sm }} />
                <Text style={styles.cardTitle}>Weekly Network Health</Text>
              </View>
              {latestSnapshot && previousSnapshot ? (
                <View style={{ gap: SPACING.xs, marginTop: SPACING.sm }}>
                  <TrendRow label="Overdue follow-ups" current={latestSnapshot.overdueFollowUps} previous={previousSnapshot.overdueFollowUps} invertColors={true} />
                  <TrendRow label="Stale important contacts" current={latestSnapshot.staleContacts} previous={previousSnapshot.staleContacts} invertColors={true} />
                  <TrendRow label="Active relationships" current={latestSnapshot.activeRelationships} previous={previousSnapshot.activeRelationships} invertColors={false} />
                </View>
              ) : (
                <Text style={[styles.syncHelper, { marginTop: SPACING.sm }]}>Tracking network trends... Check back in a few days.</Text>
              )}
            </Card.Content>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(350).springify().stiffness(100).damping(15)}>
          <GlassCard style={styles.card}>
            <Card.Title
              title="Sync status"
              titleStyle={styles.cardTitle}
              right={() => (
                <Chip style={[styles.statusChip, { backgroundColor: syncBadge.tone + '22', borderColor: syncBadge.tone + '55', borderWidth: 1 }]} textStyle={{ color: syncBadge.tone }}>
                  {syncBadge.label}
                </Chip>
              )}
            />
            <Card.Content>
              <Text style={styles.syncTime}>{sync.lastSyncAt ? isoToDisplay(sync.lastSyncAt) : 'Never synced'}</Text>
              <Text style={styles.syncMeta}>Device: {sync.totalNativeContacts} • Local: {sync.totalLocalContacts}</Text>
              <Text style={styles.syncHelper}>{syncBadge.helper}</Text>
              {sync.status === 'error' && <Text style={styles.errorText}>{sync.errorMessage}</Text>}
              {isSyncing && syncProgress && (
                <View style={styles.progressRow}>
                  <ActivityIndicator size="small" color={COLORS.primaryLight} />
                  <Text style={styles.progressText}>{syncProgress.processed} / {syncProgress.total}</Text>
                </View>
              )}
              {isSyncing && syncProgress && <ProgressBar progress={progressValue} color={COLORS.primaryLight} style={styles.progressBar} />}
            </Card.Content>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify().stiffness(100).damping(15)}>
          <GlassCard style={styles.card}>
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
                disabled={isSyncing || isScanning || isWritingBack}
                icon="magnify"
                textColor={COLORS.primaryLight}
                containerStyle={styles.actionBtn}
                style={{ borderColor: COLORS.border }}
              >
                Scan duplicates
              </QuickActionButton>
              <QuickActionButton
                mode="contained"
                onPress={handleWriteBack}
                loading={isWritingBack}
                disabled={isSyncing || isScanning || isWritingBack}
                icon="cellphone-arrow-down"
                buttonColor={COLORS.secondary}
                containerStyle={styles.actionBtn}
              >
                Write Back to Phone
              </QuickActionButton>
            </Card.Content>
          </GlassCard>
        </Animated.View>

      </ScrollView>

      <ManageGroupsModal
        visible={isGroupsModalVisible}
        onClose={() => setIsGroupsModalVisible(false)}
        onGroupsUpdated={refreshStats}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function GlassCard({ children, style, onPress }: any) {
  const CardComponent = onPress ? Card : Card;
  return (
    <CardComponent style={[styles.glassCard, style]} onPress={onPress}>
      {children}
    </CardComponent>
  );
}

function PulseCard({ children, style, onPress, color }: any) {
  const shadowOpacity = useSharedValue(0.1);
  const shadowRadius = useSharedValue(4);

  useEffect(() => {
    shadowOpacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 1500 }), withTiming(0.1, { duration: 1500 })),
      -1,
      true
    );
    shadowRadius.value = withRepeat(
      withSequence(withTiming(20, { duration: 1500 }), withTiming(4, { duration: 1500 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
    shadowRadius: shadowRadius.value,
  }));

  return (
    <Animated.View style={[{ shadowColor: color, elevation: 4 }, animatedStyle]}>
      <Card style={[styles.glassCard, style, { borderColor: color + '55', borderWidth: 1 }]} onPress={onPress}>
        {children}
      </Card>
    </Animated.View>
  );
}

function StatCard({ icon, value, label, color, onPress, needsAttention }: { icon: string; value: number; label: string; color: string; onPress?: () => void; needsAttention?: boolean }) {
  if (needsAttention) {
    return (
      <PulseCard style={styles.statCard} onPress={onPress} color={color}>
        <Card.Content style={styles.statContent}>
          <MaterialCommunityIcons name={icon as any} color={color} size={28} />
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </Card.Content>
      </PulseCard>
    );
  }
  return (
    <GlassCard style={styles.statCard} onPress={onPress}>
      <Card.Content style={styles.statContent}>
        <MaterialCommunityIcons name={icon as any} color={color} size={28} />
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Card.Content>
    </GlassCard>
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
    return { label: 'Syncing', helper: 'Refreshing your local mirror.', tone: COLORS.info };
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
  return { label: 'Up to date', helper: 'Local mirror is current.', tone: COLORS.success };
}

function buildRepairSummary(result: SyncResult): string {
  if (!result.repairs || result.repairs.groups === 0) return '';
  return ` Repaired ${result.repairs.mergedContacts} duplicates across ${result.repairs.groups} groups.`;
}

function buildSyncCountSummary(result: SyncResult): string {
  return `Added: ${result.added} • Updated: ${result.updated} • Removed: ${result.removed}`;
}

type QuickActionButtonProps = ComponentProps<typeof Button> & {
  containerStyle?: object;
};

function QuickActionButton({ containerStyle, ...props }: QuickActionButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Button
        {...props}
        onPressIn={(e) => { scale.value = withTiming(0.98, { duration: 100 }); props.onPressIn?.(e); }}
        onPressOut={(e) => { scale.value = withTiming(1, { duration: 100 }); props.onPressOut?.(e); }}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { marginBottom: SPACING.lg },
  appName: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 4 },
  
  glassCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
  },

  warningCard: { backgroundColor: 'rgba(245, 158, 11, 0.1)', marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  warningContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  warningText: { color: COLORS.warning, fontSize: FONT_SIZE.sm, flex: 1 },
  
  statsRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  statCard: { flex: 1, borderRadius: 16 },
  statContent: { alignItems: 'center', paddingVertical: SPACING.md },
  statValue: { fontSize: FONT_SIZE.xxl, fontWeight: '800', marginTop: 4 },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  
  card: { marginBottom: SPACING.md },
  cardTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  statusChip: { alignSelf: 'center', borderRadius: RADIUS.full },
  syncTime: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  syncMeta: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 4 },
  syncHelper: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, marginTop: 8 },
  errorText: { color: COLORS.error, fontSize: FONT_SIZE.sm, marginTop: 8 },
  
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 12 },
  progressText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  progressBar: { marginTop: SPACING.sm, height: 4, borderRadius: 4, backgroundColor: COLORS.surfaceElevated },
  
  actionsContent: { gap: SPACING.sm },
  actionBtn: { marginBottom: 0, borderRadius: RADIUS.lg },
  
  healthCard: { marginBottom: SPACING.md },
  healthContent: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  healthLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  healthLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  healthValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginTop: 2 },
  healthBar: { height: 6, backgroundColor: COLORS.surfaceElevated, borderRadius: 3, overflow: 'hidden', flex: 1, minWidth: 60 },
  healthProgress: { height: 6, borderRadius: 3 },

  duplicateCta: { marginBottom: SPACING.md },
  duplicateCtaContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duplicateCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  duplicateCtaTitle: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  duplicateCtaHint: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
});
