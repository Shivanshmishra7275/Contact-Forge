/**
 * ContactForge — Flashcard Duplicate Review Screen
 *
 * Gesture-first, Reanimated-powered duplicate review.
 * Swipe right → Same Person (merge preview)
 * Swipe left  → Not a Match (dismiss)
 * Swipe down  → Review Later (move to end of queue)
 * Buttons also available for accessibility.
 *
 * Motion: worklet-driven, 60fps, threshold-based accept/reject.
 */

import { memo, useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  InteractionManager,
  ScrollView,
} from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

// Swipe thresholds
const SWIPE_THRESHOLD = 90;
const SWIPE_DOWN_THRESHOLD = 80;
const MAX_ROTATION = 12;
const CARD_EXIT_X = 460;
const CARD_EXIT_Y = 200;

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  very_high: { label: 'Very likely duplicate', color: COLORS.success },
  high: { label: 'Likely duplicate', color: COLORS.secondary },
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
// Swipeable Card
// ---------------------------------------------------------------------------

interface SwipeableCardProps {
  pair: DuplicatePair;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: () => void;
}

function SwipeableCard({ pair, onSwipeLeft, onSwipeRight, onSwipeDown }: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isAnimatingOut = useSharedValue(false);

  const exitCard = useCallback(
    (direction: 'left' | 'right' | 'down', callback: () => void) => {
      isAnimatingOut.value = true;
      const toX = direction === 'left' ? -CARD_EXIT_X : direction === 'right' ? CARD_EXIT_X : 0;
      const toY = direction === 'down' ? CARD_EXIT_Y : 0;
      translateX.value = withTiming(toX, { duration: 260 }, () => runOnJS(callback)());
      translateY.value = withTiming(toY, { duration: 260 });
    },
    [translateX, translateY, isAnimatingOut],
  );

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (isAnimatingOut.value) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (isAnimatingOut.value) return;
      const vx = e.velocityX;
      const vy = e.velocityY;

      // Swipe down: dismiss to later
      if (e.translationY > SWIPE_DOWN_THRESHOLD && Math.abs(e.translationX) < 80) {
        runOnJS(exitCard)('down', onSwipeDown);
        return;
      }

      // Swipe right: same person
      if (e.translationX > SWIPE_THRESHOLD || vx > 600) {
        runOnJS(exitCard)('right', onSwipeRight);
        return;
      }

      // Swipe left: not a match
      if (e.translationX < -SWIPE_THRESHOLD || vx < -600) {
        runOnJS(exitCard)('left', onSwipeLeft);
        return;
      }

      // Spring back
      translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-200, 0, 200],
      [-MAX_ROTATION, 0, MAX_ROTATION],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      Math.abs(translateX.value) + Math.abs(translateY.value),
      [0, 200],
      [1, 0.96],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  // Green overlay when swiping right
  const rightOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  // Red overlay when swiping left
  const leftOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-20, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  // Down overlay when swiping down
  const downOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [20, SWIPE_DOWN_THRESHOLD], [0, 0.85], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.cardWrapper, cardStyle]} entering={FadeIn.duration(220).springify()}>
        {/* Directional hint overlays */}
        <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayRight, rightOverlayStyle]}>
          <MaterialCommunityIcons name="merge" size={36} color={COLORS.success} />
          <Text style={[styles.overlayLabel, { color: COLORS.success }]}>Same Person</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayLeft, leftOverlayStyle]}>
          <MaterialCommunityIcons name="close-circle" size={36} color={COLORS.error} />
          <Text style={[styles.overlayLabel, { color: COLORS.error }]}>Not a Match</Text>
        </Animated.View>
        <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayDown, downOverlayStyle]}>
          <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.warning} />
          <Text style={[styles.overlayLabel, { color: COLORS.warning }]}>Review Later</Text>
        </Animated.View>

        <FlashCard pair={pair} />
      </Animated.View>
    </GestureDetector>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DuplicateFlashcardsScreen() {
  const [queue, setQueue] = useState<DuplicatePair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);
  // Key changes force React to remount SwipeableCard, resetting gesture state
  const [cardKey, setCardKey] = useState(0);

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

  const advanceCard = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setCardKey((k) => k + 1);
  }, []);

  const handleNotAMatch = useCallback(() => {
    const pair = queue[currentIndex];
    if (!pair) return;
    resolveDuplicateCandidate(pair.candidate.id, 'ignored');
    setUndoStack((s) => [...s, { candidateId: pair.candidate.id, action: 'ignored' }]);
    advanceCard();
  }, [queue, currentIndex, advanceCard]);

  const handleReviewLater = useCallback(() => {
    setQueue((q) => {
      const next = [...q];
      const [removed] = next.splice(currentIndex, 1);
      next.push(removed);
      return next;
    });
    setCardKey((k) => k + 1);
  }, [currentIndex]);

  const handleSamePerson = useCallback(() => {
    const pair = queue[currentIndex];
    if (!pair) return;
    router.push(`/merge/${pair.candidate.id}`);
  }, [queue, currentIndex]);

  const handleUndo = useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    setUndoStack((s) => s.slice(0, -1));
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
  const progress = currentIndex / Math.max(queue.length, 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.queueText}>
            {currentIndex + 1} / {queue.length}
          </Text>
          <Text style={styles.gestureHint}>← Swipe to review →</Text>
        </View>
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
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      {/* Card — remounted on each action to reset gesture state cleanly */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <SwipeableCard
          key={cardKey}
          pair={current}
          onSwipeLeft={handleNotAMatch}
          onSwipeRight={handleSamePerson}
          onSwipeDown={handleReviewLater}
        />
      </ScrollView>

      {/* Action bar — always visible, mirrors swipe actions */}
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
          <Text style={[styles.contactPhone]} numberOfLines={1}>
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
  gestureHint: { fontSize: FONT_SIZE.xs, color: COLORS.textDisabled, marginTop: 1 },
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
  // Wrapper that the gesture hits
  cardWrapper: {
    position: 'relative',
  },
  // Directional overlay hints shown while dragging
  swipeOverlay: {
    position: 'absolute',
    top: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    pointerEvents: 'none',
  },
  swipeOverlayRight: {
    left: 16,
    backgroundColor: COLORS.success + '18',
    borderColor: COLORS.success + '55',
  },
  swipeOverlayLeft: {
    right: 16,
    backgroundColor: COLORS.error + '18',
    borderColor: COLORS.error + '55',
  },
  swipeOverlayDown: {
    alignSelf: 'center',
    left: '25%',
    top: 60,
    backgroundColor: COLORS.warning + '18',
    borderColor: COLORS.warning + '55',
  },
  overlayLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  flashCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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
    gap: 6,
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
    lineHeight: 22,
  },
  contactMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 17 },
  contactPhone: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  dataRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
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
