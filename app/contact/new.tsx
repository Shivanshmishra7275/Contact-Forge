/**
 * ContactForge — New Contact Screen
 *
 * Allows creating a contact that is stored locally only.
 * Does NOT write back to the device's native contact book.
 * (Native write-back is a future phase feature.)
 */

import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  insertContact,
  insertPhoneNumber,
  insertEmail,
} from '../../src/db/repositories/contactRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { COLORS, SPACING, FONT_SIZE, CONTACT_TAGS } from '../../src/constants';

export default function NewContactScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isTemporary, setIsTemporary] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!firstName.trim() && !lastName.trim() && !phone.trim()) {
      Alert.alert('Missing Info', 'Please enter at least a name or phone number.');
      return;
    }

    setIsSaving(true);
    try {
      const id = insertContact({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
        isTemporary,
        tags: selectedTags,
      });

      if (phone.trim()) {
        insertPhoneNumber({ contactId: id, number: phone.trim() });
      }
      if (email.trim()) {
        insertEmail({ contactId: id, email: email.trim() });
      }

      logAction('contact_created', id, { firstName, lastName, isTemporary });
      router.push(`/contact/${id}`);
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [firstName, lastName, company, phone, email, notes, isTemporary, selectedTags]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.notice}>
          This contact will be stored locally only and will not be written to your device's contact book.
        </Text>

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
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          textColor={COLORS.textPrimary}
          keyboardType="phone-pad"
        />
        <TextInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.border}
          activeOutlineColor={COLORS.primary}
          textColor={COLORS.textPrimary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
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
            onPress={() => setIsTemporary(!isTemporary)}
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

        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveBtn}
          buttonColor={COLORS.primary}
        >
          Save Contact
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.sm },
  notice: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    backgroundColor: COLORS.surfaceVariant,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  input: { backgroundColor: COLORS.surface },
  checkRow: { flexDirection: 'row', marginTop: SPACING.xs },
  tempChip: { backgroundColor: COLORS.surfaceVariant },
  tagsLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
    fontWeight: '600',
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  tagChip: { backgroundColor: COLORS.surfaceVariant },
  saveBtn: { marginTop: SPACING.md },
});
