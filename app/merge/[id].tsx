/**
 * ContactForge — Merge Review Screen
 *
 * Shows a field-level preview of what a merge would produce.
 * The user selects the survivor contact and confirms before any data changes.
 * A full snapshot is saved to merge_history before the merge executes.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Card, RadioButton, Divider } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getContactWithDetails,
  deleteContact,
  getPhonesByContactId,
  insertPhoneNumber,
  insertEmail,
  deleteEmailsByContactId,
  deletePhonesByContactId,
} from '../../src/db/repositories/contactRepository';
import {
  getPendingDuplicates,
  resolveDuplicateCandidate,
  recordMerge,
} from '../../src/db/repositories/duplicateRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE } from '../../src/constants';
import type { ContactWithDetails, DuplicateCandidate } from '../../src/types';

export default function MergeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);

  const [candidate, setCandidate] = useState<DuplicateCandidate | null>(null);
  const [contactA, setContactA] = useState<ContactWithDetails | null>(null);
  const [contactB, setContactB] = useState<ContactWithDetails | null>(null);
  const [survivorId, setSurvivorId] = useState<'a' | 'b'>('a');
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    const candidates = getPendingDuplicates();
    const c = candidates.find((x) => x.id === Number(id));
    if (!c) return;
    setCandidate(c);
    setContactA(getContactWithDetails(c.contactIdA));
    setContactB(getContactWithDetails(c.contactIdB));
  }, [id]);

  const handleMerge = useCallback(() => {
    if (!candidate || !contactA || !contactB) return;

    const survivor = survivorId === 'a' ? contactA : contactB;
    const absorbed = survivorId === 'a' ? contactB : contactA;

    Alert.alert(
      'Confirm Merge',
      `"${absorbed.displayName}" will be deleted and its data merged into "${survivor.displayName}". A backup snapshot will be saved. This action can be reviewed in audit logs.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Merge',
          style: 'destructive',
          onPress: () => executeMerge(survivor, absorbed),
        },
      ],
    );
  }, [candidate, contactA, contactB, survivorId]);

  const executeMerge = useCallback(
    (survivor: ContactWithDetails, absorbed: ContactWithDetails) => {
      if (!candidate) return;
      setIsMerging(true);

      try {
        // Save snapshot before merge
        const snapshot = JSON.stringify({ survivor, absorbed });
        recordMerge({
          survivorContactId: survivor.id,
          mergedContactIds: [absorbed.id],
          snapshotJson: snapshot,
        });

        // Merge phones: add absorbed's phones to survivor if not duplicate
        const existingNormalized = new Set(survivor.phoneNumbers.map((p) => p.normalizedNumber));
        for (const p of absorbed.phoneNumbers) {
          if (!existingNormalized.has(p.normalizedNumber)) {
            insertPhoneNumber({ contactId: survivor.id, label: p.label ?? undefined, number: p.number });
          }
        }

        // Merge emails
        const existingEmails = new Set(survivor.emails.map((e) => e.normalizedEmail));
        for (const e of absorbed.emails) {
          if (!existingEmails.has(e.normalizedEmail)) {
            insertEmail({ contactId: survivor.id, label: e.label ?? undefined, email: e.email });
          }
        }

        // Delete the absorbed contact (cascade removes phones/emails)
        deleteContact(absorbed.id);

        // Resolve the duplicate candidate
        resolveDuplicateCandidate(candidate.id, 'merged');

        logAction('contacts_merged', survivor.id, {
          survivorId: survivor.id,
          absorbedId: absorbed.id,
        });

        // Refresh pending count
        const newCount = getPendingDuplicates().length;
        setPendingDuplicateCount(newCount);

        Alert.alert('Merged', `Contacts merged successfully into "${survivor.displayName}".`);
        router.replace('/(tabs)/duplicates');
      } catch (err) {
        Alert.alert('Merge Failed', err instanceof Error ? err.message : String(err));
      } finally {
        setIsMerging(false);
      }
    },
    [candidate],
  );

  if (!candidate || !contactA || !contactB) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Duplicate candidate not found.</Text>
        <Button onPress={() => router.back()} textColor={COLORS.primary}>Go Back</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Choose which contact to keep. The other will be deleted after its data is merged in.
        </Text>

        {/* Survivor selection */}
        <RadioButton.Group
          value={survivorId}
          onValueChange={(v) => setSurvivorId(v as 'a' | 'b')}
        >
          <ContactPreviewCard
            contact={contactA}
            value="a"
            label="Contact A"
            selected={survivorId === 'a'}
          />
          <ContactPreviewCard
            contact={contactB}
            value="b"
            label="Contact B"
            selected={survivorId === 'b'}
          />
        </RadioButton.Group>

        {/* Merge reasons */}
        <Card style={styles.reasonsCard}>
          <Card.Content>
            <Text style={styles.reasonsTitle}>Why flagged as duplicate:</Text>
            {candidate.reasons.map((r) => (
              <Text key={r} style={styles.reason}>
                • {r.replace(/_/g, ' ')} (score: {candidate.score}/100)
              </Text>
            ))}
          </Card.Content>
        </Card>

        {/* Action buttons */}
        <Button
          mode="contained"
          onPress={handleMerge}
          loading={isMerging}
          disabled={isMerging}
          icon="merge"
          buttonColor={COLORS.primary}
          style={styles.mergeBtn}
        >
          Merge Contacts
        </Button>
        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={COLORS.textSecondary}
        >
          Cancel
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ContactPreviewCardProps {
  contact: ContactWithDetails;
  value: string;
  label: string;
  selected: boolean;
}

function ContactPreviewCard({ contact, value, label, selected }: ContactPreviewCardProps) {
  return (
    <Card style={[styles.contactCard, selected && styles.contactCardSelected]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <RadioButton value={value} color={COLORS.primary} />
          <View style={styles.headerText}>
            <Text style={styles.contactLabel}>{label} {selected ? '(KEEP)' : ''}</Text>
            <Text style={styles.contactName}>{contact.displayName}</Text>
          </View>
        </View>
        {contact.company && <Text style={styles.company}>{contact.company}</Text>}
        {contact.phoneNumbers.map((p) => (
          <Text key={p.id} style={styles.detail}>📞 {p.number}</Text>
        ))}
        {contact.emails.map((e) => (
          <Text key={e.id} style={styles.detail}>✉️ {e.email}</Text>
        ))}
      </Card.Content>
    </Card>
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
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.sm,
    borderRadius: 8,
  },
  contactCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contactCardSelected: { borderColor: COLORS.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  headerText: { flex: 1 },
  contactLabel: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  contactName: { color: COLORS.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  company: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  detail: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, paddingVertical: 2 },
  reasonsCard: { backgroundColor: COLORS.surfaceVariant },
  reasonsTitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  reason: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, paddingVertical: 2 },
  mergeBtn: { marginTop: SPACING.xs },
  notFound: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
});
