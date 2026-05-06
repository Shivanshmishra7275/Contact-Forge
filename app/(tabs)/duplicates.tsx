/**
 * ContactForge — Duplicates Queue Screen
 *
 * Shows pending duplicate candidate pairs.
 * Each card shows both contacts, the confidence score, and the reason list.
 * Actions: Merge, Ignore, Mark Safe.
 */

import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getPendingDuplicates,
  resolveDuplicateCandidate,
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

  useEffect(() => {
    loadDuplicates();
  }, []);

  const handleIgnore = useCallback(
    (candidate: DuplicateCandidate) => {
      resolveDuplicateCandidate(candidate.id, 'ignored');
      loadDuplicates();
    },
    [loadDuplicates],
  );

  const handleMarkSafe = useCallback(
    (candidate: DuplicateCandidate) => {
      resolveDuplicateCandidate(candidate.id, 'safe');
      loadDuplicates();
    },
    [loadDuplicates],
  );

  const handleMerge = useCallback(
    (pair: DuplicatePair) => {
      router.push(`/merge/${pair.candidate.id}`);
    },
    [],
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
        <Text style={styles.headerText}>{pairs.length} pending</Text>
      </View>
      <FlatList
        data={pairs}
        keyExtractor={(item) => String(item.candidate.id)}
        renderItem={({ item }) => (
          <DuplicateCard
            pair={item}
            onMerge={() => handleMerge(item)}
            onIgnore={() => handleIgnore(item.candidate)}
            onMarkSafe={() => handleMarkSafe(item.candidate)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

interface DuplicateCardProps {
  pair: DuplicatePair;
  onMerge: () => void;
  onIgnore: () => void;
  onMarkSafe: () => void;
}

function DuplicateCard({ pair, onMerge, onIgnore, onMarkSafe }: DuplicateCardProps) {
  const { candidate, contactA, contactB } = pair;
  const color = CONFIDENCE_COLORS[candidate.confidence] ?? COLORS.textSecondary;
  const reasons = candidate.reasons;

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Confidence badge */}
        <View style={styles.badgeRow}>
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
}

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
  listContent: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surface },
  badgeRow: { marginBottom: SPACING.sm },
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
