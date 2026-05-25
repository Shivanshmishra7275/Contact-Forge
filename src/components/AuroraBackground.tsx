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

export function AuroraBackground() {
  const breath1 = useSharedValue(0.4);
  const breath2 = useSharedValue(0.2);

  const cx1 = useSharedValue(0);
  const cy1 = useSharedValue(0);

  const cx2 = useSharedValue(width);
  const cy2 = useSharedValue(height);

  useEffect(() => {
    breath1.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    breath2.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cx1.value = withRepeat(
      withSequence(
        withTiming(width * 0.3, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-width * 0.1, { duration: 15000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cy1.value = withRepeat(
      withSequence(
        withTiming(height * 0.2, { duration: 12000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-height * 0.1, { duration: 12000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cx2.value = withRepeat(
      withSequence(
        withTiming(width * 0.7, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
        withTiming(width * 1.1, { duration: 18000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    cy2.value = withRepeat(
      withSequence(
        withTiming(height * 0.8, { duration: 14000, easing: Easing.inOut(Easing.ease) }),
        withTiming(height * 1.1, { duration: 14000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
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

  return (
    <Animated.View style={StyleSheet.absoluteFill}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <AnimatedRadialGradient
            id="grad1"
            animatedProps={animatedProps1}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
          </AnimatedRadialGradient>
          <AnimatedRadialGradient
            id="grad2"
            animatedProps={animatedProps2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.15} />
            <Stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0} />
          </AnimatedRadialGradient>
        </Defs>
        {/* Base background */}
        <Rect x="0" y="0" width="100%" height="100%" fill={COLORS.background} />
        {/* Glows */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad1)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad2)" />
      </Svg>
    </Animated.View>
  );
}
