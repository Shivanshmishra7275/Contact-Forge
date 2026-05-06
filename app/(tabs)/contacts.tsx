/**
 * ContactForge — Contacts List Screen
 *
 * Paginated, searchable list of local contacts.
 * Supports filtering by state: all / temporary / ghost / by tag.
 * Phase 7: Multi-select mode with bulk delete, bulk tag, and bulk export.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { Text, Chip, FAB, ActivityIndicator, Button, Portal, Modal } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listContacts, countContacts, deleteContact, updateContact } from '../../src/db/repositories/contactRepository';
import { logAction } from '../../src/db/repositories/auditRepository';
import { exportToCSV, shareFile } from '../../src/services/exportService';
import { parseTagsSafe } from '../../src/utils/normalization';
import { COLORS, SPACING, FONT_SIZE, PAGE_SIZE, CONTACT_TAGS } from '../../src/constants';
import type { LocalContact } from '../../src/types';

type Filter = 'all' | 'temporary' | 'ghost';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bulk select state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);
  const [isBulkWorking, setIsBulkWorking] = useState(false);

  const loadContacts = useCallback(
    (searchStr: string, f: Filter, p: number, append = false) => {
      setIsLoading(true);
      try {
        const params = {
          search: searchStr || undefined,
          isTemporary: f === 'temporary' ? true : undefined,
          isGhost: f === 'ghost' ? true : undefined,
          page: p,
          pageSize: PAGE_SIZE,
        };
        const rows = listContacts(params);
        const count = countContacts({
          search: searchStr || undefined,
          isTemporary: f === 'temporary' ? true : undefined,
          isGhost: f === 'ghost' ? true : undefined,
        });
        setContacts((prev) => (append ? [...prev, ...rows] : rows));
        setTotal(count);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadContacts(search, filter, 0, false);
    setPage(0);
  }, [filter]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setPage(0);
        loadContacts(text, filter, 0, false);
      }, 300);
    },
    [filter, loadContacts],
  );

  const handleEndReached = useCallback(() => {
    if (isLoading) return;
    const nextPage = page + 1;
    if (nextPage * PAGE_SIZE >= total) return;
    setPage(nextPage);
    loadContacts(search, filter, nextPage, true);
  }, [isLoading, page, total, search, filter, loadContacts]);

  // -------------------------------------------------------------------------
  // Selection helpers
  // -------------------------------------------------------------------------

  const toggleSelectMode = useCallback(() => {
    setIsSelecting((v) => !v);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(contacts.map((c) => c.id)));
  }, [contacts]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // -------------------------------------------------------------------------
  // Bulk actions
  // -------------------------------------------------------------------------

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Contacts',
      `Delete ${selectedIds.size} selected contact${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsBulkWorking(true);
            try {
              for (const id of selectedIds) {
                logAction('contact_deleted', id, { bulk: true });
                deleteContact(id);
              }
              setSelectedIds(new Set());
              setIsSelecting(false);
              loadContacts(search, filter, 0, false);
              setPage(0);
            } finally {
              setIsBulkWorking(false);
            }
          },
        },
      ],
    );
  }, [selectedIds, search, filter, loadContacts]);

  const handleBulkTag = useCallback((tag: string) => {
    setIsBulkWorking(true);
    try {
      for (const id of selectedIds) {
        const contact = contacts.find((c) => c.id === id);
        if (!contact) continue;
        const existingTags = parseTagsSafe(contact.tags);
        if (!existingTags.includes(tag)) {
          updateContact(id, { tags: [...existingTags, tag] });
          logAction('contact_updated', id, { bulk: true, addedTag: tag });
        }
      }
      setSelectedIds(new Set());
      setIsSelecting(false);
      setIsTagModalVisible(false);
      loadContacts(search, filter, 0, false);
      setPage(0);
    } finally {
      setIsBulkWorking(false);
    }
  }, [selectedIds, contacts, search, filter, loadContacts]);

  const handleBulkExport = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsBulkWorking(true);
    try {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `contactforge-selection-${ts}.csv`;
      const result = await exportToCSV({
        format: 'csv',
        contactIds: Array.from(selectedIds),
        includeNotes: true,
        filename,
      });
      Alert.alert(
        'Export Ready',
        `Exported ${result.rowCount} contacts. Share?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share', onPress: () => shareFile(result.filePath) },
        ],
      );
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsBulkWorking(false);
    }
  }, [selectedIds]);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item }: { item: LocalContact }) => (
      <ContactRow
        contact={item}
        isSelecting={isSelecting}
        isSelected={selectedIds.has(item.id)}
        onPress={() => {
          if (isSelecting) {
            toggleSelect(item.id);
          } else {
            router.push(`/contact/${item.id}`);
          }
        }}
        onLongPress={() => {
          if (!isSelecting) {
            setIsSelecting(true);
            setSelectedIds(new Set([item.id]));
          }
        }}
      />
    ),
    [isSelecting, selectedIds, toggleSelect],
  );

  const EmptyState = () => (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="account-off" size={48} color={COLORS.textDisabled} />
      <Text style={styles.emptyText}>
        {search ? 'No contacts match your search.' : 'No contacts yet. Sync from the dashboard.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search bar */}
      {!isSelecting && (
        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" color={COLORS.textSecondary} size={20} />
          <RNTextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or email"
            placeholderTextColor={COLORS.textDisabled}
            value={search}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search contacts"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" color={COLORS.textSecondary} size={18} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleSelectMode} accessibilityLabel="Select contacts">
            <MaterialCommunityIcons name="checkbox-multiple-outline" color={COLORS.textSecondary} size={22} />
          </TouchableOpacity>
        </View>
      )}

      {/* Selection header */}
      {isSelecting && (
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionCount}>
            {selectedIds.size} selected
          </Text>
          <View style={styles.selectionActions}>
            <Button mode="text" onPress={selectAll} textColor={COLORS.primary} compact>All</Button>
            <Button mode="text" onPress={deselectAll} textColor={COLORS.textSecondary} compact>None</Button>
            <Button mode="text" onPress={toggleSelectMode} textColor={COLORS.textSecondary} compact>Cancel</Button>
          </View>
        </View>
      )}

      {/* Filter chips */}
      {!isSelecting && (
        <View style={styles.filterRow}>
          {(['all', 'temporary', 'ghost'] as Filter[]).map((f) => (
            <Chip
              key={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              style={styles.chip}
              textStyle={{ color: filter === f ? COLORS.primary : COLORS.textSecondary, fontSize: FONT_SIZE.xs }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Chip>
          ))}
          <Text style={styles.totalText}>{total} total</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={isLoading ? null : <EmptyState />}
        ListFooterComponent={isLoading ? <ActivityIndicator style={styles.loader} color={COLORS.primary} /> : null}
        contentContainerStyle={contacts.length === 0 ? styles.listEmpty : undefined}
        style={styles.list}
        getItemLayout={(_, index) => ({ length: 72, offset: 72 * index, index })}
      />

      {/* Bulk action bar */}
      {isSelecting && selectedIds.size > 0 && (
        <View style={styles.bulkBar}>
          <Button
            mode="contained"
            onPress={handleBulkDelete}
            loading={isBulkWorking}
            disabled={isBulkWorking}
            icon="delete"
            buttonColor={COLORS.error}
            compact
            style={styles.bulkBtn}
          >
            Delete
          </Button>
          <Button
            mode="outlined"
            onPress={() => setIsTagModalVisible(true)}
            disabled={isBulkWorking}
            icon="tag"
            textColor={COLORS.accent}
            compact
            style={styles.bulkBtn}
          >
            Tag
          </Button>
          <Button
            mode="outlined"
            onPress={handleBulkExport}
            loading={isBulkWorking}
            disabled={isBulkWorking}
            icon="export"
            textColor={COLORS.secondary}
            compact
            style={styles.bulkBtn}
          >
            Export
          </Button>
        </View>
      )}

      {/* Tag picker modal */}
      <Portal>
        <Modal
          visible={isTagModalVisible}
          onDismiss={() => setIsTagModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add tag to {selectedIds.size} contact{selectedIds.size > 1 ? 's' : ''}</Text>
          <View style={styles.modalTags}>
            {CONTACT_TAGS.map((tag) => (
              <Chip
                key={tag}
                onPress={() => handleBulkTag(tag)}
                style={styles.modalTagChip}
                textStyle={{ color: COLORS.accent, fontSize: FONT_SIZE.sm }}
                icon="tag"
              >
                {tag}
              </Chip>
            ))}
          </View>
          <Button mode="text" onPress={() => setIsTagModalVisible(false)} textColor={COLORS.textSecondary}>
            Cancel
          </Button>
        </Modal>
      </Portal>

      {!isSelecting && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/contact/new')}
          color={COLORS.textPrimary}
          accessibilityLabel="Add new contact"
        />
      )}
    </SafeAreaView>
  );
}

interface ContactRowProps {
  contact: LocalContact;
  isSelecting: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function ContactRow({ contact, isSelecting, isSelected, onPress, onLongPress }: ContactRowProps) {
  const initials = getInitials(contact.displayName);
  const tags = parseTagsSafe(contact.tags);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.row, isSelected && styles.rowSelected]}
      accessibilityLabel={`Contact: ${contact.displayName}`}
    >
      {isSelecting && (
        <MaterialCommunityIcons
          name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          color={isSelected ? COLORS.primary : COLORS.textDisabled}
          size={22}
        />
      )}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.name} numberOfLines={1}>{contact.displayName}</Text>
        {contact.company && (
          <Text style={styles.company} numberOfLines={1}>{contact.company}</Text>
        )}
        {tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>{tags.join(' · ')}</Text>
        )}
      </View>
      {contact.isTemporary && (
        <MaterialCommunityIcons name="clock-outline" color={COLORS.warning} size={16} />
      )}
      {!isSelecting && (
        <MaterialCommunityIcons name="chevron-right" color={COLORS.textDisabled} size={20} />
      )}
    </TouchableOpacity>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    paddingVertical: 0,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  selectionCount: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  chip: { backgroundColor: COLORS.surfaceVariant },
  totalText: {
    marginLeft: 'auto',
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  list: { flex: 1 },
  listEmpty: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.sm,
    minHeight: 72,
  },
  rowSelected: {
    backgroundColor: COLORS.surfaceVariant,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.md },
  rowContent: { flex: 1 },
  name: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '500' },
  company: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  tags: { color: COLORS.accent, fontSize: FONT_SIZE.xs },
  loader: { padding: SPACING.lg },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs,
  },
  bulkBtn: { flex: 1 },
  modal: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modalTagChip: { backgroundColor: COLORS.surfaceVariant },
});
