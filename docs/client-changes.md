# Client-Side Changes

**Version:** 1.0
**Date:** February 9, 2026
**Status:** Draft

---

## Table of Contents

- [1. Overview of Changes](#1-overview-of-changes)
- [2. App State Machine](#2-app-state-machine)
- [3. Files to Modify](#3-files-to-modify)
- [4. New Files to Create](#4-new-files-to-create)
- [5. API Layer](#5-api-layer)
- [6. Auth UI Components](#6-auth-ui-components)
- [7. Sync Implementation](#7-sync-implementation)
- [8. Offline Support](#8-offline-support)

---

## 1. Overview of Changes

The client currently operates as a fully local application. The changes introduce:

1. **Account authentication UI**: Login, register, OAuth callback screens
2. **Encryption passphrase UI**: Kept from current implementation, but now decoupled from account auth
3. **API client**: HTTP layer for communicating with the Go server
4. **Key manager rewrite**: Two-layer KEK/MEK system (see [encryption-design.md](./encryption-design.md))
5. **Sync layer**: Push/pull encrypted document blobs to/from the server
6. **Offline support**: Cached key bundles and local-first operation

### What Stays the Same

- `EncryptedStorageAdapter` -- works the same, just uses MEK instead of PBKDF2-derived key
- Automerge CRDT data model -- unchanged
- All UI components for contexts, action items, calendar, etc. -- unchanged
- Web Worker architecture -- kept, with new message types added
- Auto-lock behavior -- unchanged

---

## 2. App State Machine

### Current State Machine

```
Start --> isUnlocked? --yes--> Unlocked (MainApp)
                |
                no
                |
                v
         isFirstTimeSetup? --yes--> PassphraseScreen (setup)
                |
                no
                |
                v
         PassphraseScreen (unlock)
```

### New State Machine

```
                        +----------+
                        |  Start   |
                        +----+-----+
                             |
                  +----------v----------+
                  | Has stored JWT?     |
                  +----------+----------+
                        yes/ \no
                       /      \
              +-------v--+  +--v--------+
              | Validate  |  | Show      |
              | JWT       |  | Login /   |
              | (refresh  |  | Register  |
              | if needed)|  | Screen    |
              +-----+-----+  +-----+----+
                    |              |
               valid|         +----v-----+
                    |         | JWT      |
                    |         | obtained |
                    |         +----+-----+
                    |              |
              +-----v--------------v------+
              | Has key bundle?           |
              | (check server or cache)   |
              +----------+----------------+
                    yes/ \no
                   /      \
          +-------v--+  +--v--------------+
          | Show      |  | Show Encryption |
          | Encryption|  | Setup Screen    |
          | Unlock    |  | (set passphrase |
          | Screen    |  |  + generate MEK)|
          +-----+-----+  +-------+--------+
                |                 |
                |  +--------------v---+
                |  | Upload key       |
                |  | bundle to server |
                |  +-------+----------+
                |          |
          +-----v----------v------+
          | MEK loaded in worker  |
          | Pull & decrypt data   |
          | App unlocked          |
          +-----------------------+
```

### State Types

```typescript
// src/App.tsx (new)
type AppState =
  | 'loading' // Checking stored JWT validity
  | 'auth' // Login / Register screen
  | 'encryption_setup' // First-time encryption passphrase setup
  | 'encryption_unlock' // Returning user encryption passphrase entry
  | 'syncing' // Pulling data from server
  | 'unlocked'; // Main app (same as current)
```

---

## 3. Files to Modify

### `src/App.tsx`

**Current behavior:** Single gate: passphrase → unlocked.
**New behavior:** Multi-step: auth → encryption passphrase → sync → unlocked.

Key changes:

- Replace `PassphraseMode` with new `AppState` state machine
- Add JWT checking on mount (validate stored JWT, attempt refresh)
- After auth, check for key bundle (server or cache)
- Route to encryption setup or unlock accordingly
- After encryption unlock, trigger sync pull before showing main app

### `src/lib/security/key-manager.ts`

**Major rewrite.** See [encryption-design.md](./encryption-design.md) Section 6 for full details.

Summary of changes:

- `initializeEncryption()` now generates MEK, wraps with KEK, returns `KeyBundle`
- `unlock()` now accepts optional `KeyBundle` parameter (from server or cache)
- `changePassphrase()` now only re-wraps MEK (returns new `KeyBundle`)
- New: `cacheKeyBundle()`, `getCachedKeyBundle()`, `clearCachedKeyBundle()`
- Removed: Direct localStorage salt/sentinel storage (now part of KeyBundle)

### `src/workers/crypto.worker.ts`

**Add new message types:** `generateMEK`, `wrapMEK`, `unwrapMEK`, `clearKEK`.
**Modify existing:** `deriveKey` sets `workerKEK` (not `workerKey`), `encrypt`/`decrypt` use `workerMEK`.

See [encryption-design.md](./encryption-design.md) Section 5 for full details.

### `src/lib/security/crypto-worker-client.ts`

Add new methods to match new worker messages:

```typescript
async generateMEK(): Promise<void>
async wrapMEK(): Promise<Uint8Array>
async unwrapMEK(wrappedMEK: Uint8Array): Promise<void>
async clearKEK(): Promise<void>
```

### `src/lib/automerge/setup.ts`

- Remove `getStoredDocId()` / `setStoredDocId()` localStorage encryption logic
- Doc ID management moves to server-synced approach (or derived from user ID)
- Keep `initializeRepo()`, `getRepo()`, `resetRepo()` -- these work the same

### `src/lib/automerge/encrypted-storage-adapter.ts`

**No changes needed.** It calls `client.encrypt()` / `client.decrypt()` which will now use MEK instead of the PBKDF2-derived key. The adapter doesn't know or care about the key hierarchy.

### `src/components/features/auth/PassphraseScreen.tsx`

- Remove `setup` mode (account creation is now separate)
- Keep `unlock` mode behavior
- Add optional "First time? Set your encryption passphrase" variant
- Remove migration-related props (`isMigrating`)

### `src/hooks/useAutoLock.ts`

**No changes needed.** Auto-lock clears MEK from worker memory, same as before.

---

## 4. New Files to Create

### API Layer

```
src/lib/api/
├── client.ts          # HTTP client with JWT handling
├── auth.ts            # Auth API calls
├── keys.ts            # Key bundle API calls
└── sync.ts            # Sync API calls
```

### Auth UI

```
src/components/features/auth/
├── LoginScreen.tsx            # Email/password login + OAuth button
├── RegisterScreen.tsx         # Account registration
├── EncryptionSetupScreen.tsx  # First-time encryption passphrase setup
├── OAuthCallback.tsx          # Handle OAuth redirect callback
└── PassphraseScreen.tsx       # (existing, modified)
```

### Hooks

```
src/hooks/
├── useAuth.ts         # Auth state management
└── useSync.ts         # Sync state and triggers
```

### Migration

```
src/lib/security/
└── migration-v2.ts    # V1 (passphrase-only) to V2 (account+MEK) migration
```

---

## 5. API Layer

### HTTP Client (`src/lib/api/client.ts`)

```typescript
interface ApiClientConfig {
  baseUrl: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: ApiClientConfig);

  // Set tokens after login/register
  setTokens(access: string, refresh: string): void;

  // Clear tokens on logout
  clearTokens(): void;

  // Generic request with auto-refresh
  async request<T>(method: string, path: string, options?: RequestOptions): Promise<T>;

  // Convenience methods
  async get<T>(path: string): Promise<T>;
  async post<T>(path: string, body: unknown): Promise<T>;
  async put<T>(path: string, body: unknown): Promise<T>;

  // Binary methods for sync
  async putBinary(
    path: string,
    data: Uint8Array,
    headers?: Record<string, string>
  ): Promise<unknown>;
  async getBinary(path: string): Promise<{ data: Uint8Array; headers: Headers }>;
}
```

**Auto-refresh flow:**

1. Make request with access token
2. If 401 response, attempt token refresh
3. If refresh succeeds, retry original request with new access token
4. If refresh fails, clear tokens and redirect to login

### Auth API (`src/lib/api/auth.ts`)

```typescript
interface AuthResponse {
  user_id: string;
  access_token: string;
  refresh_token: string;
  has_key_bundle?: boolean;
}

async function register(email: string, password: string): Promise<AuthResponse>;
async function login(email: string, password: string): Promise<AuthResponse>;
async function refreshTokens(refreshToken: string): Promise<AuthResponse>;
async function requestPasswordReset(email: string): Promise<void>;
async function resetPassword(token: string, newPassword: string): Promise<void>;
function getGoogleOAuthUrl(): string;
```

### Keys API (`src/lib/api/keys.ts`)

```typescript
interface KeyBundleResponse {
  wrapped_mek: string; // base64
  kek_salt: string; // base64
  sentinel: string; // base64
  updated_at?: string;
}

async function createKeyBundle(bundle: KeyBundleResponse): Promise<void>;
async function getKeyBundle(): Promise<KeyBundleResponse>;
async function updateKeyBundle(bundle: Partial<KeyBundleResponse>): Promise<void>;
```

### Sync API (`src/lib/api/sync.ts`)

```typescript
interface SyncStatus {
  version: number;
  size_bytes: number;
  checksum: string;
  updated_at: string;
}

async function getSyncStatus(): Promise<SyncStatus>;
async function uploadDocument(data: Uint8Array, baseVersion?: number): Promise<SyncStatus>;
async function downloadDocument(): Promise<{ data: Uint8Array; version: number }>;
```

---

## 6. Auth UI Components

### LoginScreen (`src/components/features/auth/LoginScreen.tsx`)

```
+------------------------------------------+
|                                          |
|         Context Tracking                 |
|                                          |
|  +------------------------------------+  |
|  | Email                              |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Password                           |  |
|  +------------------------------------+  |
|                                          |
|  [         Sign In                    ]  |
|                                          |
|  ─────────── or ───────────              |
|                                          |
|  [    Continue with Google            ]  |
|                                          |
|  Don't have an account? Sign up          |
|                                          |
+------------------------------------------+
```

**Props:**

```typescript
interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleOAuth: () => void;
  onSwitchToRegister: () => void;
  error: string | null;
}
```

### RegisterScreen (`src/components/features/auth/RegisterScreen.tsx`)

```
+------------------------------------------+
|                                          |
|       Create Account                     |
|                                          |
|  +------------------------------------+  |
|  | Email                              |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Password                           |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Confirm Password                   |  |
|  +------------------------------------+  |
|                                          |
|  [       Create Account               ]  |
|                                          |
|  ─────────── or ───────────              |
|                                          |
|  [    Continue with Google            ]  |
|                                          |
|  Already have an account? Sign in        |
|                                          |
+------------------------------------------+
```

### EncryptionSetupScreen (`src/components/features/auth/EncryptionSetupScreen.tsx`)

Shown after first account creation or when logging in on a new device with no key bundle.

```
+------------------------------------------+
|                                          |
|    Set Your Encryption Passphrase        |
|                                          |
|  Your data is encrypted end-to-end.      |
|  This passphrase protects your data      |
|  and is separate from your account       |
|  password. We cannot recover it.         |
|                                          |
|  +------------------------------------+  |
|  | Encryption Passphrase              |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Confirm Passphrase                 |  |
|  +------------------------------------+  |
|                                          |
|  [      Set Passphrase                ]  |
|                                          |
+------------------------------------------+
```

### Modified PassphraseScreen (Unlock Mode)

Shown on returning visits (same device or new device after key bundle is fetched).

```
+------------------------------------------+
|                                          |
|         Unlock Your Data                 |
|                                          |
|  Logged in as: user@example.com          |
|                                          |
|  +------------------------------------+  |
|  | Encryption Passphrase              |  |
|  +------------------------------------+  |
|                                          |
|  [          Unlock                    ]  |
|                                          |
|  [Log out]                               |
|                                          |
+------------------------------------------+
```

---

## 7. Sync Implementation

### Sync Hook (`src/hooks/useSync.ts`)

```typescript
interface UseSyncOptions {
  enabled: boolean; // Only sync when unlocked
  debounceMs?: number; // Debounce local changes (default: 5000)
  pollIntervalMs?: number; // Poll for remote changes (default: 60000)
}

interface UseSyncReturn {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;
  syncNow: () => Promise<void>; // Manual sync trigger
}

function useSync(options: UseSyncOptions): UseSyncReturn;
```

### Sync Strategy: Full Document

```
Local Change --> debounce 5s --> serialize Automerge doc --> encrypt with MEK --> PUT /api/sync/data

App Focus / Timer --> GET /api/sync/status --> if version changed --> GET /api/sync/data --> decrypt --> merge
```

### Push Flow

```typescript
async function pushDocument(): Promise<void> {
  // 1. Get current Automerge document
  const repo = getRepo();
  const handle = repo.find(docUrl);
  const doc = await handle.doc();

  // 2. Serialize to binary
  const binary = Automerge.save(doc);

  // 3. Encrypt with MEK (via worker)
  const cryptoClient = getCryptoWorkerClient();
  const encrypted = await cryptoClient.encrypt(binary);

  // 4. Upload to server
  const status = await syncApi.uploadDocument(encrypted, localVersion);

  // 5. Update local version tracking
  setLocalVersion(status.version);
}
```

### Pull Flow

```typescript
async function pullDocument(): Promise<void> {
  // 1. Check if remote has changes
  const status = await syncApi.getSyncStatus();
  if (status.version === localVersion) return; // No changes

  // 2. Download encrypted blob
  const { data: encrypted, version } = await syncApi.downloadDocument();

  // 3. Decrypt with MEK (via worker)
  const cryptoClient = getCryptoWorkerClient();
  const binary = await cryptoClient.decrypt(encrypted);

  // 4. Load into Automerge
  const remoteDoc = Automerge.load(binary);

  // 5. Merge with local document (Automerge CRDT handles conflicts)
  const repo = getRepo();
  const handle = repo.find(docUrl);
  handle.merge(remoteDoc);

  // 6. Update local version
  setLocalVersion(version);
}
```

### Sync Triggers

| Trigger                                  | Action                                       |
| ---------------------------------------- | -------------------------------------------- |
| Local document change                    | Debounced push (5 seconds after last change) |
| App becomes visible (`visibilitychange`) | Pull                                         |
| Window gains focus                       | Pull                                         |
| Periodic timer                           | Pull every 60 seconds                        |
| Manual "Sync Now" button                 | Push then pull                               |
| App startup (after unlock)               | Pull                                         |

### Conflict Handling (Full Document Sync)

With full-document sync, conflicts occur when two devices edit while one is offline:

1. Device A pushes version 5
2. Device B (offline) makes changes to version 4
3. Device B comes online, tries to push with `X-Base-Version: 4`
4. Server responds 409 (version conflict)
5. Device B pulls version 5, merges locally using Automerge CRDT
6. Device B pushes merged result as version 6

Automerge's CRDT merge handles the actual data merging. The server only tracks version numbers for optimistic concurrency.

---

## 8. Offline Support

### Cached Data for Offline Operation

| Data                                         | Storage                         | Purpose                            |
| -------------------------------------------- | ------------------------------- | ---------------------------------- |
| JWT refresh token                            | localStorage or httpOnly cookie | Re-auth when online                |
| Key bundle (wrapped_mek, kek_salt, sentinel) | localStorage                    | Offline unlock                     |
| Encrypted Automerge data                     | IndexedDB                       | Offline data access                |
| Local sync version                           | localStorage                    | Detect remote changes on reconnect |

### Offline Behavior

1. **No network on app open**: Use cached key bundle for encryption passphrase unlock. All data is in local IndexedDB. Full functionality.
2. **Network lost while using**: Changes save to IndexedDB normally. Sync push/pull fails silently. Queued for retry.
3. **Network restored**: Trigger sync pull (detect remote changes), then push local changes.

### Network Detection

```typescript
// Existing useOnlineStatus hook -- no changes needed
const isOnline = useOnlineStatus();

// In useSync:
if (!isOnline) {
  // Skip sync, queue for later
  return;
}
```

### Cache Invalidation

- Key bundle cache is updated whenever `PUT /api/keys` succeeds
- Key bundle cache is cleared on logout (`clearCachedKeyBundle()`)
- JWT is cleared on logout
- On account deletion: clear all localStorage, clear IndexedDB
