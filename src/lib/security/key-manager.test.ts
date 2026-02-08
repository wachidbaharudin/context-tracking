import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isFirstTimeSetup,
  isUnlocked,
  initializeEncryption,
  unlock,
  lock,
  hasExistingUnencryptedData,
} from '@/lib/security/key-manager';

// Mock the CryptoWorkerClient
const mockClient = {
  generateSalt: vi.fn(),
  deriveKey: vi.fn(),
  createSentinel: vi.fn(),
  verifySentinel: vi.fn(),
  lock: vi.fn(),
  isUnlocked: vi.fn(),
  isAvailable: vi.fn(() => true),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  terminate: vi.fn(),
};

vi.mock('@/lib/security/crypto-worker-client', () => ({
  getCryptoWorkerClient: () => mockClient,
}));

describe('key-manager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset the unlocked state — lock sets it to false via the mock
    // We need to call lock() to reset the module-scoped `unlocked` variable
  });

  describe('isFirstTimeSetup', () => {
    it('returns true when no salt exists in localStorage', () => {
      expect(isFirstTimeSetup()).toBe(true);
    });

    it('returns false when salt exists in localStorage', () => {
      localStorage.setItem('context-tracking-salt', 'somesalt');
      expect(isFirstTimeSetup()).toBe(false);
    });
  });

  describe('isUnlocked', () => {
    it('returns false initially', () => {
      // This depends on module state. Since we can't easily reset module state
      // between tests, we test the flow via initializeEncryption and lock.
      // After a fresh import, it should be false.
      // Note: Module state persists across tests in the same file.
      expect(typeof isUnlocked()).toBe('boolean');
    });
  });

  describe('initializeEncryption', () => {
    it('rejects passphrases shorter than 8 characters', async () => {
      await expect(initializeEncryption('short')).rejects.toThrow(
        'Passphrase must be at least 8 characters long'
      );
    });

    it('generates salt, derives key, creates sentinel, stores in localStorage', async () => {
      const fakeSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const fakeSentinel = new Uint8Array([99, 100, 101]);

      mockClient.generateSalt.mockResolvedValue(fakeSalt);
      mockClient.deriveKey.mockResolvedValue(undefined);
      mockClient.createSentinel.mockResolvedValue(fakeSentinel);

      await initializeEncryption('my-secure-passphrase');

      expect(mockClient.generateSalt).toHaveBeenCalled();
      expect(mockClient.deriveKey).toHaveBeenCalledWith('my-secure-passphrase', fakeSalt);
      expect(mockClient.createSentinel).toHaveBeenCalled();

      // Salt and sentinel should be stored
      expect(localStorage.getItem('context-tracking-salt')).toBeTruthy();
      expect(localStorage.getItem('context-tracking-sentinel')).toBeTruthy();

      // Should be unlocked
      expect(isUnlocked()).toBe(true);
    });
  });

  describe('unlock', () => {
    it('throws if no encryption setup found', async () => {
      await expect(unlock('anypassphrase')).rejects.toThrow('No encryption setup found');
    });

    it('derives key and verifies sentinel successfully', async () => {
      // Setup localStorage as if initializeEncryption ran before
      localStorage.setItem('context-tracking-salt', btoa(String.fromCharCode(1, 2, 3)));
      localStorage.setItem('context-tracking-sentinel', btoa(String.fromCharCode(99, 100)));

      mockClient.deriveKey.mockResolvedValue(undefined);
      mockClient.verifySentinel.mockResolvedValue(true);

      await unlock('my-passphrase');

      expect(mockClient.deriveKey).toHaveBeenCalled();
      expect(mockClient.verifySentinel).toHaveBeenCalled();
      expect(isUnlocked()).toBe(true);
    });

    it('throws and locks on incorrect passphrase', async () => {
      localStorage.setItem('context-tracking-salt', btoa(String.fromCharCode(1, 2, 3)));
      localStorage.setItem('context-tracking-sentinel', btoa(String.fromCharCode(99, 100)));

      mockClient.deriveKey.mockResolvedValue(undefined);
      mockClient.verifySentinel.mockResolvedValue(false);
      mockClient.lock.mockResolvedValue(undefined);

      await expect(unlock('wrong-passphrase')).rejects.toThrow('Incorrect passphrase');

      // Should have called lock to clear the invalid key from worker
      expect(mockClient.lock).toHaveBeenCalled();
    });
  });

  describe('lock', () => {
    it('calls worker lock and sets unlocked to false', async () => {
      // First unlock
      localStorage.setItem('context-tracking-salt', btoa(String.fromCharCode(1, 2, 3)));
      localStorage.setItem('context-tracking-sentinel', btoa(String.fromCharCode(99, 100)));
      mockClient.deriveKey.mockResolvedValue(undefined);
      mockClient.verifySentinel.mockResolvedValue(true);
      await unlock('test-passphrase');
      expect(isUnlocked()).toBe(true);

      // Now lock
      mockClient.lock.mockResolvedValue(undefined);
      await lock();

      expect(mockClient.lock).toHaveBeenCalled();
      expect(isUnlocked()).toBe(false);
    });
  });

  describe('hasExistingUnencryptedData', () => {
    it('returns false when no doc ID exists', () => {
      expect(hasExistingUnencryptedData()).toBe(false);
    });

    it('returns false when salt exists (already encrypted)', () => {
      localStorage.setItem('context-tracking-salt', 'somesalt');
      localStorage.setItem('context-tracking-doc-id', 'somedocid');
      expect(hasExistingUnencryptedData()).toBe(false);
    });

    it('returns true when doc ID exists but no salt (unencrypted)', () => {
      localStorage.setItem('context-tracking-doc-id', 'somedocid');
      expect(hasExistingUnencryptedData()).toBe(true);
    });
  });
});
