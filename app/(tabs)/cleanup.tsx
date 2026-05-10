/**
 * ContactForge — Cleanup Center Screen
 *
 * Presents a review queue of contacts with data quality issues.
 * All detection and fix logic is delegated to cleanupService.ts.
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, InteractionManager } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  scanAllContactsForIssues,
  applyCleanupFix,
  applyBulkCleanupFixes,
  applyBulkCleanupFixesByContactIds,
  purgeGhostContacts,
  type ContactIssues,
} from '../../src/services/cleanupService';
import {
  reviewAndPurgeExpired,
  getExpiredTemporaryContacts,
} from '../../src/services/temporaryContactService';
import { COLORS, SPACING, FONT_SIZE } from '../../src/constants';
import type { CleanupIssue, TemporaryContact } from '../../src/types';

const ISSUE_LABELS: Record<string, string> = {
  missing_name: 'Missing Name',
  missing_phone: 'No Phone',
  missing_email: 'No Email',
  malformed_phone: 'Bad Phone',
  uncapitalized_name: 'Name Case',
  extra_whitespace: 'Extra Spaces',
  no_country_code: 'No Country Code',
  ghost_contact: 'Ghost Contact',
  duplicate_numbers: 'Duplicate Numbers',
};

const ISSUE_ICONS: Record<string, string> = {
  missing_name: 'account-question',
  missing_phone: 'phone-off',
  uncapitalized_name: 'format-letter-case',
  extra_whitespace: 'format-clear',
  ghost_contact: 'ghost',
  missing_email: 'email-off',
  malformed_phone: 'phone-alert',
};

export default function CleanupScreen() {
  const [issueList, setIssueList] = useState<ContactIssues[]>([]);
  const [expiredTemps, setExpiredTemps] = useState<TemporaryContact[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const selectedCount = selectedContactIds.length;

  const runScan = useCallback(() => {
    setIsScanning(true);
    // Run synchronously — cleanup scan is fast enough for foreground
    const results = scanAllContactsForIssues();
    setIssueList(results);
    setExpiredTemps(getExpiredTemporaryContacts());
    setIsScanning(false);
    setHasScanned(true);
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      runScan();
    });

    return () => task.cancel();
  }, [runScan]);

  const fixableContacts = useMemo(
    () => issueList.filter((item) => item.issues.some((issue) => issue.suggestedValue)),
    [issueList],
  );

  const ghostContacts = useMemo(
    () => issueList.filter((item) => item.issues.some((issue) => issue.kind === 'ghost_contact')),
    [issueList],
  );

  const handleApplyFix = useCallback(
    (item: ContactIssues, issue: CleanupIssue) => {
      const applied = applyCleanupFix(item.contact, issue);
      if (applied) {
        runScan(); // Refresh the issue list after a fix
      }
    },
    [runScan],
  );

  const handleApplyAllForContact = useCallback(
    (item: ContactIssues) => {
      const applied = item.issues.reduce((count, issue) => {
        return applyCleanupFix(item.contact, issue) ? count + 1 : count;
      }, 0);

      if (applied > 0) {
        runScan();
      }
    },
    [runScan],
  );

  const handleFixAll = useCallback(() => {
    if (fixableContacts.length === 0) return;
    Alert.alert(
      'Apply Cleanup Fixes',
      `Apply all fixable cleanup actions to ${fixableContacts.length} contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const count = applyBulkCleanupFixes(fixableContacts);
            Alert.alert('Cleanup complete', `Applied ${count} cleanup fixes.`);
            runScan();
          },
        },
      ],
    );
  }, [fixableContacts, runScan]);

  const clearSelection = useCallback(() => {
    setSelectedContactIds([]);
    setSelectionMode(false);
  }, []);

  const toggleContactSelection = useCallback((contactId: number) => {
    setSelectedContactIds((current) => {
      if (current.includes(contactId)) {
        return current.filter((id) => id !== contactId);
      }
      return [...current, contactId];
    });
  }, []);

  const handleFixSelected = useCallback(() => {
    if (selectedContactIds.length === 0) return;

    Alert.alert(
      'Apply Selected Cleanup Fixes',
      `Apply cleanup fixes to ${selectedContactIds.length} selected contacts in one transaction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            const count = applyBulkCleanupFixesByContactIds(selectedContactIds);
            Alert.alert('Cleanup complete', `Applied ${count} cleanup fixes.`);
            clearSelection();
            runScan();
          },
        },
      ],
    );
  }, [clearSelection, runScan, selectedContactIds]);

  const handleDeleteGhosts = useCallback(() => {
    if (ghostContacts.length === 0) return;
    Alert.alert(
      'Delete Ghost Contacts',
      `Delete ${ghostContacts.length} ghost contacts? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const deleted = purgeGhostContacts(ghostContacts);
            Alert.alert('Ghost cleanup complete', `Deleted ${deleted} ghost contacts.`);
            runScan();
          },
        },
      ],
    );
  }, [ghostContacts, runScan]);

  const handlePurgeExpired = useCallback(() => {
    Alert.alert(
      'Purge Expired Contacts',
      `Are you sure you want to permanently delete ${expiredTemps.length} expired temporary contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: () => {
            const count = reviewAndPurgeExpired();
            Alert.alert('Success', `Purged ${count} expired contacts.`);
            runScan();
          }
        },
      ]
    );
  }, [expiredTemps, runScan]);

  if (isScanning) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Scanning contacts…</Text>
      </View>
    );
  }

  if (hasScanned && issueList.length === 0 && expiredTemps.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="check-all" size={56} color={COLORS.success} />
        <Text style={styles.emptyTitle}>All clean!</Text>
        <Text style={styles.emptySubtitle}>No cleanup issues or expired contacts found.</Text>
        <Button mode="outlined" onPress={runScan} textColor={COLORS.primary}>Re-scan</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerText}>
            {issueList.length} contacts with issues
          </Text>
          {selectionMode && <Text style={styles.selectionText}>{selectedCount} selected</Text>}
        </View>
        <View style={styles.headerActions}>
          {selectedCount > 0 && (
            <Button mode="text" onPress={clearSelection} textColor={COLORS.textSecondary} compact>
              Clear
            </Button>
          )}
          <Button
            mode={selectionMode ? 'contained' : 'outlined'}
            onPress={() => {
              if (selectionMode) {
                clearSelection();
              } else {
                setSelectionMode(true);
              }
            }}
            buttonColor={selectionMode ? COLORS.primary : undefined}
            textColor={selectionMode ? COLORS.textPrimary : COLORS.primary}
            compact
          >
            {selectionMode ? 'Done' : 'Select'}
          </Button>
        </View>
      </View>
      {selectionMode && selectedCount > 0 && (
        <Card style={styles.bulkCard}>
          <Card.Content style={styles.bulkActions}>
            <Button mode="contained" buttonColor={COLORS.primary} onPress={handleFixSelected}>
              Fix Selected
            </Button>
            <Button mode="outlined" textColor={COLORS.textSecondary} onPress={clearSelection}>
              Reset Selection
            </Button>
          </Card.Content>
        </Card>
      )}
      <FlatList
        data={issueList}
        keyExtractor={(item) => String(item.contact.id)}
        renderItem={({ item }) => (
          <CleanupCard
            item={item}
            selectionMode={selectionMode}
            selected={selectedContactIds.includes(item.contact.id)}
            onToggleSelect={() => toggleContactSelection(item.contact.id)}
            onApplyFix={(issue) => handleApplyFix(item, issue)}
            onApplyAllFixes={() => handleApplyAllForContact(item)}
          />
        )}
        ListHeaderComponent={(
          <View>
            <View style={styles.refreshRow}>
              <Button
                mode="text"
                onPress={runScan}
                textColor={COLORS.primary}
                compact
              >
                Re-scan
              </Button>
            </View>

            <View style={styles.summaryRow}>
              <Chip style={styles.summaryChip} textStyle={styles.summaryChipText}>
                {fixableContacts.length} fixable
              </Chip>
              <Chip style={styles.summaryChip} textStyle={styles.summaryChipText}>
                {ghostContacts.length} ghosts
              </Chip>
              <Chip style={styles.summaryChip} textStyle={styles.summaryChipText}>
                {expiredTemps.length} expired temporary
              </Chip>
            </View>

            {(fixableContacts.length > 0 || ghostContacts.length > 0 || expiredTemps.length > 0) && (
              <Card style={styles.actionCard}>
                <Card.Content style={styles.actionCardContent}>
                  {fixableContacts.length > 0 && (
                    <Button mode="contained" buttonColor={COLORS.primary} onPress={handleFixAll} style={styles.actionButton}>
                      Fix All Fixable
                    </Button>
                  )}
                  {ghostContacts.length > 0 && (
                    <Button mode="outlined" textColor={COLORS.error} onPress={handleDeleteGhosts} style={styles.actionButton}>
                      Delete Ghost Contacts
                    </Button>
                  )}
                  {expiredTemps.length > 0 && (
                    <Button mode="outlined" textColor={COLORS.warning} onPress={handlePurgeExpired} style={styles.actionButton}>
                      Review & Purge Expired
                    </Button>
                  )}
                </Card.Content>
              </Card>
            )}

            {expiredTemps.length > 0 && (
              <Card style={[styles.card, styles.expiredCard]}>
                <Card.Title
                  title={`${expiredTemps.length} Expired Temporary Contacts`}
                  subtitle="These contacts have passed their expiry date."
                  titleStyle={{ color: COLORS.error, fontSize: FONT_SIZE.md }}
                  left={() => <MaterialCommunityIcons name="timer-sand-empty" color={COLORS.error} size={24} />}
                />
              </Card>
            )}
          </View>
        )}
        ListEmptyComponent={<View style={styles.listEmptySpacer} />}
        contentContainerStyle={styles.listContent}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

interface CleanupCardProps {
  item: ContactIssues;
  selected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
  onApplyFix: (issue: CleanupIssue) => void;
  onApplyAllFixes: () => void;
}

const CleanupCard = memo(function CleanupCard({
  item,
  selected,
  selectionMode,
  onToggleSelect,
  onApplyFix,
  onApplyAllFixes,
}: CleanupCardProps) {
  const hasFixableIssue = item.issues.some((issue) => issue.suggestedValue);

  return (
    <Card style={[styles.card, selected && styles.cardSelected]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.contactName}>{item.contact.displayName}</Text>
          {selectionMode && (
            <IconButton
              icon={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
              onPress={onToggleSelect}
              size={20}
              iconColor={selected ? COLORS.primary : COLORS.textSecondary}
              style={styles.selectIcon}
            />
          )}
        </View>
        {item.issues.map((issue, idx) => (
          <View key={idx} style={styles.issueRow}>
            <MaterialCommunityIcons
              name={(ISSUE_ICONS[issue.kind] ?? 'alert') as any}
              color={COLORS.warning}
              size={16}
            />
            <View style={styles.issueContent}>
              <Text style={styles.issueLabel}>{ISSUE_LABELS[issue.kind] ?? issue.kind}</Text>
              {issue.suggestedValue && (
                <Text style={styles.issueSuggestion}>
                  → {issue.suggestedValue}
                </Text>
              )}
            </View>
            {issue.suggestedValue && (
              <Button
                mode="text"
                onPress={() => onApplyFix(issue)}
                compact
                textColor={COLORS.secondary}
              >
                Fix
              </Button>
            )}
          </View>
        ))}
        {hasFixableIssue && (
          <View style={styles.cardActions}>
            <Button mode="outlined" onPress={onApplyAllFixes} textColor={COLORS.primary}>
              Fix All
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  selectionText: { color: COLORS.primary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  bulkCard: { backgroundColor: COLORS.surfaceVariant, marginHorizontal: SPACING.md, marginBottom: SPACING.sm },
  bulkActions: { flexDirection: 'row', gap: SPACING.sm, justifyContent: 'space-between' },
  refreshRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  headerText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  listContent: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xxl },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  summaryChip: { backgroundColor: COLORS.surfaceVariant },
  summaryChipText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  actionCard: { backgroundColor: COLORS.surface, marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  actionCardContent: { gap: SPACING.sm },
  actionButton: { alignSelf: 'stretch' },
  expiredCard: { borderColor: COLORS.error, borderWidth: 1, marginHorizontal: SPACING.md, marginBottom: SPACING.md },
  listEmptySpacer: { height: 1 },
  card: { backgroundColor: COLORS.surface },
  cardSelected: { borderColor: COLORS.primary, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectIcon: { margin: 0 },
  contactName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  issueContent: { flex: 1 },
  issueLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  issueSuggestion: { color: COLORS.secondary, fontSize: FONT_SIZE.xs },
  cardActions: { marginTop: SPACING.sm, alignItems: 'flex-end' },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
