import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Snackbar, Text, Button } from 'react-native-paper';
import { useUndoStore } from '../../../store/undoStore';
import { executeUndo } from '../services/undoService';
import { COLORS, FONT_SIZE, SPACING } from '../../../constants';
import { useAppStore } from '../../../store/appStore';
import { getPendingDuplicates } from '../../../db/repositories/duplicateRepository';

export function UndoSnackbar() {
  const { showUndo, message, hideUndo } = useUndoStore();
  const setPendingDuplicateCount = useAppStore(s => s.setPendingDuplicateCount);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (showUndo) {
      // Auto-hide success message when a new undoable action happens
      setSuccessMessage(null);
    }
  }, [showUndo]);

  const handleUndo = () => {
    hideUndo();
    const result = executeUndo();

    if (result.success) {
      setSuccessMessage(result.message || 'Action undone successfully.');
      
      // If we undid a merge, refresh duplicate counts
      if (result.actionType === 'merge') {
        const newCount = getPendingDuplicates().length;
        setPendingDuplicateCount(newCount);
      }

      // Hide success message after a few seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setSuccessMessage('Failed to undo: ' + result.message);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  return (
    <>
      <Snackbar
        visible={showUndo}
        onDismiss={hideUndo}
        duration={5000}
        style={styles.snackbar}
        action={{
          label: 'UNDO',
          onPress: handleUndo,
          labelStyle: styles.actionLabel,
        }}
      >
        <Text style={styles.messageText}>{message}</Text>
      </Snackbar>

      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage(null)}
        duration={3000}
        style={styles.successSnackbar}
      >
        <Text style={styles.messageText}>{successMessage}</Text>
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    backgroundColor: COLORS.surfaceVariant,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  successSnackbar: {
    backgroundColor: COLORS.surfaceVariant,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
  },
  actionLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
