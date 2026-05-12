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

import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Portal, Dialog, SegmentedButtons, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getRelationshipsByContactId,
  createRelationship,
  deleteRelationship,
} from './db/repositories/relationshipRepository';
import { getContactById, listContacts } from './db/repositories/contactRepository';
import { COLORS, SPACING, FONT_SIZE } from './constants';
import type { ContactRelationship, LocalContact } from './types';

interface RelationshipsEditorProps {
  contactId: number;
  onClose: () => void;
}

/**
 * Supported relationship types
 * Used for organizing contact connections
 */
const RELATIONSHIP_TYPES = [
  'spouse',
  'parent',
  'child',
  'sibling',
  'colleague',
  'manager',
  'assistant',
  'referral',
  'emergency_contact',
  'friend',
  'custom',
] as const satisfies ReadonlyArray<ContactRelationship['relationshipType']>;

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
  const [direction, setDirection] = useState<ContactRelationship['direction']>('bidirectional');
  const [contactSearch, setContactSearch] = useState('');

  const candidateContacts: LocalContact[] = useMemo(() => {
    const results = listContacts({
      search: contactSearch.trim() ? contactSearch : undefined,
      page: 0,
      pageSize: 30,
    });
    return results.filter((c) => c.id !== contactId);
  }, [contactId, contactSearch]);
  const [showDialog, setShowDialog] = useState(false);

  /**
   * Add new relationship link
   * - Validates contact selection
   * - Creates relationship in database
   * - Updates local state
   */
  const handleAddRelationship = useCallback(() => {
    if (selectedContactId == null) {
      Alert.alert('Select Contact', 'Choose a contact to link');
      return;
    }

    const rel = createRelationship({
      contactIdFrom: contactId,
      contactIdTo: selectedContactId,
      relationshipType: selectedType,
      direction,
      notes: null,
    });

    setRelationships([...relationships, rel]);
    setSelectedContactId(null);
    setSelectedType('friend');
    setDirection('bidirectional');
    setContactSearch('');
    setShowDialog(false);
  }, [contactId, selectedContactId, selectedType, direction, relationships]);

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
      case 'spouse': return 'heart';
      case 'parent': return 'account';
      case 'child': return 'baby-face';
      case 'sibling': return 'account-multiple';
      case 'colleague': return 'briefcase';
      case 'manager': return 'crown';
      case 'assistant': return 'account-tie';
      case 'referral': return 'account-switch';
      case 'emergency_contact': return 'alert-decagram';
      case 'friend': return 'handshake';
      case 'custom': return 'tag';
      default: return 'link';
    }
  };

  /**
   * Get relationship display text
   */
  const getRelationshipDisplay = (rel: ContactRelationship) => {
    const otherId = rel.contactIdFrom === contactId ? rel.contactIdTo : rel.contactIdFrom;
    const otherContact = getContactById(otherId);
    if (!otherContact) return 'Unknown contact';

    let arrow = '';
    if (rel.direction === 'bidirectional') {
      arrow = '↔';
    } else if (rel.direction === 'one_way_from') {
      arrow = rel.contactIdFrom === contactId ? '→' : '←';
    } else {
      arrow = rel.contactIdFrom === contactId ? '←' : '→';
    }

    return `${otherContact.displayName} (${rel.relationshipType} ${arrow})`;
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
                          name={getRelationshipIcon(rel.relationshipType) as any} 
                          size={16} 
                          color={COLORS.primary} 
                        />
                        <Text style={styles.relType}>{rel.relationshipType}</Text>
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
              value={direction}
              onValueChange={(value) => setDirection(value as ContactRelationship['direction'])}
              buttons={[
                { value: 'bidirectional', label: 'Mutual ↔' },
                { value: 'one_way_from', label: 'One-way →' },
              ]}
            />

            <Text style={[styles.label, { marginTop: SPACING.md }]}>Link to Contact</Text>
            <TextInput
              mode="outlined"
              placeholder="Search contacts..."
              value={contactSearch}
              onChangeText={setContactSearch}
              style={styles.input}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              textColor={COLORS.textPrimary}
            />

            <View style={{ maxHeight: 240 }}>
              <FlatList
                data={candidateContacts}
                keyExtractor={(c) => c.id.toString()}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = item.id === selectedContactId;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedContactId(item.id)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: isSelected ? `${COLORS.primary}20` : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ color: COLORS.textPrimary }} numberOfLines={1}>
                        {item.displayName}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
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
    backgroundColor: COLORS.surface, 
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
  input: {
    backgroundColor: COLORS.surface,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  note: { 
    color: COLORS.textDisabled, 
    fontSize: FONT_SIZE.xs, 
    fontStyle: 'italic', 
    marginTop: SPACING.sm 
  },
});
