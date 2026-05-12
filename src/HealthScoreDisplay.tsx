/**
 * ContactForge — Health Score Display Component
 *
 * Displays contact health score with color coding, icon, progress bar,
 * and interactive dialog for detailed reasons and suggestions.
 */

import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Dialog, Portal, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE } from './constants';
import type { ContactHealthScore } from './types';

interface HealthScoreDisplayProps {
  health: ContactHealthScore | null;
  compact?: boolean;
  onPress?: () => void;
}

export function HealthScoreDisplay({ health, compact = false, onPress }: HealthScoreDisplayProps) {
  const [dialogVisible, setDialogVisible] = useState(false);

  if (!health) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Computing health score...</Text>
      </View>
    );
  }

  const { score, grade, color, icon } = getGradeInfo(health.score);

  const handlePress = () => {
    setDialogVisible(true);
    onPress?.();
  };

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={[styles.compactBadge, { backgroundColor: `${color}20` }]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name={icon} size={14} color={color} />
          <Text style={[styles.compactGrade, { color }]}>{grade}</Text>
        </TouchableOpacity>
        <HealthScoreDialog
          health={health}
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.badge, { backgroundColor: `${color}15` }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.badgeContent}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <View style={styles.badgeText}>
            <Text style={styles.scoreText}>{score}%</Text>
            <Text style={[styles.gradeText, { color }]}>Grade {grade}</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={COLORS.textDisabled} />
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${score}%`, backgroundColor: color },
          ]}
        />
      </View>

      <HealthScoreDialog
        health={health}
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
      />
    </>
  );
}

interface HealthScoreDialogProps {
  health: ContactHealthScore;
  visible: boolean;
  onDismiss: () => void;
}

function HealthScoreDialog({ health, visible, onDismiss }: HealthScoreDialogProps) {
  const { score, grade, color } = getGradeInfo(health.score);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>Contact Health</Text>
            <View style={[styles.gradeBadge, { backgroundColor: color }]}>
              <Text style={styles.gradeBadgeText}>{grade}</Text>
            </View>
          </View>
        </Dialog.Title>

        <Dialog.ScrollArea style={styles.dialogScrollArea}>
          <ScrollView
            style={styles.dialogScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Score info */}
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={[styles.scoreLarge, { color }]}>{score}/100</Text>
              <View
                style={[
                  styles.dialogProgressBar,
                  { width: `${score}%`, backgroundColor: color },
                ]}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Reasons */}
            {health.explanation && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Why this score?</Text>
                  {health.explanation.split(' • ').map((reason, i) => (
                    <View key={i} style={styles.reasonRow}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color={COLORS.success}
                        style={{ marginRight: SPACING.sm }}
                      />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>
                <Divider style={styles.divider} />
              </>
            )}

            {/* Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <StatsRow label="Fields Complete" value={`${health.fieldsPresent}/6`} />
              {health.noteCount > 0 && (
                <StatsRow
                  label="Memory Notes"
                  value={`${health.noteCount} note${health.noteCount !== 1 ? 's' : ''}`}
                />
              )}
              {health.relationshipCount > 0 && (
                <StatsRow
                  label="Relationships"
                  value={`${health.relationshipCount} link${health.relationshipCount !== 1 ? 's' : ''}`}
                />
              )}
              {health.duplicateCount > 0 && (
                <StatsRow
                  label="Duplicate Risk"
                  value={`${health.duplicateCount} candidate${health.duplicateCount !== 1 ? 's' : ''}`}
                  warning
                />
              )}
              {health.isTemporary && (
                <StatsRow label="Status" value="Temporary Contact" warning />
              )}
              {health.isGhost && (
                <StatsRow label="Status" value="Ghost Contact (missing info)" warning />
              )}
              {health.isRecent && (
                <StatsRow label="Last Activity" value="Within 30 days" />
              )}
            </View>

            {/* Suggestions */}
            {health.suggestions.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>How to Improve</Text>
                  {health.suggestions.map((suggestion, i) => (
                    <View key={i} style={styles.suggestionRow}>
                      <MaterialCommunityIcons
                        name="lightbulb-outline"
                        size={16}
                        color={COLORS.warning}
                        style={{ marginRight: SPACING.sm }}
                      />
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={COLORS.primary}>
            Close
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

interface StatsRowProps {
  label: string;
  value: string;
  warning?: boolean;
}

function StatsRow({ label, value, warning = false }: StatsRowProps) {
  return (
    <View style={styles.statsRow}>
      <Text style={styles.statsLabel}>{label}</Text>
      <Text style={[styles.statsValue, warning && styles.statsValueWarning]}>
        {value}
      </Text>
    </View>
  );
}

function getGradeInfo(score: number): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
} {
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let color: string;
  let icon: keyof typeof MaterialCommunityIcons.glyphMap;

  if (score >= 90) {
    grade = 'A';
    color = '#4caf50'; // Green
    icon = 'heart-pulse';
  } else if (score >= 80) {
    grade = 'B';
    color = '#8bc34a'; // Light green
    icon = 'heart-pulse';
  } else if (score >= 70) {
    grade = 'C';
    color = '#ffc107'; // Yellow
    icon = 'heart';
  } else if (score >= 50) {
    grade = 'D';
    color = '#ff9800'; // Orange
    icon = 'heart-outline';
  } else {
    grade = 'F';
    color = '#f23645'; // Red
    icon = 'heart-broken';
  }

  return { score, grade, color, icon };
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  badgeText: {
    gap: 2,
  },
  scoreText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  gradeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  compactGrade: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  dialog: {
    backgroundColor: COLORS.surface,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  dialogTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    flex: 1,
  },
  gradeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  gradeBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  dialogScroll: {
    paddingHorizontal: SPACING.md,
  },
  scoreInfo: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
  },
  scoreLabel: {
    color: COLORS.textDisabled,
    fontSize: FONT_SIZE.xs,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  scoreLarge: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  dialogProgressBar: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    marginTop: SPACING.sm,
  },
  divider: {
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reasonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  statsLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  statsValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  statsValueWarning: {
    color: COLORS.warning,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  suggestionText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
});
