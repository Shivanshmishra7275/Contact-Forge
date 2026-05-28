/**
 * ContactForge — Contacts List Screen
 *
 * Paginated, searchable list of local contacts.
 * Supports filtering by state: all / temporary / ghost / by tag.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  AppState,
  InteractionManager,
  Platform,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, Chip, FAB, ActivityIndicator, Button } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import {
  listContacts,
  countContacts,
  listContactsByIds,
  countContactsByIds,
  deleteContactsBulk,
} from '../../src/db/repositories/contactRepository';
import { getContactsNeedingCuration } from '../../src/services/contactHealthService';
import { exportToVCF, shareFile } from '../../src/services/exportService';
import { COLORS, SPACING, FONT_SIZE, PAGE_SIZE, RADIUS } from '../../src/constants';
import type { LocalContact } from '../../src/types';

type Filter = 'all' | 'temporary' | 'ghost' | 'low_health';

export default function ContactsScreen() {
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const rawFilter = Array.isArray(filterParam) ? filterParam[0] : filterParam;
  const initialFilter: Filter = rawFilter === 'low_health' ? 'low_health' : 'all';

  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef(search);
  const filterRef = useRef(filter);
  const lowHealthIdsRef = useRef<number[] | null>(null);
  // PERF: prevent redundant DB refresh when app returns from foreground within a short window
  const lastActiveAtRef = useRef<number>(0);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const isSelectionMode = selectedIds.size > 0;

  const loadLowHealthIds = useCallback(() => {
    const ids = getContactsNeedingCuration();
    lowHealthIdsRef.current = ids;
    return ids;
  }, []);

  const loadContacts = useCallback(
    (searchStr: string, f: Filter, p: number, append = false) => {
      setIsLoading(true);
      try {
        if (f === 'low_health') {
          const ids = p === 0 || !lowHealthIdsRef.current
            ? loadLowHealthIds()
            : lowHealthIdsRef.current;

          const rows = listContactsByIds({
            ids,
            search: searchStr || undefined,
            page: p,
            pageSize: PAGE_SIZE,
          });
          const count = countContactsByIds({ ids, search: searchStr || undefined });
          setContacts((prev) => (append ? [...prev, ...rows] : rows));
          setTotal(count);
          return;
        }

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
    [loadLowHealthIds],
  );

  const refreshContacts = useCallback(() => {
    setPage(0);
    loadContacts(searchRef.current, filterRef.current, 0, false);
  }, [loadContacts]);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  useEffect(() => {
    if (rawFilter === 'low_health') {
      setFilter('low_health');
    }
  }, [rawFilter]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      refreshContacts();
    });

    return () => task.cancel();
  }, [filter, refreshContacts]);

  useEffect(() => {
    const subscription = Platform.OS !== 'web' && typeof Contacts.addContactsChangeListener === 'function'
      ? Contacts.addContactsChangeListener(() => {
          refreshContacts();
        })
      : undefined;

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        // PERF: throttle foreground-resume reloads to max once per 5s
        const now = Date.now();
        if (now - lastActiveAtRef.current > 5000) {
          lastActiveAtRef.current = now;
          refreshContacts();
        }
      }
    });

    return () => {
      subscription?.remove();
      appStateSubscription.remove();
    };
  }, [refreshContacts]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      searchRef.current = text;
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

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      'Delete Contacts',
      `Are you sure you want to delete ${selectedIds.size} contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteContactsBulk(Array.from(selectedIds));
            clearSelection();
            refreshContacts();
          },
        },
      ]
    );
  }, [selectedIds, clearSelection, refreshContacts]);

  const handleBulkExport = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setIsLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `contactforge-export-${ts}.vcf`;
      const result = await exportToVCF({
        format: 'vcf',
        contactIds: ids,
        includeNotes: true,
        filename,
      });
      await shareFile(result.filePath);
      clearSelection();
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, clearSelection]);

  const renderItem = useCallback(
    ({ item }: { item: LocalContact }) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <ContactRow 
          contact={item} 
          selected={isSelected}
          selectionMode={isSelectionMode}
          onLongPress={() => toggleSelection(item.id)}
          onPress={() => {
            if (isSelectionMode) {
              toggleSelection(item.id);
            } else {
              router.push(`/contact/${item.id}`);
            }
          }} 
        />
      );
    },
    [selectedIds, isSelectionMode, toggleSelection],
  );

  const isLowHealth = filter === 'low_health';

  const EmptyState = () => (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="account-off" size={48} color={COLORS.textDisabled} />
      <Text style={styles.emptyText}>
        {search
          ? 'No contacts match your search.'
          : isLowHealth
            ? 'No low health contacts right now.'
            : 'No contacts yet. Sync from the dashboard.'}
      </Text>
      {!search && (
        <Button
          mode="outlined"
          onPress={() => router.push('/(tabs)')}
          icon="sync"
          textColor={COLORS.primary}
          style={styles.emptyButton}
        >
          Sync Contacts
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Search bar */}
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
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'temporary', 'ghost', 'low_health'] as Filter[]).map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={styles.chip}
            textStyle={{ color: filter === f ? COLORS.primary : COLORS.textSecondary, fontSize: FONT_SIZE.xs }}
          >
            {f === 'low_health'
              ? 'Low health'
              : f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
        <Text style={styles.totalText}>{total} total</Text>
      </View>

      {/* Main List */}
      <Animated.View style={{ flex: 1 }} entering={FadeInDown.duration(400).springify()}>
        <FlashList
          data={contacts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={!isLoading ? EmptyState : null}
          ListFooterComponent={isLoading ? <ActivityIndicator style={{ padding: SPACING.md }} /> : null}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          extraData={{ selectedIds, filter }}
          // @ts-ignore - Required for FlashList performance
          estimatedItemSize={70}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            contacts.length === 0 
              ? styles.listEmpty 
              : isSelectionMode ? { paddingBottom: 100 } : undefined
          }
          style={styles.list}
        />
      </Animated.View>

      {isSelectionMode ? (
        <View style={styles.actionBar}>
          <View style={styles.actionBarTop}>
            <Text style={styles.actionBarTitle}>{selectedIds.size} Selected</Text>
            <TouchableOpacity onPress={clearSelection} style={styles.actionIconBtn}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.actionBarButtons}>
            <Button
              mode="outlined"
              icon="export"
              onPress={handleBulkExport}
              style={[styles.actionBtn, { borderColor: COLORS.primary }]}
              textColor={COLORS.primary}
            >
              Export
            </Button>
            <Button
              mode="contained"
              icon="delete"
              onPress={handleBulkDelete}
              style={styles.actionBtn}
              buttonColor={COLORS.error}
            >
              Delete
            </Button>
          </View>
        </View>
      ) : (
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
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
}

const ContactRow = memo(function ContactRow({ contact, onPress, onLongPress, selected, selectionMode }: ContactRowProps) {
  const initials = getInitials(contact.displayName);
  const tags: string[] = (() => { try { return JSON.parse(contact.tags) as string[]; } catch { return []; } })();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[styles.row, selected && styles.rowSelected]}
      accessibilityLabel={`Contact: ${contact.displayName}`}
    >
      {selectionMode && (
        <MaterialCommunityIcons
          name={selected ? "check-circle" : "checkbox-blank-circle-outline"}
          size={24}
          color={selected ? COLORS.primary : COLORS.textDisabled}
          style={{ marginRight: SPACING.md }}
        />
      )}
      {!selectionMode && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
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
      {!selectionMode && (
        <MaterialCommunityIcons name="chevron-right" color={COLORS.textDisabled} size={20} />
      )}
    </TouchableOpacity>
  );
});

function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0].length > 0 && parts[parts.length - 1].length > 0) {
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
  healthIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthGrade: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  loader: { padding: SPACING.lg },
  empty: { alignItems: 'center', paddingTop: SPACING.xxl, gap: SPACING.md },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyButton: { marginTop: SPACING.sm },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  rowSelected: {
    backgroundColor: COLORS.primary + '11',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionBarTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  actionIconBtn: {
    padding: SPACING.xs,
  },
  actionBarButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
  },
});
