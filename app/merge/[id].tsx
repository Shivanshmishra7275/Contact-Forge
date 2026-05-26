/**
 * ContactForge — Smart Merge Review Screen
 *
 * Shows a field-level preview of what a merge would produce.
 * The user can resolve conflicts field-by-field.
 * A full snapshot is saved to merge_history before the merge executes.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getContactWithDetails,
  deleteContact,
  updateContact,
  replacePhonesByContactIdSync,
  deleteEmailsByContactId,
  insertEmail,
} from '../../src/db/repositories/contactRepository';
import {
  getPendingDuplicates,
  resolveDuplicateCandidate,
  recordMerge,
} from '../../src/db/repositories/duplicateRepository';
import { recordUndoAction } from '../../src/db/repositories/undoRepository';
import type { UndoMergePayload } from '../../src/features/undo/types';
import { logAction } from '../../src/db/repositories/auditRepository';
import { reassignNotes } from '../../src/db/repositories/noteRepository';
import { reassignRelationships } from '../../src/db/repositories/relationshipRepository';
import { transferTemporaryContact } from '../../src/db/repositories/temporaryContactRepository';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE } from '../../src/constants';
import type { ContactWithDetails, DuplicateCandidate } from '../../src/types';
import { buildMergeComparison } from '../../src/features/merge/utils/buildMergeComparison';
import type { MergeComparisonModel, FieldSource, FieldComparison } from '../../src/features/merge/types';
import { ConflictFieldRow } from '../../src/features/merge/components/ConflictFieldRow';

import { useUndoStore } from '../../src/store/undoStore';

export default function SmartMergeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);

  const [candidate, setCandidate] = useState<DuplicateCandidate | null>(null);
  const [comparison, setComparison] = useState<MergeComparisonModel | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    const candidates = getPendingDuplicates();
    const c = candidates.find((x) => x.id === Number(id));
    if (!c) return;
    setCandidate(c);
    
    const a = getContactWithDetails(c.contactIdA);
    const b = getContactWithDetails(c.contactIdB);
    
    if (a && b) {
      setComparison(buildMergeComparison(a, b));
    }
  }, [id]);

  const handleSourceChange = useCallback((fieldKey: string, source: FieldSource) => {
    setComparison((prev) => {
      if (!prev) return prev;
      const newFields = prev.fields.map(f => {
        if (f.key === fieldKey) {
          const resolved = source === 'a' ? f.valueA : source === 'b' ? f.valueB : f.resolvedValue;
          return {
            ...f,
            selectedSource: source,
            resolvedValue: resolved as any,
          } as FieldComparison;
        }
        return f;
      });
      return { ...prev, fields: newFields };
    });
  }, []);

  const handleMerge = useCallback(() => {
    if (!candidate || !comparison) return;

    Alert.alert(
      'Confirm Merge',
      `This will merge these two contacts exactly as previewed above. A backup snapshot will be saved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          style: 'destructive',
          onPress: () => executeSmartMerge(comparison),
        },
      ],
    );
  }, [candidate, comparison]);

  const executeSmartMerge = useCallback(
    (model: MergeComparisonModel) => {
      if (!candidate) return;
      setIsMerging(true);

      try {
        const survivor = model.contactA;
        const absorbed = model.contactB;

        // Save snapshot before merge
        const snapshot = JSON.stringify({ survivor, absorbed });
        recordMerge({
          survivorContactId: survivor.id,
          mergedContactIds: [absorbed.id],
          snapshotJson: snapshot,
        });

        // Save to centralized Undo Engine queue
        const undoPayload: UndoMergePayload = {
          survivorPreMerge: survivor,
          absorbedPreMerge: absorbed,
        };
        recordUndoAction({
          actionType: 'merge',
          actionDataJson: JSON.stringify(undoPayload),
          contactId: survivor.id,
        });
        useUndoStore.getState().setUndoableAction(`Contacts merged into "${survivor.displayName}".`);

        // Build the updates based on resolved fields
        const scalarUpdates: any = {};
        const tagsField = model.fields.find(f => f.key === 'tags');
        const phonesField = model.fields.find(f => f.key === 'phoneNumbers');
        const emailsField = model.fields.find(f => f.key === 'emails');

        for (const f of model.fields) {
          if (f.type === 'scalar') {
            scalarUpdates[f.key] = f.resolvedValue;
          }
        }
        
        if (tagsField) {
          scalarUpdates.tags = tagsField.resolvedValue;
        }

        // 1. Update Survivor Scalar Fields
        updateContact(survivor.id, scalarUpdates);

        // 2. Update Phones & Emails (merged arrays)
        if (phonesField && Array.isArray(phonesField.resolvedValue)) {
            // Deduplicate phones based on normalized number
            const uniquePhones = new Map();
            for (const p of phonesField.resolvedValue) {
                if (!uniquePhones.has(p.normalizedNumber)) {
                    uniquePhones.set(p.normalizedNumber, p);
                }
            }
            replacePhonesByContactIdSync(survivor.id, Array.from(uniquePhones.values()));
        }

        if (emailsField && Array.isArray(emailsField.resolvedValue)) {
            // Deduplicate emails based on normalized email
            const uniqueEmails = new Map();
            for (const e of emailsField.resolvedValue) {
                if (!uniqueEmails.has(e.normalizedEmail)) {
                    uniqueEmails.set(e.normalizedEmail, e);
                }
            }
            deleteEmailsByContactId(survivor.id);
            for (const e of uniqueEmails.values()) {
                insertEmail({ contactId: survivor.id, label: e.label ?? undefined, email: e.email });
            }
        }

        // 3. Move notes and relationships
        const movedNotes = reassignNotes(absorbed.id, survivor.id);
        const relationshipResult = reassignRelationships(absorbed.id, survivor.id);
        const movedTemporary = transferTemporaryContact(absorbed.id, survivor.id);

        // 4. Delete the absorbed contact (cascade removes its original phones/emails)
        deleteContact(absorbed.id);

        // 5. Resolve duplicate candidate
        resolveDuplicateCandidate(candidate.id, 'merged');

        logAction('contacts_merged', survivor.id, {
          survivorId: survivor.id,
          absorbedId: absorbed.id,
          movedNotes,
          relationshipsUpdated: relationshipResult.updated,
          relationshipsRemoved: relationshipResult.removed,
          movedTemporary,
        });

        // Refresh pending count
        const newCount = getPendingDuplicates().length;
        setPendingDuplicateCount(newCount);

        Alert.alert('Merged', `Contacts successfully reconciled and merged.`);
        router.replace('/(tabs)/duplicates');
      } catch (err) {
        Alert.alert('Merge Failed', err instanceof Error ? err.message : String(err));
      } finally {
        setIsMerging(false);
      }
    },
    [candidate, setPendingDuplicateCount],
  );

  const handleIgnore = useCallback(() => {
    if (!candidate) return;
    try {
      resolveDuplicateCandidate(candidate.id, 'ignored');
      const newCount = getPendingDuplicates().length;
      setPendingDuplicateCount(newCount);
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Could not ignore this pair.');
    }
  }, [candidate, setPendingDuplicateCount]);

  if (!candidate || !comparison) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Duplicate candidate not found or loading...</Text>
        <Button onPress={() => router.back()} textColor={COLORS.primary}>Go Back</Button>
      </View>
    );
  }

  const conflictsCount = comparison.fields.filter(f => f.state === 'conflict').length;
  const matchCount = comparison.fields.filter(f => f.state === 'match').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
            <Text style={styles.title}>Resolve Merge</Text>
            <Text style={styles.subtitle}>
              Review each conflicting field. Matching fields have been auto-resolved. Contact B will be safely absorbed into Contact A.
            </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
             <Text style={styles.statValue}>{matchCount}</Text>
             <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={[styles.statBox, conflictsCount > 0 && styles.statBoxAlert]}>
             <Text style={[styles.statValue, conflictsCount > 0 && { color: COLORS.error }]}>{conflictsCount}</Text>
             <Text style={[styles.statLabel, conflictsCount > 0 && { color: COLORS.error }]}>Conflicts</Text>
          </View>
        </View>

        <View style={styles.fieldsContainer}>
            {comparison.fields.map((field) => (
                <ConflictFieldRow 
                  key={field.key} 
                  field={field} 
                  onSourceSelected={(src) => handleSourceChange(field.key, src)} 
                />
            ))}
        </View>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Why flagged as duplicate:</Text>
            {candidate.reasons.map((r) => (
              <Text key={r} style={styles.reason}>
                • {r.replace(/_/g, ' ')} (score: {candidate.score}/100)
              </Text>
            ))}
          </Card.Content>
        </Card>

      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <Button
            mode="contained"
            onPress={handleMerge}
            loading={isMerging}
            disabled={isMerging}
            icon="merge"
            buttonColor={COLORS.primary}
            style={styles.actionBtn}
          >
            Confirm Merge
        </Button>
        <Button
            mode="outlined"
            onPress={handleIgnore}
            disabled={isMerging}
            icon="eye-off"
            textColor={COLORS.textSecondary}
            style={styles.actionBtn}
          >
            Not a Duplicate
        </Button>
        <Button
            mode="text"
            onPress={() => router.back()}
            textColor={COLORS.textSecondary}
          >
            Cancel
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  header: {
      marginBottom: SPACING.xs,
  },
  title: {
      fontSize: FONT_SIZE.xl,
      fontWeight: 'bold',
      color: COLORS.textPrimary,
      marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  statsRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
  },
  statBox: {
      flex: 1,
      backgroundColor: COLORS.surface,
      padding: SPACING.sm,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.surfaceVariant,
  },
  statBoxAlert: {
      borderColor: COLORS.error,
      backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  statValue: {
      fontSize: FONT_SIZE.xl,
      fontWeight: 'bold',
      color: COLORS.primary,
  },
  statLabel: {
      fontSize: FONT_SIZE.xs,
      color: COLORS.textDisabled,
      textTransform: 'uppercase',
  },
  fieldsContainer: {
      gap: 2,
  },
  summaryCard: { backgroundColor: COLORS.surfaceVariant },
  summaryTitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  reason: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, paddingVertical: 2 },
  bottomBar: {
      padding: SPACING.md,
      backgroundColor: COLORS.surface,
      borderTopWidth: 1,
      borderTopColor: COLORS.surfaceVariant,
      gap: SPACING.sm,
  },
  actionBtn: { 
      paddingVertical: 4,
  },
  notFound: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
});
