import { View, StyleSheet } from 'react-native';
import { Text, SegmentedButtons, Surface } from 'react-native-paper';
import { COLORS, SPACING, FONT_SIZE } from '../../../../src/constants';
import type { FieldComparison, FieldSource } from '../types';

interface ConflictFieldRowProps {
  field: FieldComparison;
  onSourceSelected: (source: FieldSource) => void;
}

export function ConflictFieldRow({ field, onSourceSelected }: ConflictFieldRowProps) {
  const isMatch = field.state === 'match';
  const isMergeable = field.state === 'mergeable';

  // Hide rows where both values are empty — reduces merge screen clutter
  const aEmpty = !field.valueA || (Array.isArray(field.valueA) && field.valueA.length === 0);
  const bEmpty = !field.valueB || (Array.isArray(field.valueB) && field.valueB.length === 0);
  if (aEmpty && bEmpty) return null;

  // For match/mergeable with no actual data to show, skip too
  if ((isMatch || isMergeable) && aEmpty) return null;

  return (
    <Surface style={[styles.container, isMatch && styles.matchContainer]} elevation={1}>
      <Text style={styles.label}>{field.label}</Text>

      {isMatch || isMergeable ? (
        <View style={styles.matchValueContainer}>
          <Text style={styles.matchValue}>
            {field.type === 'scalar'
              ? String(field.valueA)
              : `[${Array.isArray(field.resolvedValue) ? field.resolvedValue.length : 0} items merged]`}
          </Text>
          <Text style={styles.badge}>{isMatch ? 'MATCH' : 'MERGED'}</Text>
        </View>
      ) : (
        <View style={styles.conflictContainer}>
          {/* Only show a side if it has a value */}
          {!aEmpty && (
            <View style={styles.valueRow}>
              <Text style={styles.sourceLabel}>A</Text>
              <Text style={styles.valueText} numberOfLines={2}>
                {String(field.valueA)}
              </Text>
            </View>
          )}
          {!bEmpty && (
            <View style={styles.valueRow}>
              <Text style={styles.sourceLabel}>B</Text>
              <Text style={styles.valueText} numberOfLines={2}>
                {String(field.valueB)}
              </Text>
            </View>
          )}
          {aEmpty && !bEmpty && (
            <Text style={styles.emptyHint}>Only Contact B has this field</Text>
          )}
          {!aEmpty && bEmpty && (
            <Text style={styles.emptyHint}>Only Contact A has this field</Text>
          )}

          <SegmentedButtons
            value={field.selectedSource || 'a'}
            onValueChange={(val) => onSourceSelected(val as FieldSource)}
            buttons={[
              { value: 'a', label: aEmpty ? 'Keep empty' : 'Keep A' },
              { value: 'b', label: bEmpty ? 'Keep empty' : 'Keep B' },
            ]}
            style={styles.segmentedButtons}
            density="small"
          />
        </View>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  matchContainer: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    opacity: 0.75,
    marginBottom: 0,
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  matchValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchValue: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  badge: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: 'bold',
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  conflictContainer: {
    gap: SPACING.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.sm,
    borderRadius: 6,
    gap: SPACING.sm,
  },
  sourceLabel: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    width: 16,
    marginTop: 1,
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 18,
  },
  emptyHint: {
    color: COLORS.textDisabled,
    fontSize: FONT_SIZE.xs,
    fontStyle: 'italic',
  },
  segmentedButtons: {
    marginTop: SPACING.xs,
  },
});
