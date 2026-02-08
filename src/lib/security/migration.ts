/**
 * Data Migration: Unencrypted -> Encrypted
 *
 * Handles the one-time migration of existing unencrypted Automerge data
 * to the new encrypted storage format.
 *
 * Strategy:
 * 1. Read all data from the unencrypted IndexedDB
 * 2. Initialize a new encrypted repo (worker already has key from unlock)
 * 3. Create a new document with the existing data
 * 4. Delete the old unencrypted data
 */

import { Repo, type DocumentId, type DocHandle } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { EncryptedStorageAdapter } from '@/lib/automerge/encrypted-storage-adapter';
import { setStoredDocId } from '@/lib/automerge/setup';
import type { AppDocument } from '@/types';

const DB_NAME = 'context-tracking-db';
const OLD_DOC_ID_KEY = 'context-tracking-doc-id';

/**
 * Migrate existing unencrypted data to encrypted storage.
 *
 * The encryption key must already be derived in the Web Worker
 * (via key-manager.initializeEncryption) before calling this.
 *
 * @returns The new encrypted Repo instance, or null if no migration was needed
 */
export async function migrateToEncrypted(): Promise<Repo | null> {
  const oldDocId = localStorage.getItem(OLD_DOC_ID_KEY);
  if (!oldDocId) {
    return null; // No existing data to migrate
  }

  console.log('[Migration] Starting migration of unencrypted data...');

  // Step 1: Read existing data from unencrypted storage
  const unencryptedRepo = new Repo({
    storage: new IndexedDBStorageAdapter(DB_NAME),
  });

  let existingData: AppDocument | undefined;
  try {
    const oldHandle: DocHandle<AppDocument> = await unencryptedRepo.find(oldDocId as DocumentId);
    await oldHandle.whenReady();
    existingData = oldHandle.docSync();
  } catch (error) {
    console.error('[Migration] Failed to read existing data:', error);
    throw new Error('Failed to read existing data during migration');
  }

  if (!existingData) {
    console.log('[Migration] No document data found, skipping migration');
    return null;
  }

  console.log('[Migration] Read existing data successfully');

  // Step 2: Delete the old unencrypted IndexedDB database
  // We need to close the unencrypted repo first
  try {
    await deleteIndexedDB(DB_NAME);
    console.log('[Migration] Deleted old unencrypted database');
  } catch (error) {
    console.warn('[Migration] Failed to delete old database, continuing:', error);
  }

  // Step 3: Create new encrypted repo and save data
  // The EncryptedStorageAdapter uses the worker client — key is already in worker
  const encryptedRepo = new Repo({
    storage: new EncryptedStorageAdapter(DB_NAME),
  });

  const newHandle = encryptedRepo.create<AppDocument>();
  newHandle.change((doc) => {
    doc.contexts = existingData.contexts;
    doc.settings = existingData.settings;
  });

  // Step 4: Update the stored doc ID (encrypted via worker)
  await setStoredDocId(newHandle.documentId);

  // Remove the old plaintext doc ID
  localStorage.removeItem(OLD_DOC_ID_KEY);

  console.log('[Migration] Migration completed successfully');

  return encryptedRepo;
}

/**
 * Delete an IndexedDB database.
 */
function deleteIndexedDB(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn(`[Migration] Delete of ${name} was blocked. Retrying...`);
      // The database might be blocked by an open connection
      // We'll resolve anyway and let the user retry if needed
      resolve();
    };
  });
}
