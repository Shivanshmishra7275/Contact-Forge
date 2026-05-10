/**
 * ContactForge — Contacts List Screen
 *
 * Paginated, searchable list of local contacts.
 * Supports filtering by state: all / temporary / ghost / by tag.
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput as RNTextInput,
  AppState,
  InteractionManager,
} from 'react-native';
import { Text, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { listContacts, countContacts } from '../../src/db/repositories/contactRepository';
import { COLORS, SPACING, FONT_SIZE, PAGE_SIZE } from '../../src/constants';
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
  const searchRef = useRef(search);
  const filterRef = useRef(filter);

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
    const task = InteractionManager.runAfterInteractions(() => {
      refreshContacts();
    });

    return () => task.cancel();
  }, [filter, refreshContacts]);

  useEffect(() => {
    const subscription = typeof Contacts.addContactsChangeListener === 'function'
      ? Contacts.addContactsChangeListener(() => {
          refreshContacts();
        })
      : undefined;

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshContacts();
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

  const renderItem = useCallback(
    ({ item }: { item: LocalContact }) => (
      <ContactRow contact={item} onPress={() => router.push(`/contact/${item.id}`)} />
    ),
    [],
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
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/contact/new')}
        color={COLORS.textPrimary}
        accessibilityLabel="Add new contact"
      />
    </SafeAreaView>
  );
}

interface ContactRowProps {
  contact: LocalContact;
  onPress: () => void;
}

const ContactRow = memo(function ContactRow({ contact, onPress }: ContactRowProps) {
  const initials = getInitials(contact.displayName);
  const tags: string[] = (() => { try { return JSON.parse(contact.tags) as string[]; } catch { return []; } })();

  return (
    <TouchableOpacity onPress={onPress} style={styles.row} accessibilityLabel={`Contact: ${contact.displayName}`}>
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
      <MaterialCommunityIcons name="chevron-right" color={COLORS.textDisabled} size={20} />
    </TouchableOpacity>
  );
});

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
});
