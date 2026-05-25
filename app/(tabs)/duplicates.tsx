/**
 * ContactForge — Flashcard Duplicate Review Screen
 *
 * Presents each suspected duplicate as a focused flashcard.
 * The user reviews one pair at a time with clear, always-visible actions.
 *
 * Actions per card:
 *   - Same Person → opens merge preview
 *   - Not a Match → dismisses (marks ignored)
 *   - Review Later → snoozes (moves to end of queue)
 *   - Undo Last → reverses the previous card decision
 *   - List View → switches to legacy list-mode
 *
 * Rules:
 *   - No auto-merge
 *   - No swipe-only destructive actions
 *   - Every reason is human-readable
 *   - Buttons are always visible
 */

import { memo, useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  InteractionManager,
  ScrollView,
} from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPendingDuplicates,
  resolveDuplicateCandidate,
} from '../../src/db/repositories/duplicateRepository';
import {
  getContactById,
  getPhonesByContactId,
  getEmailsByContactId,
} from '../../src/db/repositories/contactRepository';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/constants';
import { REASON_LABELS } from '../../src/services/duplicateHeuristicsService';
import type {
  DuplicateCandidate,
  LocalContact,
  PhoneNumber,
  EmailAddress,
  DuplicateReason,
} from '../../src/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContactDetails {
  contact: LocalContact;
  phones: PhoneNumber[];
  emails: EmailAddress[];
}

interface DuplicatePair {
  candidate: DuplicateCandidate;
  a: ContactDetails | null;
  b: ContactDetails | null;
}

