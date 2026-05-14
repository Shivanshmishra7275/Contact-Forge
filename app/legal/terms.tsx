/**
 * ContactForge — Terms & Conditions screen
 */

import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegalContentView } from '../../src/LegalContentView';
import { LEGAL_DOCUMENTS } from '../../src/constants/legalContent';
import { COLORS } from '../../src/constants';

/**
 * Terms & Conditions screen.
 */
export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LegalContentView document={LEGAL_DOCUMENTS.terms} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
});
