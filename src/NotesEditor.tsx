/**
 * ContactForge — Notes Editor Component
 * Premium note management UI for contact memory features
 * 
 * Created by: T.G.S Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 * 
 * Features:
 * - Add, edit, delete contextual notes
 * - Category support (where_met, important_dates, family, work, custom)
 * - Full CRUD operations with UI feedback
 * - Professional styling with Material Design
 */

import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, TextInput, Portal, Dialog, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getNotesByContactId,
  createNote,
  updateNote,
  deleteNote,
} from '../db/repositories/noteRepository';
import { COLORS, SPACING, FONT_SIZE } from '../constants';
import type { ContactNote } from '../types';

interface NotesEditorProps {
  contactId: number;
  onClose: () => void;
}

/** Supported note categories for contextual organization */
const NOTE_CATEGORIES = ['where_met', 'important_dates', 'family', 'work', 'custom'] as const;

/**
 * NotesEditor Component
 * 
 * Provides full note management interface with:
 * - Category-based organization
 * - Real-time add/edit/delete
 * - Persistent storage via SQLite
 * - Professional Material Design UI
 */
export function NotesEditor({ contactId, onClose }: NotesEditorProps) {
  const [notes, setNotes] = useState<ContactNote[]>(getNotesByContactId(contactId));
  const [newCategory, setNewCategory] = useState<'where_met' | 'important_dates' | 'family' | 'work' | 'custom'>('where_met');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  /**
   * Add new note to contact
   * - Validates content is not empty
   * - Persists to SQLite
   * - Updates local state
   * - Resets form
   */
  const handleAddNote = useCallback(() => {
    if (!newContent.trim()) {
      Alert.alert('Empty note', 'Please enter note content');
      return;
    }
    const note = createNote(contactId, newCategory, newContent);
    setNotes([...notes, note]);
    setNewContent('');
    setNewCategory('where_met');
  }, [contactId, newCategory, newContent, notes]);

  /**
   * Update existing note
   * - Validates content
   * - Persists changes
   * - Updates local state
   * - Closes edit dialog
   */
  const handleUpdateNote = useCallback(() => {
    if (!editingId || !editContent.trim()) {
      Alert.alert('Invalid', 'Please enter note content');
      return;
    }
    updateNote(editingId, editContent);
    setNotes(notes.map(n => n.id === editingId ? { ...n, content: editContent, updatedAt: new Date().toISOString() } : n));
    setEditingId(null);
    setEditContent('');
    setShowDialog(false);
  }, [editingId, editContent, notes]);

  /**
   * Delete note with confirmation
   * - Shows alert confirmation
   * - Persists deletion to SQLite
   * - Updates local state
   */
  const handleDeleteNote = useCallback((id: number) => {
    Alert.alert('Delete Note', 'Remove this note permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteNote(id);
          setNotes(notes.filter(n => n.id !== id));
        },
      },
    ]);
  }, [notes]);

  /**
   * Get appropriate icon for category
   * Used for visual category identification
   */
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'where_met': return 'map-marker';
      case 'important_dates': return 'calendar';
      case 'family': return 'account-multiple';
      case 'work': return 'briefcase';
      default: return 'note';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <Text style={styles.title}>Contact Notes</Text>
        <Button onPress={onClose} icon="close">Close</Button>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Add new note card */}
        <Card style={styles.card}>
          <Card.Title title="Add Note" titleStyle={styles.cardTitle} />
          <Card.Content>
            {/* Category selector with segmented buttons */}
            <SegmentedButtons
              value={newCategory}
              onValueChange={(value) => setNewCategory(value as any)}
              buttons={NOTE_CATEGORIES.map(cat => ({
                value: cat,
                label: cat,
              }))}
              style={styles.segmented}
            />
            {/* Note content input */}
            <TextInput
              label="Note content"
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              textColor={COLORS.textPrimary}
            />
            {/* Add button */}
            <Button
              mode="contained"
              onPress={handleAddNote}
              style={styles.addBtn}
              buttonColor={COLORS.primary}
            >
              Add Note
            </Button>
          </Card.Content>
        </Card>

        {/* Display existing notes or empty state */}
        {notes.length === 0 ? (
          <Text style={styles.empty}>No notes yet. Add one above!</Text>
        ) : (
          notes.map((note) => (
            <Card key={note.id} style={styles.noteCard}>
              <Card.Content>
                {/* Note header with category and actions */}
                <View style={styles.noteHeader}>
                  <View style={styles.categoryBadge}>
                    <MaterialCommunityIcons name={getCategoryIcon(note.category) as any} size={14} color={COLORS.primary} />
                    <Text style={styles.categoryLabel}>{note.category}</Text>
                  </View>
                  <View style={styles.actions}>
                    <Button
                      mode="text"
                      compact
                      onPress={() => {
                        setEditingId(note.id);
                        setEditContent(note.content);
                        setShowDialog(true);
                      }}
                      textColor={COLORS.primary}
                      icon="pencil"
                    >
                      Edit
                    </Button>
                    <Button
                      mode="text"
                      compact
                      onPress={() => handleDeleteNote(note.id)}
                      textColor={COLORS.error}
                      icon="delete"
                    >
                      Delete
                    </Button>
                  </View>
                </View>
                {/* Note content */}
                <Text style={styles.noteContent}>{note.content}</Text>
                {/* Timestamp */}
                <Text style={styles.noteTime}>Updated {new Date(note.updatedAt).toLocaleDateString()}</Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Edit dialog modal */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)} style={styles.dialog}>
          <Dialog.Title>Edit Note</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Note content"
              value={editContent}
              onChangeText={setEditContent}
              multiline
              numberOfLines={4}
              mode="outlined"
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              textColor={COLORS.textPrimary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateNote} buttonColor={COLORS.primary}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm 
  },
  title: { 
    color: COLORS.primary, 
    fontSize: FONT_SIZE.lg, 
    fontWeight: '700' 
  },
  scroll: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  card: { 
    backgroundColor: COLORS.surface, 
    marginBottom: SPACING.md 
  },
  cardTitle: { color: COLORS.textPrimary },
  segmented: { marginBottom: SPACING.md },
  input: { 
    backgroundColor: COLORS.surface, 
    marginBottom: SPACING.md 
  },
  addBtn: { marginTop: SPACING.sm },
  empty: { 
    color: COLORS.textDisabled, 
    textAlign: 'center', 
    paddingVertical: SPACING.lg 
  },
  noteCard: { 
    backgroundColor: COLORS.surface, 
    marginBottom: SPACING.sm 
  },
  noteHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: SPACING.sm 
  },
  categoryBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 4, 
    backgroundColor: COLORS.surfaceVariant, 
    borderRadius: 12 
  },
  categoryLabel: { 
    color: COLORS.primary, 
    fontSize: FONT_SIZE.xs, 
    fontWeight: '600' 
  },
  actions: { 
    flexDirection: 'row', 
    gap: SPACING.xs 
  },
  noteContent: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.sm, 
    lineHeight: 20, 
    marginBottom: SPACING.xs 
  },
  noteTime: { 
    color: COLORS.textDisabled, 
    fontSize: FONT_SIZE.xs 
  },
  dialog: { backgroundColor: COLORS.surface },
});
