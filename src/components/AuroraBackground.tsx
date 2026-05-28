import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants';

const { width, height } = Dimensions.get('window');

const AnimatedRadialGradient = Animated.createAnimatedComponent(RadialGradient);

/**
 * AuroraBackground — Living ambient glow behind every screen.
 *
 * Three slow-breathing radial gradients:
 *   grad1 — Violet primary (top-left)
 *   grad2 — Teal secondary (bottom-right)
 *   grad3 — Indigo mid-accent (center-right) — adds depth
 *
 * All opacity values kept at ≤0.18 to ensure card text remains readable (WCAG AA).
 */
export function AuroraBackground() {
  // Violet glow (primary)
  const breath1 = useSharedValue(0.35);
  const cx1 = useSharedValue(-width * 0.1);
  const cy1 = useSharedValue(-height * 0.05);

  // Teal glow (secondary)
  const breath2 = useSharedValue(0.18);
  const cx2 = useSharedValue(width * 1.0);
  const cy2 = useSharedValue(height * 1.0);

  // Indigo mid accent (depth layer)
  const breath3 = useSharedValue(0.22);
  const cx3 = useSharedValue(width * 0.75);
  const cy3 = useSharedValue(height * 0.35);

  useEffect(() => {
    // Violet — slow majestic pulse
    breath1.value = withRepeat(
      withSequence(
        withTiming(0.75, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 7000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    cx1.value = withRepeat(
      withSequence(
        withTiming(width * 0.25, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-width * 0.1, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    cy1.value = withRepeat(
      withSequence(
        withTiming(height * 0.15, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-height * 0.05, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Teal — counter-breathing cycle
    breath2.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.18, { duration: 9000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    cx2.value = withRepeat(
      withSequence(
        withTiming(width * 0.75, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 1.05, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    cy2.value = withRepeat(
      withSequence(
        withTiming(height * 0.82, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 1.05, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // Indigo — slow drift for subtle depth
    breath3.value = withRepeat(
      withSequence(
        withTiming(0.42, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 11000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    cx3.value = withRepeat(
      withSequence(
        withTiming(width * 0.55, { duration: 22000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 0.85, { duration: 22000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    cy3.value = withRepeat(
      withSequence(
        withTiming(height * 0.5, { duration: 17000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 0.25, { duration: 17000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedProps1 = useAnimatedProps(() => ({
    r: Math.max(width, height) * breath1.value,
    cx: cx1.value,
    cy: cy1.value,
  }));

  const animatedProps2 = useAnimatedProps(() => ({
    r: Math.max(width, height) * breath2.value,
    cx: cx2.value,
    cy: cy2.value,
  }));

  const animatedProps3 = useAnimatedProps(() => ({
    r: Math.max(width, height) * breath3.value,
    cx: cx3.value,
    cy: cy3.value,
  }));

  return (
    <Animated.View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          {/* Violet primary glow */}
          <AnimatedRadialGradient
            id="grad1"
            animatedProps={animatedProps1}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#7C3AED" stopOpacity={0.18} />
            <Stop offset="60%" stopColor="#7C3AED" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
          </AnimatedRadialGradient>
          {/* Teal secondary glow */}
          <AnimatedRadialGradient
            id="grad2"
            animatedProps={animatedProps2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#06B6D4" stopOpacity={0.14} />
            <Stop offset="60%" stopColor="#06B6D4" stopOpacity={0.04} />
            <Stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
          </AnimatedRadialGradient>
          {/* Indigo depth glow */}
          <AnimatedRadialGradient
            id="grad3"
            animatedProps={animatedProps3}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#4F46E5" stopOpacity={0.12} />
            <Stop offset="60%" stopColor="#4F46E5" stopOpacity={0.03} />
            <Stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
          </AnimatedRadialGradient>
        </Defs>
        {/* Base background */}
        <Rect x="0" y="0" width="100%" height="100%" fill={COLORS.background} />
        {/* Glow layers */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad3)" />
      </Svg>
    </Animated.View>
  );
}
