/**
 * ContactForge — Cleanup Center Screen
 *
 * Presents a review queue of contacts with data quality issues.
 * All detection and fix logic is delegated to cleanupService.ts.
 */

import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  scanAllContactsForIssues,
  applyCleanupFix,
  type ContactIssues,
} from '../../src/services/cleanupService';
import { COLORS, SPACING, FONT_SIZE } from '../../src/constants';
import type { CleanupIssue } from '../../src/types';

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
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);

  const runScan = useCallback(() => {
    setIsScanning(true);
    // Run synchronously — cleanup scan is fast enough for foreground
    const results = scanAllContactsForIssues();
    setIssueList(results);
    setIsScanning(false);
    setHasScanned(true);
  }, []);

  useEffect(() => {
    runScan();
  }, []);

  const handleApplyFix = useCallback(
    (item: ContactIssues, issue: CleanupIssue) => {
      const applied = applyCleanupFix(item.contact, issue);
      if (applied) {
        runScan(); // Refresh the issue list after a fix
      }
    },
    [runScan],
  );

  if (isScanning) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.loadingText}>Scanning contacts…</Text>
      </View>
    );
  }

  if (hasScanned && issueList.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="check-all" size={56} color={COLORS.success} />
        <Text style={styles.emptyTitle}>All clean!</Text>
        <Text style={styles.emptySubtitle}>No cleanup issues found in your contacts.</Text>
        <Button mode="outlined" onPress={runScan} textColor={COLORS.primary}>Re-scan</Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {issueList.length} contacts with issues
        </Text>
        <Button
          mode="text"
          onPress={runScan}
          textColor={COLORS.primary}
          compact
        >
          Re-scan
        </Button>
      </View>

      <FlatList
        data={issueList}
        keyExtractor={(item) => String(item.contact.id)}
        renderItem={({ item }) => (
          <CleanupCard
            item={item}
            onApplyFix={(issue) => handleApplyFix(item, issue)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

interface CleanupCardProps {
  item: ContactIssues;
  onApplyFix: (issue: CleanupIssue) => void;
}

function CleanupCard({ item, onApplyFix }: CleanupCardProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.contactName}>{item.contact.displayName}</Text>
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
      </Card.Content>
    </Card>
  );
}

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
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  headerText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  listContent: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING.xxl },
  card: { backgroundColor: COLORS.surface },
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
