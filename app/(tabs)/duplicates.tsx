/**
 * ContactForge — Flashcard Duplicate Review Screen
 *
 * Gesture-first, Reanimated-powered duplicate review with 3D stacking.
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react';
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
import * as Haptics from 'expo-haptics';
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
import { AuroraBackground } from '../../src/components/AuroraBackground';
import type {
  DuplicateCandidate,
  LocalContact,
  PhoneNumber,
  EmailAddress,
  DuplicateReason,
} from '../../src/types';

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

const SWIPE_THRESHOLD = 90;
const SWIPE_DOWN_THRESHOLD = 80;
const MAX_ROTATION = 10;
const CARD_EXIT_X = 460;
const CARD_EXIT_Y = 300;

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  very_high: { label: 'Very likely duplicate', color: COLORS.success },
  high: { label: 'Likely duplicate', color: COLORS.secondary },
  medium: { label: 'Possible duplicate', color: COLORS.warning },
  low: { label: 'Weak signal', color: COLORS.textSecondary },
};

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
// Text Diff Helper
// ---------------------------------------------------------------------------

function DiffText({ a, b, isSideA }: { a: string; b: string; isSideA: boolean }) {
  if (a === b) {
    return <Text style={styles.diffSame}>{isSideA ? a : b}</Text>;
  }
  
  const text = isSideA ? a : b;
  const other = isSideA ? b : a;

  let start = 0;
  while (start < text.length && start < other.length && text[start] === other[start]) {
    start++;
  }

  let endT = text.length - 1;
  let endO = other.length - 1;
  while (endT >= start && endO >= start && text[endT] === other[endO]) {
    endT--;
    endO--;
  }

  const prefix = text.slice(0, start);
  const diff = text.slice(start, endT + 1);
  const suffix = text.slice(endT + 1);

  return (
    <Text style={styles.diffSame}>
      {prefix}
      {diff.length > 0 && <Text style={styles.diffDifferent}>{diff}</Text>}
      {suffix}
    </Text>
  );
}


// ---------------------------------------------------------------------------
// Swipeable Card Stack
// ---------------------------------------------------------------------------

interface CardStackProps {
  currentPair: DuplicatePair;
  nextPair: DuplicatePair | null;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeDown: () => void;
  cardKey: number;
}

function CardStack({ currentPair, nextPair, onSwipeLeft, onSwipeRight, onSwipeDown, cardKey }: CardStackProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isAnimatingOut = useSharedValue(false);
  const hapticFired = useSharedValue(false);

  // Remount state tracking
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    isAnimatingOut.value = false;
    hapticFired.value = false;
  }, [cardKey]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    runOnJS(Haptics.impactAsync)(style);
  };

  const exitCard = useCallback(
    (direction: 'left' | 'right' | 'down', callback: () => void) => {
      isAnimatingOut.value = true;
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      const toX = direction === 'left' ? -CARD_EXIT_X : direction === 'right' ? CARD_EXIT_X : 0;
      const toY = direction === 'down' ? CARD_EXIT_Y : 0;
      translateX.value = withTiming(toX, { duration: 250 }, () => runOnJS(callback)());
      translateY.value = withTiming(toY, { duration: 250 });
    },
    [translateX, translateY, isAnimatingOut]
  );

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (isAnimatingOut.value) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;

      const isOverThreshold = Math.abs(e.translationX) > SWIPE_THRESHOLD || e.translationY > SWIPE_DOWN_THRESHOLD;
      if (isOverThreshold && !hapticFired.value) {
        hapticFired.value = true;
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
      } else if (!isOverThreshold && hapticFired.value) {
        hapticFired.value = false;
      }
    })
    .onEnd((e) => {
      if (isAnimatingOut.value) return;
      const vx = e.velocityX;

      if (e.translationY > SWIPE_DOWN_THRESHOLD && Math.abs(e.translationX) < 80) {
        runOnJS(exitCard)('down', onSwipeDown);
        return;
      }
      if (e.translationX > SWIPE_THRESHOLD || vx > 600) {
        runOnJS(exitCard)('right', onSwipeRight);
        return;
      }
      if (e.translationX < -SWIPE_THRESHOLD || vx < -600) {
        runOnJS(exitCard)('left', onSwipeLeft);
        return;
      }

      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      hapticFired.value = false;
    });

  // Foreground card styles
  const frontCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-200, 0, 200], [-MAX_ROTATION, 0, MAX_ROTATION], Extrapolation.CLAMP);
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      zIndex: 10,
    };
  });

  // Background card styles (scale up as foreground moves)
  const backCardStyle = useAnimatedStyle(() => {
    const moveDist = Math.abs(translateX.value) + Math.abs(translateY.value);
    const scale = interpolate(moveDist, [0, 150], [0.93, 1], Extrapolation.CLAMP);
    const opacity = interpolate(moveDist, [0, 150], [0.5, 1], Extrapolation.CLAMP);
    const translateYBack = interpolate(moveDist, [0, 150], [-25, 0], Extrapolation.CLAMP);
    
    return {
      transform: [{ scale }, { translateY: translateYBack }],
      opacity,
      zIndex: 1,
    };
  });

  const rightOverlayStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [20, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) }));
  const leftOverlayStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateX.value, [-20, -SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP) }));
  const downOverlayStyle = useAnimatedStyle(() => ({ opacity: interpolate(translateY.value, [20, SWIPE_DOWN_THRESHOLD], [0, 0.9], Extrapolation.CLAMP) }));

  return (
    <View style={styles.cardStackContainer}>
      {nextPair && (
        <Animated.View style={[styles.cardWrapper, styles.backgroundCard, backCardStyle]}>
          <FlashCard pair={nextPair} />
          {/* Glass frost overlay for the background card */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: RADIUS.lg }]} />
        </Animated.View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.cardWrapper, frontCardStyle]} entering={FadeIn.duration(200)}>
          <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayRight, rightOverlayStyle]}>
            <MaterialCommunityIcons name="merge" size={32} color={COLORS.success} />
            <Text style={[styles.overlayLabel, { color: COLORS.success }]}>Merge</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayLeft, leftOverlayStyle]}>
            <MaterialCommunityIcons name="close-circle" size={32} color={COLORS.error} />
            <Text style={[styles.overlayLabel, { color: COLORS.error }]}>Discard</Text>
          </Animated.View>
          <Animated.View style={[styles.swipeOverlay, styles.swipeOverlayDown, downOverlayStyle]}>
            <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.warning} />
            <Text style={[styles.overlayLabel, { color: COLORS.warning }]}>Snooze</Text>
          </Animated.View>

          <FlashCard pair={currentPair} />
        </Animated.View>
      </GestureDetector>
    </View>
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        <AuroraBackground />
        <ActivityIndicator color={COLORS.primaryLight} size="large" />
      </View>
    );
  }

  const remaining = queue.length - currentIndex;

  if (remaining <= 0) {
    return (
      <View style={styles.center}>
        <AuroraBackground />
        <MaterialCommunityIcons name="check-decagram" size={80} color={COLORS.success} />
        <Text style={styles.doneTitle}>Library Clean</Text>
        <Text style={styles.doneSubtitle}>
          No pending duplicates found.{'\n'}Your contacts are fully organized.
        </Text>
        <Button mode="contained" onPress={() => router.push('/')} buttonColor={COLORS.surfaceElevated} textColor={COLORS.textPrimary} style={{ marginTop: SPACING.lg, borderRadius: RADIUS.lg }}>
          Return to Dashboard
        </Button>
      </View>
    );
  }

  const current = queue[currentIndex];
  const next = currentIndex + 1 < queue.length ? queue[currentIndex + 1] : null;
  const progress = currentIndex / Math.max(queue.length, 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AuroraBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.queueText}>Reviewing {currentIndex + 1} of {queue.length}</Text>
        </View>
        <View style={styles.headerRight}>
          {undoStack.length > 0 && (
            <Button mode="text" onPress={handleUndo} textColor={COLORS.primaryLight} compact icon="undo" contentStyle={{ flexDirection: 'row-reverse' }}>
              Undo
            </Button>
          )}
        </View>
      </View>

      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      <View style={styles.stackArea}>
        <CardStack
          cardKey={cardKey}
          currentPair={current}
          nextPair={next}
          onSwipeLeft={handleNotAMatch}
          onSwipeRight={handleSamePerson}
          onSwipeDown={handleReviewLater}
        />
      </View>

      <View style={styles.actionBar}>
        <Button mode="outlined" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleNotAMatch(); }} textColor={COLORS.error} style={[styles.actionBtn, { borderColor: COLORS.error + '44' }]} contentStyle={styles.actionBtnContent} icon="close">
          Discard
        </Button>
        <Button mode="contained" onPress={handleSamePerson} buttonColor={COLORS.primary} textColor={COLORS.onPrimary} style={styles.actionBtn} contentStyle={styles.actionBtnContent} icon="merge">
          Merge
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
      <View style={[styles.confidenceBadge, { backgroundColor: conf.color + '1A', borderColor: conf.color + '40' }]}>
        <View style={[styles.confidenceDot, { backgroundColor: conf.color, shadowColor: conf.color, shadowOpacity: 0.8, shadowRadius: 4 }]} />
        <Text style={[styles.confidenceText, { color: conf.color }]}>{conf.label}</Text>
        <Text style={[styles.scoreText, { color: conf.color }]}>{candidate.score}%</Text>
      </View>

      <View style={styles.reasonsRow}>
        {candidate.reasons.map((r) => (
          <ReasonPill key={r} reason={r} />
        ))}
      </View>

      <View style={styles.compareContainer}>
        <ContactDiff detailsA={a} detailsB={b} />
      </View>
    </View>
  );
});

