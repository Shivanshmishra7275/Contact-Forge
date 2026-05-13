/**
 * ContactForge — Background Maintenance Registration
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { runMaintenance } from './maintenanceService';

export const MAINTENANCE_TASK = 'contactforge-background-maintenance';

TaskManager.defineTask(MAINTENANCE_TASK, async () => {
  try {
    await runMaintenance('background');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundMaintenance(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const status = await BackgroundFetch.getStatusAsync();
  if (status !== BackgroundFetch.BackgroundFetchStatus.Available) return false;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(MAINTENANCE_TASK);
  if (isRegistered) return true;

  await BackgroundFetch.registerTaskAsync(MAINTENANCE_TASK, {
    minimumInterval: 60 * 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });

  return true;
}

export async function unregisterBackgroundMaintenance(): Promise<void> {
  if (Platform.OS === 'web') return;
  const isRegistered = await TaskManager.isTaskRegisteredAsync(MAINTENANCE_TASK);
  if (!isRegistered) return;
  await BackgroundFetch.unregisterTaskAsync(MAINTENANCE_TASK);
}
