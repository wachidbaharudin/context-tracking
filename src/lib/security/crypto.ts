/**
 * Cryptographic utilities using the Web Crypto API.
 *
 * Provides AES-256-GCM authenticated encryption with PBKDF2 key derivation.
 * All operations use the browser's native crypto.subtle API — no external dependencies.
 */

/** PBKDF2 iteration count. Higher = more resistant to brute force, but slower. */
const PBKDF2_ITERATIONS = 100_000;

/** Salt length in bytes for PBKDF2 key derivation. */
const SALT_LENGTH = 16;

/** AES-GCM initialization vector length in bytes. NIST recommends 12 bytes for GCM. */
const IV_LENGTH = 12;

/** AES key length in bits. */
const AES_KEY_LENGTH = 256;

/** Algorithm identifiers */
const KEY_ALGORITHM = 'AES-GCM';
const DERIVATION_ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';

/**
 * Sentinel value used to verify a passphrase is correct without
 * attempting to decrypt the entire database.
 */
const VERIFICATION_PLAINTEXT = new TextEncoder().encode('context-tracking-verified');

/**
 * Generate a cryptographically random salt for PBKDF2 key derivation.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a cryptographically random initialization vector for AES-GCM.
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Helper to convert Uint8Array to a BufferSource-compatible type.
 * Required because TypeScript's strict mode distinguishes ArrayBuffer from ArrayBufferLike.
 */
function toBuffer(data: Uint8Array): ArrayBuffer {
  // Create a fresh ArrayBuffer copy to ensure compatibility across environments
  // (some environments like jsdom don't accept sliced or shared buffers)
  const copy = new ArrayBuffer(data.byteLength);
  new Uint8Array(copy).set(data);
  return copy;
}

/**
 * Derive an AES-256-GCM CryptoKey from a user passphrase using PBKDF2.
 *
 * The returned key is marked as non-extractable — it cannot be exported
 * as raw bytes, only used for encrypt/decrypt operations.
 *
 * @param passphrase - User-provided passphrase string
 * @param salt - Random salt (must be persisted alongside the encrypted data)
 * @returns Non-extractable AES-GCM CryptoKey
 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    DERIVATION_ALGORITHM,
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: DERIVATION_ALGORITHM,
      salt: toBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    {
      name: KEY_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM.
 *
 * Output format: [IV (12 bytes)] [ciphertext + auth tag]
 * The IV is prepended to the ciphertext for self-contained storage.
 *
 * @param key - AES-GCM CryptoKey (from deriveKey)
 * @param data - Plaintext data to encrypt
 * @returns Encrypted data with IV prepended
 */
export async function encrypt(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const iv = generateIV();

  const ciphertext = await crypto.subtle.encrypt(
    { name: KEY_ALGORITHM, iv: toBuffer(iv) },
    key,
    toBuffer(data)
  );

  // Prepend IV to ciphertext: [IV][ciphertext+tag]
  const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), IV_LENGTH);

  return result;
}

/**
 * Decrypt data using AES-256-GCM.
 *
 * Expects the input format produced by encrypt(): [IV (12 bytes)] [ciphertext + auth tag]
 *
 * @param key - AES-GCM CryptoKey (from deriveKey)
 * @param encryptedData - Encrypted data with IV prepended
 * @returns Decrypted plaintext data
 * @throws DOMException if the key is wrong or data has been tampered with
 */
export async function decrypt(key: CryptoKey, encryptedData: Uint8Array): Promise<Uint8Array> {
  if (encryptedData.length < IV_LENGTH + 1) {
    throw new Error('Encrypted data is too short to contain valid ciphertext');
  }

  const iv = encryptedData.slice(0, IV_LENGTH);
  const ciphertext = encryptedData.slice(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: KEY_ALGORITHM, iv: toBuffer(iv) },
    key,
    toBuffer(ciphertext)
  );

  return new Uint8Array(plaintext);
}

/**
 * Create an encrypted verification sentinel.
 *
 * This is stored alongside the salt. On subsequent unlocks, we attempt to
 * decrypt this sentinel to verify the passphrase before trying to decrypt
 * the entire database.
 *
 * @param key - AES-GCM CryptoKey derived from the passphrase
 * @returns Encrypted sentinel blob
 */
export async function createVerificationSentinel(key: CryptoKey): Promise<Uint8Array> {
  return encrypt(key, VERIFICATION_PLAINTEXT);
}

/**
 * Verify a passphrase by attempting to decrypt the verification sentinel.
 *
 * @param key - AES-GCM CryptoKey derived from the candidate passphrase
 * @param sentinel - Previously stored encrypted sentinel
 * @returns true if the passphrase is correct, false otherwise
 */
export async function verifyPassphrase(key: CryptoKey, sentinel: Uint8Array): Promise<boolean> {
  try {
    const decrypted = await decrypt(key, sentinel);

    // Compare with expected plaintext
    if (decrypted.length !== VERIFICATION_PLAINTEXT.length) {
      return false;
    }
    // Constant-time comparison to prevent timing attacks
    let mismatch = 0;
    for (let i = 0; i < decrypted.length; i++) {
      mismatch |= decrypted[i] ^ VERIFICATION_PLAINTEXT[i];
    }
    return mismatch === 0;
  } catch {
    // Decryption failed — wrong key
    return false;
  }
}

/**
 * Encode a Uint8Array to a base64 string for localStorage storage.
 */
export function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Decode a base64 string back to a Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
