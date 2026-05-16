import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../../src/constants';
import { importOrchestrator } from '../../src/features/import/services/importOrchestrator';

export default function ImportStudioScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/vcard', 'text/x-vcard', 'text/directory'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file.uri || !file.name) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: 'csv' | 'vcf' = 'csv';

      if (ext === 'vcf' || ext === 'vcard') {
        type = 'vcf';
      } else if (ext !== 'csv') {
        Alert.alert('Unsupported File', 'Please select a CSV or VCF file.');
        return;
      }

      // Check file size limit (e.g., 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 5MB.');
        return;
      }

      setIsProcessing(true);

      const sessionId = await importOrchestrator.processPickedFile(file.uri, type, file.name);

      setIsProcessing(false);

      if (sessionId) {
        if (type === 'csv') {
          router.push(`/import/mapping?sessionId=${sessionId}`);
        } else {
          router.push(`/import/review?sessionId=${sessionId}`);
        }
      }

    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Import Error', err.message || 'Failed to read file.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.content}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>Start a New Import</Text>
            <Text variant="bodyMedium" style={styles.description}>
              Import contacts from a CSV or VCF file safely. All processing happens entirely on your device. No data is sent to the cloud.
            </Text>

            {isProcessing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Reading file...</Text>
              </View>
            ) : (
              <Button 
                mode="contained" 
                onPress={handlePickFile}
                icon="file-upload"
                style={styles.button}
              >
                Select CSV or VCF
              </Button>
            )}
          </Card.Content>
        </Card>

        <View style={styles.infoSection}>
          <Text variant="titleMedium" style={styles.infoTitle}>Privacy Guarantee</Text>
          <Text variant="bodySmall" style={styles.infoText}>
            100% Offline Processing. We parse your files locally to extract names, numbers, and emails. You'll get to review and confirm all contacts before they are added to your local database.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    marginBottom: 24,
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  infoSection: {
    padding: 16,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  }
});
