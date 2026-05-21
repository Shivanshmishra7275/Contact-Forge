/**
 * ContactForge — Sync Foundation Abstract Layer
 *
 * This provides the abstraction for future cross-device sync integrations
 * without locking into any specific cloud provider.
 */

import { generateBackupBundle, importBackupBundle } from './backupService';
import { encryptPayload, decryptPayload } from './encryptionService';
import { webDavProvider } from './webDavProvider';
import type { ContactForgeBackup } from '../types';

export interface SyncProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  authenticate(): Promise<boolean>;
  pushEncryptedPayload(payload: string): Promise<boolean>;
  pullEncryptedPayload(): Promise<string | null>;
}

export class SyncAdapter {
  private provider: SyncProvider | null = null;
  
  registerProvider(provider: SyncProvider) {
    this.provider = provider;
  }
  
  async hasProvider(): Promise<boolean> {
    return this.provider !== null && (await this.provider.isAvailable());
  }

  getProviderName(): string {
    return this.provider?.name || 'None';
  }
  
  async pushBackup(passphrase: string): Promise<{ success: boolean; message: string }> {
    if (!this.provider) return { success: false, message: 'No sync provider registered.' };
    
    try {
      const auth = await this.provider.authenticate();
      if (!auth) return { success: false, message: 'Provider authentication failed.' };

      const bundle = await generateBackupBundle();
      const encrypted = encryptPayload(JSON.stringify(bundle), passphrase);
      
      const pushed = await this.provider.pushEncryptedPayload(JSON.stringify(encrypted));
      return { 
        success: pushed, 
        message: pushed ? 'Backup pushed successfully.' : 'Failed to push backup to provider.' 
      };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'An error occurred during push.' };
    }
  }

  async pullBackup(passphrase: string): Promise<{ success: boolean; message: string }> {
    if (!this.provider) return { success: false, message: 'No sync provider registered.' };
    
    try {
      const auth = await this.provider.authenticate();
      if (!auth) return { success: false, message: 'Provider authentication failed.' };

      const remoteData = await this.provider.pullEncryptedPayload();
      if (!remoteData) return { success: false, message: 'No backup found on remote provider.' };

      let encrypted;
      try {
        encrypted = JSON.parse(remoteData);
      } catch {
        return { success: false, message: 'Remote file is not valid JSON.' };
      }

      const decryptedStr = decryptPayload(encrypted, passphrase);
      if (!decryptedStr) {
        return { success: false, message: 'Invalid passphrase or corrupted remote backup.' };
      }

      const bundle: ContactForgeBackup = JSON.parse(decryptedStr);
      if (bundle.version !== 1) {
        return { success: false, message: 'Unsupported backup version.' };
      }

      // Safe conflict-free merge via INSERT OR IGNORE
      importBackupBundle(bundle);

      return { success: true, message: 'Remote backup pulled and imported successfully.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'An error occurred during pull.' };
    }
  }
}

export const syncAdapter = new SyncAdapter();

// Register built-in providers
syncAdapter.registerProvider(webDavProvider);
