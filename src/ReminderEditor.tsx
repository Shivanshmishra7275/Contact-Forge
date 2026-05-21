/**
 * ContactForge — Reminder Editor
 *
 * Create or manage follow-up reminders for a contact.
 * Supports one-shot and recurring reminders.
 */

import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getRemindersByContactId,
  createReminder,
  updateReminderStatus,
  deleteReminder,
} from './db/repositories/reminderRepository';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from './constants';
import type { ContactReminder } from './types';

interface Props {
  contactId: number;
  contactName: string;
  onClose: () => void;
}

const QUICK_INTERVALS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
];

export function ReminderEditor({ contactId, contactName, onClose }: Props) {
  const [reminders, setReminders] = useState<ContactReminder[]>(() =>
    getRemindersByContactId(contactId)
  );
  const [title, setTitle] = useState('Follow up');
  const [selectedDays, setSelectedDays] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [adding, setAdding] = useState(false);

  const reload = () => setReminders(getRemindersByContactId(contactId));

  const handleAdd = () => {
    if (!title.trim()) return;
    setAdding(true);
    try {
      const dueAt = new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      createReminder({
        contactId,
        title: title.trim(),
        dueAt,
        intervalDays: isRecurring ? selectedDays : null,
      });
      reload();
      setTitle('Follow up');
    } finally {
      setAdding(false);
    }
  };

  const handleDone = (id: number) => {
    updateReminderStatus(id, 'done');
    reload();
  };

  const handleDelete = (id: number) => {
    deleteReminder(id);
    reload();
  };

  const formatDue = (dueAt: string): string => {
    const date = new Date(dueAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff}d`;
  };

  const isOverdue = (dueAt: string): boolean => new Date(dueAt) < new Date();

  const pendingReminders = reminders.filter((r) => r.status === 'pending');
  const pastReminders = reminders.filter((r) => r.status !== 'pending');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Follow-up Reminders</Text>
          <Text style={styles.subtitle}>{contactName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <Divider style={styles.divider} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Add New */}
        <Text style={styles.sectionLabel}>Add Reminder</Text>

        <View style={styles.titleRow}>
          <Text style={styles.fieldLabel}>Title</Text>
          <View style={styles.titleInput}>
            {(['Follow up', 'Check in', 'Send update', 'Introduce'].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetBtn, title === preset && styles.presetBtnActive]}
                onPress={() => setTitle(preset)}
              >
                <Text style={[styles.presetText, title === preset && { color: COLORS.primary }]}>
                  {preset}
                </Text>
              </TouchableOpacity>
            )))}
          </View>
        </View>

        <Text style={styles.fieldLabel}>In how many days?</Text>
        <View style={styles.intervalRow}>
          {QUICK_INTERVALS.map((opt) => (
            <TouchableOpacity
              key={opt.days}
              style={[
                styles.intervalBtn,
                selectedDays === opt.days && styles.intervalBtnActive,
              ]}
              onPress={() => setSelectedDays(opt.days)}
            >
              <Text
                style={[
                  styles.intervalText,
                  selectedDays === opt.days && { color: COLORS.primary },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.recurringRow}
          onPress={() => setIsRecurring(!isRecurring)}
        >
          <MaterialCommunityIcons
            name={isRecurring ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={18}
            color={isRecurring ? COLORS.primary : COLORS.textDisabled}
          />
          <Text style={styles.recurringLabel}>Repeat automatically</Text>
        </TouchableOpacity>

        <Button
          mode="contained"
          onPress={handleAdd}
          loading={adding}
          buttonColor={COLORS.primary}
          style={styles.addBtn}
          icon="bell-plus"
        >
          Add Reminder
        </Button>

        {/* Pending Reminders */}
        {pendingReminders.length > 0 && (
          <>
            <Divider style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>Pending</Text>
            {pendingReminders.map((r) => (
              <View key={r.id} style={styles.reminderCard}>
                <View style={styles.reminderLeft}>
                  <Text style={styles.reminderTitle}>{r.title}</Text>
                  <Text style={[
                    styles.reminderDue,
                    isOverdue(r.dueAt) && { color: COLORS.error },
                  ]}>
                    {formatDue(r.dueAt)}
                    {r.intervalDays ? ` • repeats every ${r.intervalDays}d` : ''}
                  </Text>
                </View>
                <View style={styles.reminderActions}>
                  <TouchableOpacity onPress={() => handleDone(r.id)} style={styles.iconBtn}>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(r.id)} style={styles.iconBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Past */}
        {pastReminders.length > 0 && (
          <>
            <Divider style={styles.sectionDivider} />
            <Text style={styles.sectionLabel}>Completed / Dismissed</Text>
            {pastReminders.slice(0, 5).map((r) => (
              <View key={r.id} style={[styles.reminderCard, styles.pastCard]}>
                <Text style={styles.pastTitle}>{r.title}</Text>
                <Text style={styles.pastStatus}>{r.status}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: { color: COLORS.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 },
  closeBtn: { padding: SPACING.xs },
  divider: { backgroundColor: COLORS.divider },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
  },
  titleRow: { gap: SPACING.sm },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: 4 },
  titleInput: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  presetBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  presetBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  presetText: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  intervalRow: { flexDirection: 'row', gap: SPACING.sm },
  intervalBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  intervalBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '22' },
  intervalText: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, fontWeight: '700' },
  recurringRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  recurringLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  addBtn: { marginTop: SPACING.sm },
  sectionDivider: { backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  reminderLeft: { flex: 1 },
  reminderTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  reminderDue: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  reminderActions: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: { padding: SPACING.xs },
  pastCard: { opacity: 0.5 },
  pastTitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, flex: 1 },
  pastStatus: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs },
});
