/**
 * ContactForge — Cinematic Splash / Initialization Screen
 *
 * Design: Tier-one premium mobile utility feel.
 * Communicates: privacy-first, offline intelligence, "forging" data.
 *
 * Architecture:
 *   - Pure react-native-reanimated v4 worklets (no Animated API)
 *   - Network node cluster → converging → single forge icon
 *   - Layered glow: purple (#6B46C1) + cyan (#0bc5ea) dual radial
 *   - Staggered entrance choreography with spring physics
 *   - Typewriter effect on loading status line
 *   - Exit: smooth fade before handoff
 *
 * Entrance sequence:
 *   0ms   Background gradient fades in
 *   200ms Central forge icon springs up (damped bounce)
 *   400ms "ContactForge" slides up + fades in
 *   500ms Subtitle + loading text fades in
 *   Loop  Breathing pulse + node orbit on icon
 *   Hold  2400ms idle then exits over 400ms
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from './constants';

// ─── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');

/** The 6 satellite nodes that orbit the central icon */
const NODES: Array<{ angle: number; radius: number; delay: number; size: number }> = [
  { angle: 0,   radius: 70, delay: 0,   size: 5 },
  { angle: 60,  radius: 82, delay: 80,  size: 3 },
  { angle: 120, radius: 64, delay: 160, size: 6 },
  { angle: 180, radius: 78, delay: 40,  size: 4 },
  { angle: 240, radius: 72, delay: 120, size: 3 },
  { angle: 300, radius: 66, delay: 200, size: 5 },
];

const DEG = Math.PI / 180;

// ─── Typewriter hook ────────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 38, startDelay = 520): string {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');

    const delayTimer = setTimeout(() => {
      const tick = () => {
        idxRef.current += 1;
        setDisplayed(text.slice(0, idxRef.current));
        if (idxRef.current < text.length) {
          timerRef.current = setTimeout(tick, speed);
        }
      };
      tick();
    }, startDelay);

    return () => {
      clearTimeout(delayTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, startDelay]);

  return displayed;
}

// ─── Satellite Node ─────────────────────────────────────────────────────────────

interface NodeProps {
  angle: number;
  radius: number;
  delay: number;
  size: number;
  convergeProgress: SharedValue<number>;
}

function SatelliteNode({ angle, radius, delay, size, convergeProgress }: NodeProps) {
  const x = Math.cos(angle * DEG) * radius;
  const y = Math.sin(angle * DEG) * radius;

  const orbitPhase = useSharedValue(0);

  useEffect(() => {
    orbitPhase.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3200 + delay * 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3200 + delay * 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const nodeStyle = useAnimatedStyle(() => {
    // Slow orbital drift ±8px on each axis
    const driftX = interpolate(orbitPhase.value, [0, 1], [-8, 8]);
    const driftY = interpolate(orbitPhase.value, [0, 1], [-5, 5]);

    // Converge: nodes shrink and move toward center as progress → 1
    const convergeFraction = convergeProgress.value;
    const scale = interpolate(convergeFraction, [0, 0.8, 1], [1, 0.4, 0]);
    const translateX = interpolate(convergeFraction, [0, 1], [x + driftX, 0]);
    const translateY = interpolate(convergeFraction, [0, 1], [y + driftY, 0]);
    const opacity = interpolate(convergeFraction, [0, 0.6, 1], [0.75, 0.4, 0]);

    return {
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.node,
        {
          width: size * 2,
          height: size * 2,
          borderRadius: size,
          // Alternate: teal for even-indexed, violet for odd
          backgroundColor: angle % 120 === 0 ? '#06B6D4' : '#A78BFA',
        },
        nodeStyle,
      ]}
    />
  );
}

// ─── Connection Lines (static SVG-like lines using View transforms) ─────────────

function NodeLine({
  angle,
  radius,
  convergeProgress,
}: {
  angle: number;
  radius: number;
  convergeProgress: SharedValue<number>;
}) {
  const x = Math.cos(angle * DEG) * radius;
  const y = Math.sin(angle * DEG) * radius;
  const length = Math.sqrt(x * x + y * y);
  const lineAngle = Math.atan2(y, x) * (180 / Math.PI);

  const lineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(convergeProgress.value, [0, 0.5, 1], [0.12, 0.06, 0]),
  }));

  return (
    <Animated.View
      style={[
        styles.connectionLine,
        {
          width: length,
          transform: [
            { rotate: `${lineAngle}deg` },
            { translateX: length / 2 },
          ],
        },
        lineStyle,
      ]}
    />
  );
}