const ReasonPill = memo(function ReasonPill({ reason }: { reason: DuplicateReason }) {
  const label = REASON_LABELS[reason] ?? reason.replace(/_/g, ' ');
  return (
    <View style={styles.reasonPill}>
      <MaterialCommunityIcons name="lightning-bolt" size={12} color={COLORS.secondary} />
      <Text style={styles.reasonPillText}>{label}</Text>
    </View>
  );
});

// Refactored ContactColumn into a single Diff view for better visual diffing
const ContactDiff = memo(function ContactDiff({ detailsA, detailsB }: { detailsA: ContactDetails | null, detailsB: ContactDetails | null }) {
  const nameA = detailsA?.contact.displayName || '(Deleted)';
  const nameB = detailsB?.contact.displayName || '(Deleted)';
  
  const phoneA = detailsA?.phones[0]?.number || '';
  const phoneB = detailsB?.phones[0]?.number || '';

  const emailA = detailsA?.emails[0]?.email || '';
  const emailB = detailsB?.emails[0]?.email || '';

  return (
    <View style={styles.diffWrapper}>
      <View style={styles.diffRow}>
        <View style={styles.diffSide}>
          <Text style={styles.diffHeader}>Contact A</Text>
          <Text style={styles.diffName}><DiffText a={nameA} b={nameB} isSideA={true} /></Text>
          {phoneA ? <Text style={styles.diffSub}><DiffText a={phoneA} b={phoneB} isSideA={true} /></Text> : null}
          {emailA ? <Text style={styles.diffSub}><DiffText a={emailA} b={emailB} isSideA={true} /></Text> : null}
        </View>
        <View style={styles.diffDivider} />
        <View style={styles.diffSide}>
          <Text style={styles.diffHeader}>Contact B</Text>
          <Text style={styles.diffName}><DiffText a={nameA} b={nameB} isSideA={false} /></Text>
          {phoneB ? <Text style={styles.diffSub}><DiffText a={phoneA} b={phoneB} isSideA={false} /></Text> : null}
          {emailB ? <Text style={styles.diffSub}><DiffText a={emailA} b={emailB} isSideA={false} /></Text> : null}
        </View>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  doneTitle: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', color: COLORS.textPrimary, marginTop: 16 },
  doneSubtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  queueText: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: '700' },
  
  progressBar: { height: 2, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: SPACING.lg, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.lg },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: RADIUS.full },
  
  stackArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardStackContainer: { width: '100%', height: '100%', paddingHorizontal: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
  
  cardWrapper: { position: 'absolute', width: '100%', maxHeight: 500 },
  backgroundCard: { top: '50%', marginTop: -250 }, // Center hack
  
  swipeOverlay: { position: 'absolute', top: 20, zIndex: 20, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, pointerEvents: 'none', backgroundColor: 'rgba(0,0,0,0.6)' },
  swipeOverlayRight: { left: 20, borderColor: COLORS.success },
  swipeOverlayLeft: { right: 20, borderColor: COLORS.error },
  swipeOverlayDown: { alignSelf: 'center', left: '35%', top: 60, borderColor: COLORS.warning },
  overlayLabel: { fontSize: FONT_SIZE.md, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  
  flashCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.7)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
    height: 480, // Fixed height for consistent stacking
  },
  
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, alignSelf: 'flex-start', marginBottom: SPACING.md },
  confidenceDot: { width: 8, height: 8, borderRadius: 4 },
  confidenceText: { fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreText: { fontSize: FONT_SIZE.xs, fontWeight: '500', marginLeft: 4, opacity: 0.8 },
  
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  reasonPill: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  // A11Y: raised from textSecondary to textPrimary — reason labels communicate *why* flagged, need strong readability
  reasonPillText: { fontSize: FONT_SIZE.xs, color: COLORS.textPrimary, fontWeight: '600' },
  
  compareContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  diffWrapper: { flex: 1 },
  diffRow: { flexDirection: 'row', flex: 1 },
  diffSide: { flex: 1, padding: SPACING.md, gap: SPACING.sm },
  diffDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  diffHeader: { fontSize: FONT_SIZE.xs, color: COLORS.textDisabled, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 4 },
  diffName: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 24 },
  diffSub: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontFamily: 'monospace' },
  
  // A11Y: diffSame needs to be readable in both matched and diffed positions on dark card surface
  diffSame: { color: COLORS.textSecondary },
  diffDifferent: { color: '#FFFFFF', backgroundColor: 'rgba(239, 68, 68, 0.25)', fontWeight: '700' },
  
  actionBar: { padding: SPACING.lg, flexDirection: 'row', gap: SPACING.md, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  actionBtn: { flex: 1, borderRadius: RADIUS.lg },
  actionBtnContent: { paddingVertical: 6 },
});
