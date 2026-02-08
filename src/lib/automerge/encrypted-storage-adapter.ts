/**
 * Encrypted Storage Adapter for Automerge.
 *
 * Wraps IndexedDBStorageAdapter and transparently encrypts all data
 * before writing and decrypts after reading using AES-256-GCM.
 *
 * All cryptographic operations are delegated to the CryptoWorkerClient,
 * which communicates with a Web Worker. The encryption key never
 * exists on the main thread.
 *
 * The storage keys themselves are NOT encrypted (they're needed for
 * IndexedDB key-range queries), but all binary data blobs are.
 */

import type { StorageAdapterInterface, Chunk } from '@automerge/automerge-repo';
import { IndexedDBStorageAdapter } from '@automerge/automerge-repo-storage-indexeddb';
import { getCryptoWorkerClient } from '@/lib/security/crypto-worker-client';

type StorageKey = string[];

export class EncryptedStorageAdapter implements StorageAdapterInterface {
  private inner: IndexedDBStorageAdapter;

  constructor(databaseName: string) {
    this.inner = new IndexedDBStorageAdapter(databaseName);
  }

  async load(key: StorageKey): Promise<Uint8Array | undefined> {
    const encryptedData = await this.inner.load(key);
    if (!encryptedData) {
      return undefined;
    }

    try {
      const client = getCryptoWorkerClient();
      return await client.decrypt(encryptedData);
    } catch (error) {
      console.error('[EncryptedStorageAdapter] Failed to decrypt data for key:', key, error);
      throw new Error('Failed to decrypt stored data. The encryption key may be incorrect.');
    }
  }

  async save(key: StorageKey, data: Uint8Array): Promise<void> {
    const client = getCryptoWorkerClient();
    const encryptedData = await client.encrypt(data);
    await this.inner.save(key, encryptedData);
  }

  async remove(key: StorageKey): Promise<void> {
    await this.inner.remove(key);
  }

  async loadRange(keyPrefix: StorageKey): Promise<Chunk[]> {
    const encryptedChunks = await this.inner.loadRange(keyPrefix);
    const client = getCryptoWorkerClient();
    const decryptedChunks: Chunk[] = [];

    for (const chunk of encryptedChunks) {
      if (!chunk.data) {
        decryptedChunks.push(chunk);
        continue;
      }

      try {
        const decryptedData = await client.decrypt(chunk.data);
        decryptedChunks.push({
          key: chunk.key,
          data: decryptedData,
        });
      } catch (error) {
        console.error(
          '[EncryptedStorageAdapter] Failed to decrypt chunk for key:',
          chunk.key,
          error
        );
        throw new Error('Failed to decrypt stored data. The encryption key may be incorrect.');
      }
    }

    return decryptedChunks;
  }

  async removeRange(keyPrefix: StorageKey): Promise<void> {
    await this.inner.removeRange(keyPrefix);
  }
}
