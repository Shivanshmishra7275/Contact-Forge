/**
 * ContactForge — Privacy & Data Handling screen
 */

import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LegalContentView } from '../../src/LegalContentView';
import { LEGAL_DOCUMENTS } from '../../src/constants/legalContent';
import { COLORS } from '../../src/constants';

/**
 * Privacy & Data Handling screen.
 */
export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LegalContentView document={LEGAL_DOCUMENTS.privacy} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
});
