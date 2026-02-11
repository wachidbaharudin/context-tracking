# Encryption Design

**Version:** 1.0
**Date:** February 9, 2026
**Status:** Draft

---

## Table of Contents

- [1. Current Encryption (v1)](#1-current-encryption-v1)
- [2. New Encryption (v2)](#2-new-encryption-v2)
- [3. Cryptographic Parameters](#3-cryptographic-parameters)
- [4. Detailed Flows](#4-detailed-flows)
- [5. Web Worker Changes](#5-web-worker-changes)
- [6. Key Manager Rewrite](#6-key-manager-rewrite)
- [7. Security Analysis](#7-security-analysis)

---

## 1. Current Encryption (v1)

### How It Works Today

```
Passphrase + random salt --> PBKDF2 (100k iterations, SHA-256) --> AES-256-GCM key
                                                                        |
                                                                        v
                                                              Encrypts all data
                                                              in IndexedDB
```

- Single-layer: passphrase directly derives the data encryption key
- Key lives only in Web Worker memory (`workerKey` in `crypto.worker.ts:24`)
- Salt stored in `localStorage` (`context-tracking-salt`)
- Verification sentinel stored in `localStorage` (`context-tracking-sentinel`)
- Changing passphrase requires re-encrypting ALL data

### Current File References

| File                                             | Role                                                      |
| ------------------------------------------------ | --------------------------------------------------------- |
| `src/workers/crypto.worker.ts`                   | Holds CryptoKey, all crypto operations                    |
| `src/lib/security/key-manager.ts`                | Passphrase lifecycle: init, unlock, lock, change          |
| `src/lib/security/crypto-worker-client.ts`       | Promise-based client for worker communication             |
| `src/lib/security/crypto.ts`                     | Crypto primitives (deriveKey, encrypt, decrypt, sentinel) |
| `src/lib/automerge/encrypted-storage-adapter.ts` | Transparent encrypt/decrypt wrapper for IndexedDB         |

---

## 2. New Encryption (v2)

### Two-Layer Key Hierarchy

```
Encryption Passphrase + kek_salt
        |
        v
    PBKDF2 (100k iterations, SHA-256)
        |
        v
    KEK (Key Encryption Key) -- AES-256-GCM
        |
        +--- wraps (encrypts) ---> wrapped_mek (stored on server)
        |
        +--- unwraps (decrypts) <--- wrapped_mek (fetched from server)
                                        |
                                        v
                                    MEK (Master Encryption Key) -- AES-256-GCM
                                        |
                                        +--- encrypts all user data
                                        +--- creates verification sentinel
                                        +--- lives only in Web Worker memory
```

### Key Bundle (Stored on Server per User)

```json
{
  "wrapped_mek": "<base64: MEK encrypted with KEK using AES-256-GCM>",
  "kek_salt": "<base64: 16-byte random salt for PBKDF2>",
  "sentinel": "<base64: known plaintext encrypted with MEK>"
}
```

### Why Two Layers?

| Scenario            | v1 (Current)                                      | v2 (New)                                               |
| ------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Change passphrase   | Must re-encrypt ALL data (slow, error-prone)      | Only re-wrap MEK (milliseconds)                        |
| Cross-device access | Impossible (key derived locally, no shared state) | Wrapped MEK stored on server, unwrapped on each device |
| OAuth support       | Impossible (needs passphrase for key derivation)  | Auth is separate from encryption                       |
| Key rotation        | Requires full data re-encryption                  | Can rotate KEK without touching data                   |

---

## 3. Cryptographic Parameters

| Parameter           | Value                                        | Notes                                 |
| ------------------- | -------------------------------------------- | ------------------------------------- |
| **KEK derivation**  |                                              |                                       |
| Algorithm           | PBKDF2                                       | Same as v1                            |
| Hash                | SHA-256                                      | Same as v1                            |
| Iterations          | 100,000                                      | Same as v1                            |
| Salt length         | 16 bytes (128 bits)                          | Same as v1                            |
| Output key          | AES-256-GCM                                  | Same as v1                            |
| Key extractable     | false                                        | Non-extractable CryptoKey             |
| **MEK**             |                                              |                                       |
| Generation          | `crypto.getRandomValues(new Uint8Array(32))` | 256 bits of cryptographic randomness  |
| Algorithm           | AES-256-GCM                                  | Same key type as v1 data key          |
| Key extractable     | true (within worker only)                    | Must be extractable to wrap/unwrap    |
| **MEK wrapping**    |                                              |                                       |
| Algorithm           | AES-256-GCM                                  | Authenticated encryption              |
| IV length           | 12 bytes                                     | Random per wrap operation             |
| Format              | `[IV (12 bytes)][ciphertext + GCM auth tag]` | Same as v1 ciphertext format          |
| **Data encryption** |                                              |                                       |
| Algorithm           | AES-256-GCM                                  | Same as v1                            |
| IV length           | 12 bytes                                     | Random per encrypt operation          |
| Format              | `[IV (12 bytes)][ciphertext + GCM auth tag]` | Same as v1                            |
| **Sentinel**        |                                              |                                       |
| Plaintext           | `"context-tracking-verified"`                | Same as v1                            |
| Encrypted with      | MEK (not KEK)                                | Verifies MEK correctness after unwrap |

---

## 4. Detailed Flows

### 4.1 First-Time Setup (New Account + New Encryption)

```
User                     Client (Web Worker)              Server
  |                            |                            |
  |-- Create account --------->|                            |
  |                            |-- POST /api/auth/register ->|
  |                            |<-- JWT -------------------- |
  |                            |                            |
  |-- Set encryption           |                            |
  |   passphrase ------------->|                            |
  |                            |                            |
  |                      1. Generate kek_salt (16 bytes)    |
  |                      2. KEK = PBKDF2(passphrase,        |
  |                              kek_salt, 100k, SHA-256)   |
  |                      3. MEK = random 256-bit key        |
  |                      4. wrapped_mek = AES-GCM-Encrypt(  |
  |                              KEK, raw MEK bytes)        |
  |                      5. sentinel = AES-GCM-Encrypt(     |
  |                              MEK, "context-tracking-    |
  |                              verified")                 |
  |                      6. Store MEK in worker memory      |
  |                      7. Clear KEK from worker memory    |
  |                            |                            |
  |                            |-- POST /api/keys ---------->|
  |                            |   { wrapped_mek,           |
  |                            |     kek_salt, sentinel }   |
  |                            |<-- 201 Created ----------- |
  |                            |                            |
  |<-- App unlocked -----------|                            |
```

### 4.2 New Device Login

```
User                     Client (Web Worker)              Server
  |                            |                            |
  |-- Login (email/pass       |                            |
  |   or Google OAuth) ------->|                            |
  |                            |-- POST /api/auth/login ---->|
  |                            |<-- JWT -------------------- |
  |                            |                            |
  |                            |-- GET /api/keys ----------->|
  |                            |<-- { wrapped_mek,           |
  |                            |     kek_salt, sentinel } -- |
  |                            |                            |
  |-- Enter encryption         |                            |
  |   passphrase ------------->|                            |
  |                            |                            |
  |                      1. KEK = PBKDF2(passphrase,        |
  |                              kek_salt, 100k, SHA-256)   |
  |                      2. raw_mek = AES-GCM-Decrypt(      |
  |                              KEK, wrapped_mek)          |
  |                      3. Import raw_mek as CryptoKey     |
  |                      4. Decrypt sentinel with MEK       |
  |                      5. Compare to known plaintext      |
  |                      6. If match: store MEK in worker   |
  |                      7. Clear KEK from worker memory    |
  |                            |                            |
  |                            |-- GET /api/sync/data ------>|
  |                            |<-- encrypted blob --------- |
  |                            |                            |
  |                      8. Decrypt blob with MEK           |
  |                      9. Load into Automerge repo        |
  |                            |                            |
  |<-- App unlocked -----------|                            |
```

### 4.3 Same Device Unlock (Cached Key Bundle)

```
User                     Client (Web Worker)
  |                            |
  |-- Enter encryption         |
  |   passphrase ------------->|
  |                            |
  |                      1. Load cached { wrapped_mek,
  |                         kek_salt, sentinel } from
  |                         localStorage
  |                      2. KEK = PBKDF2(passphrase,
  |                              kek_salt, 100k)
  |                      3. raw_mek = AES-GCM-Decrypt(
  |                              KEK, wrapped_mek)
  |                      4. Verify sentinel
  |                      5. Store MEK in worker
  |                      6. Clear KEK
  |                            |
  |<-- App unlocked -----------|
```

No network needed -- works fully offline.

### 4.4 Change Encryption Passphrase

```
User                     Client (Web Worker)              Server
  |                            |                            |
  |-- Enter current            |                            |
  |   passphrase ------------->|                            |
  |                            |                            |
  |                      1. KEK_old = PBKDF2(old_pass,      |
  |                              old_salt, 100k)            |
  |                      2. raw_mek = AES-GCM-Decrypt(      |
  |                              KEK_old, wrapped_mek)      |
  |                      3. Verify sentinel (confirm        |
  |                         old passphrase is correct)      |
  |                            |                            |
  |-- Enter new passphrase --->|                            |
  |                            |                            |
  |                      4. Generate new kek_salt           |
  |                      5. KEK_new = PBKDF2(new_pass,      |
  |                              new_salt, 100k)            |
  |                      6. new_wrapped_mek = AES-GCM-      |
  |                              Encrypt(KEK_new, raw_mek)  |
  |                      7. Clear KEK_old and KEK_new       |
  |                      8. MEK remains in worker memory    |
  |                            |                            |
  |                            |-- PUT /api/keys ----------->|
  |                            |   { wrapped_mek: new,      |
  |                            |     kek_salt: new }        |
  |                            |<-- 200 OK ---------------- |
  |                            |                            |
  |                      9. Update localStorage cache       |
  |                            |                            |
  |<-- Success (no data        |                            |
  |   re-encryption needed) ---|                            |
```

**Key benefit**: The MEK never changes, so all existing encrypted data remains valid. Only the wrapping changes.

### 4.5 Lock

```
User                     Client (Web Worker)
  |                            |
  |-- Lock app --------------->|
  |                      1. workerMEK = null
  |                      2. workerKEK = null (already null)
  |                            |
  |<-- Locked (passphrase      |
  |   screen shown) -----------|
```

Same as current behavior. Key bundle remains cached in localStorage for next unlock.

### 4.6 Full Document Sync

```
Client                                                   Server
  |                                                        |
  |-- GET /api/sync/status ---------------------------------|
  |<-- { version: 5, updated_at: "..." } ------------------|
  |                                                        |
  |  [Compare with local version]                          |
  |                                                        |
  |  IF remote is newer:                                   |
  |-- GET /api/sync/data ---------------------------------->|
  |<-- encrypted blob + X-Version: 5 ----------------------|
  |  Decrypt with MEK -> load into Automerge               |
  |                                                        |
  |  IF local has changes:                                 |
  |  Serialize Automerge doc -> encrypt with MEK           |
  |-- PUT /api/sync/data ---------------------------------->|
  |   (encrypted blob + X-Base-Version: 5)                 |
  |<-- { version: 6, updated_at: "..." } ------------------|
  |  Update local version tracking                         |
  |                                                        |
  |  IF conflict (both sides changed):                     |
  |  Pull remote, merge locally (Automerge CRDT),          |
  |  then push merged result                               |
```

---

## 5. Web Worker Changes

### Current Worker State (`crypto.worker.ts`)

```typescript
let workerKey: CryptoKey | null = null; // PBKDF2-derived data key
```

### New Worker State

```typescript
let workerMEK: CryptoKey | null = null; // Master Encryption Key (for data)
let workerKEK: CryptoKey | null = null; // Key Encryption Key (temporary, for wrap/unwrap)
```

### New Message Types

Add to `CryptoWorkerRequest`:

```typescript
// Generate a random 256-bit MEK and store in worker
| { id: string; type: 'generateMEK' }

// Export MEK as raw bytes, encrypt with current KEK
// Requires: workerKEK and workerMEK are both set
| { id: string; type: 'wrapMEK' }

// Decrypt wrapped MEK bytes using current KEK, import as CryptoKey
// Requires: workerKEK is set
| { id: string; type: 'unwrapMEK'; wrappedMEK: Uint8Array }

// Clear KEK from memory (called after wrap/unwrap is done)
| { id: string; type: 'clearKEK' }
```

### Worker Operation Details

**`generateMEK`**:

```
1. raw = crypto.getRandomValues(new Uint8Array(32))
2. workerMEK = crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
3. Clear raw bytes from memory
4. Respond: success
```

Note: MEK must be imported with `extractable: true` so it can be exported for wrapping. This is safe because the key only exists inside the worker scope.

**`wrapMEK`**:

```
1. Verify workerMEK and workerKEK are set
2. rawMEK = crypto.subtle.exportKey('raw', workerMEK)
3. iv = crypto.getRandomValues(new Uint8Array(12))
4. ciphertext = crypto.subtle.encrypt({ name: 'AES-GCM', iv }, workerKEK, rawMEK)
5. result = [iv][ciphertext]
6. Clear rawMEK from memory
7. Respond: { data: result }
```

**`unwrapMEK`**:

```
1. Verify workerKEK is set
2. iv = wrappedMEK.slice(0, 12)
3. ciphertext = wrappedMEK.slice(12)
4. rawMEK = crypto.subtle.decrypt({ name: 'AES-GCM', iv }, workerKEK, ciphertext)
5. workerMEK = crypto.subtle.importKey('raw', rawMEK, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
6. Clear rawMEK from memory
7. Respond: success
```

**`deriveKey` (modified)**:
The existing `deriveKey` message now sets `workerKEK` instead of `workerKey`:

```
1. workerKEK = PBKDF2(passphrase, salt, 100k, SHA-256) -> AES-256-GCM key
   (non-extractable, encrypt+decrypt)
2. Respond: success
```

**`encrypt` / `decrypt` (modified)**:
These now use `workerMEK` instead of `workerKey`:

```
encrypt: AES-GCM-Encrypt(workerMEK, data)
decrypt: AES-GCM-Decrypt(workerMEK, data)
```

**`lock` (modified)**:

```
workerMEK = null
workerKEK = null  // Should already be null, but clear for safety
```

**`createSentinel` / `verifySentinel` (modified)**:
These now use `workerMEK`:

```
createSentinel: AES-GCM-Encrypt(workerMEK, "context-tracking-verified")
verifySentinel: AES-GCM-Decrypt(workerMEK, sentinel) == "context-tracking-verified"
```

---

## 6. Key Manager Rewrite

### Current Exports (Kept, Behavior Changed)

```typescript
// Now generates MEK, wraps with KEK, returns key bundle for server upload
initializeEncryption(passphrase: string): Promise<KeyBundle>

// Fetches key bundle (from cache or param), derives KEK, unwraps MEK
unlock(passphrase: string, keyBundle?: KeyBundle): Promise<void>

// Clears MEK from worker (unchanged behavior)
lock(): Promise<void>

// Synchronous unlock state check (unchanged)
isUnlocked(): boolean

// Async unlock state check (unchanged)
isUnlockedAsync(): Promise<boolean>

// Re-wraps MEK with new KEK. Returns new key bundle for server upload.
// NO data re-encryption needed.
changePassphrase(currentPassphrase: string, newPassphrase: string): Promise<KeyBundle>
```

### New Exports

```typescript
interface KeyBundle {
  wrappedMEK: Uint8Array;   // MEK encrypted with KEK
  kekSalt: Uint8Array;      // PBKDF2 salt for KEK derivation
  sentinel: Uint8Array;     // Known plaintext encrypted with MEK
}

// Cache key bundle in localStorage for offline unlock
cacheKeyBundle(bundle: KeyBundle): void

// Load cached key bundle from localStorage
getCachedKeyBundle(): KeyBundle | null

// Clear cached key bundle (logout)
clearCachedKeyBundle(): void

// Check if this is an upgrade from v1 (has old salt in localStorage)
needsV1Migration(): boolean
```

### Removed Responsibilities

- No longer stores salt/sentinel in localStorage directly (now part of key bundle)
- `hasExistingUnencryptedData()` moved to migration module
- `isFirstTimeSetup()` no longer checks localStorage salt -- checks for account + key bundle instead

---

## 7. Security Analysis

### Threat Model

| Threat                  | Mitigation                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server compromise       | Server only has encrypted blobs + wrapped MEK. MEK is encrypted with KEK derived from passphrase (never sent to server). Attacker would need to brute-force the passphrase via PBKDF2. |
| XSS on client           | MEK lives only in Web Worker (same as v1). Worker scope is isolated from main thread.                                                                                                  |
| Man-in-the-middle       | TLS/HTTPS required. All data is additionally encrypted client-side.                                                                                                                    |
| Brute-force login       | Rate limiting on auth endpoints. bcrypt with cost factor 12.                                                                                                                           |
| Brute-force passphrase  | PBKDF2 with 100k iterations makes offline brute-force slow. Rate limiting on key bundle endpoint.                                                                                      |
| Stolen JWT              | Short-lived access tokens (15 min). Refresh token rotation.                                                                                                                            |
| Device theft (unlocked) | Auto-lock after inactivity (same as v1). Lock clears MEK from memory.                                                                                                                  |
| Device theft (locked)   | Attacker has cached wrapped_mek + kek_salt. Must brute-force passphrase via PBKDF2 to unwrap MEK.                                                                                      |

### Comparison to v1

| Aspect          | v1              | v2                                                   |
| --------------- | --------------- | ---------------------------------------------------- |
| Attack surface  | Browser only    | Browser + server + network                           |
| Key derivation  | PBKDF2 (strong) | PBKDF2 (same strength)                               |
| Data encryption | AES-256-GCM     | AES-256-GCM (same)                                   |
| Key isolation   | Web Worker      | Web Worker (same)                                    |
| Zero-knowledge  | Yes             | Yes (server never sees MEK or data)                  |
| Recovery        | None            | None (same, by design)                               |
| New risk        | -               | Server stores wrapped MEK (encrypted, not plaintext) |

The security posture is equivalent to v1 for the encryption layer. The new attack surface is the server and network, mitigated by TLS, JWT, rate limiting, and the fact that the server only stores already-encrypted data.

### PBKDF2 Brute-Force Resistance

With 100,000 iterations of PBKDF2-SHA256:

- A strong 20+ character passphrase is effectively unbreakable
- An 8-character passphrase with mixed case + numbers + symbols (~50 bits entropy): ~years on consumer hardware
- Rate limiting on the server adds an additional barrier for online attacks
- The wrapped MEK is AES-256-GCM encrypted, so the attacker must derive the exact KEK
