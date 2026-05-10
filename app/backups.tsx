/**
 * ContactForge — Backup Vault Screen
 *
 * Lists local backup files created by the export service and lets the user
 * create new backups, share them, or delete them with confirmation.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createFullBackup, shareFile } from '../src/services/exportService';
import { COLORS, SPACING, FONT_SIZE } from '../src/constants';

type BackupFile = {
  name: string;
  uri: string;
};

const BACKUP_PREFIX = 'contactforge-backup-';

export default function BackupsScreen() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const loadBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const dir = FileSystem.documentDirectory;
      if (!dir) {
        setBackups([]);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(dir);
      const filtered = files
        .filter((name) => name.startsWith(BACKUP_PREFIX))
        .sort((a, b) => b.localeCompare(a))
        .map((name) => ({ name, uri: `${dir}${name}` }));

      setBackups(filtered);
    } catch {
      setBackups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  const handleCreateBackup = useCallback(async (format: 'csv' | 'vcf') => {
    setIsCreating(true);
    try {
      await createFullBackup(format, true);
      await loadBackups();
    } catch (err) {
      Alert.alert('Backup Failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreating(false);
    }
  }, [loadBackups]);

  const handleShare = useCallback(async (uri: string) => {
    try {
      await shareFile(uri);
    } catch (err) {
      Alert.alert('Share Failed', err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleDelete = useCallback((file: BackupFile) => {
    Alert.alert(
      'Delete Backup',
      `Delete ${file.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await FileSystem.deleteAsync(file.uri, { idempotent: true });
              await loadBackups();
            } catch (err) {
              Alert.alert('Delete Failed', err instanceof Error ? err.message : String(err));
            }
          },
        },
      ],
    );
  }, [loadBackups]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={backups}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
          <View style={styles.headerWrap}>
            <Card style={styles.heroCard}>
              <Card.Content>
                <View style={styles.heroRow}>
                  <MaterialCommunityIcons name="archive" color={COLORS.primary} size={24} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.heroTitle}>Local Backup Vault</Text>
                    <Text style={styles.heroText}>
                      Timestamped CSV and VCF backups are stored on-device only.
                    </Text>
                  </View>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.actionRow}>
                  <Button mode="contained" buttonColor={COLORS.primary} onPress={() => handleCreateBackup('csv')} loading={isCreating} disabled={isCreating} style={styles.actionBtn}>
                    New CSV Backup
                  </Button>
                  <Button mode="outlined" textColor={COLORS.secondary} onPress={() => handleCreateBackup('vcf')} loading={isCreating} disabled={isCreating} style={styles.actionBtn}>
                    New VCF Backup
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
        ListEmptyComponent={isLoading ? null : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="folder-outline" color={COLORS.textSecondary} size={40} />
            <Text style={styles.emptyTitle}>No backups yet</Text>
            <Text style={styles.emptyText}>Create a backup to keep a local safety snapshot on this device.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Card style={styles.backupCard}>
            <Card.Content>
              <Text style={styles.backupName}>{item.name}</Text>
              <Text style={styles.backupPath}>Stored locally in the app document directory.</Text>
              <View style={styles.backupActions}>
                <Button mode="text" onPress={() => handleShare(item.uri)} textColor={COLORS.primary}>Share</Button>
                <Button mode="text" onPress={() => handleDelete(item)} textColor={COLORS.error}>Delete</Button>
              </View>
            </Card.Content>
          </Card>
        )}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.sm },
  headerWrap: { marginBottom: SPACING.xs },
  heroCard: { backgroundColor: COLORS.surface },
  heroRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' },
  heroTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  heroText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginTop: SPACING.xs, lineHeight: 20 },
  divider: { backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  actionRow: { gap: SPACING.sm },
  actionBtn: { alignSelf: 'stretch' },
  backupCard: { backgroundColor: COLORS.surface },
  backupName: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  backupPath: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginTop: SPACING.xs },
  backupActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  emptyText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center', maxWidth: 280 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.overlay },
});