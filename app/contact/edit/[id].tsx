/**
 * ContactForge — Contact Edit Screen
 *
 * Allows editing an existing local contact (name, phones, emails, notes, tags).
 * Changes are persisted to the local SQLite database only.
 * After saving, the user may optionally push the update to the native contacts book.
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, TextInput, Button, Chip, Divider } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getContactWithDetails,
  updateContact,
  deletePhonesByContactId,
  deleteEmailsByContactId,
  insertPhoneNumber,
  insertEmail,
} from '../../../src/db/repositories/contactRepository';
import { logAction } from '../../../src/db/repositories/auditRepository';
import { writeContactToNative } from '../../../src/services/writeBackService';
import { COLORS, SPACING, FONT_SIZE, CONTACT_TAGS } from '../../../src/constants';
import type { ContactWithDetails } from '../../../src/types';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contact, setContact] = useState<ContactWithDetails | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phones, setPhones] = useState<{ label: string; number: string }[]>([]);
  const [emails, setEmails] = useState<{ label: string; email: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    const c = getContactWithDetails(Number(id));
    if (!c) return;
    setContact(c);
    setFirstName(c.firstName ?? '');
    setLastName(c.lastName ?? '');
    setCompany(c.company ?? '');
    setJobTitle(c.jobTitle ?? '');
    setPhones(c.phoneNumbers.map((p) => ({ label: p.label ?? '', number: p.number })));
    setEmails(c.emails.map((e) => ({ label: e.label ?? '', email: e.email })));
    setNotes(c.notes ?? '');
    setIsTemporary(c.isTemporary);
    try { setSelectedTags(JSON.parse(c.tags) as string[]); } catch { setSelectedTags([]); }
  }, [id]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const updatePhone = useCallback((index: number, field: 'label' | 'number', value: string) => {
    setPhones((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }, []);

  const addPhone = useCallback(() => {
    setPhones((prev) => [...prev, { label: 'mobile', number: '' }]);
  }, []);

  const removePhone = useCallback((index: number) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateEmail = useCallback((index: number, field: 'label' | 'email', value: string) => {
    setEmails((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }, []);

  const addEmail = useCallback(() => {
    setEmails((prev) => [...prev, { label: 'home', email: '' }]);
  }, []);

  const removeEmail = useCallback((index: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    if (!firstName.trim() && !lastName.trim() && !company.trim() && phones.every((p) => !p.number.trim())) {
      Alert.alert('Missing Info', 'Please enter at least a name, company, or phone number.');
      return;
    }

    setIsSaving(true);
    try {
      const contactId = Number(id);

      updateContact(contactId, {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        company: company.trim() || null,
        jobTitle: jobTitle.trim() || null,
        notes: notes.trim() || null,
        isTemporary,
        tags: selectedTags,
      });

      // Replace phone numbers and emails
      deletePhonesByContactId(contactId);
      for (const p of phones) {
        if (p.number.trim()) {
          insertPhoneNumber({ contactId, label: p.label || undefined, number: p.number.trim() });
        }
      }

      deleteEmailsByContactId(contactId);
      for (const e of emails) {
        if (e.email.trim()) {
          insertEmail({ contactId, label: e.label || undefined, email: e.email.trim() });
        }
      }

      logAction('contact_updated', contactId, { firstName, lastName, company });
      router.replace(`/contact/${contactId}`);
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [id, firstName, lastName, company, jobTitle, phones, emails, notes, isTemporary, selectedTags]);

  const handlePushToDevice = useCallback(async () => {
    if (!contact) return;

    Alert.alert(
      'Push to Device Contacts',
      contact.nativeId
        ? `This will overwrite "${contact.displayName}" in your device's contacts book with the current local data.`
        : `This will create "${contact.displayName || 'this contact'}" in your device's contacts book.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Push',
          onPress: async () => {
            setIsPushing(true);
            try {
              const result = await writeContactToNative(Number(id));
              if (result.success) {
                Alert.alert(
                  'Done',
                  result.created
                    ? 'Contact was created in your device contacts book.'
                    : 'Device contact updated successfully.',
                );
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
  }, [contact, id]);

  if (!contact) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Contact not found.</Text>
        <Button onPress={() => router.back()} textColor={COLORS.primary}>Go Back</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Basic info */}
        <TextInput
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          textColor={COLORS.textPrimary}
          autoCapitalize="words"
        />
        <TextInput
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          textColor={COLORS.textPrimary}
          autoCapitalize="words"
        />
        <TextInput
          label="Company"
          value={company}
          onChangeText={setCompany}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          textColor={COLORS.textPrimary}
        />
        <TextInput
          label="Job Title"
          value={jobTitle}
          onChangeText={setJobTitle}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          textColor={COLORS.textPrimary}
        />

        {/* Phone numbers */}
        <SectionLabel icon="phone" label="Phone Numbers" />
        {phones.map((p, i) => (
          <View key={i} style={styles.fieldGroup}>
            <TextInput
              label="Label"
              value={p.label}
              onChangeText={(v) => updatePhone(i, 'label', v)}
              style={[styles.input, styles.labelInput]}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              textColor={COLORS.textPrimary}
              dense
            />
            <TextInput
              label="Number"
              value={p.number}
              onChangeText={(v) => updatePhone(i, 'number', v)}
              style={[styles.input, styles.valueInput]}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              textColor={COLORS.textPrimary}
              keyboardType="phone-pad"
              dense
            />
            <Button
              mode="text"
              onPress={() => removePhone(i)}
              compact
              textColor={COLORS.error}
              style={styles.removeBtn}
            >
              ✕
            </Button>
          </View>
        ))}
        <Button
          mode="text"
          onPress={addPhone}
          icon="plus"
          textColor={COLORS.secondary}
          compact
        >
          Add Phone
        </Button>

        <Divider style={styles.divider} />

        {/* Email addresses */}
        <SectionLabel icon="email" label="Email Addresses" />
        {emails.map((e, i) => (
          <View key={i} style={styles.fieldGroup}>
            <TextInput
              label="Label"
              value={e.label}
              onChangeText={(v) => updateEmail(i, 'label', v)}
              style={[styles.input, styles.labelInput]}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              textColor={COLORS.textPrimary}
              dense
            />
            <TextInput
              label="Email"
              value={e.email}
              onChangeText={(v) => updateEmail(i, 'email', v)}
              style={[styles.input, styles.valueInput]}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              textColor={COLORS.textPrimary}
              keyboardType="email-address"
              autoCapitalize="none"
              dense
            />
            <Button
              mode="text"
              onPress={() => removeEmail(i)}
              compact
              textColor={COLORS.error}
              style={styles.removeBtn}
            >
              ✕
            </Button>
          </View>
        ))}
        <Button
          mode="text"
          onPress={addEmail}
          icon="plus"
          textColor={COLORS.secondary}
          compact
        >
          Add Email
        </Button>

        <Divider style={styles.divider} />

        {/* Notes */}
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          textColor={COLORS.textPrimary}
          multiline
          numberOfLines={3}
        />

        {/* Temporary toggle */}
        <View style={styles.checkRow}>
          <Chip
            selected={isTemporary}
            onPress={() => setIsTemporary((v) => !v)}
            style={styles.tempChip}
            textStyle={{ color: isTemporary ? COLORS.warning : COLORS.textSecondary }}
            icon="clock-outline"
          >
            Temporary Contact
          </Chip>
        </View>

        {/* Tags */}
        <Text style={styles.tagsLabel}>Tags</Text>
        <View style={styles.tagsRow}>
          {CONTACT_TAGS.map((tag) => (
            <Chip
              key={tag}
              selected={selectedTags.includes(tag)}
              onPress={() => toggleTag(tag)}
              style={styles.tagChip}
              textStyle={{
                color: selectedTags.includes(tag) ? COLORS.accent : COLORS.textSecondary,
                fontSize: FONT_SIZE.xs,
              }}
            >
              {tag}
            </Chip>
          ))}
        </View>

        {/* Save */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving || isPushing}
          style={styles.saveBtn}
          buttonColor={COLORS.primary}
          icon="content-save"
        >
          Save Changes
        </Button>

        {/* Push to device */}
        <Button
          mode="outlined"
          onPress={handlePushToDevice}
          loading={isPushing}
          disabled={isSaving || isPushing}
          icon="cellphone-arrow-down"
          textColor={COLORS.secondary}
          style={styles.pushBtn}
        >
          {contact.nativeId ? 'Update Device Contact' : 'Push to Device Contacts'}
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

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.sectionLabel}>
      <MaterialCommunityIcons name={icon as any} color={COLORS.secondary} size={16} />
      <Text style={styles.sectionLabelText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.xs },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING.md, backgroundColor: COLORS.background,
  },
  notFound: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  input: { backgroundColor: COLORS.surface },
  sectionLabel: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.xs, marginTop: SPACING.sm, marginBottom: SPACING.xs,
  },
  sectionLabelText: {
    color: COLORS.secondary, fontSize: FONT_SIZE.sm,
    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  fieldGroup: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  labelInput: { flex: 1 },
  valueInput: { flex: 2 },
  removeBtn: { marginTop: SPACING.xs },
  divider: { backgroundColor: COLORS.divider, marginVertical: SPACING.xs },
  checkRow: { flexDirection: 'row', marginTop: SPACING.xs },
  tempChip: { backgroundColor: COLORS.surfaceVariant },
  tagsLabel: {
    color: COLORS.textSecondary, fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm, fontWeight: '600',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tagChip: { backgroundColor: COLORS.surfaceVariant },
  saveBtn: { marginTop: SPACING.md },
  pushBtn: { borderColor: COLORS.secondary },
});
