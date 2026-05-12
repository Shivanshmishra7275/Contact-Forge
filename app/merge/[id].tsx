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
  updateContact,
  insertPhoneNumber,
  insertEmail,
} from '../../src/db/repositories/contactRepository';
import {
  getPendingDuplicates,
  resolveDuplicateCandidate,
  recordMerge,
} from '../../src/db/repositories/duplicateRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { getNotesByContactId, reassignNotes } from '../../src/db/repositories/noteRepository';
import { getRelationshipsByContactId, reassignRelationships } from '../../src/db/repositories/relationshipRepository';
import { transferTemporaryContact } from '../../src/db/repositories/temporaryContactRepository';
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
  const [noteCounts, setNoteCounts] = useState({ a: 0, b: 0 });
  const [relationshipCounts, setRelationshipCounts] = useState({ a: 0, b: 0 });

  useEffect(() => {
    const candidates = getPendingDuplicates();
    const c = candidates.find((x) => x.id === Number(id));
    if (!c) return;
    setCandidate(c);
    const a = getContactWithDetails(c.contactIdA);
    const b = getContactWithDetails(c.contactIdB);
    setContactA(a);
    setContactB(b);
    if (a) {
      setNoteCounts((prev) => ({ ...prev, a: getNotesByContactId(a.id).length }));
      setRelationshipCounts((prev) => ({ ...prev, a: getRelationshipsByContactId(a.id).length }));
    }
    if (b) {
      setNoteCounts((prev) => ({ ...prev, b: getNotesByContactId(b.id).length }));
      setRelationshipCounts((prev) => ({ ...prev, b: getRelationshipsByContactId(b.id).length }));
    }
  }, [id]);

  const parseTags = useCallback((raw: string): string[] => {
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }, []);

  const mergeContactFields = useCallback((survivor: ContactWithDetails, absorbed: ContactWithDetails) => {
    const updates: Partial<{
      firstName: string | null;
      lastName: string | null;
      company: string | null;
      jobTitle: string | null;
      notes: string | null;
      birthday: string | null;
      imageUri: string | null;
      hasThumbnail: boolean;
      isTemporary: boolean;
      isGhost: boolean;
      tags: string[];
      syncedAt: string;
    }> = {};

    if (!survivor.firstName && absorbed.firstName) updates.firstName = absorbed.firstName;
    if (!survivor.lastName && absorbed.lastName) updates.lastName = absorbed.lastName;
    if (!survivor.company && absorbed.company) updates.company = absorbed.company;
    if (!survivor.jobTitle && absorbed.jobTitle) updates.jobTitle = absorbed.jobTitle;
    if (!survivor.notes && absorbed.notes) updates.notes = absorbed.notes;
    if (!survivor.birthday && absorbed.birthday) updates.birthday = absorbed.birthday;
    if (!survivor.imageUri && absorbed.imageUri) {
      updates.imageUri = absorbed.imageUri;
      updates.hasThumbnail = absorbed.hasThumbnail;
    }
    if (!survivor.syncedAt && absorbed.syncedAt) updates.syncedAt = absorbed.syncedAt;
    if (survivor.isGhost && !absorbed.isGhost) updates.isGhost = false;
    if (!survivor.isTemporary && absorbed.isTemporary) updates.isTemporary = true;

    const tagsA = parseTags(survivor.tags);
    const tagsB = parseTags(absorbed.tags);
    const mergedTags = Array.from(new Set([...tagsA, ...tagsB]));
    if (mergedTags.length !== tagsA.length) updates.tags = mergedTags;

    if (Object.keys(updates).length > 0) {
      updateContact(survivor.id, updates);
    }
  }, [parseTags]);

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

        // Merge core fields and tags (only fill gaps on survivor)
        mergeContactFields(survivor, absorbed);

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

        // Move notes and relationships
        const movedNotes = reassignNotes(absorbed.id, survivor.id);
        const relationshipResult = reassignRelationships(absorbed.id, survivor.id);
        const movedTemporary = transferTemporaryContact(absorbed.id, survivor.id);

        // Delete the absorbed contact (cascade removes phones/emails)
        deleteContact(absorbed.id);

        // Resolve the duplicate candidate
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

        Alert.alert('Merged', `Contacts merged successfully into "${survivor.displayName}".`);
        router.replace('/(tabs)/duplicates');
      } catch (err) {
        Alert.alert('Merge Failed', err instanceof Error ? err.message : String(err));
      } finally {
        setIsMerging(false);
      }
    },
    [candidate, mergeContactFields],
  );

  if (!candidate || !contactA || !contactB) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Duplicate candidate not found.</Text>
        <Button onPress={() => router.back()} textColor={COLORS.primary}>Go Back</Button>
      </View>
    );
  }

  const tagsA = parseTags(contactA.tags);
  const tagsB = parseTags(contactB.tags);
  const absorbedNotes = survivorId === 'a' ? noteCounts.b : noteCounts.a;
  const absorbedRelationships = survivorId === 'a' ? relationshipCounts.b : relationshipCounts.a;
  const absorbedTags = survivorId === 'a' ? tagsB.length : tagsA.length;
  const absorbedLabel = survivorId === 'a' ? 'Contact B' : 'Contact A';

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

        {/* Merge impact summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.reasonsTitle}>Merge impact for {absorbedLabel}:</Text>
            <Text style={styles.reason}>• {absorbedNotes} memory note{absorbedNotes !== 1 ? 's' : ''}</Text>
            <Text style={styles.reason}>• {absorbedRelationships} relationship link{absorbedRelationships !== 1 ? 's' : ''}</Text>
            <Text style={styles.reason}>• {absorbedTags} tag{absorbedTags !== 1 ? 's' : ''}</Text>
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
  summaryCard: { backgroundColor: COLORS.surface },
  reasonsTitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  reason: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, paddingVertical: 2 },
  mergeBtn: { marginTop: SPACING.xs },
  notFound: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
});
