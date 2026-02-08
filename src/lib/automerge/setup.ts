import { Repo } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { EncryptedStorageAdapter } from './encrypted-storage-adapter';
import { getCryptoWorkerClient } from '@/lib/security/crypto-worker-client';
import type { AppDocument } from '@/types';

const DB_NAME = 'context-tracking-db';
const DOC_ID_KEY = 'context-tracking-doc-id';

/**
 * Migration-specific database name.
 * During migration, unencrypted data is read from the old DB
 * and re-written encrypted to the main DB.
 */
export const MIGRATION_DB_NAME = 'context-tracking-db-migration';

let repo: Repo | null = null;

/**
 * Encode a Uint8Array to a base64 string for localStorage storage.
 */
function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Decode a base64 string back to a Uint8Array.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Initialize the Automerge Repo with an encrypted storage adapter.
 * This must be called after the user has provided their passphrase
 * and the key has been derived in the Web Worker.
 *
 * No CryptoKey is needed — the EncryptedStorageAdapter delegates
 * all crypto operations to the worker via CryptoWorkerClient.
 *
 * @returns The initialized Repo instance
 */
export function initializeRepo(): Repo {
  if (repo) {
    return repo;
  }
  repo = new Repo({
    storage: new EncryptedStorageAdapter(DB_NAME),
  });
  return repo;
}

/**
 * Get the initialized Repo instance.
 * @throws Error if repo has not been initialized yet
 */
export function getRepo(): Repo {
  if (!repo) {
    throw new Error(
      'Automerge Repo has not been initialized. Call initializeRepo() after passphrase unlock.'
    );
  }
  return repo;
}

/**
 * Reset the repo instance (used during lock/migration).
 */
export function resetRepo(): void {
  repo = null;
}

/**
 * Get an unencrypted repo for migration purposes.
 * This reads the old unencrypted data.
 */
export function getUnencryptedRepo(): Repo {
  return new Repo({
    storage: new IndexedDBStorageAdapter(DB_NAME),
  });
}

/**
 * Get the stored document ID.
 * If encryption is active (worker has key), the doc ID is decrypted from
 * the encrypted variant stored in localStorage.
 *
 * @param encrypted - Whether to attempt decryption (default: true)
 */
export async function getStoredDocId(encrypted: boolean = true): Promise<string | null> {
  const raw = localStorage.getItem(DOC_ID_KEY);
  if (!raw) return null;

  // If requested, try to decrypt the encrypted variant
  if (encrypted) {
    const encryptedDocId = localStorage.getItem(`${DOC_ID_KEY}-encrypted`);
    if (encryptedDocId) {
      try {
        const client = getCryptoWorkerClient();
        const encryptedBytes = base64ToUint8Array(encryptedDocId);
        const decryptedBytes = await client.decrypt(encryptedBytes);
        return new TextDecoder().decode(decryptedBytes);
      } catch {
        // If decryption fails, fall back to plaintext (migration scenario)
        return raw;
      }
    }
  }

  return raw;
}

/**
 * Store the document ID, encrypting it if the worker has a key loaded.
 *
 * @param docId - The document ID to store
 * @param encrypted - Whether to also store an encrypted variant (default: true)
 */
export async function setStoredDocId(docId: string, encrypted: boolean = true): Promise<void> {
  // Always store plaintext for backward compatibility during migration
  localStorage.setItem(DOC_ID_KEY, docId);

  if (encrypted) {
    try {
      const client = getCryptoWorkerClient();
      const encoded = new TextEncoder().encode(docId);
      const encryptedData = await client.encrypt(encoded);
      localStorage.setItem(`${DOC_ID_KEY}-encrypted`, uint8ArrayToBase64(encryptedData));
    } catch (error) {
      console.warn('[setup] Failed to encrypt doc ID, storing plaintext only:', error);
    }
  }
}

/**
 * Remove the plaintext doc ID after migration (keep only encrypted version).
 */
export function clearPlaintextDocId(): void {
  // Only clear if we have the encrypted version
  if (localStorage.getItem(`${DOC_ID_KEY}-encrypted`)) {
    localStorage.removeItem(DOC_ID_KEY);
  }
}

export function createInitialDocument(): AppDocument {
  return {
    contexts: {},
    settings: {
      theme: 'light',
      defaultView: 'list',
      autoLockMinutes: 15,
    },
  };
}
