# Account-Based Authentication & Cross-Device Sync Plan

**Version:** 1.0
**Date:** February 9, 2026
**Status:** Draft

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Design Decisions](#2-design-decisions)
- [3. Architecture](#3-architecture)
- [4. Implementation Phases](#4-implementation-phases)
- [5. Open Considerations](#5-open-considerations)
- [6. Related Documents](#6-related-documents)

---

## 1. Overview

### Problem

The application currently stores all data locally in the browser (IndexedDB) with passphrase-based encryption. This means:

- Data is trapped on a single device/browser
- If the user clears browser data, everything is lost
- No way to access data from a phone, another computer, or a different browser

### Solution

Replace the local-only passphrase system with:

1. **Account-based authentication** (email/password + optional Google OAuth) for user identity
2. **Separate encryption passphrase** for zero-knowledge data encryption
3. **Server-side encrypted blob storage** with a Go backend
4. **Full-document sync** for cross-device access

### Key Principle

The server **never** sees unencrypted user data. All encryption/decryption happens client-side. The server stores only opaque encrypted blobs and a wrapped (encrypted) master key.

---

## 2. Design Decisions

| Decision              | Choice                                              | Rationale                                                                                               |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Encryption approach   | Option B: Separate auth + master encryption key     | Decouples auth from encryption. Allows OAuth. Passphrase change doesn't require data re-encryption.     |
| Auth method           | Email/password (primary) + Google OAuth (secondary) | Email/password provides a universal baseline. OAuth added for convenience.                              |
| Backend technology    | Go                                                  | High performance, strong standard library for HTTP/crypto, good for API servers.                        |
| Encryption passphrase | Separate from account password                      | More secure (two factors). Required because OAuth doesn't provide a stable password for key derivation. |
| Sync approach         | Full document sync                                  | Simple to implement, reliable. Can upgrade to incremental Automerge sync protocol later.                |
| Key management        | Two-layer KEK/MEK                                   | Changing passphrase only re-wraps the MEK (milliseconds) instead of re-encrypting all data.             |

---

## 3. Architecture

### System Diagram

```
+---------------------------------------------------------+
|  React Client (existing + modified)                     |
|                                                         |
|  +----------+  +------------+  +---------------------+  |
|  | Auth UI  |  | Encryption |  |  Sync Client        |  |
|  | (new)    |  | Passphrase |  |  (new)              |  |
|  |          |  | UI (kept)  |  |                     |  |
|  +----+-----+  +-----+------+  +--------+------------+  |
|       |              |                   |               |
|       |     +--------v--------+          |               |
|       |     |  Web Worker     |          |               |
|       |     |  (MEK + KEK)   |          |               |
|       |     +--------+--------+          |               |
|       |              |                   |               |
|       |     +--------v--------+          |               |
|       |     |  Encrypted      |          |               |
|       |     |  IndexedDB      |          |               |
|       |     +-----------------+          |               |
|       |                                  |               |
+-------+----------------------------------+--------------+
        |          HTTPS                   |
        v                                  v
+---------------------------------------------------------+
|  Go Server (new)                                        |
|                                                         |
|  +----------+  +------------+  +---------------------+  |
|  | Auth API |  | Key Bundle |  |  Encrypted Data     |  |
|  | (JWT)    |  | Storage    |  |  Blob Storage       |  |
|  +----+-----+  +-----+------+  +--------+------------+  |
|       |              |                   |               |
|       v              v                   v               |
|  +-------------------------------------------------+    |
|  |            PostgreSQL                            |    |
|  +-------------------------------------------------+    |
+---------------------------------------------------------+
```

### Key Hierarchy

```
Account Password ----> Server Auth (bcrypt, JWT)        <-- for identity

Encryption Passphrase + salt ----> PBKDF2 ----> KEK (Key Encryption Key)
                                                  |
                              Random MEK ---------+ wrapped by KEK
                             (Master Key)           stored on server
                                  |
                                  v
                       Encrypts all user data (AES-256-GCM)
                       Synced as encrypted blobs to server
```

### What the Server Can See vs. Cannot See

| Server CAN see                   | Server CANNOT see                            |
| -------------------------------- | -------------------------------------------- |
| Email address                    | Encryption passphrase                        |
| Hashed account password (bcrypt) | Plaintext MEK (Master Encryption Key)        |
| Wrapped (encrypted) MEK blob     | Any user data (contexts, action items, etc.) |
| Encrypted data blobs             | Data content or structure                    |
| Timestamps, blob sizes           | Plaintext of anything                        |
| PBKDF2 salt (not secret)         | KEK (Key Encryption Key)                     |

---

## 4. Implementation Phases

| Phase                            | Description                                                        | Depends On    | Estimated Effort |
| -------------------------------- | ------------------------------------------------------------------ | ------------- | ---------------- |
| **1. Go Server - Auth**          | Project setup, user model, register/login, JWT, bcrypt, middleware | -             | Medium           |
| **2. Go Server - Keys & Sync**   | Key bundle CRUD, encrypted blob storage, sync endpoints            | Phase 1       | Medium           |
| **3. Client - API Layer**        | HTTP client, auth API, JWT storage/refresh, keys API, sync API     | Phase 1       | Medium           |
| **4. Client - Crypto Rewrite**   | Worker MEK/KEK support, key-manager rewrite, wrap/unwrap           | -             | High (critical)  |
| **5. Client - Auth UI**          | Login, register, encryption passphrase screens, app state machine  | Phase 3, 4    | Medium           |
| **6. Client - Sync Integration** | Push/pull logic, debounced sync, version checking                  | Phase 2, 3, 5 | Medium           |
| **7. Google OAuth**              | Server OAuth flow, client OAuth button, account linking            | Phase 1, 5    | Low-Medium       |
| **8. Migration**                 | V1 to V2 migration flow, data re-encryption, cleanup               | Phase 4, 5    | Medium           |
| **9. Testing**                   | Unit tests for crypto, integration tests for auth + sync, E2E      | All phases    | High             |

Phases 1 and 4 can be developed in parallel since they have no dependencies on each other.

---

## 5. Open Considerations

### 5.1 Offline-First Behavior

The app must continue to work offline. Key decisions:

- **Key bundle caching**: The `wrapped_mek`, `kek_salt`, and `sentinel` are cached in `localStorage` after first fetch. Users can unlock without network.
- **Offline edits**: Changes are saved to local IndexedDB as before. Sync happens when connectivity is restored.
- **Conflict handling**: With full-document sync, concurrent edits on two offline devices require conflict resolution. Initial approach: last-write-wins. Future: upgrade to Automerge sync protocol for true CRDT merging.

### 5.2 Account Deletion

- Cascade-deletes key bundle and all encrypted data on server
- MEK is permanently lost (data is irrecoverable by design)
- Client clears local storage and IndexedDB

### 5.3 OAuth-Only Users

Users who register via Google OAuth have no account password. They still need an encryption passphrase because:

- OAuth tokens don't provide a stable secret for key derivation
- The encryption passphrase is conceptually separate from authentication
- This maintains zero-knowledge encryption regardless of auth method

### 5.4 Passphrase Recovery

There is **no passphrase recovery** for the encryption passphrase (zero-knowledge design). If a user forgets their encryption passphrase and has no device with an unlocked session, their data is permanently inaccessible.

Potential future mitigations:

- **Recovery codes**: Generated at setup, stored by user offline
- **Trusted device recovery**: If one device still has MEK in memory, use it to re-wrap with a new passphrase
- These are deferred to a future iteration

### 5.5 Data Size Limits

Full-document sync uploads the entire Automerge document as one blob. Considerations:

- Set a server-side max blob size (e.g., 50 MB)
- Track `size_bytes` per user for quota management
- If documents grow large, upgrade to incremental/change-based sync

### 5.6 Rate Limiting

Critical endpoints to rate-limit:

- `/api/auth/login`: 5 attempts per minute per IP (prevent brute-force)
- `/api/keys`: 10 requests per minute per user (prevent wrapped MEK brute-force)
- `/api/sync/data` PUT: 30 requests per minute per user (prevent abuse)

---

## 6. Related Documents

| Document                                     | Description                                                        |
| -------------------------------------------- | ------------------------------------------------------------------ |
| [Encryption Design](./encryption-design.md)  | Detailed encryption mechanism, crypto flows, key lifecycle         |
| [Server Design](./server-design.md)          | Go backend API endpoints, database schema, project structure       |
| [Client Changes](./client-changes.md)        | React client modifications, new components, state machine          |
| [Migration Plan](./migration-plan.md)        | V1 to V2 migration strategy for existing users                     |
| [PRD](../PRD.md)                             | Original product requirements document                             |
| [Setup & Security](../SETUP_AND_SECURITY.md) | Current security documentation (to be updated post-implementation) |
