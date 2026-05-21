/**
 * ContactForge — Contact Context Editor
 *
 * Shows and edits relationship context for a contact:
 * where met, warmth, relationship strength, last interaction, next action.
 * Used as a modal panel from the contact detail screen.
 */

import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getContactContext,
  upsertContactContext,
} from './db/repositories/contactContextRepository';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from './constants';
import type { ContactContext, RelationshipStrength } from './types';

interface Props {
  contactId: number;
  contactName: string;
  onClose: () => void;
}

const STRENGTH_OPTIONS: Array<{ value: RelationshipStrength; label: string; icon: string; color: string }> = [
  { value: 'close', label: 'Close', icon: 'heart', color: '#e86c6c' },
  { value: 'active', label: 'Active', icon: 'lightning-bolt', color: '#5cba82' },
  { value: 'neutral', label: 'Neutral', icon: 'minus-circle', color: '#a8b3c1' },
  { value: 'dormant', label: 'Dormant', icon: 'sleep', color: '#f5c842' },
  { value: 'fading', label: 'Fading', icon: 'trending-down', color: '#6db3e8' },
];

const WARMTH_STEPS = [
  { label: 'Cold', value: 10 },
  { label: 'Acquaintance', value: 30 },
  { label: 'Friendly', value: 50 },
  { label: 'Warm', value: 70 },
  { label: 'Close', value: 90 },
];

export function ContactContextEditor({ contactId, contactName, onClose }: Props) {
  const [context, setContext] = useState<ContactContext | null>(null);
  const [whereMet, setWhereMet] = useState('');
  const [strength, setStrength] = useState<RelationshipStrength>('neutral');
  const [warmth, setWarmth] = useState(50);
  const [lastInteraction, setLastInteraction] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [notesPlain, setNotesPlain] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ctx = getContactContext(contactId);
    setContext(ctx);
    if (ctx) {
      setWhereMet(ctx.whereMet ?? '');
      setStrength(ctx.relationshipStrength);
      setWarmth(ctx.warmth);
      setLastInteraction(ctx.lastInteractionAt ?? '');
      setNextAction(ctx.nextAction ?? '');
      setNotesPlain(ctx.notesPlain ?? '');
    }
  }, [contactId]);

  const handleSave = () => {
    setSaving(true);
    try {
      upsertContactContext({
        contactId,
        whereMet: whereMet.trim() || null,
        relationshipStrength: strength,
        warmth,
        lastInteractionAt: lastInteraction.trim() || null,
        nextAction: nextAction.trim() || null,
        notesPlain: notesPlain.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedStrength = STRENGTH_OPTIONS.find((s) => s.value === strength);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Relationship Context</Text>
          <Text style={styles.subtitle}>{contactName}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <Divider style={styles.divider} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Relationship Strength */}
        <Text style={styles.label}>Relationship Strength</Text>
        <View style={styles.strengthRow}>
          {STRENGTH_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.strengthChip,
                strength === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '22' },
              ]}
              onPress={() => setStrength(opt.value)}
            >
              <MaterialCommunityIcons
                name={opt.icon as any}
                size={14}
                color={strength === opt.value ? opt.color : COLORS.textDisabled}
              />
              <Text
                style={[
                  styles.strengthLabel,
                  strength === opt.value && { color: opt.color },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Warmth */}
        <Text style={styles.label}>Warmth Level</Text>
        <View style={styles.warmthRow}>
          {WARMTH_STEPS.map((step) => (
            <TouchableOpacity
              key={step.value}
              style={[
                styles.warmthBtn,
                warmth === step.value && styles.warmthBtnActive,
              ]}
              onPress={() => setWarmth(step.value)}
            >
              <Text
                style={[
                  styles.warmthBtnText,
                  warmth === step.value && { color: COLORS.primary },
                ]}
              >
                {step.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.warmthValue}>{warmth}/100</Text>

        {/* Where Met */}
        <Text style={styles.label}>Where You Met</Text>
        <TextInput
          style={styles.input}
          value={whereMet}
          onChangeText={setWhereMet}
          placeholder="Conference 2024, Intro by Alex…"
          placeholderTextColor={COLORS.textDisabled}
          maxLength={120}
        />

        {/* Last Interaction */}
        <Text style={styles.label}>Last Interaction Date</Text>
        <TextInput
          style={styles.input}
          value={lastInteraction}
          onChangeText={setLastInteraction}
          placeholder="YYYY-MM-DD or ISO timestamp"
          placeholderTextColor={COLORS.textDisabled}
          maxLength={32}
        />
        <TouchableOpacity
          style={styles.todayBtn}
          onPress={() => setLastInteraction(new Date().toISOString().split('T')[0])}
        >
          <Text style={styles.todayBtnText}>Set to today</Text>
        </TouchableOpacity>

        {/* Next Action */}
        <Text style={styles.label}>Next Action</Text>
        <TextInput
          style={styles.input}
          value={nextAction}
          onChangeText={setNextAction}
          placeholder="Send project update, Introduce to Sara…"
          placeholderTextColor={COLORS.textDisabled}
          maxLength={200}
        />

        {/* Quick Notes */}
        <Text style={styles.label}>Quick Context Note</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notesPlain}
          onChangeText={setNotesPlain}
          placeholder="Background context, shared interests, important details…"
          placeholderTextColor={COLORS.textDisabled}
          multiline
          numberOfLines={4}
          maxLength={600}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button mode="outlined" onPress={onClose} style={styles.footerBtn}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          buttonColor={COLORS.primary}
          style={styles.footerBtn}
        >
          Save Context
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.sm },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  strengthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  strengthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  strengthLabel: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  warmthRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  warmthBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  warmthBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '22',
  },
  warmthBtnText: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  warmthValue: { color: COLORS.textDisabled, fontSize: FONT_SIZE.xs, marginTop: 4 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  todayBtn: { alignSelf: 'flex-start', marginTop: 4 },
  todayBtnText: { color: COLORS.primary, fontSize: FONT_SIZE.xs },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerBtn: { flex: 1 },
});
