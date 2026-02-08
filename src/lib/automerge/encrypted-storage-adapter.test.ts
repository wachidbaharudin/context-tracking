import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EncryptedStorageAdapter } from '@/lib/automerge/encrypted-storage-adapter';

// Mock the CryptoWorkerClient
const mockClient = {
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  isAvailable: vi.fn(() => true),
  generateSalt: vi.fn(),
  deriveKey: vi.fn(),
  createSentinel: vi.fn(),
  verifySentinel: vi.fn(),
  lock: vi.fn(),
  isUnlocked: vi.fn(),
  terminate: vi.fn(),
};

vi.mock('@/lib/security/crypto-worker-client', () => ({
  getCryptoWorkerClient: () => mockClient,
}));

// Mock IndexedDBStorageAdapter
const mockInner = {
  load: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
  loadRange: vi.fn(),
  removeRange: vi.fn(),
};

vi.mock('@automerge/automerge-repo-storage-indexeddb', () => ({
  IndexedDBStorageAdapter: function () {
    return mockInner;
  },
}));

describe('EncryptedStorageAdapter', () => {
  let adapter: EncryptedStorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new EncryptedStorageAdapter('test-db');
  });

  describe('save', () => {
    it('encrypts data before saving to inner adapter', async () => {
      const plaintext = new Uint8Array([1, 2, 3]);
      const encrypted = new Uint8Array([99, 98, 97]);
      mockClient.encrypt.mockResolvedValue(encrypted);
      mockInner.save.mockResolvedValue(undefined);

      await adapter.save(['doc', 'key1'], plaintext);

      expect(mockClient.encrypt).toHaveBeenCalledWith(plaintext);
      expect(mockInner.save).toHaveBeenCalledWith(['doc', 'key1'], encrypted);
    });
  });

  describe('load', () => {
    it('returns undefined when no data exists', async () => {
      mockInner.load.mockResolvedValue(undefined);

      const result = await adapter.load(['doc', 'key1']);

      expect(result).toBeUndefined();
      expect(mockClient.decrypt).not.toHaveBeenCalled();
    });

    it('decrypts data loaded from inner adapter', async () => {
      const encrypted = new Uint8Array([99, 98, 97]);
      const plaintext = new Uint8Array([1, 2, 3]);
      mockInner.load.mockResolvedValue(encrypted);
      mockClient.decrypt.mockResolvedValue(plaintext);

      const result = await adapter.load(['doc', 'key1']);

      expect(mockClient.decrypt).toHaveBeenCalledWith(encrypted);
      expect(result).toEqual(plaintext);
    });

    it('throws descriptive error on decryption failure', async () => {
      mockInner.load.mockResolvedValue(new Uint8Array([1, 2]));
      mockClient.decrypt.mockRejectedValue(new Error('decrypt failed'));

      await expect(adapter.load(['doc', 'key1'])).rejects.toThrow('Failed to decrypt stored data');
    });
  });

  describe('remove', () => {
    it('passes through to inner adapter', async () => {
      mockInner.remove.mockResolvedValue(undefined);

      await adapter.remove(['doc', 'key1']);

      expect(mockInner.remove).toHaveBeenCalledWith(['doc', 'key1']);
    });
  });

  describe('loadRange', () => {
    it('decrypts each chunk from inner adapter', async () => {
      const chunk1Encrypted = new Uint8Array([10, 20]);
      const chunk2Encrypted = new Uint8Array([30, 40]);
      const chunk1Decrypted = new Uint8Array([1, 2]);
      const chunk2Decrypted = new Uint8Array([3, 4]);

      mockInner.loadRange.mockResolvedValue([
        { key: ['doc', 'a'], data: chunk1Encrypted },
        { key: ['doc', 'b'], data: chunk2Encrypted },
      ]);

      mockClient.decrypt
        .mockResolvedValueOnce(chunk1Decrypted)
        .mockResolvedValueOnce(chunk2Decrypted);

      const result = await adapter.loadRange(['doc']);

      expect(result).toEqual([
        { key: ['doc', 'a'], data: chunk1Decrypted },
        { key: ['doc', 'b'], data: chunk2Decrypted },
      ]);
      expect(mockClient.decrypt).toHaveBeenCalledTimes(2);
    });

    it('passes through chunks with no data', async () => {
      mockInner.loadRange.mockResolvedValue([{ key: ['doc', 'a'], data: undefined }]);

      const result = await adapter.loadRange(['doc']);

      expect(result).toEqual([{ key: ['doc', 'a'], data: undefined }]);
      expect(mockClient.decrypt).not.toHaveBeenCalled();
    });

    it('throws descriptive error if any chunk fails decryption', async () => {
      mockInner.loadRange.mockResolvedValue([{ key: ['doc', 'a'], data: new Uint8Array([1]) }]);
      mockClient.decrypt.mockRejectedValue(new Error('bad'));

      await expect(adapter.loadRange(['doc'])).rejects.toThrow('Failed to decrypt stored data');
    });
  });

  describe('removeRange', () => {
    it('passes through to inner adapter', async () => {
      mockInner.removeRange.mockResolvedValue(undefined);

      await adapter.removeRange(['doc']);

      expect(mockInner.removeRange).toHaveBeenCalledWith(['doc']);
    });
  });
});
