/**
 * ContactForge — Background WebDAV Sync Service
 * 
 * Silently syncs the local SQLite database to the user's WebDAV server
 * in the background. Driven by expo-background-fetch and expo-task-manager.
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getDatabase } from '../db';
import { getAllSettings, setSetting } from '../db/repositories/settingsRepository';
import { syncAdapter } from './syncAdapter';

export const BACKGROUND_WEBDAV_SYNC_TASK = 'contactforge-background-webdav-sync';

// Register the task outside of React lifecycle
TaskManager.defineTask(BACKGROUND_WEBDAV_SYNC_TASK, async () => {
  try {
    const settings = getAllSettings();
    
    // Only proceed if enabled
    if (!settings.enableBackgroundWebDavSync) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Securely retrieve credentials
    const passphrase = await SecureStore.getItemAsync('webdav_passphrase');
    
    if (!passphrase) {
      // Missing credentials, can't sync
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Delta check: Were any contacts updated since last successful sync?
    const lastSyncTime = settings.lastAutomatedSyncTime || settings.lastSyncTime;
    let hasChanges = true; // Default to true if we don't have a last sync time

    if (lastSyncTime) {
      const db = getDatabase();
      const row = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM contacts WHERE updated_at > ?',
        [lastSyncTime]
      );
      
      if (row && row.count === 0) {
        hasChanges = false;
      }
    }

    if (!hasChanges) {
      return BackgroundFetch.BackgroundFetchResult.NoData; // Battery optimization
    }

    // Execute the WebDAV upload
    // Privacy: We pass the passphrase directly to the adapter which encrypts the data locally
    const result = await syncAdapter.pushBackup(passphrase);

    if (result.success) {
      const now = new Date().toISOString();
      setSetting('lastAutomatedSyncTime', now);
      setSetting('lastSyncTime', now);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  } catch (error) {
    // Graceful catch, no logging of PII or credentials
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  
  const status = await BackgroundFetch.getStatusAsync();
  if (status !== BackgroundFetch.BackgroundFetchStatus.Available) return false;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEBDAV_SYNC_TASK);
  if (isRegistered) return true;

  // OS schedules minimum interval roughly 15-60 mins depending on battery state
  await BackgroundFetch.registerTaskAsync(BACKGROUND_WEBDAV_SYNC_TASK, {
    minimumInterval: 15 * 60, // 15 minutes
    stopOnTerminate: false,   // Android only: continue running when app is killed
    startOnBoot: true,        // Android only: restart task after reboot
  });

  return true;
}

export async function unregisterBackgroundSync(): Promise<void> {
  if (Platform.OS === 'web') return;
  
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_WEBDAV_SYNC_TASK);
  if (!isRegistered) return;
  
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_WEBDAV_SYNC_TASK);
}
