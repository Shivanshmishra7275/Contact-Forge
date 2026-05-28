/**
 * ContactForge — Edit Contact Screen
 */

import { useCallback, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getContactWithDetails,
  updateContact,
} from '../../src/db/repositories/contactRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { COLORS, SPACING, FONT_SIZE, CONTACT_TAGS } from '../../src/constants';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const contact = getContactWithDetails(Number(id));
    if (contact) {
      setFirstName(contact.firstName || '');
      setLastName(contact.lastName || '');
      setCompany(contact.company || '');
      setJobTitle(contact.jobTitle || '');
      setNotes(contact.notes || '');
      
      try {
        const parsedTags = JSON.parse(contact.tags || '[]');
        setSelectedTags(parsedTags);
      } catch {
        setSelectedTags([]);
      }
      setIsLoaded(true);
    } else {
      Alert.alert('Error', 'Contact not found');
      router.back();
    }
  }, [id]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSave = useCallback(() => {
    if (!firstName.trim() && !lastName.trim()) {
      Alert.alert('Missing Info', 'Please enter at least a name.');
      return;
    }

    setIsSaving(true);
    try {
      updateContact(Number(id), {
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        company: company.trim() || null,
        jobTitle: jobTitle.trim() || null,
        notes: notes.trim() || null,
        tags: selectedTags,
      });

      logAction('contact_updated', Number(id), { firstName, lastName });
      router.back();
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }, [id, firstName, lastName, company, jobTitle, notes, selectedTags]);

  if (!isLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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
          Save Changes
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
  input: { backgroundColor: COLORS.surface },
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
