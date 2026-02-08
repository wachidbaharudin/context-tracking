/**
 * Key Manager for passphrase-based encryption.
 *
 * Manages the lifecycle of encryption keys derived from user passphrases.
 * All cryptographic operations are delegated to the Web Worker via CryptoWorkerClient,
 * so the CryptoKey never exists on the main thread.
 *
 * - First-time setup: generate salt, derive key in worker, create verification sentinel
 * - Returning user: derive key in worker from passphrase + stored salt, verify against sentinel
 * - Lock: clear key from worker memory
 *
 * The salt and encrypted verification sentinel are stored in localStorage.
 * The actual CryptoKey only exists inside the Web Worker's scope.
 */

import { getCryptoWorkerClient } from '@/lib/security/crypto-worker-client';

/** localStorage keys */
const SALT_KEY = 'context-tracking-salt';
const SENTINEL_KEY = 'context-tracking-sentinel';

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
 * Check if this is the first time the app is being used (no encryption setup yet).
 */
export function isFirstTimeSetup(): boolean {
  return localStorage.getItem(SALT_KEY) === null;
}

/**
 * Check if the app is currently unlocked (key loaded in worker).
 * This is an async operation because it queries the worker.
 */
export async function isUnlockedAsync(): Promise<boolean> {
  const client = getCryptoWorkerClient();
  if (!client.isAvailable()) {
    return false;
  }
  return client.isUnlocked();
}

/**
 * Synchronous unlock check for initial render.
 * Uses a module-scoped flag that tracks whether we've successfully unlocked.
 * The actual key is in the worker — this is just a main-thread mirror of that state.
 */
let unlocked = false;

export function isUnlocked(): boolean {
  return unlocked;
}

/**
 * Initialize encryption for the first time.
 *
 * Generates a random salt, derives a key in the worker from the passphrase,
 * and stores the salt + verification sentinel in localStorage.
 *
 * @param passphrase - User-chosen passphrase
 */
export async function initializeEncryption(passphrase: string): Promise<void> {
  if (passphrase.length < 8) {
    throw new Error('Passphrase must be at least 8 characters long');
  }

  const client = getCryptoWorkerClient();

  const salt = await client.generateSalt();
  await client.deriveKey(passphrase, salt);
  const sentinel = await client.createSentinel();

  // Persist salt and sentinel
  localStorage.setItem(SALT_KEY, uint8ArrayToBase64(salt));
  localStorage.setItem(SENTINEL_KEY, uint8ArrayToBase64(sentinel));

  // Mark as unlocked on main thread
  unlocked = true;
}

/**
 * Unlock the app with a passphrase.
 *
 * Derives the key in the worker from the stored salt and verifies it against
 * the stored sentinel. If verification fails, the passphrase is wrong.
 *
 * @param passphrase - User-provided passphrase
 * @throws Error if passphrase is incorrect or no encryption is set up
 */
export async function unlock(passphrase: string): Promise<void> {
  const saltBase64 = localStorage.getItem(SALT_KEY);
  const sentinelBase64 = localStorage.getItem(SENTINEL_KEY);

  if (!saltBase64 || !sentinelBase64) {
    throw new Error('No encryption setup found. Use initializeEncryption() for first-time setup.');
  }

  const salt = base64ToUint8Array(saltBase64);
  const sentinel = base64ToUint8Array(sentinelBase64);

  const client = getCryptoWorkerClient();

  await client.deriveKey(passphrase, salt);
  const isValid = await client.verifySentinel(sentinel);

  if (!isValid) {
    // Clear the invalid key from the worker
    await client.lock();
    throw new Error('Incorrect passphrase');
  }

  // Mark as unlocked on main thread
  unlocked = true;
}

/**
 * Lock the app by clearing the encryption key from the worker's memory.
 */
export async function lock(): Promise<void> {
  const client = getCryptoWorkerClient();
  await client.lock();
  unlocked = false;
}

/**
 * Change the passphrase.
 *
 * This re-derives a new key in the worker from the new passphrase.
 * IMPORTANT: After calling this, all existing encrypted data must be re-encrypted.
 * The caller is responsible for re-encrypting data (read with old key, write with new key).
 *
 * Strategy:
 * 1. Verify current passphrase by unlocking with it
 * 2. Read all data while old key is active
 * 3. Lock, then derive new key
 * 4. Re-encrypt and write all data with new key
 *
 * @param currentPassphrase - Current passphrase (for verification)
 * @param newPassphrase - New passphrase to set
 */
export async function changePassphrase(
  currentPassphrase: string,
  newPassphrase: string
): Promise<void> {
  if (newPassphrase.length < 8) {
    throw new Error('New passphrase must be at least 8 characters long');
  }

  // Verify current passphrase
  const saltBase64 = localStorage.getItem(SALT_KEY);
  const sentinelBase64 = localStorage.getItem(SENTINEL_KEY);

  if (!saltBase64 || !sentinelBase64) {
    throw new Error('No encryption setup found');
  }

  const currentSalt = base64ToUint8Array(saltBase64);
  const currentSentinel = base64ToUint8Array(sentinelBase64);

  const client = getCryptoWorkerClient();

  // Derive current key and verify
  await client.deriveKey(currentPassphrase, currentSalt);
  const isValid = await client.verifySentinel(currentSentinel);

  if (!isValid) {
    await client.lock();
    throw new Error('Current passphrase is incorrect');
  }

  // NOTE: At this point the caller should have already read/cached any data
  // that needs re-encryption while the old key was active.

  // Generate new salt and key
  const newSalt = await client.generateSalt();
  await client.deriveKey(newPassphrase, newSalt);
  const newSentinel = await client.createSentinel();

  // Update stored artifacts
  localStorage.setItem(SALT_KEY, uint8ArrayToBase64(newSalt));
  localStorage.setItem(SENTINEL_KEY, uint8ArrayToBase64(newSentinel));
}

/**
 * Check if encrypted data exists (for migration detection).
 * If there's no salt, the data is unencrypted (pre-encryption era).
 */
export function hasExistingUnencryptedData(): boolean {
  const hasSalt = localStorage.getItem(SALT_KEY) !== null;
  const hasDocId = localStorage.getItem('context-tracking-doc-id') !== null;
  return !hasSalt && hasDocId;
}
