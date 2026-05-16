import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { importSessionRepository } from '../../src/db/repositories/importSessionRepository';
import { ImportSession } from '../../src/features/import/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ResultScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<ImportSession | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const s = importSessionRepository.getSession(Number(sessionId));
    if (s) {
      setSession(s);
    }
  }, [sessionId]);

  const handleFinish = () => {
    router.replace('/(tabs)/contacts');
  };

  if (!session) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: COLORS.background }]}>
        <Text style={{ color: COLORS.textSecondary }}>Loading results...</Text>
      </View>
    );
  }

  const summary = session.summary_json ? JSON.parse(session.summary_json) : {};
  const importedCount = summary.imported_count || 0;
  const skippedCount = (summary.total_rows || 0) - importedCount;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="check-decagram" size={80} color={COLORS.success} />
        </View>

        <Text variant="headlineMedium" style={styles.title}>Import Complete</Text>
        
        <Text variant="bodyMedium" style={styles.description}>
          Your contacts have been processed and safely stored in your local database.
        </Text>

        <Card style={styles.card} mode="contained">
          <Card.Content>
            <View style={styles.statRow}>
              <Text variant="bodyLarge" style={styles.statLabel}>Successfully Imported</Text>
              <Text variant="titleLarge" style={[styles.statValue, { color: COLORS.success }]}>{importedCount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text variant="bodyLarge" style={styles.statLabel}>Skipped or Invalid</Text>
              <Text variant="titleLarge" style={[styles.statValue, { color: COLORS.textSecondary }]}>{skippedCount}</Text>
            </View>
          </Card.Content>
        </Card>

        {summary.was_truncated && (
          <Text variant="bodySmall" style={{ color: COLORS.warning || '#f57c00', marginTop: 16, textAlign: 'center' }}>
            Note: The original file exceeded 10,000 rows. Only the first 10,000 were processed.
          </Text>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <Button 
          mode="contained" 
          onPress={handleFinish}
          style={styles.doneButton}
          icon="account-group"
        >
          View Contacts
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.surfaceVariant,
    width: '100%',
    borderRadius: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  statLabel: {
    color: COLORS.textPrimary,
  },
  statValue: {
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneButton: {
    borderRadius: 8,
    paddingVertical: 6,
  }
});
