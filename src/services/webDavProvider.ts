/**
 * ContactForge — WebDAV Sync Provider
 *
 * Implements lightweight WebDAV sync using standard fetch API.
 * Encrypted payload only. No remote tracking.
 */

import CryptoJS from 'crypto-js';
import type { SyncProvider } from './syncAdapter';
import { getSetting } from '../db/repositories/settingsRepository';

export class WebDavProvider implements SyncProvider {
  id = 'webdav';
  name = 'WebDAV';

  private getEndpoint(): string {
    const ep = getSetting('syncWebDavEndpoint') || '';
    if (!ep) return '';
    const base = ep.endsWith('/') ? ep : ep + '/';
    return base + 'contactforge-backup.cfbak';
  }

  private getCredentials(): string {
    const user = getSetting('syncWebDavUser') || '';
    const pass = getSetting('syncWebDavPass') || '';
    if (!user || !pass) return '';
    
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(`${user}:${pass}`));
  }

  async isAvailable(): Promise<boolean> {
    return !!getSetting('syncWebDavEndpoint') && !!getSetting('syncWebDavUser');
  }

  async authenticate(): Promise<boolean> {
    if (!(await this.isAvailable())) return false;
    return true; // Simple check, actual auth happens on request
  }

  async pushEncryptedPayload(payload: string): Promise<boolean> {
    const url = this.getEndpoint();
    const creds = this.getCredentials();
    if (!url || !creds) return false;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${creds}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });
      return response.ok;
    } catch (err) {
      console.error('WebDAV Push Error:', err);
      return false;
    }
  }

  async pullEncryptedPayload(): Promise<string | null> {
    const url = this.getEndpoint();
    const creds = this.getCredentials();
    if (!url || !creds) return null;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${creds}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      return await response.text();
    } catch (err) {
      console.error('WebDAV Pull Error:', err);
      return null;
    }
  }
}

export const webDavProvider = new WebDavProvider();
