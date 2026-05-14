/**
 * ContactForge — Export warning screen
 */

import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegalContentView } from '../../src/LegalContentView';
import { LEGAL_DOCUMENTS } from '../../src/constants/legalContent';
import { COLORS } from '../../src/constants';

/**
 * Export warning screen.
 */
export default function ExportWarningScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LegalContentView document={LEGAL_DOCUMENTS['export-warning']} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
});
