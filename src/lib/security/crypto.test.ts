// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  generateSalt,
  deriveKey,
  encrypt,
  decrypt,
  createVerificationSentinel,
  verifyPassphrase,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from '@/lib/security/crypto';

describe('crypto', () => {
  describe('generateSalt', () => {
    it('generates a 16-byte salt', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('generates unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(uint8ArrayToBase64(salt1)).not.toBe(uint8ArrayToBase64(salt2));
    });
  });

  describe('deriveKey', () => {
    it('derives a CryptoKey from passphrase and salt', async () => {
      const salt = generateSalt();
      const key = await deriveKey('testpassphrase', salt);
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
      expect(key.extractable).toBe(false);
      expect(key.usages).toEqual(expect.arrayContaining(['encrypt', 'decrypt']));
    });

    it('derives the same key from the same passphrase and salt', async () => {
      const salt = generateSalt();
      const key1 = await deriveKey('testpassphrase', salt);
      const key2 = await deriveKey('testpassphrase', salt);

      // Encrypt with key1, decrypt with key2 should work
      const data = new TextEncoder().encode('hello');
      const encrypted = await encrypt(key1, data);
      const decrypted = await decrypt(key2, encrypted);
      expect(new TextDecoder().decode(decrypted)).toBe('hello');
    });

    it('derives different keys from different passphrases', async () => {
      const salt = generateSalt();
      const key1 = await deriveKey('passphrase1', salt);
      const key2 = await deriveKey('passphrase2', salt);

      const data = new TextEncoder().encode('hello');
      const encrypted = await encrypt(key1, data);

      // Decrypting with a different key should fail
      await expect(decrypt(key2, encrypted)).rejects.toThrow();
    });

    it('derives different keys from different salts', async () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const key1 = await deriveKey('samepassphrase', salt1);
      const key2 = await deriveKey('samepassphrase', salt2);

      const data = new TextEncoder().encode('hello');
      const encrypted = await encrypt(key1, data);

      await expect(decrypt(key2, encrypted)).rejects.toThrow();
    });
  });

  describe('encrypt / decrypt', () => {
    it('round-trips data correctly', async () => {
      const salt = generateSalt();
      const key = await deriveKey('roundtrip-test', salt);
      const plaintext = new TextEncoder().encode('Hello, World!');

      const encrypted = await encrypt(key, plaintext);
      const decrypted = await decrypt(key, encrypted);

      expect(new TextDecoder().decode(decrypted)).toBe('Hello, World!');
    });

    it('handles empty data', async () => {
      const salt = generateSalt();
      const key = await deriveKey('emptytest', salt);
      const plaintext = new Uint8Array(0);

      const encrypted = await encrypt(key, plaintext);
      const decrypted = await decrypt(key, encrypted);

      expect(decrypted.length).toBe(0);
    });

    it('handles large data', async () => {
      const salt = generateSalt();
      const key = await deriveKey('largetest', salt);
      const plaintext = new Uint8Array(100_000);
      // Node's getRandomValues has a 65536-byte limit per call, so fill in chunks
      for (let offset = 0; offset < plaintext.length; offset += 65536) {
        const chunk = plaintext.subarray(offset, Math.min(offset + 65536, plaintext.length));
        crypto.getRandomValues(chunk);
      }

      const encrypted = await encrypt(key, plaintext);
      const decrypted = await decrypt(key, encrypted);

      expect(decrypted).toEqual(plaintext);
    });

    it('produces different ciphertext for same plaintext (random IV)', async () => {
      const salt = generateSalt();
      const key = await deriveKey('ivtest', salt);
      const plaintext = new TextEncoder().encode('same data');

      const encrypted1 = await encrypt(key, plaintext);
      const encrypted2 = await encrypt(key, plaintext);

      // Encrypted outputs should differ (different IV)
      expect(uint8ArrayToBase64(encrypted1)).not.toBe(uint8ArrayToBase64(encrypted2));

      // But both should decrypt to the same plaintext
      expect(new TextDecoder().decode(await decrypt(key, encrypted1))).toBe('same data');
      expect(new TextDecoder().decode(await decrypt(key, encrypted2))).toBe('same data');
    });

    it('rejects decryption with wrong key', async () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const key1 = await deriveKey('correctpassphrase', salt1);
      const key2 = await deriveKey('wrongpassphrase', salt2);

      const encrypted = await encrypt(key1, new TextEncoder().encode('secret'));
      await expect(decrypt(key2, encrypted)).rejects.toThrow();
    });

    it('rejects tampered ciphertext', async () => {
      const salt = generateSalt();
      const key = await deriveKey('tampertest', salt);
      const encrypted = await encrypt(key, new TextEncoder().encode('authentic'));

      // Tamper with the ciphertext (flip a byte after the IV)
      const tampered = new Uint8Array(encrypted);
      tampered[15] ^= 0xff;

      await expect(decrypt(key, tampered)).rejects.toThrow();
    });

    it('rejects data that is too short', async () => {
      const salt = generateSalt();
      const key = await deriveKey('shorttest', salt);
      const tooShort = new Uint8Array(12); // Only IV length, no ciphertext

      await expect(decrypt(key, tooShort)).rejects.toThrow(
        'Encrypted data is too short to contain valid ciphertext'
      );
    });

    it('encrypted output has IV prepended (12 bytes)', async () => {
      const salt = generateSalt();
      const key = await deriveKey('formattest', salt);
      const encrypted = await encrypt(key, new TextEncoder().encode('test'));

      // Encrypted should be at least 12 (IV) + some ciphertext bytes
      expect(encrypted.length).toBeGreaterThan(12);
    });
  });

  describe('createVerificationSentinel / verifyPassphrase', () => {
    it('creates and verifies a sentinel with the correct key', async () => {
      const salt = generateSalt();
      const key = await deriveKey('sentinel-test', salt);

      const sentinel = await createVerificationSentinel(key);
      expect(sentinel).toBeInstanceOf(Uint8Array);
      expect(sentinel.length).toBeGreaterThan(0);

      const isValid = await verifyPassphrase(key, sentinel);
      expect(isValid).toBe(true);
    });

    it('rejects sentinel with wrong key', async () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const correctKey = await deriveKey('correct', salt1);
      const wrongKey = await deriveKey('wrong', salt2);

      const sentinel = await createVerificationSentinel(correctKey);
      const isValid = await verifyPassphrase(wrongKey, sentinel);
      expect(isValid).toBe(false);
    });

    it('rejects tampered sentinel', async () => {
      const salt = generateSalt();
      const key = await deriveKey('tamper-sentinel', salt);
      const sentinel = await createVerificationSentinel(key);

      const tampered = new Uint8Array(sentinel);
      tampered[tampered.length - 1] ^= 0xff;

      const isValid = await verifyPassphrase(key, tampered);
      expect(isValid).toBe(false);
    });
  });

  describe('uint8ArrayToBase64 / base64ToUint8Array', () => {
    it('round-trips arbitrary bytes', () => {
      const original = new Uint8Array([0, 1, 127, 128, 255, 42, 99]);
      const base64 = uint8ArrayToBase64(original);
      const recovered = base64ToUint8Array(base64);
      expect(recovered).toEqual(original);
    });

    it('handles empty array', () => {
      const empty = new Uint8Array(0);
      const base64 = uint8ArrayToBase64(empty);
      const recovered = base64ToUint8Array(base64);
      expect(recovered.length).toBe(0);
    });

    it('produces valid base64 string', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = uint8ArrayToBase64(data);
      expect(base64).toBe(btoa('Hello'));
    });
  });
});
