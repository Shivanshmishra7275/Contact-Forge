/**
 * ContactForge — Contact Detail Screen
 */

import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Alert, Linking, Clipboard, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Chip, Divider, Portal, Dialog, RadioButton, Modal } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getContactWithDetails,
  deleteContact,
  getContactById,
} from '../../src/db/repositories/contactRepository';
import { getDuplicatesByContactId } from '../../src/db/repositories/duplicateRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { getNotesByContactId } from '../../src/db/repositories/noteRepository';
import { getRelationshipsByContactId } from '../../src/db/repositories/relationshipRepository';
import { getContactContext } from '../../src/db/repositories/contactContextRepository';
import { getRemindersByContactId } from '../../src/db/repositories/reminderRepository';
import { calculateContactHealthScore } from '../../src/services/contactHealthService';
import { suggestCategories, CategorySuggestion } from '../../src/services/relationshipCategorizationService';
import {
  markContactAsTemporary,
  unmarkContactAsTemporary,
  getTemporaryContactEntry,
} from '../../src/services/temporaryContactService';
import { isoToDisplay } from '../../src/utils/normalization';
import { HealthScoreDisplay } from '../../src/HealthScoreDisplay';
import { NotesEditor } from '../../src/NotesEditor';
import { RelationshipsEditor } from '../../src/RelationshipsEditor';
import { ContactContextEditor } from '../../src/ContactContextEditor';
import { ReminderEditor } from '../../src/ReminderEditor';
import type { TemporaryContact, ContactNote, ContactHealthScore, ContactRelationship, ContactContext, ContactReminder, Group } from '../../src/types';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/constants';
import type { ContactWithDetails } from '../../src/types';
import { GroupRepository } from '../../src/db/repositories/groupRepository';
import * as Haptics from 'expo-haptics';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contact, setContact] = useState<ContactWithDetails | null>(null);
  const [tempEntry, setTempEntry] = useState<TemporaryContact | null>(null);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [relationships, setRelationships] = useState<ContactRelationship[]>([]);
  const [health, setHealth] = useState<ContactHealthScore | null>(null);
  const [context, setContext] = useState<ContactContext | null>(null);
  const [reminders, setReminders] = useState<ContactReminder[]>([]);

  const [showNotesEditor, setShowNotesEditor] = useState(false);
  const [showRelationshipsEditor, setShowRelationshipsEditor] = useState(false);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [showReminderEditor, setShowReminderEditor] = useState(false);

  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [showGroupsModal, setShowGroupsModal] = useState(false);

  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);

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
      setRelationships(getRelationshipsByContactId(c.id));
      setContext(getContactContext(c.id));
      setReminders(getRemindersByContactId(c.id).filter((r) => r.status === 'pending'));
      const healthScore = calculateContactHealthScore(c.id);
      setHealth(healthScore);
      setSuggestions(suggestCategories(c));
      
      try {
        setAssignedGroups(GroupRepository.getGroupsForContact(c.id));
        setAvailableGroups(GroupRepository.getAllGroups());
      } catch (e) {
        console.warn('Groups not initialized', e);
      }
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

  const handleApplySuggestion = useCallback((suggestion: CategorySuggestion) => {
    if (!contact) return;
    try {
      const currentTags = JSON.parse(contact.tags || '[]');
      if (!currentTags.includes(suggestion.category)) {
        currentTags.push(suggestion.category);
        const { updateContact } = require('../../src/db/repositories/contactRepository');
        updateContact(contact.id, { tags: currentTags });
        load();
      }
    } catch (err) {
      console.error(err);
    }
  }, [contact, load]);

  const handleDismissSuggestion = useCallback((category: string) => {
    setSuggestions(prev => prev.filter(s => s.category !== category));
  }, []);

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
          
          {/* Health Score Display */}
          <HealthScoreDisplay health={health} />
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

        {/* Groups & Tags */}
        {(tags.length > 0 || assignedGroups.length > 0) ? (
          <Card style={styles.card}>
            <Card.Title 
              title="Groups & Tags" 
              titleStyle={styles.sectionTitle}
              right={() => (
                <Button mode="text" onPress={() => setShowGroupsModal(true)} textColor={'#06b6d4'} compact>Manage</Button>
              )}
            />
            <Card.Content style={styles.tagsContent}>
              {assignedGroups.map(g => (
                <View key={`g-${g.id}`} style={[{ backgroundColor: g.color + '1A', borderColor: g.color + '33', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: g.color, shadowColor: g.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }} />
                  <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZE.xs, fontWeight: '600' }}>{g.name}</Text>
                </View>
              ))}
              {tags.map((t) => (
                <Chip key={`t-${t}`} style={styles.tag} textStyle={{ color: COLORS.accent, fontSize: FONT_SIZE.xs }}>
                  {t}
                </Chip>
              ))}
            </Card.Content>
          </Card>
        ) : (
          <Button mode="outlined" icon="tag" onPress={() => setShowGroupsModal(true)} style={{ borderColor: COLORS.border, marginBottom: SPACING.md }} textColor={COLORS.textSecondary}>
            Add to Group
          </Button>
        )}

        {/* Suggested Categories */}
        {suggestions.length > 0 && (
          <View style={{ gap: SPACING.xs, marginVertical: SPACING.xs }}>
            <Text style={{ fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginLeft: SPACING.xs }}>Suggested Relationships</Text>
            {suggestions.map((s) => (
              <Card key={s.category} style={[styles.card, { borderColor: COLORS.primary, borderWidth: 1 }]}>
                <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm }}>
                  <MaterialCommunityIcons name="tag-plus-outline" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>{s.category}</Text>
                      <Chip style={{ backgroundColor: s.confidence === 'high' ? COLORS.success + '22' : COLORS.warning + '22', height: 20 }} textStyle={{ fontSize: 10, color: s.confidence === 'high' ? COLORS.success : COLORS.warning, marginVertical: 0 }}>
                        {s.confidence} match
                      </Chip>
                    </View>
                    <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZE.xs }}>{s.reasons[0]}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                    <Button mode="text" textColor={COLORS.textDisabled} compact onPress={() => handleDismissSuggestion(s.category)}>Dismiss</Button>
                    <Button mode="contained" buttonColor={COLORS.primary} compact onPress={() => handleApplySuggestion(s)}>Apply</Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
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
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(`tel:${p.number}`)}
                      accessibilityLabel={`Call ${p.number}`}
                    >
                      <MaterialCommunityIcons name="phone" size={16} color={COLORS.secondary} />
                      <Text style={[styles.actionLabel, { color: COLORS.secondary }]}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(`sms:${p.number}`)}
                      accessibilityLabel={`SMS ${p.number}`}
                    >
                      <MaterialCommunityIcons name="message-text" size={16} color={COLORS.primary} />
                      <Text style={[styles.actionLabel, { color: COLORS.primary }]}>SMS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={async () => {
                        const digits = p.number.replace(/\D/g, '');
                        const url = `https://wa.me/${digits}`;
                        const supported = await Linking.canOpenURL(url);
                        if (supported) Linking.openURL(url);
                        else Alert.alert('WhatsApp not installed', 'Could not open WhatsApp.');
                      }}
                      accessibilityLabel={`WhatsApp ${p.number}`}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
                      <Text style={[styles.actionLabel, { color: '#25D366' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        Clipboard.setString(p.number);
                        Alert.alert('Copied', 'Phone number copied to clipboard.');
                      }}
                      accessibilityLabel={`Copy ${p.number}`}
                    >
                      <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.textDisabled} />
                      <Text style={[styles.actionLabel, { color: COLORS.textDisabled }]}>Copy</Text>
                    </TouchableOpacity>
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
                    <Text style={styles.fieldValue} numberOfLines={1}>{e.email}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => Linking.openURL(`mailto:${e.email}`)}
                      accessibilityLabel={`Email ${e.email}`}
                    >
                      <MaterialCommunityIcons name="email-fast" size={16} color={COLORS.primary} />
                      <Text style={[styles.actionLabel, { color: COLORS.primary }]}>Email</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        Clipboard.setString(e.email);
                        Alert.alert('Copied', 'Email address copied to clipboard.');
                      }}
                      accessibilityLabel={`Copy ${e.email}`}
                    >
                      <MaterialCommunityIcons name="content-copy" size={16} color={COLORS.textDisabled} />
                      <Text style={[styles.actionLabel, { color: COLORS.textDisabled }]}>Copy</Text>
                    </TouchableOpacity>
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

        {/* Relationship Brief */}
        <Card style={styles.card}>
          <Card.Title
            title="Relationship Brief"
            titleStyle={styles.sectionTitle}
            left={() => <MaterialCommunityIcons name="brain" color={COLORS.primary} size={20} />}
            right={() => (
              <Button
                mode="text"
                onPress={() => setShowContextEditor(true)}
                textColor={COLORS.primary}
                compact
              >
                {context ? 'Edit' : 'Add'}
              </Button>
            )}
          />
          <Card.Content>
            {!context ? (
              <Text style={styles.emptySectionText}>No relationship context yet. Tap Add to capture where you met, warmth, and next steps.</Text>
            ) : (
              <View style={{ gap: SPACING.sm }}>
                {/* Strength + Warmth row */}
                <View style={styles.briefRow}>
                  <StrengthBadge strength={context.relationshipStrength} />
                  <View style={styles.warmthPill}>
                    <MaterialCommunityIcons name="fire" size={12} color={COLORS.accent} />
                    <Text style={styles.warmthText}>Warmth {context.warmth}/100</Text>
                  </View>
                </View>
                {context.whereMet && (
                  <View style={styles.briefField}>
                    <MaterialCommunityIcons name="map-marker" size={13} color={COLORS.textDisabled} />
                    <Text style={styles.briefFieldText}>Met: {context.whereMet}</Text>
                  </View>
                )}
                {context.lastInteractionAt && (
                  <View style={styles.briefField}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color={COLORS.textDisabled} />
                    <Text style={styles.briefFieldText}>Last: {isoToDisplay(context.lastInteractionAt)}</Text>
                  </View>
                )}
                {context.nextAction && (
                  <View style={styles.briefField}>
                    <MaterialCommunityIcons name="arrow-right-circle" size={13} color={COLORS.secondary} />
                    <Text style={[styles.briefFieldText, { color: COLORS.secondary }]}>{context.nextAction}</Text>
                  </View>
                )}
                {context.notesPlain && (
                  <Text style={styles.briefNotes}>{context.notesPlain}</Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Follow-up Reminders */}
        <Card style={styles.card}>
          <Card.Title
            title="Follow-up Reminders"
            titleStyle={styles.sectionTitle}
            left={() => <MaterialCommunityIcons name="bell-outline" color={COLORS.warning} size={20} />}
            right={() => (
              <Button
                mode="text"
                onPress={() => setShowReminderEditor(true)}
                textColor={COLORS.primary}
                compact
              >
                Manage
              </Button>
            )}
          />
          <Card.Content>
            {reminders.length === 0 ? (
              <Text style={styles.emptySectionText}>No reminders. Tap Manage to schedule a follow-up.</Text>
            ) : (
              reminders.slice(0, 3).map((r, i) => {
                const due = new Date(r.dueAt);
                const today = new Date(); today.setHours(0,0,0,0);
                const diff = Math.floor((due.getTime() - today.getTime()) / 86400000);
                const overdue = diff < 0;
                const label = overdue ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Due today' : `Due in ${diff}d`;
                return (
                  <View key={r.id}>
                    {i > 0 && <Divider style={styles.divider} />}
                    <View style={styles.reminderRow}>
                      <MaterialCommunityIcons
                        name={overdue ? 'bell-alert' : 'bell-outline'}
                        size={14}
                        color={overdue ? COLORS.error : COLORS.warning}
                      />
                      <Text style={styles.reminderTitle}>{r.title}</Text>
                      <Text style={[styles.reminderDue, overdue && { color: COLORS.error }]}>{label}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* Memory Notes */}
        <Card style={styles.card}>
          <Card.Title
            title="Memory Notes"
            titleStyle={styles.sectionTitle}
            left={() => <MaterialCommunityIcons name="notebook" color={COLORS.secondary} size={20} />}
            right={() => (
              <Button
                mode="text"
                onPress={() => setShowNotesEditor(true)}
                textColor={COLORS.primary}
                compact
              >
                Manage
              </Button>
            )}
          />
          <Card.Content>
            {notes.length === 0 ? (
              <Text style={styles.emptySectionText}>No memory notes yet.</Text>
            ) : (
              notes.map((note, i) => (
                <View key={note.id}>
                  {i > 0 && <Divider style={styles.divider} />}
                  <View style={styles.noteRow}>
                    <Chip style={styles.categoryChip} textStyle={{ fontSize: FONT_SIZE.xs }}>
                      {note.category}
                    </Chip>
                    <Text style={styles.noteText}>{note.content}</Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Relationships */}
        <Card style={styles.card}>
          <Card.Title
            title="Relationships"
            titleStyle={styles.sectionTitle}
            left={() => <MaterialCommunityIcons name="account-multiple" color={COLORS.secondary} size={20} />}
            right={() => (
              <Button
                mode="text"
                onPress={() => setShowRelationshipsEditor(true)}
                textColor={COLORS.primary}
                compact
              >
                Manage
              </Button>
            )}
          />
          <Card.Content>
            {relationships.length === 0 ? (
              <Text style={styles.emptySectionText}>No relationships linked yet.</Text>
            ) : (
              relationships.map((rel, i) => (
                <View key={rel.id}>
                  {i > 0 && <Divider style={styles.divider} />}
                  <View style={styles.relationshipRow}>
                    <Chip style={styles.relationshipChip} textStyle={{ fontSize: FONT_SIZE.xs }}>
                      {rel.relationshipType}
                    </Chip>
                    <Text style={styles.relationshipText}>
                      {buildRelationshipLabel(contact.id, rel)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

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

        <Dialog visible={showGroupsModal} onDismiss={() => setShowGroupsModal(false)} style={styles.dialog}>
          <Dialog.Title>Manage Groups</Dialog.Title>
          <Dialog.Content>
            {availableGroups.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary }}>No groups exist yet. Create them from the Dashboard.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {availableGroups.map(group => {
                  const isAssigned = assignedGroups.some(ag => ag.id === group.id);
                  return (
                    <View key={group.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: group.color }} />
                        <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZE.md }}>{group.name}</Text>
                      </View>
                      <Button 
                        mode={isAssigned ? "contained" : "outlined"} 
                        buttonColor={isAssigned ? group.color : undefined}
                        textColor={isAssigned ? '#000' : group.color}
                        style={!isAssigned && { borderColor: group.color + '55' }}
                        compact
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          if (isAssigned) {
                            GroupRepository.removeContactFromGroup(contact.id, group.id);
                          } else {
                            GroupRepository.assignContactToGroup(contact.id, group.id);
                          }
                          load();
                        }}
                      >
                        {isAssigned ? 'Added' : 'Add'}
                      </Button>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowGroupsModal(false)} textColor={COLORS.textSecondary}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Modal
          visible={showNotesEditor}
          onDismiss={() => setShowNotesEditor(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <NotesEditor
            contactId={contact.id}
            onClose={() => { setShowNotesEditor(false); load(); }}
          />
        </Modal>
        <Modal
          visible={showRelationshipsEditor}
          onDismiss={() => setShowRelationshipsEditor(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <RelationshipsEditor
            contactId={contact.id}
            onClose={() => { setShowRelationshipsEditor(false); load(); }}
          />
        </Modal>
        <Modal
          visible={showContextEditor}
          onDismiss={() => setShowContextEditor(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ContactContextEditor
            contactId={contact.id}
            contactName={contact.displayName}
            onClose={() => { setShowContextEditor(false); load(); }}
          />
        </Modal>
        <Modal
          visible={showReminderEditor}
          onDismiss={() => setShowReminderEditor(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ReminderEditor
            contactId={contact.id}
            contactName={contact.displayName}
            onClose={() => { setShowReminderEditor(false); load(); }}
          />
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

function buildRelationshipLabel(
  currentContactId: number,
  relationship: ContactRelationship,
): string {
  const otherId = relationship.contactIdFrom === currentContactId
    ? relationship.contactIdTo
    : relationship.contactIdFrom;
  const otherContact = getContactById(otherId);
  const otherName = otherContact?.displayName ?? 'Unknown';

  let arrow = '<->';
  if (relationship.direction === 'one_way_from') {
    arrow = relationship.contactIdFrom === currentContactId ? '->' : '<-';
  }
  if (relationship.direction === 'one_way_to') {
    arrow = relationship.contactIdFrom === currentContactId ? '<-' : '->';
  }

  return `${otherName} ${arrow}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const STRENGTH_COLORS: Record<string, string> = {
  close: '#e86c6c',
  active: '#5cba82',
  neutral: '#a8b3c1',
  dormant: '#f5c842',
  fading: '#6db3e8',
};

function StrengthBadge({ strength }: { strength: string }) {
  const color = STRENGTH_COLORS[strength] ?? COLORS.textDisabled;
  return (
    <View style={[strengthStyles.badge, { borderColor: color, backgroundColor: color + '22' }]}>
      <Text style={[strengthStyles.label, { color }]}>{strength}</Text>
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: { fontSize: FONT_SIZE.xs, fontWeight: '700', textTransform: 'capitalize' },
});

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
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 20,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
  },
  actionLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  notes: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  meta: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, marginBottom: 2 },
  deleteBtn: { marginTop: SPACING.md, borderColor: COLORS.error },
  notFound: { color: COLORS.textSecondary, fontSize: FONT_SIZE.md },
  tempHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  tempTitle: { fontSize: FONT_SIZE.md, marginLeft: SPACING.sm, fontWeight: 'bold' },
  tempDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  dialog: { backgroundColor: COLORS.surface },
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
  emptySectionText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  relationshipRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  relationshipChip: { backgroundColor: COLORS.surfaceVariant },
  relationshipText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, flex: 1 },
  modalContainer: { flex: 1, backgroundColor: COLORS.background, padding: 0 },
  // Relationship Brief styles
  briefRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  warmthPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.surfaceVariant, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 2 },
  warmthText: { color: COLORS.accent, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  briefField: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  briefFieldText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, flex: 1 },
  briefNotes: { color: COLORS.textDisabled, fontSize: FONT_SIZE.sm, lineHeight: 18, fontStyle: 'italic', marginTop: 2 },
  // Reminder styles
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  reminderTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, flex: 1 },
  reminderDue: { color: COLORS.warning, fontSize: FONT_SIZE.xs, fontWeight: '600' },
});
