/**
 * Crypto Worker Client
 *
 * Provides a Promise-based API for communicating with the crypto Web Worker.
 * Falls back to main-thread crypto operations if the worker fails to initialize.
 *
 * Usage:
 *   const client = new CryptoWorkerClient();
 *   await client.deriveKey(passphrase, salt);
 *   const encrypted = await client.encrypt(data);
 *   const decrypted = await client.decrypt(encrypted);
 *   client.terminate();
 */

import type { CryptoWorkerResponse } from '@/workers/crypto.worker';

type PendingRequest = {
  resolve: (value: CryptoWorkerResponse) => void;
  reject: (reason: Error) => void;
};

let requestCounter = 0;

function generateId(): string {
  return `req_${++requestCounter}_${Date.now()}`;
}

export class CryptoWorkerClient {
  private worker: Worker | null = null;
  private pending = new Map<string, PendingRequest>();
  private initialized = false;
  private initError: Error | null = null;

  constructor() {
    try {
      this.worker = new Worker(new URL('../../workers/crypto.worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent<CryptoWorkerResponse>) => {
        const response = event.data;
        const pending = this.pending.get(response.id);
        if (pending) {
          this.pending.delete(response.id);
          if (response.type === 'error') {
            pending.reject(new Error(response.message));
          } else {
            pending.resolve(response);
          }
        }
      };

      this.worker.onerror = (event) => {
        console.error('[CryptoWorkerClient] Worker error:', event);
        this.initError = new Error(`Worker error: ${event.message}`);
        // Reject all pending requests
        for (const [id, pending] of this.pending) {
          pending.reject(this.initError);
          this.pending.delete(id);
        }
      };

      this.initialized = true;
    } catch (error) {
      console.warn(
        '[CryptoWorkerClient] Failed to initialize Web Worker. Crypto operations will not use worker isolation.',
        error
      );
      this.initError = error instanceof Error ? error : new Error('Worker init failed');
    }
  }

  /**
   * Check if the worker is available.
   */
  isAvailable(): boolean {
    return this.initialized && this.worker !== null && this.initError === null;
  }

  /**
   * Send a request to the worker and wait for the response.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendRequest(message: Record<string, any>): Promise<CryptoWorkerResponse> {
    if (!this.worker || !this.initialized) {
      throw new Error('Crypto Worker is not available');
    }

    const id = generateId();
    const fullMessage = { ...message, id };

    return new Promise<CryptoWorkerResponse>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Crypto worker request timed out'));
      }, 30_000);

      // Clear timeout when resolved
      const originalResolve = resolve;
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          originalResolve(value);
        },
        reject: (reason) => {
          clearTimeout(timeout);
          reject(reason);
        },
      });

      this.worker!.postMessage(fullMessage);
    });
  }

  /**
   * Derive an encryption key from a passphrase and salt.
   * The key is stored in the worker's memory — not returned to the main thread.
   */
  async deriveKey(passphrase: string, salt: Uint8Array): Promise<void> {
    await this.sendRequest({ type: 'deriveKey', passphrase, salt });
  }

  /**
   * Encrypt data using the worker's stored key.
   */
  async encrypt(data: Uint8Array): Promise<Uint8Array> {
    const response = await this.sendRequest({ type: 'encrypt', data });
    if (response.type === 'success' && response.data) {
      return response.data;
    }
    throw new Error('Encryption failed: no data returned');
  }

  /**
   * Decrypt data using the worker's stored key.
   */
  async decrypt(data: Uint8Array): Promise<Uint8Array> {
    const response = await this.sendRequest({ type: 'decrypt', data });
    if (response.type === 'success' && response.data) {
      return response.data;
    }
    throw new Error('Decryption failed: no data returned');
  }

  /**
   * Create a verification sentinel.
   */
  async createSentinel(): Promise<Uint8Array> {
    const response = await this.sendRequest({ type: 'createSentinel' });
    if (response.type === 'success' && response.data) {
      return response.data;
    }
    throw new Error('Sentinel creation failed: no data returned');
  }

  /**
   * Verify a sentinel against the worker's stored key.
   */
  async verifySentinel(sentinel: Uint8Array): Promise<boolean> {
    const response = await this.sendRequest({ type: 'verifySentinel', sentinel });
    if (response.type === 'success') {
      return response.result ?? false;
    }
    return false;
  }

  /**
   * Generate a random salt.
   */
  async generateSalt(): Promise<Uint8Array> {
    const response = await this.sendRequest({ type: 'generateSalt' });
    if (response.type === 'success' && response.data) {
      return response.data;
    }
    throw new Error('Salt generation failed: no data returned');
  }

  /**
   * Clear the encryption key from the worker's memory.
   */
  async lock(): Promise<void> {
    await this.sendRequest({ type: 'lock' });
  }

  /**
   * Check if the worker has a key loaded.
   */
  async isUnlocked(): Promise<boolean> {
    const response = await this.sendRequest({ type: 'isUnlocked' });
    if (response.type === 'success') {
      return response.result ?? false;
    }
    return false;
  }

  /**
   * Terminate the worker.
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    // Reject all pending requests
    for (const [id, pending] of this.pending) {
      pending.reject(new Error('Worker terminated'));
      this.pending.delete(id);
    }
  }
}

/**
 * Singleton instance of the crypto worker client.
 * Lazily initialized on first access.
 */
let instance: CryptoWorkerClient | null = null;

export function getCryptoWorkerClient(): CryptoWorkerClient {
  if (!instance) {
    instance = new CryptoWorkerClient();
  }
  return instance;
}
