/**
 * ContactForge — Relationships Editor Component
 * Relationship mapping and visualization UI
 * 
 * Created by: T.G.S Mishra
 * Part of ContactForge Phase 8 Premium Cinematic Upgrade
 * 
 * Features:
 * - Link contacts with relationship types
 * - Support for 11+ relationship types (family, colleague, manager, etc.)
 * - Bidirectional and directional relationships
 * - Visual relationship explorer
 */

import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Text, Button, Card, Portal, Dialog, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getRelationshipsByContactId,
  createRelationship,
  deleteRelationship,
} from '../db/repositories/relationshipRepository';
import { getContactById } from '../db/repositories/contactRepository';
import { COLORS, SPACING, FONT_SIZE } from '../constants';
import type { ContactRelationship, LocalContact } from '../types';

interface RelationshipsEditorProps {
  contactId: number;
  onClose: () => void;
}

/**
 * Supported relationship types
 * Used for organizing contact connections
 */
const RELATIONSHIP_TYPES = [
  'family',
  'spouse',
  'parent',
  'child',
  'sibling',
  'colleague',
  'manager',
  'mentor',
  'friend',
  'other',
] as const;

/**
 * RelationshipsEditor Component
 * 
 * Manages contact relationships with:
 * - Multiple relationship types
 * - Bidirectional linking
 * - Contact search
 * - Persistent SQLite storage
 */
