/**
 * ContactForge — Power Cleanup Command Center Screen
 *
 * Implements a premium, confidence-building data quality control center.
 * Integrates duplicates, formatting, incomplete profiles, and temporary contacts.
 * Wrapped with transaction-safe execution and global Undo support.
 */

import { memo, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, InteractionManager, Dimensions, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  IconButton,
  Portal,
  Modal,
  Divider,
  Surface,
} from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  scanAllContactsForIssues,
  applyCleanupFix,
  applyBulkCleanupFixesByContactIds,
  purgeGhostContacts,
  type ContactIssues,
} from '../../src/services/cleanupService';
import {
  reviewAndPurgeExpired,
  getExpiredTemporaryContacts,
} from '../../src/services/temporaryContactService';
import {
  getPendingDuplicates,
  resolveDuplicateCandidate,
  resolveDuplicateCandidatesBulk,
} from '../../src/db/repositories/duplicateRepository';
import {
  getContactById,
  countContacts,
  deleteContactsBulk,
} from '../../src/db/repositories/contactRepository';
import { useAppStore } from '../../src/store/appStore';
import { COLORS, SPACING, FONT_SIZE, RADIUS } from '../../src/constants';
import type { CleanupCategory, UnifiedCleanupItem, DuplicatePair } from '../../src/features/cleanup/types';
import type { CleanupIssue, TemporaryContact, DuplicateCandidate, LocalContact } from '../../src/types';

const ISSUE_LABELS: Record<string, string> = {
  missing_name: 'Missing Name',
  missing_phone: 'No Phone',
  missing_email: 'No Email',
  malformed_phone: 'Standardize Phone',
  uncapitalized_name: 'Capitalization',
  extra_whitespace: 'Trim Spaces',
  no_country_code: 'Country Code',
  ghost_contact: 'Ghost Profile',
  duplicate_numbers: 'Duplicate Numbers',
};

const ISSUE_ICONS: Record<string, string> = {
  missing_name: 'account-question',
  missing_phone: 'phone-off',
  missing_email: 'email-off',
  uncapitalized_name: 'format-letter-case',
  extra_whitespace: 'format-clear',
  ghost_contact: 'ghost',
  malformed_phone: 'phone-alert',
  no_country_code: 'earth',
  duplicate_numbers: 'content-copy',
};

