import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../src/constants';
import { importSessionRepository } from '../../src/db/repositories/importSessionRepository';
import { importRowRepository } from '../../src/db/repositories/importRowRepository';
import { suggestMappings, ALL_CONTACT_FIELDS } from '../../src/features/import/utils/mappingSuggestions';
import { importOrchestrator } from '../../src/features/import/services/importOrchestrator';
import { CsvHeaderMap } from '../../src/features/import/types';

export default function MappingScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [mappings, setMappings] = useState<CsvHeaderMap[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    
    // Get headers from first row
    const rows = importRowRepository.getRowsBySession(Number(sessionId), 1);
    if (rows.length > 0) {
      try {
        const rawJson = JSON.parse(rows[0].csv_row_json);
        const headers = Object.keys(rawJson);
        const suggested = suggestMappings(headers);
        setMappings(suggested);
      } catch (e) {
        Alert.alert('Error', 'Failed to read headers from parsed rows.');
      }
    }
  }, [sessionId]);

  const updateMapping = (index: number, field: string) => {
    const newMappings = [...mappings];
    newMappings[index].contact_field = field;
    setMappings(newMappings);
  };

  const handleContinue = async () => {
    if (!sessionId) return;
    setIsProcessing(true);
    
    try {
      await importOrchestrator.applyCsvMapping(Number(sessionId), mappings);
      router.replace(`/import/review?sessionId=${sessionId}`);
    } catch (e: any) {
      Alert.alert('Mapping Error', e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (mappings.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: COLORS.background }]}>
        <Text style={{ color: COLORS.textSecondary }}>Loading columns...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView style={styles.content}>
        <Text variant="titleLarge" style={styles.title}>Map Columns</Text>
        <Text variant="bodyMedium" style={styles.description}>
          Match the columns from your CSV to ContactForge fields. We've auto-suggested the best matches.
        </Text>

        {mappings.map((m, idx) => (
          <Card key={idx} style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="bodyMedium" style={styles.csvColumnLabel}>CSV Column: <Text style={styles.csvColumnValue}>{m.csv_column}</Text></Text>
              
              <View style={styles.pickerContainer}>
                {/* For MVP without a third-party dropdown, we map a simple list of buttons or native picker if supported. Since we can't guarantee @react-native-picker/picker is installed, we will just use a horizontal scroll of chips. */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {ALL_CONTACT_FIELDS.map(field => (
                    <Button 
                      key={field}
                      mode={m.contact_field === field ? 'contained' : 'outlined'}
                      onPress={() => updateMapping(idx, field)}
                      style={styles.chip}
                      labelStyle={styles.chipLabel}
                      compact
                    >
                      {field}
                    </Button>
                  ))}
                </ScrollView>
              </View>
            </Card.Content>
          </Card>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          mode="contained" 
          onPress={handleContinue}
          loading={isProcessing}
          disabled={isProcessing}
          style={styles.continueButton}
        >
          Review Data
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
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  csvColumnLabel: {
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  csvColumnValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginTop: 8,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
    borderRadius: 20,
  },
  chipLabel: {
    fontSize: 12,
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