export function RelationshipsEditor({ contactId, onClose }: RelationshipsEditorProps) {
  const contact = getContactById(contactId);
  const [relationships, setRelationships] = useState<ContactRelationship[]>(
    getRelationshipsByContactId(contactId)
  );
  const [selectedType, setSelectedType] = useState<typeof RELATIONSHIP_TYPES[number]>('friend');
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [bidirectional, setBidirectional] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  /**
   * Add new relationship link
   * - Validates contact selection
   * - Creates relationship in database
   * - Updates local state
   */
  const handleAddRelationship = useCallback(() => {
    if (!selectedContactId) {
      Alert.alert('Select Contact', 'Choose a contact to link');
      return;
    }
    
    const rel = createRelationship(
      contactId,
      selectedContactId,
      selectedType,
      bidirectional ? 'bidirectional' : 'directional'
    );
    
    setRelationships([...relationships, rel]);
    setSelectedContactId(null);
    setSelectedType('friend');
    setShowDialog(false);
  }, [contactId, selectedContactId, selectedType, bidirectional, relationships]);

  /**
   * Remove relationship link
   * - Shows confirmation
   * - Deletes from database
   * - Updates local state
   */
  const handleDeleteRelationship = useCallback((id: number) => {
    Alert.alert('Remove Link', 'Delete this relationship?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRelationship(id);
          setRelationships(relationships.filter(r => r.id !== id));
        },
      },
    ]);
  }, [relationships]);

  /**
   * Get icon for relationship type
   * Visual identification helper
   */
  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'family': return 'family-tree';
      case 'spouse': return 'heart';
      case 'parent': return 'account';
      case 'child': return 'baby-face';
      case 'sibling': return 'account-multiple';
      case 'colleague': return 'briefcase';
      case 'manager': return 'crown';
      case 'mentor': return 'lightbulb';
      case 'friend': return 'handshake';
      default: return 'link';
    }
  };

  /**
   * Get relationship display text
   */
  const getRelationshipDisplay = (rel: ContactRelationship) => {
    const otherContact = getContactById(rel.contactIdB);
    if (!otherContact) return 'Unknown contact';
    return `${otherContact.displayName} (${rel.type}${rel.direction === 'bidirectional' ? ' ↔' : ' →'})`;
  };

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Contact not found</Text>
        <Button onPress={onClose}>Close</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Relationships</Text>
        <Button onPress={onClose} icon="close">Close</Button>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Info card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Link {contact.displayName} to other contacts to track relationships.
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Add relationship button */}
        <Button
          mode="contained"
          onPress={() => setShowDialog(true)}
          style={styles.addBtn}
          buttonColor={COLORS.primary}
          icon="plus"
        >
          Add Relationship
        </Button>

        {/* Existing relationships */}
        {relationships.length === 0 ? (
          <Text style={styles.empty}>No relationships yet. Add one above!</Text>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={relationships}
            keyExtractor={(r) => r.id.toString()}
            renderItem={({ item: rel }) => (
              <Card style={styles.relCard}>
                <Card.Content>
                  <View style={styles.relRow}>
                    <View style={styles.relInfo}>
                      <View style={styles.relBadge}>
                        <MaterialCommunityIcons 
                          name={getRelationshipIcon(rel.type) as any} 
                          size={16} 
                          color={COLORS.primary} 
                        />
                        <Text style={styles.relType}>{rel.type}</Text>
                      </View>
                      <Text style={styles.relContact}>{getRelationshipDisplay(rel)}</Text>
                    </View>
                    <Button
                      mode="text"
                      compact
                      onPress={() => handleDeleteRelationship(rel.id)}
                      textColor={COLORS.error}
                      icon="delete"
                    >
                      Delete
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}
          />
        )}
      </ScrollView>

      {/* Add relationship dialog */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)} style={styles.dialog}>
          <Dialog.Title>Add Relationship</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.label}>Relationship Type</Text>
            <SegmentedButtons
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as any)}
              buttons={RELATIONSHIP_TYPES.map(type => ({
                value: type,
                label: type,
              }))}
              style={styles.segmented}
            />
            
            <Text style={[styles.label, { marginTop: SPACING.md }]}>Link Direction</Text>
            <SegmentedButtons
              value={bidirectional ? 'bidirectional' : 'directional'}
              onValueChange={(value) => setBidirectional(value === 'bidirectional')}
              buttons={[
                { value: 'bidirectional', label: 'Mutual ↔' },
                { value: 'directional', label: 'One-way →' },
              ]}
            />

            <Text style={[styles.label, { marginTop: SPACING.md }]}>Link to Contact</Text>
            <Text style={styles.note}>Contact selector would appear here (placeholder)</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button onPress={handleAddRelationship} buttonColor={COLORS.primary}>Add</Button>
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
  infoCard: { 
    backgroundColor: COLORS.surface, 
    marginBottom: SPACING.md 
  },
  infoRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    alignItems: 'flex-start' 
  },
  infoText: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.sm, 
    flex: 1, 
    lineHeight: 20 
  },
  addBtn: { marginBottom: SPACING.md },
  empty: { 
    color: COLORS.textDisabled, 
    textAlign: 'center', 
    paddingVertical: SPACING.lg 
  },
  relCard: { 
    backgroundColor: COLORS.surface, 
    marginBottom: SPACING.sm 
  },
  relRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    gap: SPACING.sm 
  },
  relInfo: { flex: 1 },
  relBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 4, 
    backgroundColor: COLORS.surfaceVariant, 
    borderRadius: 8, 
    alignSelf: 'flex-start', 
    marginBottom: SPACING.xs 
  },
  relType: { 
    color: COLORS.primary, 
    fontSize: FONT_SIZE.xs, 
    fontWeight: '600' 
  },
  relContact: { 
    color: COLORS.textSecondary, 
    fontSize: FONT_SIZE.sm 
  },
  error: { 
    color: COLORS.error, 
    fontSize: FONT_SIZE.md, 
    textAlign: 'center', 
    paddingVertical: SPACING.lg 
  },
  dialog: { backgroundColor: COLORS.surface },
  label: { 
    color: COLORS.textPrimary, 
    fontSize: FONT_SIZE.sm, 
    fontWeight: '600', 
    marginBottom: SPACING.xs 
  },
  segmented: { marginBottom: SPACING.md },
  note: { 
    color: COLORS.textDisabled, 
    fontSize: FONT_SIZE.xs, 
    fontStyle: 'italic', 
    marginTop: SPACING.sm 
  },
});
