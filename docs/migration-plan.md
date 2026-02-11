# Migration Plan: v1 (Passphrase-Only) to v2 (Account + MEK)

**Version:** 1.0
**Date:** February 9, 2026
**Status:** Draft

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Migration Scenarios](#2-migration-scenarios)
- [3. Detailed Migration Flow](#3-detailed-migration-flow)
- [4. Implementation](#4-implementation)
- [5. Edge Cases](#5-edge-cases)
- [6. Rollback Strategy](#6-rollback-strategy)
- [7. Testing Plan](#7-testing-plan)

---

## 1. Overview

### 1.1 What Changes Between v1 and v2

| Aspect         | v1 (Current)                            | v2 (New)                                                  |
| -------------- | --------------------------------------- | --------------------------------------------------------- |
| Authentication | Passphrase only                         | Account (email/password or OAuth) + encryption passphrase |
| Encryption key | PBKDF2-derived directly from passphrase | Random MEK, wrapped by passphrase-derived KEK             |
| Key storage    | Salt + sentinel in `localStorage`       | Key bundle on server + `localStorage` cache               |
| Data storage   | IndexedDB only (browser-local)          | IndexedDB + server-synced encrypted blobs                 |
| Cross-device   | Not supported                           | Supported via server sync                                 |

### 1.2 Who Needs Migration

Any existing user who has:

- `context-tracking-salt` in `localStorage` (v1 encryption set up)
- Encrypted data in IndexedDB

### 1.3 Migration Principle

The migration must be:

- **User-initiated** -- user must provide their current passphrase to decrypt
- **Non-destructive** -- old data preserved until migration confirmed successful
- **Atomic** -- either fully migrates or rolls back
- **Transparent** -- user understands what is happening and why

---

## 2. Migration Scenarios

### Scenario A: Existing User With Encrypted Data (Most Common)

**Starting state:**

- v1 encryption set up (salt + sentinel in `localStorage`)
- Encrypted data in IndexedDB
- No account

**Migration path:**

1. Detect v1 setup on app load
2. Show migration prompt explaining the upgrade
3. Create account (email + password)
4. Enter current v1 passphrase (to unlock existing data)
5. Enter new encryption passphrase (can be same as v1 passphrase)
6. Migrate encryption from PBKDF2-direct to MEK-based
7. Upload key bundle + encrypted data to server

### Scenario B: Existing User With Unencrypted Data (Legacy)

**Starting state:**

- Pre-encryption era data (doc ID in `localStorage`, no salt)
- Unencrypted data in IndexedDB

**Migration path:**

1. Run existing v0-to-v1 migration first (`migration.ts`)
2. Then run v1-to-v2 migration (Scenario A)

### Scenario C: New User (No Migration)

**Starting state:**

- No `localStorage` data
- No IndexedDB data

**Path:**

1. Normal registration flow
2. Set encryption passphrase
3. Generate MEK, wrap, upload key bundle
4. Start using app

---

## 3. Detailed Migration Flow

### 3.1 Detection

```typescript
// src/lib/security/migration-v2.ts

export function detectMigrationState(): MigrationState {
  const hasSalt = localStorage.getItem('context-tracking-salt') !== null;
  const hasDocId = localStorage.getItem('context-tracking-doc-id') !== null;
  const hasKeyBundleCache = localStorage.getItem('context-tracking-key-bundle') !== null;

  if (!hasSalt && !hasDocId) {
    return 'fresh_install'; // Scenario C: no migration needed
  }

  if (!hasSalt && hasDocId) {
    return 'needs_v0_to_v1'; // Scenario B: unencrypted data
  }

  if (hasSalt && !hasKeyBundleCache) {
    return 'needs_v1_to_v2'; // Scenario A: encrypted but no account
  }

  return 'already_migrated'; // Already on v2
}

type MigrationState = 'fresh_install' | 'needs_v0_to_v1' | 'needs_v1_to_v2' | 'already_migrated';
```

### 3.2 Step-by-Step Migration UI (Scenario A)

```
+-------------------------------------------------------------+
| Step 1: Show Migration Banner                                |
| "We've added account support for cross-device access.        |
|  Please create an account to continue."                      |
| [Create Account]                                             |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
| Step 2: Create Account                                       |
| Email: [_______________]                                     |
| Password: [_______________]                                  |
| Confirm:  [_______________]                                  |
| [Create Account]  [Continue with Google]                     |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
| Step 3: Enter Current Passphrase                             |
| "Enter your current passphrase to decrypt your existing      |
|  data so it can be migrated to the new encryption system."   |
| Current passphrase: [_______________]                        |
| [Unlock Data]                                                |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
| Step 4: Set New Encryption Passphrase                        |
| "Set an encryption passphrase for the new system.            |
|  This can be the same as your old passphrase."               |
| [x] Use my current passphrase  (or)                         |
| New passphrase: [_______________]                            |
| Confirm:        [_______________]                            |
|                                                              |
| WARNING: This passphrase cannot be recovered. If forgotten,  |
| your data will be permanently lost.                          |
| [Set Up Encryption]                                          |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
| Step 5: Migration In Progress                                |
| [xxxxxxxxxxxx........] 60%                                   |
| Generating new encryption key...                             |
| Re-encrypting data...                                        |
| Uploading to server...                                       |
+-----------------------------+-------------------------------+
                              |
+-----------------------------v-------------------------------+
| Step 6: Migration Complete                                   |
| [OK] Account created                                         |
| [OK] Data migrated to new encryption                         |
| [OK] Synced to server                                        |
| "You can now access your data from any device."              |
| [Continue to App]                                            |
+-------------------------------------------------------------+
```

### 3.3 Technical Migration Steps

```
Step  Action                                    Detail
----  ----------------------------------------  ------------------------------------
 1    Create account on server                  POST /api/auth/register -> JWT
 2    Load v1 salt from localStorage            context-tracking-salt
 3    Derive v1 key in worker                   PBKDF2(passphrase, v1_salt) -> v1_key
 4    Verify v1 key against sentinel            Decrypt sentinel, compare
 5    Read all data from IndexedDB              Using EncryptedStorageAdapter with v1_key
 6    Serialize Automerge document              Automerge.save(doc) -> plaintext_binary
 7    Generate new MEK in worker                Random 256-bit key
 8    Generate kek_salt                         Random 16 bytes
 9    Derive KEK from new passphrase            PBKDF2(new_passphrase, kek_salt) -> KEK
10    Wrap MEK with KEK                         AES-256-GCM-Encrypt(KEK, MEK)
11    Create sentinel with MEK                  AES-256-GCM-Encrypt(MEK, known_plaintext)
12    Upload key bundle to server               POST /api/keys { wrapped_mek, kek_salt, sentinel }
13    Clear v1 key from worker                  Lock worker
14    Load MEK as new worker key                Set workerMEK = MEK
15    Re-encrypt data with MEK                  EncryptedStorageAdapter.save() uses MEK
16    Encrypt document for server               AES-256-GCM-Encrypt(MEK, plaintext_binary)
17    Upload encrypted document to server       PUT /api/sync/data
18    Clean up old localStorage keys            Remove v1 salt, sentinel, plaintext doc ID
19    Cache key bundle in localStorage          For offline unlock
20    Verify migration                          Test unlock with new passphrase
```

---

## 4. Implementation

### 4.1 Migration Module

```typescript
// src/lib/security/migration-v2.ts

import { getCryptoWorkerClient } from '@/lib/security/crypto-worker-client';
import { getRepo, resetRepo, initializeRepo } from '@/lib/automerge/setup';
import * as Automerge from '@automerge/automerge';
import * as keysApi from '@/lib/api/keys';
import * as syncApi from '@/lib/api/sync';
import type { KeyBundle } from '@/lib/security/key-manager';

interface MigrationProgress {
  step: string;
  percent: number;
}

type ProgressCallback = (progress: MigrationProgress) => void;

export async function migrateV1ToV2(
  currentPassphrase: string,
  newEncryptionPassphrase: string,
  onProgress?: ProgressCallback
): Promise<KeyBundle> {
  const client = getCryptoWorkerClient();

  // Step 1: Unlock with v1 key
  onProgress?.({ step: 'Verifying current passphrase...', percent: 5 });
  const v1Salt = base64ToUint8Array(localStorage.getItem('context-tracking-salt')!);
  const v1Sentinel = base64ToUint8Array(localStorage.getItem('context-tracking-sentinel')!);

  await client.deriveKey(currentPassphrase, v1Salt);
  const isValid = await client.verifySentinel(v1Sentinel);
  if (!isValid) {
    await client.lock();
    throw new Error('Current passphrase is incorrect');
  }

  // Step 2: Read all data with v1 key
  onProgress?.({ step: 'Reading existing data...', percent: 15 });
  initializeRepo(); // Uses v1 key via EncryptedStorageAdapter
  const repo = getRepo();
  // ... get document handle, load doc ...
  // const doc = loaded document;
  // const plainBinary = Automerge.save(doc);

  // Step 3: Lock v1 key
  onProgress?.({ step: 'Generating new encryption key...', percent: 30 });
  await client.lock();
  resetRepo();

  // Step 4: Generate MEK
  await client.generateMEK();

  // Step 5: Derive KEK and wrap MEK
  onProgress?.({ step: 'Setting up new encryption...', percent: 45 });
  const kekSalt = await client.generateSalt();
  await client.deriveKey(newEncryptionPassphrase, kekSalt); // deriveKEK
  const wrappedMEK = await client.wrapMEK();
  const sentinel = await client.createSentinel();
  await client.clearKEK();

  const bundle: KeyBundle = { wrappedMEK, kekSalt, sentinel };

  // Step 6: Upload key bundle
  onProgress?.({ step: 'Uploading encryption key...', percent: 55 });
  await keysApi.createKeyBundle(bundle);

  // Step 7: Re-encrypt data with MEK and write to IndexedDB
  onProgress?.({ step: 'Re-encrypting data...', percent: 65 });
  initializeRepo(); // Now uses MEK via EncryptedStorageAdapter
  // ... create new doc, copy data from plainBinary ...

  // Step 8: Encrypt and upload to server
  onProgress?.({ step: 'Syncing to server...', percent: 80 });
  // const encryptedBlob = await client.encrypt(plainBinary);
  // await syncApi.uploadDocument(encryptedBlob);

  // Step 9: Cleanup
  onProgress?.({ step: 'Cleaning up...', percent: 90 });
  localStorage.removeItem('context-tracking-salt');
  localStorage.removeItem('context-tracking-sentinel');
  localStorage.removeItem('context-tracking-doc-id');
  localStorage.removeItem('context-tracking-doc-id-encrypted');

  // Step 10: Cache new key bundle
  // cacheKeyBundle(bundle);

  onProgress?.({ step: 'Migration complete!', percent: 100 });
  return bundle;
}
```

### 4.2 Migration UI Component

```typescript
// src/components/features/auth/MigrationWizard.tsx

interface MigrationWizardProps {
  onComplete: () => void;
  onError: (error: string) => void;
}

// Multi-step wizard with:
// 1. Welcome/explanation screen
// 2. Account creation form
// 3. Current passphrase input
// 4. New encryption passphrase input (with "use current" checkbox)
// 5. Progress bar during migration
// 6. Success screen
```

### 4.3 Integration in App.tsx

```typescript
function App() {
  const migrationState = detectMigrationState();

  // Handle migration before normal app flow
  if (migrationState === 'needs_v0_to_v1') {
    // Run existing unencrypted migration first, then v1->v2
    return <MigrationWizard version="v0" onComplete={handleV0Complete} />;
  }

  if (migrationState === 'needs_v1_to_v2') {
    return <MigrationWizard version="v1" onComplete={handleV1Complete} />;
  }

  // Normal v2 flow
  // ...
}
```

---

## 5. Edge Cases

### 5.1 Migration Interrupted (Network Failure)

**Risk:** Migration completes locally but fails to upload to server.

**Mitigation:**

- Migration is staged: local re-encryption happens first, then upload
- If upload fails, data is safe locally (encrypted with MEK)
- Key bundle is cached locally even if server upload fails
- On next app load, detect "partially migrated" state and retry upload

**Detection:**

```typescript
function isPartiallyMigrated(): boolean {
  // Has key bundle cache but v1 salt still present
  return getCachedKeyBundle() !== null && localStorage.getItem('context-tracking-salt') !== null;
}
```

### 5.2 Migration Interrupted (App Closed)

**Risk:** App closed mid-migration.

**Mitigation:**

- v1 data is never deleted until migration is confirmed complete
- v1 salt/sentinel remain in `localStorage` until cleanup step
- On next load, `detectMigrationState()` still returns `needs_v1_to_v2`
- User must restart migration from the beginning (passphrase entry)

### 5.3 Wrong Current Passphrase

**Handling:** v1 sentinel verification fails, show error, let user retry. No data modified.

### 5.4 Account Already Exists for Email

**Handling:** If user tries to register with an existing email:

- Show login option instead
- After login, check if key bundle exists
- If key bundle exists: user already migrated on another device (edge case)
- If no key bundle: continue migration normally

### 5.5 User Chooses Same Passphrase for v2

**Allowed and expected.** The checkbox "Use my current passphrase" makes this easy. The key derivation produces a different KEK (new salt) even with the same passphrase, and the MEK is a brand new random key.

### 5.6 Very Large Data Sets

**Risk:** Migration takes too long for very large documents.

**Mitigation:**

- Show progress bar with step descriptions
- Re-encryption is streaming (chunk by chunk via Automerge storage adapter)
- Server upload may take time for large blobs -- show upload progress
- Set reasonable timeout (5 minutes) with retry option

---

## 6. Rollback Strategy

### 6.1 Before Migration Starts

No changes made. User stays on v1.

### 6.2 During Migration (Before Cleanup)

v1 data is intact:

- Salt and sentinel still in `localStorage`
- Original encrypted data still in IndexedDB
- User can simply refresh and use v1 as before

### 6.3 After Migration Complete

No rollback possible. v1 keys removed, data re-encrypted with MEK.

**Why this is acceptable:**

- Migration only cleans up after successful verification
- User explicitly confirmed migration
- Data is preserved (just encrypted differently)
- Account can be deleted and recreated if needed

---

## 7. Testing Plan

### 7.1 Unit Tests

| Test                                           | Description                                               |
| ---------------------------------------------- | --------------------------------------------------------- |
| `detectMigrationState()` returns correct state | Test all combinations of `localStorage` keys              |
| v1 passphrase verification                     | Ensure v1 key correctly decrypts v1 sentinel              |
| MEK generation and wrapping                    | Generate MEK, wrap with KEK, unwrap, verify               |
| Data re-encryption                             | Encrypt with v1 key, decrypt, re-encrypt with MEK, verify |
| Cleanup removes correct keys                   | Verify v1 keys removed, v2 keys present                   |

### 7.2 Integration Tests

| Test                                | Description                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| Full migration happy path           | v1 setup then create account then migrate then verify unlock |
| Migration with same passphrase      | Use "keep current passphrase" option                         |
| Migration with different passphrase | Use new passphrase, verify old does not work                 |
| Network failure during upload       | Verify local data safe, retry succeeds                       |
| Wrong passphrase during migration   | Verify error handling, no data corruption                    |

### 7.3 E2E Tests

| Test                         | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| Complete user journey        | v1 then migrate then lock then unlock then verify data intact |
| Cross-device after migration | Migrate on device A then login on device B then verify data   |
| Partial migration recovery   | Kill app mid-migration then restart then resume               |

### 7.4 Manual Testing Checklist

- [ ] Fresh install: no migration prompt shown
- [ ] v1 user: migration prompt shown on load
- [ ] v0 user: v0-to-v1 migration runs first, then v1-to-v2
- [ ] Migration with correct passphrase: completes successfully
- [ ] Migration with wrong passphrase: error shown, can retry
- [ ] Migration with "use current passphrase": works
- [ ] Migration with new passphrase: works
- [ ] After migration: login + encryption unlock works
- [ ] After migration: data intact (contexts, action items, timesheets)
- [ ] After migration: sync to server works
- [ ] After migration: new device can pull data
- [ ] Offline after migration: cached key bundle allows unlock
- [ ] App closed during migration: restart shows migration prompt again
- [ ] Network failure during migration: data safe, retry works