// ─── Central Forge Orb ─────────────────────────────────────────────────────────

function ForgeOrb({ convergeProgress }: { convergeProgress: SharedValue<number> }) {
  const breathe = useSharedValue(1);
  const glowPulse = useSharedValue(0.55);

  useEffect(() => {
    // Gentle breathing scale on icon
    breathe.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.97, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    // Glow halo pulse
    glowPulse.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.45, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.06, 0.14]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [1, 1.18]) }],
  }));

  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.12, 0.28]),
    transform: [{ scale: interpolate(glowPulse.value, [0, 1], [0.9, 1.06]) }],
  }));

  const iconBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(convergeProgress.value, [0, 0.4, 1], [0, 0, 1]),
    transform: [
      { scale: interpolate(convergeProgress.value, [0.4, 1], [0.5, 1]) },
    ],
  }));

  return (
    <View style={styles.orbContainer}>
      {/* Outermost cyan glow ring */}
      <Animated.View style={[styles.outerGlow, outerGlowStyle]} />
      {/* Purple mid-glow ring */}
      <Animated.View style={[styles.innerGlow, innerGlowStyle]} />
      {/* Icon surface */}
      <Animated.View style={[styles.orbSurface, iconStyle]}>
        <MaterialCommunityIcons
          name="shield-lock"
          size={52}
          color={COLORS.primary}
          style={styles.orbIcon}
        />
      </Animated.View>
      {/* Converge indicator — small "merged" badge that appears after nodes converge */}
      <Animated.View style={[styles.convergeCheck, iconBadgeStyle]}>
        <MaterialCommunityIcons name="check" size={11} color="#0bc5ea" />
      </Animated.View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Shared animation values
  const bgOpacity      = useSharedValue(0);
  const forgeScale     = useSharedValue(0.55);
  const titleOpacity   = useSharedValue(0);
  const titleTranslateY = useSharedValue(14);
  const subOpacity     = useSharedValue(0);
  const footerOpacity  = useSharedValue(0);
  const masterOpacity  = useSharedValue(1);
  const convergeProgress = useSharedValue(0); // 0=nodes spread, 1=converged to center

  // Typewriter text for loading state
  const loadingText = useTypewriter('Initializing secure workspace…', 36, 540);

  // Cursor blink for typewriter
  const cursorBlink = useSharedValue(1);

  const startExit = useCallback(() => {
    masterOpacity.value = withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) }, () => {
      runOnJS(onFinish)();
    });
  }, []);

  useEffect(() => {
    // ── 0ms: background fade in ─────────────────────────────────────────────
    bgOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });

    // ── 200ms: forge orb springs in ─────────────────────────────────────────
    forgeScale.value = withDelay(
      200,
      withSpring(1, { damping: 14, stiffness: 110, mass: 1 }),
    );

    // ── 400ms: title slides + fades in ──────────────────────────────────────
    titleOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
    titleTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );

    // ── 500ms: subtitle + loading text fade in ───────────────────────────────
    subOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.quad) }),
    );
    footerOpacity.value = withDelay(
      700,
      // A11Y: raised from 0.4 to 0.72 — text was nearly invisible at 40% opacity
      withTiming(0.72, { duration: 400 }),
    );

    // ── 900ms: nodes converge toward center ──────────────────────────────────
    convergeProgress.value = withDelay(
      900,
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }),
    );

    // ── Cursor blink loop ────────────────────────────────────────────────────
    cursorBlink.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 530 }),
        withTiming(0, { duration: 530 }),
      ),
      -1,
      false,
    );

    // ── Total hold: ~2400ms, then exit ───────────────────────────────────────
    const exitTimer = setTimeout(startExit, 2800);
    return () => clearTimeout(exitTimer);
  }, []);

  // ── Animated styles ──────────────────────────────────────────────────────────

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const forgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: forgeScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const masterStyle = useAnimatedStyle(() => ({
    opacity: masterOpacity.value,
  }));

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorBlink.value,
  }));

  return (
    <Animated.View style={[styles.root, masterStyle]}>
      {/* ── Background: deep navy base ─────────────────────────────────────── */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.bg, bgStyle]} />

      {/* ── Dual radial glow: purple left, cyan right ──────────────────────── */}
      <Animated.View style={[styles.glowPurple, bgStyle]} />
      <Animated.View style={[styles.glowCyan, bgStyle]} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ── Network + Forge Centerpiece ───────────────────────────────────── */}
        <View style={styles.centerpieceWrapper}>
          <Animated.View style={[styles.networkCluster, forgeStyle]}>
            {/* Connection lines radiating from center */}
            {NODES.map((n) => (
              <NodeLine
                key={`line-${n.angle}`}
                angle={n.angle}
                radius={n.radius}
                convergeProgress={convergeProgress}
              />
            ))}
            {/* Satellite nodes */}
            {NODES.map((n) => (
              <SatelliteNode
                key={`node-${n.angle}`}
                angle={n.angle}
                radius={n.radius}
                delay={n.delay}
                size={n.size}
                convergeProgress={convergeProgress}
              />
            ))}
            {/* Central forge orb */}
            <ForgeOrb convergeProgress={convergeProgress} />
          </Animated.View>
        </View>

        {/* ── Typography block ──────────────────────────────────────────────── */}
        <View style={styles.textBlock}>
          {/* App name — display weight, gradient feel via text shadow */}
          <Animated.Text style={[styles.title, titleStyle]}>
            Contact
            <Animated.Text style={styles.titleAccent}>Forge</Animated.Text>
          </Animated.Text>

          {/* Subtitle */}
          <Animated.Text style={[styles.subtitle, subStyle]}>
            Privacy-first contact intelligence.
          </Animated.Text>

          {/* Typewriter loading status */}
          <Animated.View style={[styles.loadingRow, subStyle]}>
            <Animated.Text style={styles.loadingText} numberOfLines={1}>
              {loadingText}
            </Animated.Text>
            <Animated.Text style={[styles.cursor, cursorStyle]}>|</Animated.Text>
          </Animated.View>
        </View>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.footer, footerStyle]}>
          <Animated.Text style={styles.footerText}>
            Built with ❤️ by Shivansh Mishra
          </Animated.Text>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────

