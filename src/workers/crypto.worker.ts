/**
 * Crypto Web Worker
 *
 * Isolates all cryptographic operations in a dedicated Web Worker thread.
 * This provides defense-in-depth by ensuring encryption keys never exist
 * on the main thread, reducing the XSS attack surface.
 *
 * The main thread communicates with this worker via structured messages.
 * The CryptoKey is held in the worker's scope and cannot be accessed from outside.
 */

/** PBKDF2 configuration */
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AES_KEY_LENGTH = 256;
const KEY_ALGORITHM = 'AES-GCM';
const DERIVATION_ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';

const VERIFICATION_PLAINTEXT = new TextEncoder().encode('context-tracking-verified');

/** The encryption key — held only in this worker's scope */
let workerKey: CryptoKey | null = null;

/** Message types */
export type CryptoWorkerRequest =
  | { id: string; type: 'deriveKey'; passphrase: string; salt: Uint8Array }
  | { id: string; type: 'encrypt'; data: Uint8Array }
  | { id: string; type: 'decrypt'; data: Uint8Array }
  | { id: string; type: 'createSentinel' }
  | { id: string; type: 'verifySentinel'; sentinel: Uint8Array }
  | { id: string; type: 'generateSalt' }
  | { id: string; type: 'lock' }
  | { id: string; type: 'isUnlocked' };

export type CryptoWorkerResponse =
  | { id: string; type: 'success'; data?: Uint8Array; result?: boolean }
  | { id: string; type: 'error'; message: string };

function toBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

async function deriveKeyInternal(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
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

async function encryptInternal(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const ciphertext = await crypto.subtle.encrypt(
    { name: KEY_ALGORITHM, iv: toBuffer(iv) },
    key,
    toBuffer(data)
  );

  const result = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), IV_LENGTH);

  return result;
}

async function decryptInternal(key: CryptoKey, encryptedData: Uint8Array): Promise<Uint8Array> {
  if (encryptedData.length < IV_LENGTH + 1) {
    throw new Error('Encrypted data is too short');
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

/** Handle incoming messages from the main thread */
self.onmessage = async (event: MessageEvent<CryptoWorkerRequest>) => {
  const msg = event.data;

  try {
    switch (msg.type) {
      case 'deriveKey': {
        workerKey = await deriveKeyInternal(msg.passphrase, msg.salt);
        const response: CryptoWorkerResponse = { id: msg.id, type: 'success' };
        self.postMessage(response);
        break;
      }

      case 'encrypt': {
        if (!workerKey) throw new Error('No key available. Derive key first.');
        const encrypted = await encryptInternal(workerKey, msg.data);
        const response: CryptoWorkerResponse = {
          id: msg.id,
          type: 'success',
          data: encrypted,
        };
        self.postMessage(response, { transfer: [encrypted.buffer as ArrayBuffer] });
        break;
      }

      case 'decrypt': {
        if (!workerKey) throw new Error('No key available. Derive key first.');
        const decrypted = await decryptInternal(workerKey, msg.data);
        const response: CryptoWorkerResponse = {
          id: msg.id,
          type: 'success',
          data: decrypted,
        };
        self.postMessage(response, { transfer: [decrypted.buffer as ArrayBuffer] });
        break;
      }

      case 'createSentinel': {
        if (!workerKey) throw new Error('No key available. Derive key first.');
        const sentinel = await encryptInternal(workerKey, VERIFICATION_PLAINTEXT);
        const response: CryptoWorkerResponse = {
          id: msg.id,
          type: 'success',
          data: sentinel,
        };
        self.postMessage(response, { transfer: [sentinel.buffer as ArrayBuffer] });
        break;
      }

      case 'verifySentinel': {
        if (!workerKey) throw new Error('No key available. Derive key first.');
        try {
          const decrypted = await decryptInternal(workerKey, msg.sentinel);
          let mismatch = 0;
          if (decrypted.length !== VERIFICATION_PLAINTEXT.length) {
            const response: CryptoWorkerResponse = {
              id: msg.id,
              type: 'success',
              result: false,
            };
            self.postMessage(response);
            break;
          }
          for (let i = 0; i < decrypted.length; i++) {
            mismatch |= decrypted[i] ^ VERIFICATION_PLAINTEXT[i];
          }
          const response: CryptoWorkerResponse = {
            id: msg.id,
            type: 'success',
            result: mismatch === 0,
          };
          self.postMessage(response);
        } catch {
          const response: CryptoWorkerResponse = {
            id: msg.id,
            type: 'success',
            result: false,
          };
          self.postMessage(response);
        }
        break;
      }

      case 'generateSalt': {
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        const response: CryptoWorkerResponse = {
          id: msg.id,
          type: 'success',
          data: salt,
        };
        self.postMessage(response, { transfer: [salt.buffer as ArrayBuffer] });
        break;
      }

      case 'lock': {
        workerKey = null;
        const response: CryptoWorkerResponse = { id: msg.id, type: 'success' };
        self.postMessage(response);
        break;
      }

      case 'isUnlocked': {
        const response: CryptoWorkerResponse = {
          id: msg.id,
          type: 'success',
          result: workerKey !== null,
        };
        self.postMessage(response);
        break;
      }
    }
  } catch (error) {
    const response: CryptoWorkerResponse = {
      id: msg.id,
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};
