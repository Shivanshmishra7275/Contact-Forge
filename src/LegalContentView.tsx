/**
 * ContactForge — Legal content renderer
 */

import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { COLORS, FONT_SIZE, RADIUS, SPACING } from './constants';
import type { LegalDocument } from './constants/legalContent';

interface LegalContentViewProps {
  document: LegalDocument;
}

/**
 * Renders a legal document with consistent styling and structure.
 */
export function LegalContentView({ document }: LegalContentViewProps) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{document.title}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Version {document.version}</Text>
        <Text style={styles.metaText}>Updated {document.updatedAt}</Text>
      </View>

      {document.summary.map((paragraph) => (
        <Text key={paragraph} style={styles.summaryText}>
          {paragraph}
        </Text>
      ))}

      {document.sections.map((section) => (
        <Card key={section.title} style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletPrefix}>-</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      ))}

      {document.footer?.map((line) => (
        <Text key={line} style={styles.footerText}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  summaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  paragraph: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  bulletPrefix: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    paddingTop: 1,
  },
  bulletText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    flex: 1,
    lineHeight: 20,
  },
  footerText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.sm,
  },
});
