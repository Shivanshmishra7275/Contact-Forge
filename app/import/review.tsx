import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { importSessionRepository } from '../../src/db/repositories/importSessionRepository';
import { importRowRepository } from '../../src/db/repositories/importRowRepository';
import { importOrchestrator } from '../../src/features/import/services/importOrchestrator';
import { StagedImportRow, ImportSession } from '../../src/features/import/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReviewScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  
  const [session, setSession] = useState<ImportSession | null>(null);
  const [rows, setRows] = useState<StagedImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    
    const s = importSessionRepository.getSession(Number(sessionId));
    if (s) {
      setSession(s);
      // For MVP we just grab first 50 rows for preview to keep it fast
      const previewRows = importRowRepository.getRowsBySession(Number(sessionId), 50, 0);
      setRows(previewRows);
    }
  }, [sessionId]);

  const handleConfirm = async () => {
    if (!sessionId) return;
    
    Alert.alert(
      'Confirm Import',
      'This will create local contacts based on valid rows. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await importOrchestrator.commitImport(Number(sessionId));
              router.replace(`/import/result?sessionId=${sessionId}`);
            } catch (e: any) {
              Alert.alert('Import Failed', e.message);
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (!session) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: COLORS.background }]}>
        <Text style={{ color: COLORS.textSecondary }}>Loading preview...</Text>
      </View>
    );
  }

  const summary = session.summary_json ? JSON.parse(session.summary_json) : {};

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>Review & Confirm</Text>
        <Text variant="bodyMedium" style={styles.description}>
          Review the parsed contacts. Only valid rows will be imported.
        </Text>

        <Card style={styles.summaryCard} mode="contained">
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text variant="bodyLarge" style={{ color: COLORS.textPrimary }}>Total Rows Found:</Text>
              <Text variant="bodyLarge" style={{ color: COLORS.primary, fontWeight: 'bold' }}>{summary.total_rows || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyLarge" style={{ color: COLORS.textPrimary }}>Valid Contacts:</Text>
              <Text variant="bodyLarge" style={{ color: COLORS.success, fontWeight: 'bold' }}>{summary.valid_rows || 0}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text variant="bodyLarge" style={{ color: COLORS.textPrimary }}>Invalid / Skipped:</Text>
              <Text variant="bodyLarge" style={{ color: COLORS.error, fontWeight: 'bold' }}>{(summary.total_rows || 0) - (summary.valid_rows || 0)}</Text>
            </View>
            {summary.was_truncated && (
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Text variant="bodySmall" style={{ color: COLORS.warning || '#f57c00' }}>
                  File was too large and was truncated to the first 10,000 rows.
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.previewTitle}>Preview (First {rows.length})</Text>

        {rows.map((row) => {
          const mapped = JSON.parse(row.mapped_contact_json || '{}');
          const isValid = row.validation_status === 'valid';
          const name = mapped.full_name || mapped.first_name || 'No Name';

          return (
            <View key={row.id} style={[styles.rowItem, isValid ? styles.rowValid : styles.rowInvalid]}>
              <MaterialCommunityIcons 
                name={isValid ? 'check-circle' : 'alert-circle'} 
                size={24} 
                color={isValid ? COLORS.success : COLORS.error} 
              />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{name}</Text>
                {mapped.phone_primary && <Text style={styles.rowSub}>{mapped.phone_primary}</Text>}
                {mapped.email_primary && <Text style={styles.rowSub}>{mapped.email_primary}</Text>}
                {!isValid && row.validation_errors && (
                  <Text style={styles.rowErrorText}>{JSON.parse(row.validation_errors).join(', ')}</Text>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          mode="contained" 
          onPress={handleConfirm}
          loading={isProcessing}
          disabled={isProcessing || summary.valid_rows === 0}
          style={styles.continueButton}
          icon="check-all"
        >
          Confirm Import
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
    padding: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.surfaceVariant,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  previewTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    borderLeftWidth: 4,
  },
  rowValid: {
    borderLeftColor: COLORS.success,
  },
  rowInvalid: {
    borderLeftColor: COLORS.error,
  },
  rowInfo: {
    marginLeft: 12,
    flex: 1,
  },
  rowName: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 16,
  },
  rowSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  rowErrorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueButton: {
    borderRadius: 8,
    paddingVertical: 6,
  }
});