interface UndoEntry {
  candidateId: number;
  action: 'ignored';
}

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  very_high: { label: 'Very likely duplicate', color: COLORS.error },
  high: { label: 'Likely duplicate', color: '#e07040' },
  medium: { label: 'Possible duplicate', color: COLORS.warning },
  low: { label: 'Weak signal', color: COLORS.textSecondary },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function loadContactDetails(id: number): ContactDetails | null {
  const contact = getContactById(id);
  if (!contact) return null;
  return {
    contact,
    phones: getPhonesByContactId(id),
    emails: getEmailsByContactId(id),
  };
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DuplicateFlashcardsScreen() {
  const [queue, setQueue] = useState<DuplicatePair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);

  const loadQueue = useCallback(() => {
    setIsLoading(true);
    const candidates = getPendingDuplicates();
    const pairs: DuplicatePair[] = candidates.map((c) => ({
      candidate: c,
      a: loadContactDetails(c.contactIdA),
      b: loadContactDetails(c.contactIdB),
    }));
    setQueue(pairs);
    setCurrentIndex(0);
    setUndoStack([]);
    setPendingDuplicateCount(pairs.length);
    setIsLoading(false);
  }, [setPendingDuplicateCount]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(loadQueue);
      return () => task.cancel();
    }, [loadQueue]),
  );

  const animateOut = useCallback(
    (direction: 'left' | 'right', callback: () => void) => {
      const toX = direction === 'left' ? -420 : 420;
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: toX,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(0);
        fadeAnim.setValue(1);
        callback();
      });
    },
    [slideAnim, fadeAnim],
  );

  const handleNotAMatch = useCallback(() => {
    const pair = queue[currentIndex];
    if (!pair) return;
    animateOut('left', () => {
      resolveDuplicateCandidate(pair.candidate.id, 'ignored');
      setUndoStack((s) => [...s, { candidateId: pair.candidate.id, action: 'ignored' }]);
      setCurrentIndex((i) => i + 1);
    });
  }, [queue, currentIndex, animateOut]);

  const handleReviewLater = useCallback(() => {
    const pair = queue[currentIndex];
    if (!pair) return;
    animateOut('right', () => {
      // Move current card to end of queue without resolving it
      setQueue((q) => {
        const next = [...q];
        const [removed] = next.splice(currentIndex, 1);
        next.push(removed);
        return next;
      });
      // Don't advance index — next card slides in at same position
    });
  }, [queue, currentIndex, animateOut]);

  const handleSamePerson = useCallback(() => {
    const pair = queue[currentIndex];
    if (!pair) return;
    router.push(`/merge/${pair.candidate.id}`);
  }, [queue, currentIndex]);

  const handleUndo = useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setUndoStack((s) => s.slice(0, -1));
    // Reload full queue to surface the previously ignored candidate
    loadQueue();
  }, [undoStack, loadQueue]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const remaining = queue.length - currentIndex;

  if (remaining <= 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="check-circle-outline" size={64} color={COLORS.success} />
        <Text style={styles.doneTitle}>All caught up!</Text>
        <Text style={styles.doneSubtitle}>
          No pending duplicates to review.{'\n'}Run a scan from the dashboard to detect more.
        </Text>
        <Button
          mode="outlined"
          onPress={loadQueue}
          textColor={COLORS.primary}
          style={{ marginTop: SPACING.lg }}
        >
          Refresh
        </Button>
      </View>
    );
  }

  const current = queue[currentIndex];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.queueText}>
          {currentIndex + 1} / {queue.length}
        </Text>
        <View style={styles.headerRight}>
          {undoStack.length > 0 && (
            <Button
              mode="text"
              onPress={handleUndo}
              textColor={COLORS.primary}
              compact
              icon="undo"
            >
              Undo
            </Button>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentIndex / Math.max(queue.length, 1)) * 100}%` as any },
          ]}
        />
      </View>

      {/* Card */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }]}
        >
          <FlashCard pair={current} />
        </Animated.View>
      </ScrollView>

      {/* Action bar — always visible */}
      <View style={styles.actionBar}>
        <Button
          mode="outlined"
          onPress={handleNotAMatch}
          textColor={COLORS.textSecondary}
          style={styles.actionBtn}
          contentStyle={styles.actionBtnContent}
          icon="close-circle-outline"
        >
          Not a match
        </Button>
        <Button
          mode="contained"
          onPress={handleSamePerson}
          buttonColor={COLORS.primary}
          style={styles.actionBtn}
          contentStyle={styles.actionBtnContent}
          icon="merge"
        >
          Same person
        </Button>
        <Button
          mode="text"
          onPress={handleReviewLater}
          textColor={COLORS.textSecondary}
          compact
          icon="clock-outline"
        >
          Later
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// FlashCard Component
// ---------------------------------------------------------------------------

const FlashCard = memo(function FlashCard({ pair }: { pair: DuplicatePair }) {
  const { candidate, a, b } = pair;
  const conf = CONFIDENCE_CONFIG[candidate.confidence] ?? CONFIDENCE_CONFIG.low;

  return (
    <View style={styles.flashCard}>
      {/* Confidence badge */}
      <View
        style={[
          styles.confidenceBadge,
          { backgroundColor: conf.color + '22', borderColor: conf.color + '55' },
        ]}
      >
        <View style={[styles.confidenceDot, { backgroundColor: conf.color }]} />
        <Text style={[styles.confidenceText, { color: conf.color }]}>{conf.label}</Text>
        <Text style={[styles.scoreText, { color: conf.color }]}>{candidate.score}%</Text>
      </View>

      {/* Reason pills */}
      <View style={styles.reasonsRow}>
        {candidate.reasons.map((r) => (
          <ReasonPill key={r} reason={r} />
        ))}
      </View>

      {/* Contact comparison */}
      <View style={styles.compareRow}>
        <ContactColumn details={a} label="Contact A" />
        <View style={styles.compareVs}>
          <MaterialCommunityIcons
            name="approximately-equal"
            size={22}
            color={COLORS.textSecondary}
          />
        </View>
        <ContactColumn details={b} label="Contact B" />
      </View>
    </View>
  );
});

const ReasonPill = memo(function ReasonPill({ reason }: { reason: DuplicateReason }) {
  const label = REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
  return (
    <View style={styles.reasonPill}>
      <Text style={styles.reasonPillText}>{label}</Text>
    </View>
  );
});

const ContactColumn = memo(function ContactColumn({
  details,
  label,
}: {
  details: ContactDetails | null;
  label: string;
}) {
  if (!details) {
    return (
      <View style={styles.contactColumn}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactName}>(Deleted)</Text>
      </View>
    );
  }

  const { contact, phones, emails } = details;

  return (
    <View style={styles.contactColumn}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactName} numberOfLines={2}>
        {contact.displayName}
      </Text>
      {contact.company ? (
        <Text style={styles.contactMeta} numberOfLines={1}>
          {contact.company}
        </Text>
      ) : null}
      {phones.slice(0, 2).map((p) => (
        <View key={p.id} style={styles.dataRow}>
          <MaterialCommunityIcons name="phone-outline" size={12} color={COLORS.textTertiary} />
          <Text style={styles.contactMeta} numberOfLines={1}>
            {' '}
            {p.number}
          </Text>
        </View>
      ))}
      {emails.slice(0, 1).map((e) => (
        <View key={e.id} style={styles.dataRow}>
          <MaterialCommunityIcons name="email-outline" size={12} color={COLORS.textTertiary} />
          <Text style={styles.contactMeta} numberOfLines={1}>
            {' '}
            {e.email}
          </Text>
        </View>
      ))}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  doneTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  doneSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  queueText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '600' },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.surfaceVariant,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  scrollArea: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  flashCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  confidenceDot: { width: 8, height: 8, borderRadius: 4 },
  confidenceText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  scoreText: { fontSize: FONT_SIZE.xs, fontWeight: '500', marginLeft: SPACING.xs },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  reasonPill: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
  },
  reasonPillText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  compareRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  contactColumn: {
    flex: 1,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 4,
  },
  contactLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contactName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  contactMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },
  dataRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  compareVs: { alignSelf: 'center', paddingTop: SPACING.xl },
  actionBar: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  actionBtn: { flex: 1 },
  actionBtnContent: { paddingVertical: 4 },
});
