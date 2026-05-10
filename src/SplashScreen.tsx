/**
 * ContactForge — Premium Splash Screen
 *
 * Created by: T.G.S Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 *
 * Purpose:
 * Display T.G.S Mishra branding on app startup
 * Premium cinematic experience with smooth animations
 * Sets tone for professional, offline-first contact management
 *
 * Features:
 * - Animated T.G.S Mishra logo entrance
 * - Tagline: "First Mobile App"
 * - Smooth fade-out transition
 * - Database initialization indicator
 * - Premium dark mode aesthetics
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from '../constants';

interface SplashScreenProps {
  onFinish: () => void;
}

/**
 * Premium splash screen component with T.G.S Mishra branding
 * Auto-dismisses after animation completes
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Phase 1: Logo entrance (500ms)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Hold on screen (2000ms)
      Animated.delay(2000),
      // Phase 3: Fade out (400ms)
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.background} />

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Star icon with glow */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="star"
            size={80}
            color={COLORS.primary}
            style={styles.starIcon}
          />
        </View>

        {/* Developer brand name */}
        <Text style={styles.brandName}>T.G.S Mishra</Text>

        {/* App name */}
        <Text style={styles.appName}>ContactForge</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>First Mobile App</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Privacy-First Offline Contact Manager
        </Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </Animated.View>

      {/* Footer text */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>
          Built with ❤️ by T.G.S Mishra
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    zIndex: 0,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starIcon: {
    marginBottom: SPACING.md,
    textShadowColor: COLORS.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  brandName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  appName: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