const GLOW_SIZE = SCREEN_W * 1.1;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  bg: {
    backgroundColor: '#0D0D1A',
  },

  // ── Layered background glows ──────────────────────────────────────────────────
  glowPurple: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: '#7C3AED',
    opacity: 0.09,
    top: -GLOW_SIZE * 0.15,
    left: -GLOW_SIZE * 0.25,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 130,
  },
  glowCyan: {
    position: 'absolute',
    width: GLOW_SIZE * 0.7,
    height: GLOW_SIZE * 0.7,
    borderRadius: GLOW_SIZE * 0.35,
    backgroundColor: '#06B6D4',
    opacity: 0.06,
    bottom: -GLOW_SIZE * 0.2,
    right: -GLOW_SIZE * 0.2,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 110,
  },

  // ── Layout ──────────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerpieceWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xxl,
    height: 200,
    width: 200,
  },
  networkCluster: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Satellite nodes ──────────────────────────────────────────────────────────
  node: {
    position: 'absolute',
    shadowColor: '#0bc5ea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  connectionLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#8B7EFF',
    transformOrigin: 'left center',
    left: 0,
  },

  // ── Central forge orb ────────────────────────────────────────────────────────
  orbContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  outerGlow: {
    position: 'absolute',
    width: 134,
    height: 134,
    borderRadius: 67,
    backgroundColor: '#06B6D4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 44,
  },
  innerGlow: {
    position: 'absolute',
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 32,
  },
  orbSurface: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#130E28',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(124, 58, 237, 0.40)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 14,
  },
  orbIcon: {
    textShadowColor: '#A78BFA',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  convergeCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#06B6D4',
  },

  // ── Typography ────────────────────────────────────────────────────────────────
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: 10,
    width: '100%',
  },
  title: {
    fontSize: 50,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: -1.8,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  titleAccent: {
    fontSize: 50,
    fontWeight: '900',
    color: '#A78BFA',
    letterSpacing: -1.8,
    textShadowColor: '#7C3AED',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 1.0,
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    minHeight: 20,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  cursor: {
    fontSize: 13,
    fontWeight: '300',
    color: '#06B6D4',
    marginLeft: 1,
  },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
