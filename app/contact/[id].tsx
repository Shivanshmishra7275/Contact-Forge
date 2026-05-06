/**
 * ContactForge — Contact Detail Screen
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, Button, Card, Chip, Divider, FAB } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getContactWithDetails,
  deleteContact,
} from '../../src/db/repositories/contactRepository';
import { getDuplicatesByContactId } from '../../src/db/repositories/duplicateRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { writeContactToNative } from '../../src/services/writeBackService';
import { isoToDisplay, parseTagsSafe } from '../../src/utils/normalization';
import { COLORS, SPACING, FONT_SIZE } from '../../src/constants';
import type { ContactWithDetails } from '../../src/types';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const load = useCallback(() => {
    const c = getContactWithDetails(Number(id));
    setContact(c);
    if (c) {
      const dupes = getDuplicatesByContactId(c.id);
      setHasDuplicates(dupes.length > 0);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

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

  const handlePushToDevice = useCallback(async () => {
    if (!contact) return;
    Alert.alert(
      'Push to Device Contacts',
      contact.nativeId
        ? `Update "${contact.displayName}" in your device contacts book with the current local data?`
        : `Create "${contact.displayName}" in your device contacts book?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Push',
          onPress: async () => {
            setIsPushing(true);
            try {
              const result = await writeContactToNative(contact.id);
              if (result.success) {
                Alert.alert(
                  'Done',
                  result.created
                    ? 'Contact created in your device contacts book.'
                    : 'Device contact updated successfully.',
                );
                load(); // Refresh (native_id may have changed)
              } else {
                Alert.alert('Push Failed', result.error);
              }
            } finally {
              setIsPushing(false);
            }
          },
        },
      ],
    );
  }, [contact, load]);

  if (!contact) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Contact not found.</Text>
        <Button onPress={() => router.back()} textColor={COLORS.primary}>Go Back</Button>
      </View>
    );
  }

  const tags = parseTagsSafe(contact.tags);

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

        {/* Metadata */}
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

        {/* Push to device */}
        <Button
          mode="outlined"
          onPress={handlePushToDevice}
          loading={isPushing}
          disabled={isPushing}
          icon="cellphone-arrow-down"
          textColor={COLORS.secondary}
          style={styles.pushBtn}
        >
          {contact.nativeId ? 'Update Device Contact' : 'Push to Device Contacts'}
        </Button>
      </ScrollView>

      {/* Edit FAB */}
      <FAB
        icon="pencil"
        style={styles.fab}
        onPress={() => router.push(`/contact/edit/${contact.id}`)}
        color={COLORS.textPrimary}
        accessibilityLabel="Edit contact"
      />
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
  pushBtn: { marginTop: SPACING.xs, borderColor: COLORS.secondary },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  notFound: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
});
