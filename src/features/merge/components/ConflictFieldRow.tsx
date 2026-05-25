import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Text } from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, interpolateColor, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../../../src/constants';
import * as Haptics from 'expo-haptics';
import type { FieldComparison, FieldSource } from '../types';

interface ConflictFieldRowProps {
  field: FieldComparison;
  onSourceSelected: (source: FieldSource) => void;
}

export function ConflictFieldRow({ field, onSourceSelected }: ConflictFieldRowProps) {
  const isMatch = field.state === 'match';
  const isMergeable = field.state === 'mergeable';
  const [expanded, setExpanded] = useState(false);

  // Hide rows where both values are empty — reduces merge screen clutter
  const aEmpty = !field.valueA || (Array.isArray(field.valueA) && field.valueA.length === 0);
  const bEmpty = !field.valueB || (Array.isArray(field.valueB) && field.valueB.length === 0);
  if (aEmpty && bEmpty) return null;
  if ((isMatch || isMergeable) && aEmpty) return null;

  if (isMatch || isMergeable) {
    return (
      <View style={styles.matchContainer}>
        <TouchableOpacity 
          style={styles.matchHeader} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setExpanded(!expanded);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.matchHeaderLeft}>
            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} style={styles.matchIcon} />
            <Text style={styles.label}>{field.label}</Text>
          </View>
          <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
        
        {expanded && (
          <View style={styles.matchContent}>
            <Text style={styles.matchValue}>
              {field.type === 'scalar'
                ? String(field.valueA)
                : `[${Array.isArray(field.resolvedValue) ? field.resolvedValue.length : 0} items merged automatically]`}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.conflictContainer}>
      <View style={styles.conflictHeader}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.warning} style={styles.matchIcon} />
        <Text style={[styles.label, { color: COLORS.warning }]}>{field.label}</Text>
      </View>

      <View style={styles.optionsContainer}>
        <AnimatedSegmentedControl
          valueA={String(field.valueA || '')}
          valueB={String(field.valueB || '')}
          aEmpty={aEmpty}
          bEmpty={bEmpty}
          selectedValue={field.selectedSource || 'a'}
          onSelect={(val) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSourceSelected(val);
          }}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Animated Segmented Control
// ---------------------------------------------------------------------------

interface SegmentedProps {
  valueA: string;
  valueB: string;
  aEmpty: boolean;
  bEmpty: boolean;
  selectedValue: FieldSource;
  onSelect: (val: FieldSource) => void;
}

function AnimatedSegmentedControl({ valueA, valueB, aEmpty, bEmpty, selectedValue, onSelect }: SegmentedProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const position = useSharedValue(selectedValue === 'a' ? 0 : 1);

  // Update position on prop change
  position.value = withSpring(selectedValue === 'a' ? 0 : 1, { damping: 14, stiffness: 120 });

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const pillWidth = containerWidth > 0 ? (containerWidth - 8) / 2 : 0;

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * pillWidth }],
    width: pillWidth,
  }));

  const textStyleA = useAnimatedStyle(() => ({
    color: interpolateColor(position.value, [0, 1], [COLORS.textPrimary, COLORS.textSecondary]),
  }));
  const subStyleA = useAnimatedStyle(() => ({
    color: interpolateColor(position.value, [0, 1], [COLORS.textSecondary, COLORS.textDisabled]),
  }));

  const textStyleB = useAnimatedStyle(() => ({
    color: interpolateColor(position.value, [0, 1], [COLORS.textSecondary, COLORS.textPrimary]),
  }));
  const subStyleB = useAnimatedStyle(() => ({
    color: interpolateColor(position.value, [0, 1], [COLORS.textDisabled, COLORS.textSecondary]),
  }));

  return (
    <View style={styles.segmentContainer} onLayout={onLayout}>
      {/* Sliding Highlight Pill */}
      {containerWidth > 0 && (
        <Animated.View style={[styles.segmentSlider, sliderStyle]} />
      )}

      {/* Button A */}
      <TouchableOpacity 
        style={styles.segmentButton} 
        onPress={() => onSelect('a')}
        activeOpacity={1}
      >
        <Animated.Text style={[styles.segmentTitle, textStyleA]}>Keep A</Animated.Text>
        <Animated.Text style={[styles.segmentValue, subStyleA]} numberOfLines={2}>
          {aEmpty ? 'Leave empty' : valueA}
        </Animated.Text>
      </TouchableOpacity>

      {/* Button B */}
      <TouchableOpacity 
        style={styles.segmentButton} 
        onPress={() => onSelect('b')}
        activeOpacity={1}
      >
        <Animated.Text style={[styles.segmentTitle, textStyleB]}>Keep B</Animated.Text>
        <Animated.Text style={[styles.segmentValue, subStyleB]} numberOfLines={2}>
          {bEmpty ? 'Leave empty' : valueB}
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  matchContainer: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    marginBottom: SPACING.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  matchIcon: {
    marginTop: -2,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  matchContent: {
    marginTop: SPACING.sm,
    paddingLeft: 24, // align with text, bypassing icon
  },
  matchValue: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },

  conflictContainer: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(30, 30, 45, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.sm,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  optionsContainer: {
    width: '100%',
  },

  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 10, 18, 0.8)',
    borderRadius: RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    height: 72,
    position: 'relative',
  },
  segmentSlider: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    backgroundColor: 'rgba(76, 29, 149, 0.5)',
    borderRadius: RADIUS.md - 2,
    borderWidth: 1,
    borderColor: 'rgba(109, 40, 217, 0.8)',
    shadowColor: COLORS.primaryLight,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    zIndex: 2,
  },
  segmentTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  segmentValue: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 16,
  },
});
