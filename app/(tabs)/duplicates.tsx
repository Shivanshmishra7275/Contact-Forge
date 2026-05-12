/**
 * ContactForge — Duplicates Queue Screen
 *
 * Shows pending duplicate candidate pairs.
 * Each card shows both contacts, the confidence score, and the reason list.
 * Actions: Merge, Ignore, Mark Safe.
 */

import { memo, useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, InteractionManager } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPendingDuplicates,
  resolveDuplicateCandidate,
  resolveDuplicateCandidatesBulk,
} from '../../src/db/repositories/duplicateRepository';
import { getContactById } from '../../src/db/repositories/contactRepository';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE } from '../../src/constants';
import type { DuplicateCandidate, LocalContact } from '../../src/types';

interface DuplicatePair {
  candidate: DuplicateCandidate;
  contactA: LocalContact | null;
  contactB: LocalContact | null;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  very_high: COLORS.error,
  high: '#e07040',
  medium: COLORS.warning,
  low: COLORS.textSecondary,
};

export default function DuplicatesScreen() {
  const [pairs, setPairs] = useState<DuplicatePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);

  const loadDuplicates = useCallback(() => {
    setIsLoading(true);
    const candidates = getPendingDuplicates();
    const loaded: DuplicatePair[] = candidates.map((c) => ({
      candidate: c,
      contactA: getContactById(c.contactIdA),
      contactB: getContactById(c.contactIdB),
    }));
    setPairs(loaded);
    setPendingDuplicateCount(loaded.length);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadDuplicates();
      });

      return () => task.cancel();
    }, [loadDuplicates]),
  );

  const clearSelection = useCallback(() => {
    setSelectedCandidateIds([]);
    setSelectionMode(false);
  }, []);

  const toggleCandidateSelection = useCallback((candidateId: number) => {
    setSelectedCandidateIds((current) => {
      if (current.includes(candidateId)) {
        return current.filter((id) => id !== candidateId);
      }
      return [...current, candidateId];
    });
  }, []);

  const handleBulkResolve = useCallback(
    (status: 'ignored' | 'safe') => {
      if (selectedCandidateIds.length === 0) return;
      Alert.alert(
        status === 'safe' ? 'Mark selected as safe?' : 'Ignore selected duplicates?',
        `Apply this action to ${selectedCandidateIds.length} selected duplicate candidates?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply',
            onPress: () => {
              resolveDuplicateCandidatesBulk(selectedCandidateIds, status);
              clearSelection();
              loadDuplicates();
            },
          },
        ],
      );
    },
    [clearSelection, loadDuplicates, selectedCandidateIds],
  );

  const handleIgnore = useCallback(
    (candidate: DuplicateCandidate) => {
      resolveDuplicateCandidate(candidate.id, 'ignored');
      clearSelection();
      loadDuplicates();
    },
    [clearSelection, loadDuplicates],
  );

  const handleMarkSafe = useCallback(
    (candidate: DuplicateCandidate) => {
      resolveDuplicateCandidate(candidate.id, 'safe');
      clearSelection();
      loadDuplicates();
    },
    [clearSelection, loadDuplicates],
  );

  const handleMerge = useCallback(
    (pair: DuplicatePair) => {
      router.push(`/merge/${pair.candidate.id}`);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: DuplicatePair }) => (
      <DuplicateCard
        pair={item}
        selectionMode={selectionMode}
        selected={selectedCandidateIds.includes(item.candidate.id)}
        onToggleSelect={() => toggleCandidateSelection(item.candidate.id)}
        onMerge={() => handleMerge(item)}
        onIgnore={() => handleIgnore(item.candidate)}
        onMarkSafe={() => handleMarkSafe(item.candidate)}
      />
    ),
    [handleIgnore, handleMarkSafe, handleMerge, selectedCandidateIds, selectionMode, toggleCandidateSelection],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (pairs.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="check-circle" size={56} color={COLORS.success} />
        <Text style={styles.emptyTitle}>No duplicates found</Text>
        <Text style={styles.emptySubtitle}>
          Run a duplicate scan from the dashboard to detect potential duplicates.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>{pairs.length} pending</Text>
          {selectionMode && <Text style={styles.selectionText}>{selectedCandidateIds.length} selected</Text>}
        </View>
        <View style={styles.headerActions}>
          {selectedCandidateIds.length > 0 && (
            <Button mode="text" onPress={clearSelection} textColor={COLORS.textSecondary} compact>
              Clear
            </Button>
          )}
          <Button
            mode={selectionMode ? 'contained' : 'outlined'}
            onPress={() => {
              if (selectionMode) {
                clearSelection();
              } else {
                setSelectionMode(true);
              }
            }}
            buttonColor={selectionMode ? COLORS.primary : undefined}
            textColor={selectionMode ? COLORS.textPrimary : COLORS.primary}
            compact
          >
            {selectionMode ? 'Done' : 'Select'}
          </Button>
        </View>
      </View>
      {selectionMode && selectedCandidateIds.length > 0 && (
        <Card style={styles.bulkCard}>
          <Card.Content style={styles.bulkActions}>
            <Button mode="contained" buttonColor={COLORS.primary} onPress={() => handleBulkResolve('safe')}>
              Mark Safe Selected
            </Button>
            <Button mode="outlined" textColor={COLORS.textSecondary} onPress={() => handleBulkResolve('ignored')}>
              Ignore Selected
            </Button>
          </Card.Content>
        </Card>
      )}
      <FlatList
        data={pairs}
        keyExtractor={(item) => String(item.candidate.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

interface DuplicateCardProps {
  pair: DuplicatePair;
  selected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
  onMerge: () => void;
  onIgnore: () => void;
  onMarkSafe: () => void;
}

const DuplicateCard = memo(function DuplicateCard({
  pair,
  selected,
  selectionMode,
  onToggleSelect,
  onMerge,
  onIgnore,
  onMarkSafe,
}: DuplicateCardProps) {
  const { candidate, contactA, contactB } = pair;
  const color = CONFIDENCE_COLORS[candidate.confidence] ?? COLORS.textSecondary;
  const reasons = candidate.reasons;

  return (
    <Card style={[styles.card, selected && styles.cardSelected]}>
      <Card.Content>
        {/* Confidence badge */}
        <View style={styles.badgeRow}>
          {selectionMode && (
            <IconButton
              icon={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              onPress={onToggleSelect}
              iconColor={selected ? COLORS.primary : COLORS.textSecondary}
              style={styles.selectIcon}
            />
          )}
          <Chip
            style={[styles.badge, { backgroundColor: color + '33' }]}
            textStyle={{ color, fontSize: FONT_SIZE.xs }}
          >
            {candidate.confidence.replace('_', ' ')} · {candidate.score}%
          </Chip>
        </View>

        {/* Contact names */}
        <View style={styles.namesRow}>
          <ContactNameBlock contact={contactA} label="Contact A" />
          <MaterialCommunityIcons name="equal" color={COLORS.textSecondary} size={20} />
          <ContactNameBlock contact={contactB} label="Contact B" />
        </View>

        {/* Reasons */}
        <View style={styles.reasonsRow}>
          {reasons.map((r) => (
            <Chip
              key={r}
              style={styles.reasonChip}
              textStyle={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.xs }}
            >
              {r.replace(/_/g, ' ')}
            </Chip>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            mode="contained"
            onPress={onMerge}
            compact
            buttonColor={COLORS.primary}
            style={styles.actionBtn}
          >
            Review & Merge
          </Button>
          <Button
            mode="outlined"
            onPress={onIgnore}
            compact
            textColor={COLORS.textSecondary}
            style={styles.actionBtn}
          >
            Ignore
          </Button>
          <Button
            mode="text"
            onPress={onMarkSafe}
            compact
            textColor={COLORS.success}
          >
            Mark Safe
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
});

function ContactNameBlock({
  contact,
  label,
}: {
  contact: LocalContact | null;
  label: string;
}) {
  return (
    <View style={styles.nameBlock}>
      <Text style={styles.nameLabel}>{label}</Text>
      <Text style={styles.nameText} numberOfLines={2}>
        {contact?.displayName ?? '(Deleted)'}
      </Text>
      {contact?.company && (
        <Text style={styles.companyText} numberOfLines={1}>
          {contact.company}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md, backgroundColor: COLORS.background },
  header: { padding: SPACING.md, paddingBottom: SPACING.xs },
  headerText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  selectionText: { color: COLORS.primary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  bulkCard: { marginHorizontal: SPACING.md, marginBottom: SPACING.sm, backgroundColor: COLORS.surfaceVariant },
  bulkActions: { flexDirection: 'row', gap: SPACING.sm, justifyContent: 'space-between' },
  listContent: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surface },
  cardSelected: { borderColor: COLORS.primary, borderWidth: 1 },
  badgeRow: { marginBottom: SPACING.sm },
  selectIcon: { margin: 0, marginRight: SPACING.xs },
  badge: { alignSelf: 'flex-start' },
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  nameBlock: { flex: 1 },
  nameLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textDisabled, marginBottom: 2 },
  nameText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  companyText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: SPACING.sm },
  reasonChip: { backgroundColor: COLORS.surfaceVariant, height: 26 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  actionBtn: {},
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 280 },
});
