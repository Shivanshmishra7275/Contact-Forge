import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useAppStore } from '../store/appStore';
import { useUndoStore } from '../store/undoStore';
import { executeUndo } from '../features/undo/services/undoService';
import { getPendingDuplicates } from '../db/repositories/duplicateRepository';
import * as Haptics from 'expo-haptics';

const SHAKE_THRESHOLD = 1.5;
const SHAKE_TIMEOUT = 1000;

export function useShakeToUndo() {
  const setPendingDuplicateCount = useAppStore(s => s.setPendingDuplicateCount);
  const { showUndo, hideUndo } = useUndoStore();
  const lastShakeTime = useRef(0);

  useEffect(() => {
    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
    let isSubscribed = false;

    const subscribe = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) return;
      
      Accelerometer.setUpdateInterval(200);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x * x + y * y + z * z);
        
        if (acceleration > SHAKE_THRESHOLD) {
          const now = Date.now();
          if (now - lastShakeTime.current > SHAKE_TIMEOUT) {
            lastShakeTime.current = now;
            
            // If there's a pending undo action, execute it!
            if (showUndo) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              hideUndo();
              const result = executeUndo();
              if (result.success && result.actionType === 'merge') {
                setPendingDuplicateCount(getPendingDuplicates().length);
              }
            }
          }
        }
      });
      isSubscribed = true;
    };

    subscribe();

    return () => {
      if (isSubscribed && subscription) {
        subscription.remove();
      }
    };
  }, [showUndo, hideUndo, setPendingDuplicateCount]);
}
