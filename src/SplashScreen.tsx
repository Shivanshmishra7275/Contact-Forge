/**
 * ContactForge — Splash / Initialization Screen
 *
 * Premium SaaS vibe: dark background, glowing icon, clear hierarchy.
 *
 * Content structure:
 *   - Glowing star icon (breathing pulse animation)
 *   - "ContactForge" — massive primary title
 *   - "Privacy-first contact intelligence." — muted subtitle
 *   - "Initializing local workspace…" — subtle loading text
 *   - "Built with ❤️ by Shivansh Mishra" — absolute footer
 *
 * Animations:
 *   1. Content fades + scales in (500 ms)
 *   2. Star icon pulses opacity while app loads (breathing loop)
 *   3. Everything fades out before handing off (400 ms)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from './constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Master fade for enter / exit
  const masterFade = useRef(new Animated.Value(0)).current;
  // Scale for content entrance
  const entranceScale = useRef(new Animated.Value(0.88)).current;
  // Breathing pulse for the icon glow
  const iconPulse = useRef(new Animated.Value(0.6)).current;
  // Loading text subtle blink
  const loadingFade = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // ── Phase 1: Entrance (500 ms) ──────────────────────────────────────────
    const entrance = Animated.parallel([
      Animated.timing(masterFade, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entranceScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]);

    // ── Breathing loops (run while app is "holding") ────────────────────────
    const iconBreath = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 0.6,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const loadingBlink = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingFade, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(loadingFade, {
          toValue: 0.3,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    // ── Phase 3: Exit (400 ms) ──────────────────────────────────────────────
    const exit = Animated.timing(masterFade, {
      toValue: 0,
      duration: 400,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });

    // ── Sequence ────────────────────────────────────────────────────────────
    entrance.start(() => {
      iconBreath.start();
      loadingBlink.start();

      // Hold for 2 s then exit
      setTimeout(() => {
        iconBreath.stop();
        loadingBlink.stop();
        exit.start(() => onFinish());
      }, 2000);
    });

    return () => {
      iconBreath.stop();
      loadingBlink.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Radial glow backdrop */}
      <View style={styles.glowBackdrop} />

      {/* ── Main content block ─────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.content,
          { opacity: masterFade, transform: [{ scale: entranceScale }] },
        ]}
      >
        {/* Pulsing star icon */}
        <Animated.View style={[styles.iconWrapper, { opacity: iconPulse }]}>
          {/* Glow halo behind the icon */}
          <View style={styles.iconGlow} />
          <MaterialCommunityIcons
            name="star-four-points"
            size={72}
            color={COLORS.primary}
            style={styles.icon}
          />
        </Animated.View>

        {/* PRIMARY TITLE — the hero element */}
        <Text style={styles.title}>ContactForge</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Privacy-first contact intelligence.</Text>

        {/* Loading text — subtle, blinking */}
        <Animated.Text style={[styles.loadingText, { opacity: loadingFade }]}>
          Initializing local workspace…
        </Animated.Text>
      </Animated.View>

      {/* ── Footer — absolute bottom ────────────────────────────────────────── */}
      <Animated.View style={[styles.footer, { opacity: masterFade }]}>
        <Text style={styles.footerText}>Built with ❤️ by Shivansh Mishra</Text>
      </Animated.View>
    </View>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Soft radial glow behind the centre content
  glowBackdrop: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: COLORS.primary,
    opacity: 0.04,
    top: '25%',
    alignSelf: 'center',
  },

  // Centred content column
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  },

  // Icon + its glow halo
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.primary,
    opacity: 0.18,
  },
  icon: {
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 28,
  },

  // "ContactForge" — dominant, unmissable
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },

  // Muted one-liner beneath the title
  subtitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '400',
    color: COLORS.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Small, italic, blinking loading text
  loadingText: {
    fontSize: FONT_SIZE.xs,
    fontStyle: 'italic',
    color: COLORS.textDisabled,
    textAlign: 'center',
    marginTop: SPACING.md,
    letterSpacing: 0.3,
  },

  // Absolute footer — never competes with the title
  footer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDisabled,
    opacity: 0.6,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