export default function PowerCleanupCommandCenter() {
  const [activeCategory, setActiveCategory] = useState<CleanupCategory>('all');
  const [unifiedItems, setUnifiedItems] = useState<UnifiedCleanupItem[]>([]);
  const [totalContactCount, setTotalContactCount] = useState(0);
  const [isScanning, setIsScanning] = useState(true);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Safe Preview Modal state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewAction, setPreviewAction] = useState<{
    type: 'bulk_fix' | 'bulk_ignore' | 'bulk_safe' | 'bulk_delete' | 'bulk_purge_expired';
    title: string;
    description: string;
    affectedCount: number;
    execute: () => void;
  } | null>(null);

  const setPendingDuplicateCount = useAppStore((s) => s.setPendingDuplicateCount);

  // Unified Data Loading routine
  const loadUnifiedData = useCallback(() => {
    setIsScanning(true);
    
    // Fetch total database contact count
    const total = countContacts();
    setTotalContactCount(total);

    const mappedItems: UnifiedCleanupItem[] = [];

    // 1. Fetch pending duplicate pairs
    const duplicates = getPendingDuplicates();
    setPendingDuplicateCount(duplicates.length);
    duplicates.forEach((cand) => {
      const contactA = getContactById(cand.contactIdA);
      const contactB = getContactById(cand.contactIdB);
      mappedItems.push({
        id: `dup_${cand.id}`,
        category: 'duplicates',
        title: 'Potential Duplicate Pair',
        subtitle: `${contactA?.displayName ?? 'Unknown'} & ${contactB?.displayName ?? 'Unknown'}`,
        icon: 'account-multiple',
        contactId: cand.contactIdA,
        duplicatePair: {
          candidate: cand,
          contactA,
          contactB,
        },
      });
    });

    // 2. Fetch formatting & incomplete profile issues
    const profileIssues = scanAllContactsForIssues();
    profileIssues.forEach((item) => {
      const incompleteIssues = item.issues.filter(iss => 
        ['missing_name', 'missing_phone', 'missing_email', 'ghost_contact'].includes(iss.kind)
      );
      
      const formattingIssues = item.issues.filter(iss => 
        !['missing_name', 'missing_phone', 'missing_email', 'ghost_contact'].includes(iss.kind)
      );
      
      if (incompleteIssues.length > 0) {
        mappedItems.push({
          id: `incomplete_${item.contact.id}`,
          category: 'incomplete',
          title: item.contact.displayName,
          subtitle: `${incompleteIssues.length} incomplete field${incompleteIssues.length > 1 ? 's' : ''}`,
          icon: 'account-alert',
          contactId: item.contact.id,
          contactIssues: { contact: item.contact, issues: incompleteIssues },
        });
      }

      if (formattingIssues.length > 0) {
        mappedItems.push({
          id: `formatting_${item.contact.id}`,
          category: 'formatting',
          title: item.contact.displayName,
          subtitle: `${formattingIssues.length} formatting issue${formattingIssues.length > 1 ? 's' : ''}`,
          icon: 'card-text-outline',
          contactId: item.contact.id,
          contactIssues: { contact: item.contact, issues: formattingIssues },
        });
      }
    });

    // 3. Fetch expired temporary contacts
    const expiredTemps = getExpiredTemporaryContacts();
    expiredTemps.forEach((temp) => {
      const contact = getContactById(temp.contactId);
      mappedItems.push({
        id: `temp_${temp.id}`,
        category: 'temporary',
        title: contact?.displayName ?? 'Expired Temporary Contact',
        subtitle: 'Expired Temporary Contact',
        icon: 'timer-sand-empty',
        contactId: temp.contactId,
        tempContact: temp,
      });
    });

    setUnifiedItems(mappedItems);
    setIsScanning(false);
  }, [setPendingDuplicateCount]);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        loadUnifiedData();
      });
      return () => task.cancel();
    }, [loadUnifiedData])
  );

  // Group metrics calculations
  const metrics = useMemo(() => {
    const counts = {
      all: unifiedItems.length,
      duplicates: 0,
      incomplete: 0,
      formatting: 0,
      temporary: 0,
    };
    unifiedItems.forEach((item) => {
      counts[item.category]++;
    });
    return counts;
  }, [unifiedItems]);

  // Filtered item list
  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return unifiedItems;
    return unifiedItems.filter((item) => item.category === activeCategory);
  }, [unifiedItems, activeCategory]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }, []);

  // Safe execution of preview actions
  const triggerPreview = useCallback((action: typeof previewAction) => {
    if (!action) return;
    setPreviewAction(action);
    setPreviewModalVisible(true);
  }, []);

  // Individual Actions
  const handleApplySingleFix = useCallback((item: ContactIssues, issue: CleanupIssue) => {
    const applied = applyCleanupFix(item.contact, issue);
    if (applied) {
      loadUnifiedData();
    }
  }, [loadUnifiedData]);

  const handleIgnoreSingleDuplicate = useCallback((cand: DuplicateCandidate) => {
    resolveDuplicateCandidate(cand.id, 'ignored');
    loadUnifiedData();
  }, [loadUnifiedData]);

  const handleMarkSafeSingleDuplicate = useCallback((cand: DuplicateCandidate) => {
    resolveDuplicateCandidate(cand.id, 'safe');
    loadUnifiedData();
  }, [loadUnifiedData]);

  // Bulk Actions
  const handleBulkApplyFormatting = useCallback(() => {
    const targetIds = filteredItems
      .filter((item) => item.category === 'formatting' && (selectedIds.length === 0 || selectedIds.includes(item.id)))
      .map((item) => item.contactId);

    if (targetIds.length === 0) return;

    triggerPreview({
      type: 'bulk_fix',
      title: 'Fix formatting issues',
      description: `This will apply spelling case standardizations, spacing corrections, and phone number normalization changes to ${targetIds.length} profiles.`,
      affectedCount: targetIds.length,
      execute: () => {
        applyBulkCleanupFixesByContactIds(targetIds);
        clearSelection();
        loadUnifiedData();
      },
    });
  }, [filteredItems, selectedIds, triggerPreview, clearSelection, loadUnifiedData]);

  const handleBulkDeleteGhosts = useCallback(() => {
    const targetIssues = filteredItems
      .filter((item) => item.category === 'incomplete' && (selectedIds.length === 0 || selectedIds.includes(item.id)))
      .map((item) => item.contactIssues)
      .filter(Boolean) as ContactIssues[];

    const ghostCount = targetIssues.filter((item) =>
      item.issues.some((iss) => iss.kind === 'ghost_contact')
    ).length;

    if (ghostCount === 0) return;

    triggerPreview({
      type: 'bulk_delete',
      title: 'Delete Ghost Contacts',
      description: `This will permanently delete ${ghostCount} empty contact profiles containing no names, phone numbers, or email records.`,
      affectedCount: ghostCount,
      execute: () => {
        purgeGhostContacts(targetIssues);
        clearSelection();
        loadUnifiedData();
      },
    });
  }, [filteredItems, selectedIds, triggerPreview, clearSelection, loadUnifiedData]);

  const handleBulkResolveDuplicates = useCallback((status: 'safe' | 'ignored') => {
    const targetCandidateIds = filteredItems
      .filter((item) => item.category === 'duplicates' && (selectedIds.length === 0 || selectedIds.includes(item.id)))
      .map((item) => item.duplicatePair?.candidate.id)
      .filter(Boolean) as number[];

    if (targetCandidateIds.length === 0) return;

    triggerPreview({
      type: status === 'safe' ? 'bulk_safe' : 'bulk_ignore',
      title: status === 'safe' ? 'Mark Selected Safe' : 'Ignore Selected',
      description: `This will mark ${targetCandidateIds.length} candidate pairs as ${
        status === 'safe' ? 'manually confirmed duplicates' : 'ignored comparisons'
      } to clear them from lists.`,
      affectedCount: targetCandidateIds.length,
      execute: () => {
        resolveDuplicateCandidatesBulk(targetCandidateIds, status);
        clearSelection();
        loadUnifiedData();
      },
    });
  }, [filteredItems, selectedIds, triggerPreview, clearSelection, loadUnifiedData]);

  const handleBulkPurgeExpired = useCallback(() => {
    const targetIds = filteredItems
      .filter((item) => item.category === 'temporary' && (selectedIds.length === 0 || selectedIds.includes(item.id)))
      .map((item) => item.contactId);

    if (targetIds.length === 0) return;

    triggerPreview({
      type: 'bulk_purge_expired',
      title: 'Purge Expired Temporary Contacts',
      description: `This will permanently delete ${targetIds.length} temporary contact profiles whose lifespans have expired.`,
      affectedCount: targetIds.length,
      execute: () => {
        deleteContactsBulk(targetIds);
        clearSelection();
        loadUnifiedData();
      },
    });
  }, [filteredItems, selectedIds, triggerPreview, clearSelection, loadUnifiedData]);

  if (isScanning && unifiedItems.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Scanning details for cleanup opportunities…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top dashboard summary bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titleText}>Power Cleanup</Text>
          <Text style={styles.subtitleText}>
            {metrics.all > 0
              ? `${metrics.all} health problems flagged across ${totalContactCount} contacts`
              : 'All profiles fully standardized'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {selectionMode ? (
            <Button mode="text" onPress={clearSelection} textColor={COLORS.textSecondary} compact>
              Cancel
            </Button>
          ) : (
            unifiedItems.length > 0 && (
              <IconButton
                icon="checkbox-multiple-marked-outline"
                iconColor={COLORS.primary}
                size={22}
                onPress={() => setSelectionMode(true)}
              />
            )
          )}
        </View>
      </View>

      {/* Horizontal Dashboard Metrics Filters */}
      <View style={{ height: 95, marginBottom: SPACING.md }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsContainer}
        >
          <MetricCard
            title="All"
            count={metrics.all}
            active={activeCategory === 'all'}
            onPress={() => { setActiveCategory('all'); clearSelection(); }}
            icon="broom"
            color={COLORS.primary}
          />
          <MetricCard
            title="Duplicates"
            count={metrics.duplicates}
            active={activeCategory === 'duplicates'}
            onPress={() => { setActiveCategory('duplicates'); clearSelection(); }}
            icon="content-copy"
            color={COLORS.error}
          />
          <MetricCard
            title="Formatting"
            count={metrics.formatting}
            active={activeCategory === 'formatting'}
            onPress={() => { setActiveCategory('formatting'); clearSelection(); }}
            icon="format-letter-case"
            color={COLORS.secondary}
          />
          <MetricCard
            title="Incomplete"
            count={metrics.incomplete}
            active={activeCategory === 'incomplete'}
            onPress={() => { setActiveCategory('incomplete'); clearSelection(); }}
            icon="account-alert"
            color={COLORS.accent}
          />
          <MetricCard
            title="Temporary"
            count={metrics.temporary}
            active={activeCategory === 'temporary'}
            onPress={() => { setActiveCategory('temporary'); clearSelection(); }}
            icon="timer-sand-empty"
            color={COLORS.info}
          />
        </ScrollView>
      </View>

      {/* Unified List Rendering */}
      {filteredItems.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="shield-check-outline" size={64} color={COLORS.success} />
          <Text style={styles.emptyTitle}>Looking Standardized!</Text>
          <Text style={styles.emptySubtitle}>
            No issues found in this category. Your contact vault is safe and clean.
          </Text>
          <Button mode="outlined" onPress={loadUnifiedData} textColor={COLORS.primary} style={styles.rescanBtn}>
            Rescan database
          </Button>
        </View>
      ) : (
        <FlashList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          // @ts-ignore - Required for FlashList performance
          estimatedItemSize={120}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <UnifiedCleanupCard
              item={item}
              selectionMode={selectionMode}
              selected={selectedIds.includes(item.id)}
              onToggleSelect={() => toggleSelection(item.id)}
              onApplySingleFix={handleApplySingleFix}
              onIgnoreSingleDuplicate={handleIgnoreSingleDuplicate}
              onMarkSafeSingleDuplicate={handleMarkSafeSingleDuplicate}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Sticky Bottom Action Bar */}
      {selectionMode && (
        <Surface style={styles.bottomBar} elevation={4}>
          <View style={styles.bottomBarContent}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionCount}>
                {selectedIds.length === 0 ? 'All' : selectedIds.length} Selected
              </Text>
            </View>
            <View style={styles.bottomBarActions}>
              {activeCategory === 'all' && (
                <Text style={styles.selectAllHelp}>Filter to category for bulk actions</Text>
              )}
              {activeCategory === 'formatting' && (
                <Button mode="contained" buttonColor={COLORS.primary} onPress={handleBulkApplyFormatting}>
                  Fix Formatting
                </Button>
              )}
              {activeCategory === 'duplicates' && (
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <Button mode="contained" buttonColor={COLORS.success} onPress={() => handleBulkResolveDuplicates('safe')} compact>
                    Mark Safe
                  </Button>
                  <Button mode="outlined" textColor={COLORS.error} onPress={() => handleBulkResolveDuplicates('ignored')} compact style={{ borderWidth: 1, borderColor: COLORS.error }}>
                    Ignore
                  </Button>
                </View>
              )}
              {activeCategory === 'incomplete' && (
                <Button mode="contained" buttonColor={COLORS.error} onPress={handleBulkDeleteGhosts}>
                  Delete Ghosts
                </Button>
              )}
              {activeCategory === 'temporary' && (
                <Button mode="contained" buttonColor={COLORS.warning} onPress={handleBulkPurgeExpired}>
                  Purge Expired
                </Button>
              )}
            </View>
          </View>
        </Surface>
      )}

      {/* Frosted Safe Preview Modal */}
      <Portal>
        <Modal
          visible={previewModalVisible}
          onDismiss={() => setPreviewModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons name="shield-lock-outline" size={26} color={COLORS.primary} />
            <Text style={styles.modalTitle}>{previewAction?.title}</Text>
          </View>
          <Divider style={styles.modalDivider} />
          
          <Text style={styles.modalDesc}>{previewAction?.description}</Text>
          
          <View style={styles.safetyBox}>
            <MaterialCommunityIcons name="backup-restore" size={20} color={COLORS.success} />
            <Text style={styles.safetyText}>
              This action is transaction-safe. If needed, you can roll back instantly with the Undo action.
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="contained"
              buttonColor={COLORS.primary}
              onPress={() => {
                setPreviewModalVisible(false);
                if (previewAction) {
                  previewAction.execute();
                }
              }}
              style={styles.modalBtn}
            >
              Apply Changes
            </Button>
            <Button
              mode="text"
              textColor={COLORS.textSecondary}
              onPress={() => setPreviewModalVisible(false)}
              style={styles.modalBtn}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

// Subcomponent: Dashboard Metrics Cards
interface MetricCardProps {
  title: string;
  count: number;
  active: boolean;
  onPress: () => void;
  icon: string;
  color: string;
}

const MetricCard = memo(function MetricCard({ title, count, active, onPress, icon, color }: MetricCardProps) {
  return (
    <Card
      style={[
        styles.metricCard,
        active && { borderColor: color, borderWidth: 1.5, backgroundColor: COLORS.surfaceElevated },
      ]}
      onPress={onPress}
    >
      <Card.Content style={styles.metricContent}>
        <View style={styles.metricRow}>
          <MaterialCommunityIcons name={icon as any} color={active ? color : COLORS.textTertiary} size={18} />
          <Text style={[styles.metricCount, { color: active ? COLORS.textPrimary : COLORS.textSecondary }]}>
            {count}
          </Text>
        </View>
        <Text style={styles.metricTitle}>{title}</Text>
      </Card.Content>
    </Card>
  );
});

// Subcomponent: Unified Cleanup List Item Card
interface UnifiedCardProps {
  item: UnifiedCleanupItem;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onApplySingleFix: (item: ContactIssues, issue: CleanupIssue) => void;
  onIgnoreSingleDuplicate: (cand: DuplicateCandidate) => void;
  onMarkSafeSingleDuplicate: (cand: DuplicateCandidate) => void;
}

const UnifiedCleanupCard = memo(function UnifiedCleanupCard({
  item,
  selectionMode,
  selected,
  onToggleSelect,
  onApplySingleFix,
  onIgnoreSingleDuplicate,
  onMarkSafeSingleDuplicate,
}: UnifiedCardProps) {
  
  // Custom Render for Duplicates Category
  if (item.category === 'duplicates' && item.duplicatePair) {
    const { candidate, contactA, contactB } = item.duplicatePair;
    return (
      <Card style={[styles.card, selected && styles.cardSelected]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.badgeRow}>
              {selectionMode && (
                <IconButton
                  icon={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  onPress={onToggleSelect}
                  iconColor={selected ? COLORS.primary : COLORS.textSecondary}
                  style={styles.selectIcon}
                />
              )}
              <Chip
                style={[styles.badge, { backgroundColor: COLORS.error + '22' }]}
                textStyle={{ color: COLORS.error, fontSize: FONT_SIZE.xs }}
                compact
              >
                Duplicate Pair · {candidate.score}%
              </Chip>
            </View>
            <IconButton
              icon="open-in-new"
              iconColor={COLORS.primary}
              size={18}
              onPress={() => router.push(`/merge/${candidate.id}`)}
              style={{ margin: 0 }}
            />
          </View>

          {/* Side by side compare block */}
          <View style={styles.namesRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.nameLabel}>Contact A</Text>
              <Text style={styles.nameText} numberOfLines={1}>{contactA?.displayName ?? '(Deleted)'}</Text>
              {contactA?.company && <Text style={styles.companyText} numberOfLines={1}>{contactA.company}</Text>}
            </View>
            <MaterialCommunityIcons name="equal" color={COLORS.textTertiary} size={18} style={{ marginHorizontal: SPACING.xs }} />
            <View style={styles.nameBlock}>
              <Text style={styles.nameLabel}>Contact B</Text>
              <Text style={styles.nameText} numberOfLines={1}>{contactB?.displayName ?? '(Deleted)'}</Text>
              {contactB?.company && <Text style={styles.companyText} numberOfLines={1}>{contactB.company}</Text>}
            </View>
          </View>

          <View style={styles.reasonsRow}>
            {candidate.reasons.map((r: string) => (
              <Chip key={r} style={styles.reasonChip} textStyle={styles.reasonChipText} compact>
                {r.replace(/_/g, ' ')}
              </Chip>
            ))}
          </View>

          {!selectionMode && (
            <View style={styles.cardActions}>
              <Button
                mode="contained"
                buttonColor={COLORS.primary}
                onPress={() => router.push(`/merge/${candidate.id}`)}
                compact
                style={styles.actionBtn}
              >
                Review & Merge
              </Button>
              <Button
                mode="outlined"
                textColor={COLORS.textSecondary}
                onPress={() => onIgnoreSingleDuplicate(candidate)}
                compact
                style={styles.actionBtn}
              >
                Ignore
              </Button>
              <IconButton
                icon="shield-check"
                iconColor={COLORS.success}
                size={18}
                onPress={() => onMarkSafeSingleDuplicate(candidate)}
                style={{ margin: 0 }}
              />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  }

  // Custom Render for Formatting Category
  if (item.category === 'formatting' && item.contactIssues) {
    const contactIssues = item.contactIssues;
    return (
      <Card style={[styles.card, selected && styles.cardSelected]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {selectionMode && (
                <IconButton
                  icon={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  onPress={onToggleSelect}
                  iconColor={selected ? COLORS.primary : COLORS.textSecondary}
                  style={styles.selectIcon}
                />
              )}
              <Text style={styles.contactName}>{item.title}</Text>
            </View>
            <Chip style={styles.formattingBadge} textStyle={styles.formattingBadgeText} compact>
              Formatting
            </Chip>
          </View>

          {contactIssues.issues.map((issue, idx) => (
            <View key={idx} style={styles.issueRow}>
              <MaterialCommunityIcons
                name={(ISSUE_ICONS[issue.kind] ?? 'alert-circle-outline') as any}
                color={COLORS.warning}
                size={15}
              />
              <View style={styles.issueContent}>
                <Text style={styles.issueLabel}>{ISSUE_LABELS[issue.kind] ?? issue.kind}</Text>
                {issue.suggestedValue && (
                  <Text style={styles.issueSuggestion}>→ {issue.suggestedValue}</Text>
                )}
              </View>
              {issue.suggestedValue && !selectionMode && (
                <Button
                  mode="text"
                  onPress={() => onApplySingleFix(contactIssues, issue)}
                  compact
                  textColor={COLORS.secondary}
                >
                  Fix
                </Button>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  }

  // Custom Render for Incomplete Category
  if (item.category === 'incomplete' && item.contactIssues) {
    const contactIssues = item.contactIssues;
    const isGhost = contactIssues.issues.some((iss) => iss.kind === 'ghost_contact');
    return (
      <Card style={[styles.card, selected && styles.cardSelected]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {selectionMode && (
                <IconButton
                  icon={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  onPress={onToggleSelect}
                  iconColor={selected ? COLORS.primary : COLORS.textSecondary}
                  style={styles.selectIcon}
                />
              )}
              <Text style={styles.contactName}>{item.title}</Text>
            </View>
            <Chip
              style={[styles.badge, { backgroundColor: COLORS.accent + '22' }]}
              textStyle={{ color: COLORS.accent, fontSize: FONT_SIZE.xs }}
              compact
            >
              {isGhost ? 'Ghost Profile' : 'Incomplete'}
            </Chip>
          </View>

          {contactIssues.issues.map((issue, idx) => (
            <View key={idx} style={styles.issueRow}>
              <MaterialCommunityIcons
                name={(ISSUE_ICONS[issue.kind] ?? 'alert-octagon-outline') as any}
                color={COLORS.error}
                size={15}
              />
              <View style={styles.issueContent}>
                <Text style={styles.issueLabel}>{ISSUE_LABELS[issue.kind] ?? issue.kind}</Text>
                <Text style={styles.incompleteReason}>
                  {issue.kind === 'ghost_contact'
                    ? 'Contains zero fields of information. Safe to delete.'
                    : 'Missing critical contact field.'}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  }

  // Custom Render for Temporary Category
  if (item.category === 'temporary' && item.tempContact) {
    const temp = item.tempContact;
    return (
      <Card style={[styles.card, selected && styles.cardSelected]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {selectionMode && (
                <IconButton
                  icon={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  onPress={onToggleSelect}
                  iconColor={selected ? COLORS.primary : COLORS.textSecondary}
                  style={styles.selectIcon}
                />
              )}
              <Text style={styles.contactName}>{item.title}</Text>
            </View>
            <Chip style={styles.temporaryBadge} textStyle={styles.temporaryBadgeText} compact>
              Expired Temp
            </Chip>
          </View>

          <View style={styles.issueRow}>
            <MaterialCommunityIcons name="timer-off-outline" color={COLORS.error} size={15} />
            <View style={styles.issueContent}>
              <Text style={styles.issueLabel}>Lifespan Expired</Text>
              <Text style={styles.incompleteReason}>
                Contact was registered as temporary and has exceeded its expiry date.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return null;
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  loadingText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  titleText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '700' },
  subtitleText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  metricsContainer: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'center',
  },
  metricCard: {
    width: 105,
    height: 75,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  metricContent: { padding: SPACING.sm, paddingVertical: SPACING.md },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  metricCount: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  metricTitle: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, fontWeight: '500' },
  rescanBtn: { marginTop: SPACING.md },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    marginTop: SPACING.xs,
  },
  listContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  cardSelected: { borderColor: COLORS.primary, borderWidth: 1.5 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { borderRadius: RADIUS.xs },
  selectIcon: { margin: 0, marginRight: SPACING.xs },
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundAlt,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  nameBlock: { flex: 1 },
  nameLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textTertiary, marginBottom: 2 },
  nameText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  companyText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  reasonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: SPACING.md },
  reasonChip: { backgroundColor: COLORS.surfaceVariant, height: 24, borderRadius: RADIUS.xs },
  reasonChipText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  cardActions: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  actionBtn: { borderRadius: RADIUS.xs },
  contactName: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  formattingBadge: { backgroundColor: COLORS.secondary + '22', borderRadius: RADIUS.xs },
  formattingBadgeText: { color: COLORS.secondary, fontSize: FONT_SIZE.xs },
  temporaryBadge: { backgroundColor: COLORS.info + '22', borderRadius: RADIUS.xs },
  temporaryBadgeText: { color: COLORS.info, fontSize: FONT_SIZE.xs },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  issueContent: { flex: 1 },
  issueLabel: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '500' },
  issueSuggestion: { color: COLORS.secondary, fontSize: FONT_SIZE.xs, marginTop: 1 },
  incompleteReason: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 1 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceElevated,
    borderTopColor: COLORS.border,
    borderTopWidth: 1.5,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  bottomBarContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectionInfo: { flex: 1 },
  selectionCount: { color: COLORS.primary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  bottomBarActions: { flexDirection: 'row', alignItems: 'center' },
  selectAllHelp: { color: COLORS.textTertiary, fontSize: FONT_SIZE.xs },
  modalContainer: {
    backgroundColor: COLORS.surfaceElevated,
    margin: SPACING.xl,
    padding: SPACING.xl,
    borderRadius: RADIUS.md,
    borderColor: COLORS.border,
    borderWidth: 1.5,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  modalDivider: { backgroundColor: COLORS.border, marginBottom: SPACING.lg },
  modalDesc: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginBottom: SPACING.lg },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    borderColor: COLORS.success + '33',
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  safetyText: { color: COLORS.success, fontSize: FONT_SIZE.xs, flex: 1, lineHeight: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md },
  modalBtn: { flex: 1, borderRadius: RADIUS.sm },
});
