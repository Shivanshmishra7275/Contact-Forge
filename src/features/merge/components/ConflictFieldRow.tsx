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

  return (
    <Surface style={[styles.container, isMatch && styles.matchContainer]} elevation={1}>
      <Text style={styles.label}>{field.label}</Text>

      {isMatch || isMergeable ? (
        <View style={styles.matchValueContainer}>
          <Text style={styles.matchValue}>
            {field.type === 'scalar' 
              ? String(field.valueA || '(Empty)') 
              : `[${field.resolvedValue.length} items merged]`}
          </Text>
          <Text style={styles.badge}>{isMatch ? 'MATCH' : 'MERGED'}</Text>
        </View>
      ) : (
        <View style={styles.conflictContainer}>
          <View style={styles.valueRow}>
            <Text style={styles.sourceLabel}>A:</Text>
            <Text style={styles.valueText} numberOfLines={2}>
              {field.valueA ? String(field.valueA) : '(Empty)'}
            </Text>
          </View>
          <View style={styles.valueRow}>
            <Text style={styles.sourceLabel}>B:</Text>
            <Text style={styles.valueText} numberOfLines={2}>
              {field.valueB ? String(field.valueB) : '(Empty)'}
            </Text>
          </View>

          <SegmentedButtons
            value={field.selectedSource || 'a'}
            onValueChange={(val) => onSourceSelected(val as FieldSource)}
            buttons={[
              { value: 'a', label: 'Keep A' },
              { value: 'b', label: 'Keep B' },
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
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  matchContainer: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    opacity: 0.8,
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
    fontSize: FONT_SIZE.md,
    flex: 1,
  },
  badge: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: 'bold',
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  conflictContainer: {
    gap: SPACING.xs,
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
    color: COLORS.textDisabled,
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
    width: 20,
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    flex: 1,
  },
  segmentedButtons: {
    marginTop: SPACING.sm,
  },
});
