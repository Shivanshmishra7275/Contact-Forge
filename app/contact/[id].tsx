/**
 * ContactForge — Contact Detail Screen
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Card, Chip, Divider, Portal, Dialog, RadioButton } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getContactWithDetails,
  deleteContact,
} from '../../src/db/repositories/contactRepository';
import { getDuplicatesByContactId } from '../../src/db/repositories/duplicateRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { getNotesByContactId } from '../../src/db/repositories/noteRepository';
import { calculateContactHealthScore, getContactHealthGrade } from '../../src/services/contactHealthService';
import {
  markContactAsTemporary,
  unmarkContactAsTemporary,
  getTemporaryContactEntry,
} from '../../src/services/temporaryContactService';
import { isoToDisplay } from '../../src/utils/normalization';
import type { TemporaryContact, ContactNote } from '../../src/types';
import { COLORS, SPACING, FONT_SIZE } from '../../src/constants';
import type { ContactWithDetails } from '../../src/types';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [tempEntry, setTempEntry] = useState<TemporaryContact | null>(null);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [healthScore, setHealthScore] = useState(0);
  const [healthGrade, setHealthGrade] = useState('C');

  const [isTempModalVisible, setTempModalVisible] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<'none' | '1day' | '1week' | '1month'>('none');

  const load = useCallback(() => {
    const c = getContactWithDetails(Number(id));
    setContact(c);
    if (c) {
      const dupes = getDuplicatesByContactId(c.id);
      setHasDuplicates(dupes.length > 0);
      setTempEntry(getTemporaryContactEntry(c.id));
      setNotes(getNotesByContactId(c.id));
      const score = calculateContactHealthScore(c.id);
      setHealthScore(score.score);
      setHealthGrade(getContactHealthGrade(score.score));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleMarkTemporary = useCallback(() => {
    if (!contact) return;
    let expiresAt: string | null = null;
    if (selectedExpiry !== 'none') {
      const d = new Date();
      if (selectedExpiry === '1day') d.setDate(d.getDate() + 1);
      else if (selectedExpiry === '1week') d.setDate(d.getDate() + 7);
      else if (selectedExpiry === '1month') d.setMonth(d.getMonth() + 1);
      expiresAt = d.toISOString();
    }
    
    markContactAsTemporary(contact.id, expiresAt, null);
    setTempModalVisible(false);
    load();
  }, [contact, selectedExpiry, load]);

  const handleUnmarkTemporary = useCallback(() => {
    if (!contact) return;
    unmarkContactAsTemporary(contact.id);
    load();
  }, [contact, load]);

  const handleDelete = useCallback(() => {
    if (!contact) return;
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete "${contact.displayName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            logAction('contact_deleted', contact.id, { displayName: contact.displayName });
            deleteContact(contact.id);
            router.back();
          },
        },
      ],
    );
  }, [contact]);

  if (!contact) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Contact not found.</Text>
        <Button onPress={() => router.back()} textColor={COLORS.primary}>Go Back</Button>
      </View>
    );
  }

  const tags: string[] = (() => { try { return JSON.parse(contact.tags) as string[]; } catch { return []; } })();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Avatar & Name */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(contact.displayName)}</Text>
          </View>
          <Text style={styles.displayName}>{contact.displayName}</Text>
          {contact.company && <Text style={styles.company}>{contact.company}</Text>}
          {contact.jobTitle && <Text style={styles.jobTitle}>{contact.jobTitle}</Text>}
          
          {/* Health Score Badge */}
          <View style={styles.healthBadge}>
            <MaterialCommunityIcons name="heart-pulse" size={16} color={COLORS.primary} />
            <Text style={styles.healthScoreText}>{healthScore}% • Grade {healthGrade}</Text>
          </View>
        </View>

        {/* Duplicate warning */}
        {hasDuplicates && (
          <Button
            mode="outlined"
            icon="content-copy"
            onPress={() => router.push('/(tabs)/duplicates')}
            textColor={COLORS.warning}
            style={styles.dupeBtn}
          >
            Duplicate candidates found
          </Button>
        )}

        {/* Temporary Contact Info */}
        {contact.isTemporary ? (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.tempHeader}>
                <MaterialCommunityIcons name="timer-sand" size={24} color={COLORS.warning} />
                <Text style={styles.tempTitle}>Temporary Contact</Text>
              </View>
              {tempEntry?.expiresAt ? (
                <Text style={styles.tempDesc}>Expires at: {isoToDisplay(tempEntry.expiresAt)}</Text>
              ) : (
                <Text style={styles.tempDesc}>No expiry date set.</Text>
              )}
              <Button style={{ marginTop: 8 }} mode="outlined" onPress={handleUnmarkTemporary}>
                Remove Temporary Status
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <Button mode="text" icon="timer-sand" onPress={() => setTempModalVisible(true)}>
            Mark as Temporary
          </Button>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.tagsContent}>
              {tags.map((t) => (
                <Chip key={t} style={styles.tag} textStyle={{ color: COLORS.accent, fontSize: FONT_SIZE.xs }}>
                  {t}
                </Chip>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Phone numbers */}
        {contact.phoneNumbers.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title="Phone Numbers"
              titleStyle={styles.sectionTitle}
              left={() => <MaterialCommunityIcons name="phone" color={COLORS.secondary} size={20} />}
            />
            <Card.Content>
              {contact.phoneNumbers.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <Divider style={styles.divider} />}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{p.label ?? 'mobile'}</Text>
                    <Text style={styles.fieldValue}>{p.number}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Emails */}
        {contact.emails.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title="Email Addresses"
              titleStyle={styles.sectionTitle}
              left={() => <MaterialCommunityIcons name="email" color={COLORS.secondary} size={20} />}
            />
            <Card.Content>
              {contact.emails.map((e, i) => (
                <View key={e.id}>
                  {i > 0 && <Divider style={styles.divider} />}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{e.label ?? 'home'}</Text>
                    <Text style={styles.fieldValue}>{e.email}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        {contact.notes && (
          <Card style={styles.card}>
            <Card.Title title="Notes" titleStyle={styles.sectionTitle} />
            <Card.Content>
              <Text style={styles.notes}>{contact.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Contextual Notes (Phase 8) */}
        {notes.length > 0 && (
          <Card style={styles.card}>
            <Card.Title
              title="Memory Notes"
              titleStyle={styles.sectionTitle}
              left={() => <MaterialCommunityIcons name="notebook" color={COLORS.secondary} size={20} />}
            />
            <Card.Content>
              {notes.map((note, i) => (
                <View key={note.id}>
                  {i > 0 && <Divider style={styles.divider} />}
                  <View style={styles.noteRow}>
                    <Chip style={styles.categoryChip} size={28} textStyle={{ fontSize: FONT_SIZE.xs }}>
                      {note.category}
                    </Chip>
                    <Text style={styles.noteText}>{note.content}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Original Notes */}
        <Card style={styles.card}>
          <Card.Content>
            {contact.syncedAt && (
              <Text style={styles.meta}>Synced: {isoToDisplay(contact.syncedAt)}</Text>
            )}
            <Text style={styles.meta}>Added: {isoToDisplay(contact.createdAt)}</Text>
            {contact.nativeId && (
              <Text style={styles.meta}>Native ID: {contact.nativeId}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Delete button */}
        <Button
          mode="outlined"
          onPress={handleDelete}
          icon="delete"
          textColor={COLORS.error}
          style={styles.deleteBtn}
        >
          Delete Contact
        </Button>
      </ScrollView>

      {/* Temporary Setup Modal */}
      <Portal>
        <Dialog visible={isTempModalVisible} onDismiss={() => setTempModalVisible(false)} style={styles.dialog}>
          <Dialog.Title>Mark as Temporary</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 12 }}>Select when this contact should expire:</Text>
            <RadioButton.Group onValueChange={v => setSelectedExpiry(v as any)} value={selectedExpiry}>
              <RadioButton.Item label="Never (Manual cleanup)" value="none" />
              <RadioButton.Item label="1 Day" value="1day" />
              <RadioButton.Item label="1 Week" value="1week" />
              <RadioButton.Item label="1 Month" value="1month" />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTempModalVisible(false)}>Cancel</Button>
            <Button onPress={handleMarkTemporary} textColor={COLORS.primary}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, backgroundColor: COLORS.background },
  hero: { alignItems: 'center', paddingVertical: SPACING.lg, gap: SPACING.xs },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.xl },
  displayName: { color: COLORS.textPrimary, fontSize: FONT_SIZE.xxl, fontWeight: '700', textAlign: 'center' },
  company: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  jobTitle: { color: COLORS.textDisabled, fontSize: FONT_SIZE.sm },
  dupeBtn: { borderColor: COLORS.warning, marginBottom: SPACING.xs },
  card: { backgroundColor: COLORS.surface },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md },
  tagsContent: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tag: { backgroundColor: COLORS.surfaceVariant },
  divider: { backgroundColor: COLORS.divider, marginVertical: SPACING.xs },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.xs },
  fieldLabel: { color: COLORS.textDisabled, fontSize: FONT_SIZE.sm, textTransform: 'capitalize', flex: 1 },
  fieldValue: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, flex: 2, textAlign: 'right' },
  notes: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  meta: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, marginBottom: 2 },
  deleteBtn: { marginTop: SPACING.md, borderColor: COLORS.error },
  notFound: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  tempHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  tempTitle: { fontSize: FONT_SIZE.md, marginLeft: SPACING.sm, fontWeight: 'bold' },
  tempDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  dialog: { backgroundColor: COLORS.surface },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceVariant,
    marginTop: SPACING.sm,
  },
  healthScoreText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  noteRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  categoryChip: {
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 18,
  },
});
