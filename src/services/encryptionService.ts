/**
 * ContactForge — Encryption Service
 *
 * Provides safe, deterministic local AES encryption for backups.
 * No hardcoded keys. No analytics. Completely offline.
 */

import CryptoJS from 'crypto-js';

export interface EncryptedPayload {
  version: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

export function encryptPayload(data: string, passphrase: string): EncryptedPayload {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  
  // Key derivation using PBKDF2
  const key = CryptoJS.PBKDF2(passphrase, salt, { 
    keySize: 256 / 32, 
    iterations: 1000 
  });
  
  // AES-CBC encryption
  const encrypted = CryptoJS.AES.encrypt(data, key, { 
    iv: iv, 
    padding: CryptoJS.pad.Pkcs7, 
    mode: CryptoJS.mode.CBC 
  });
  
  return {
    version: 1,
    salt: salt.toString(),
    iv: iv.toString(),
    ciphertext: encrypted.toString()
  };
}

export function decryptPayload(payload: EncryptedPayload, passphrase: string): string | null {
  try {
    if (payload.version !== 1) return null;
    
    const salt = CryptoJS.enc.Hex.parse(payload.salt);
    const iv = CryptoJS.enc.Hex.parse(payload.iv);
    
    const key = CryptoJS.PBKDF2(passphrase, salt, { 
      keySize: 256 / 32, 
      iterations: 1000 
    });
    
    const decrypted = CryptoJS.AES.decrypt(payload.ciphertext, key, { 
      iv: iv, 
      padding: CryptoJS.pad.Pkcs7, 
      mode: CryptoJS.mode.CBC 
    });
    
    const str = decrypted.toString(CryptoJS.enc.Utf8);
    return str || null;
  } catch (err) {
    return null;
  }
}
