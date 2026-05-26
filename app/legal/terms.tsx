/**
 * ContactForge — Cinematic Terms & Conditions Gate
 */

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useAppStore } from '../../src/store/appStore';
import { setSetting } from '../../src/db/repositories/settingsRepository';
import { COLORS, SPACING, FONT_SIZE, FONT_WEIGHT, RADIUS, MOTION } from '../../src/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TermsScreen() {
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const [canAccept, setCanAccept] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animated values
  const buttonOpacity = useSharedValue(0.5);
  const buttonScale = useSharedValue(0.95);

  useEffect(() => {
    if (canAccept) {
      buttonOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      buttonScale.value = withSpring(1, MOTION.spring.bouncy);
    }
  }, [canAccept]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (canAccept) return;
    
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setCanAccept(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleAccept = async () => {
    if (!canAccept) {
      // Haptic feedback if trying to click before scrolling
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    // Haptic pop for accepting
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Persist
    setSetting('hasAcceptedTerms', 'true');
    setSettings({ ...settings, hasAcceptedTerms: true });
    
    // Navigate to root tab dashboard
    router.replace('/');
  };

  const animatedButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = canAccept 
      ? COLORS.primary 
      : COLORS.surfaceElevated;
      
    const borderColor = canAccept
      ? COLORS.primaryLight
      : COLORS.border;

    return {
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonScale.value }],
      backgroundColor: withTiming(backgroundColor, { duration: 300 }),
      borderColor: withTiming(borderColor, { duration: 300 }),
    };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View 
        style={styles.header}
        entering={FadeIn.duration(800).delay(100)}
      >
        <MaterialCommunityIcons name="shield-lock-outline" size={48} color={COLORS.primaryLight} style={styles.headerIcon} />
        <Text style={styles.title}>The ContactForge Pledge</Text>
      </Animated.View>

      <Animated.View 
        style={styles.scrollContainer}
        entering={SlideInDown.duration(800).delay(200)}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
          indicatorStyle="white"
        >
          {/* Privacy Pledge Section */}
          <View style={styles.pledgeBox}>
            <Text style={styles.pledgeHeader}>Our Core Promises</Text>
            
            <View style={styles.pledgeRow}>
              <View style={styles.pledgeIconBox}>
                <MaterialCommunityIcons name="cloud-off-outline" size={24} color={COLORS.accent} />
              </View>
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeTitle}>Zero Cloud Sync</Text>
                <Text style={styles.pledgeDesc}>Your contact data never leaves this device unless you explicitly configure a personal WebDAV server.</Text>
              </View>
            </View>

            <View style={styles.pledgeRow}>
              <View style={styles.pledgeIconBox}>
                <MaterialCommunityIcons name="eye-off-outline" size={24} color={COLORS.info} />
              </View>
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeTitle}>No Tracking</Text>
                <Text style={styles.pledgeDesc}>We do not harvest, mine, or transmit your personal network. You are the sole owner of your data.</Text>
              </View>
            </View>

            <View style={styles.pledgeRow}>
              <View style={styles.pledgeIconBox}>
                <MaterialCommunityIcons name="database-lock-outline" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeTitle}>Total Sovereignty</Text>
                <Text style={styles.pledgeDesc}>Everything is processed locally via a secure SQLite database on your hardware.</Text>
              </View>
            </View>
          </View>

          {/* Boilerplate T&C */}
          <Text style={styles.legalSectionTitle}>1. Terms of Use</Text>
          <Text style={styles.legalBody}>
            By continuing to use ContactForge, you agree to these Terms and Conditions. The software is provided "as is", without warranty of any kind, express or implied. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from, out of, or in connection with the software or the use or other dealings in the software.
          </Text>

          <Text style={styles.legalSectionTitle}>2. Local Data Processing</Text>
          <Text style={styles.legalBody}>
            ContactForge operates entirely on your device. We do not maintain any centralized servers for processing your contact data. Features such as duplicate detection, network insights, and backup encryption are executed locally using your device's computational resources.
          </Text>
          
          <Text style={styles.legalSectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.legalBody}>
            You are responsible for maintaining the security of your device and local backups. If you enable the App Lock feature, you must remember your authentication credentials, as there is no central password recovery mechanism.
          </Text>

          <Text style={styles.legalSectionTitle}>4. Contact Access Permissions</Text>
          <Text style={styles.legalBody}>
            ContactForge requires permission to access your device's native contacts in order to function. This access is strictly used to synchronize your local database with your device's address book. We do not upload this information to any third party.
          </Text>
          
          <View style={styles.spacer} />
          <Text style={styles.scrollHint}>
            {canAccept ? "Thank you for reading." : "Please scroll to the bottom to agree."}
          </Text>
        </ScrollView>
      </Animated.View>

      <Animated.View style={styles.footer} entering={FadeIn.duration(1000).delay(600)}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleAccept}
          style={styles.touchableArea}
        >
          <Animated.View style={[styles.agreeButton, animatedButtonStyle]}>
            <Text style={[styles.agreeButtonText, { color: canAccept ? '#FFF' : COLORS.textSecondary }]}>
              {canAccept ? 'I Agree & Continue' : 'Scroll to Read Terms'}
            </Text>
            {canAccept && (
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={styles.arrowIcon} />
            )}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginBottom: SPACING.md,
    textShadowColor: COLORS.primaryLight,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  scrollContainer: {
    flex: 1,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  pledgeBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.borderFocus,
  },
  pledgeHeader: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  pledgeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  pledgeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  pledgeTextContainer: {
    flex: 1,
  },
  pledgeTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  pledgeDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  legalSectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  legalBody: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  spacer: {
    height: SPACING.xxxl,
  },
  scrollHint: {
    textAlign: 'center',
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
    marginTop: SPACING.lg,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  touchableArea: {
    width: '100%',
  },
  agreeButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: COLORS.primaryLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  agreeButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  arrowIcon: {
    marginLeft: SPACING.sm,
  },
});
