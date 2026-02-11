# Context Tracking - Local Setup & Security Documentation

> A privacy-focused, offline-first productivity app for managing work contexts, action items,
> time tracking, and invoicing. All data is encrypted client-side and stored locally in the browser.

---

## Table of Contents

- [1. Getting Started Locally](#1-getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Available Commands](#available-commands)
  - [First-Time User Flow](#first-time-user-flow)
  - [Development Workflow](#development-workflow)
  - [Troubleshooting](#troubleshooting)
- [2. Application Architecture](#2-application-architecture)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [Data Flow](#data-flow)
- [3. Security Implementation](#3-security-implementation)
  - [Security Architecture Overview](#security-architecture-overview)
  - [Tier 1 - Authentication & Session Management](#tier-1---authentication--session-management)
  - [Tier 2 - Data Encryption & Storage](#tier-2---data-encryption--storage)
  - [Tier 3 - Frontend Security (XSS, CSP, Validation)](#tier-3---frontend-security-xss-csp-validation)
  - [Tier 4 - Network & Transport Security](#tier-4---network--transport-security)
  - [Tier 5 - Code Quality & Security Tooling](#tier-5---code-quality--security-tooling)
- [4. Security Best Practices for Users](#4-security-best-practices-for-users)
- [5. Quick Reference](#5-quick-reference)

---

## 1. Getting Started Locally

### Prerequisites

| Requirement | Version | Notes                                                                       |
| ----------- | ------- | --------------------------------------------------------------------------- |
| Node.js     | >= 20.x | Required for build tooling                                                  |
| npm         | >= 10.x | Included with Node.js                                                       |
| Browser     | Modern  | Chrome, Firefox, Safari, Edge (must support Web Crypto API and Web Workers) |

No backend services, databases, API keys, or environment variables are required.
This is a fully client-side application.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd context-tracking

# Install dependencies
npm install
```

### Running the App

```bash
# Start the development server
npm run dev

# The app will be available at:
# http://localhost:5173/context-tracking/
```

### Available Commands

| Command                    | Description                                |
| -------------------------- | ------------------------------------------ |
| `npm run dev`              | Start dev server with hot reload (Vite)    |
| `npm run build`            | TypeScript compile + Vite production build |
| `npm run preview`          | Preview the production build locally       |
| `npm run preview:gh-pages` | Preview with GitHub Pages base path        |
| `npm run lint`             | Run ESLint across the codebase             |
| `npm test`                 | Run tests in watch mode (Vitest)           |
| `npm run test:ui`          | Run tests with Vitest UI                   |
| `npm run test:coverage`    | Run tests and generate coverage report     |

### First-Time User Flow

When you open the app for the first time:

```
+--------------------------------------------------+
|                                                  |
|          Encrypt Your Data                       |
|                                                  |
|  Create a passphrase to encrypt your data.       |
|  This passphrase will be required every time     |
|  you open the app.                               |
|                                                  |
|  [  Passphrase (min 8 chars)               ]     |
|  [  Confirm Passphrase                     ]     |
|                                                  |
|  [ ] Show passphrase                             |
|                                                  |
|  [ Create Passphrase & Encrypt ]                 |
|                                                  |
|  WARNING: If you forget your passphrase,         |
|  your data cannot be recovered.                  |
|                                                  |
+--------------------------------------------------+
```

1. Enter a passphrase (minimum 8 characters).
2. Confirm the passphrase.
3. Click "Create Passphrase & Encrypt" to initialize encryption.
4. Begin creating contexts, action items, links, and time entries.

On subsequent visits, you will be prompted to unlock with your passphrase.

### Development Workflow

1. Run `npm run dev` to start the development server.
2. Make changes to source files under `src/`.
3. Vite provides hot module replacement (HMR) - changes reflect instantly.
4. Pre-commit hooks (Husky + lint-staged) automatically lint and format staged files.
5. Run `npm test` to validate changes against the test suite.

### Troubleshooting

| Issue                          | Solution                                                       |
| ------------------------------ | -------------------------------------------------------------- |
| WASM-related build errors      | Ensure `vite-plugin-wasm` is installed; check `vite.config.ts` |
| App stuck on passphrase screen | Clear browser data for `localhost:5173` and re-setup           |
| IndexedDB quota errors         | Clear site storage in browser dev tools                        |
| Web Worker not loading         | Ensure browser supports Web Workers and WASM                   |
| Port 5173 already in use       | Kill the existing process or Vite will auto-pick another port  |

---

## 2. Application Architecture

### Technology Stack

| Layer          | Technology                                        |
| -------------- | ------------------------------------------------- |
| Framework      | React 19 + TypeScript 5.9 (strict mode)           |
| Build Tool     | Vite 7 with WASM plugin                           |
| Data Layer     | Automerge (CRDT) with encrypted IndexedDB storage |
| Styling        | Tailwind CSS 4                                    |
| Encryption     | Web Crypto API (AES-256-GCM + PBKDF2)             |
| XSS Prevention | DOMPurify                                         |
| PDF Generation | jsPDF (for invoices)                              |
| Testing        | Vitest + React Testing Library                    |
| Code Quality   | ESLint, Prettier, Husky, lint-staged              |
| Deployment     | GitHub Pages via GitHub Actions                   |

### Project Structure

```
context-tracking/
  src/
    components/
      ui/                    # Reusable UI primitives (Button, Modal, Input)
      layout/                # Sidebar, navigation
      features/
        auth/                # PassphraseScreen (unlock/setup UI)
        action-items/        # Task management components
        calendar/            # Calendar view
        contexts/            # Context CRUD UI
        invoice/             # Invoice generation
        links/               # Link management
        timesheet/           # Time tracking
    hooks/                   # Custom React hooks
      useAutomerge.ts        # Core Automerge integration
      useContexts.ts         # Context CRUD operations
      useActionItems.ts      # Action item operations
      useTimesheet.ts        # Time tracking operations
      useAutoLock.ts         # Inactivity-based auto-lock
      useOnlineStatus.ts     # Online/offline detection
    lib/
      automerge/             # Automerge repo setup + encrypted storage adapter
      security/              # Encryption, key management, sanitization, validation
      utils/                 # General helper functions
    workers/
      crypto.worker.ts       # Web Worker for all cryptographic operations
    types/                   # TypeScript type definitions
    constants/               # App-wide constants
    test/                    # Test setup and helpers
  public/                    # Static assets
  .github/workflows/         # CI/CD (GitHub Actions -> GitHub Pages)
```

### Data Flow

```
  User Interaction (browser)
        |
        v
  React Components (src/components/features/)
        |
        v
  Custom Hooks (src/hooks/)
    useContexts, useActionItems, useTimesheet, etc.
        |
        v
  useAutomerge Hook (src/hooks/useAutomerge.ts)
        |
        v
  Automerge DocHandle.change()
    (CRDT-based state management)
        |
        v
  EncryptedStorageAdapter (src/lib/automerge/encrypted-storage-adapter.ts)
        |                                          ^
        v                                          |
  CryptoWorkerClient ---- postMessage() ----> Crypto Web Worker
    (main thread)                              (src/workers/crypto.worker.ts)
        |                                          |
        |               AES-256-GCM                |
        |          encrypt / decrypt               |
        v                                          v
  IndexedDB (encrypted binary data stored in browser)
```

All data is encrypted before it leaves the main application logic.
The encryption key exists only inside the Web Worker's memory scope.

---

## 3. Security Implementation

### Security Architecture Overview

This application implements a **zero-knowledge, client-side-only** security model.
There is no backend server that ever sees unencrypted data.

```
+-----------------------------------------------------------------------+
|                        SECURITY LAYERS                                |
+-----------------------------------------------------------------------+
|                                                                       |
|  +---------------------+    +--------------------------------------+  |
|  | TIER 1              |    | TIER 2                               |  |
|  | Authentication      |    | Data Encryption                     |  |
|  |                     |    |                                      |  |
|  | - Passphrase auth   |    | - AES-256-GCM encryption            |  |
|  | - PBKDF2 derivation |    | - Web Worker key isolation          |  |
|  | - Auto-lock         |    | - Encrypted IndexedDB               |  |
|  | - Sentinel verify   |    | - Non-extractable CryptoKey         |  |
|  +---------------------+    +--------------------------------------+  |
|                                                                       |
|  +---------------------+    +--------------------------------------+  |
|  | TIER 3              |    | TIER 4                               |  |
|  | Frontend Security   |    | Network & Transport                  |  |
|  |                     |    |                                      |  |
|  | - CSP headers       |    | - HTTPS (GitHub Pages)              |  |
|  | - DOMPurify (XSS)   |    | - No external API calls             |  |
|  | - Input validation  |    | - Referrer policy                   |  |
|  | - URL sanitization  |    | - No cookies / no sessions          |  |
|  +---------------------+    +--------------------------------------+  |
|                                                                       |
|  +------------------------------------------------------------------+ |
|  | TIER 5 - Code Quality & Security Tooling                         | |
|  |                                                                  | |
|  | - TypeScript strict mode     - ESLint + Prettier                 | |
|  | - Pre-commit hooks (Husky)   - Security unit tests               | |
|  | - Constant-time comparison   - React StrictMode                  | |
|  +------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

---

### Tier 1 - Authentication & Session Management

**Concept:** Users authenticate via a passphrase that derives an encryption key.
No passwords are stored anywhere. The key exists only in Web Worker memory.

#### Passphrase Authentication Flow

```
  First-time Setup:                     Returning User:
  ================                      ===============

  User enters passphrase                User enters passphrase
        |                                     |
        v                                     v
  Generate random salt (16 bytes)       Load salt from localStorage
        |                                     |
        v                                     v
  PBKDF2 key derivation              PBKDF2 key derivation
  (100,000 iterations, SHA-256)       (100,000 iterations, SHA-256)
        |                                     |
        v                                     v
  Create verification sentinel        Decrypt stored sentinel
  (encrypt known plaintext)           (compare with known plaintext)
        |                                     |
        v                                     v
  Store salt + sentinel               Match? --> Unlock app
  in localStorage                     No match? --> Reject
        |
        v
  App unlocked, ready to use
```

#### Auto-Lock (Inactivity Timeout)

The app automatically locks after a configurable period of inactivity (default: 15 minutes).
When locked, the encryption key is cleared from the Web Worker's memory.

Monitored activity events: `mousedown`, `mousemove`, `keydown`, `touchstart`, `scroll`, `click`

**Key files:**

- Authentication UI: `src/components/features/auth/PassphraseScreen.tsx`
- Key lifecycle management: `src/lib/security/key-manager.ts`
- Auto-lock hook: `src/hooks/useAutoLock.ts`

---

### Tier 2 - Data Encryption & Storage

**Concept:** All user data is encrypted with AES-256-GCM before being written to IndexedDB.
Cryptographic operations are isolated in a dedicated Web Worker to minimize attack surface.

#### Encryption Details

| Parameter          | Value                                             |
| ------------------ | ------------------------------------------------- |
| Algorithm          | AES-256-GCM (authenticated)                       |
| Key Derivation     | PBKDF2                                            |
| PBKDF2 Iterations  | 100,000                                           |
| Hash Function      | SHA-256                                           |
| Salt Length        | 16 bytes (random)                                 |
| IV Length          | 12 bytes (NIST-recommended for GCM)               |
| Key Extractability | Non-extractable (cannot be exported as raw bytes) |

#### Encrypted Data Format

```
  +--------+----------------------------+
  | IV     | Ciphertext + Auth Tag      |
  | 12 B   | variable length            |
  +--------+----------------------------+

  The IV is prepended to the ciphertext for self-contained storage.
  Each encryption operation generates a fresh random IV.
```

#### Web Worker Key Isolation

```
  +----------------------------+          +----------------------------+
  |       MAIN THREAD          |          |       WEB WORKER           |
  |                            |          |                            |
  | CryptoWorkerClient         |          |  crypto.worker.ts          |
  |   - sends messages --------|--------->|   - workerKey: CryptoKey   |
  |   - receives results <-----|----------|   - deriveKey()            |
  |                            |          |   - encrypt()              |
  | EncryptedStorageAdapter    |          |   - decrypt()              |
  |   - calls encrypt/decrypt  |          |   - lock() --> key = null  |
  |   - reads/writes IndexedDB |          |                            |
  |                            |          |  Key NEVER crosses this    |
  |  (no CryptoKey here)       |          |  boundary                  |
  +----------------------------+          +----------------------------+
```

The `CryptoKey` object is marked as non-extractable and lives exclusively in the
Web Worker scope. The main thread communicates with the worker via `postMessage()`.
This design limits the blast radius of XSS attacks -- even if an attacker injects
script on the main thread, they cannot directly access the encryption key.

#### Storage Layout

| Storage      | Key                         | Content                         |
| ------------ | --------------------------- | ------------------------------- |
| localStorage | `context-tracking-salt`     | Base64-encoded PBKDF2 salt      |
| localStorage | `context-tracking-sentinel` | Encrypted verification blob     |
| IndexedDB    | `context-tracking-db`       | Encrypted Automerge binary data |

#### Data Migration (Unencrypted to Encrypted)

For users who had data before encryption was added, a migration process transparently:

1. Reads all data from the unencrypted IndexedDB.
2. Creates a new encrypted Automerge repo.
3. Re-saves all data encrypted.
4. Deletes the old unencrypted database.

**Key files:**

- Cryptographic primitives: `src/lib/security/crypto.ts`
- Web Worker implementation: `src/workers/crypto.worker.ts`
- Encrypted storage adapter: `src/lib/automerge/encrypted-storage-adapter.ts`
- Data migration: `src/lib/security/migration.ts`

---

### Tier 3 - Frontend Security (XSS, CSP, Validation)

**Concept:** Defense-in-depth measures prevent cross-site scripting, protocol injection,
and other frontend attack vectors.

#### Content Security Policy (CSP)

Defined in `index.html` via a `<meta>` tag:

| Directive     | Value                       | Purpose                                      |
| ------------- | --------------------------- | -------------------------------------------- |
| `default-src` | `'self'`                    | Only load resources from same origin         |
| `script-src`  | `'self' 'wasm-unsafe-eval'` | Scripts from same origin + WASM support      |
| `style-src`   | `'self' 'unsafe-inline'`    | Inline styles (required by Tailwind/React)   |
| `connect-src` | `'self'`                    | No external API calls allowed                |
| `img-src`     | `'self' data: blob:`        | Images from same origin + data/blob URIs     |
| `font-src`    | `'self'`                    | Fonts from same origin only                  |
| `object-src`  | `'none'`                    | No plugins (Flash, Java, etc.)               |
| `base-uri`    | `'self'`                    | Prevents `<base>` tag hijacking              |
| `form-action` | `'self'`                    | Forms only submit to same origin             |
| `worker-src`  | `'self' blob:`              | Workers from same origin (for crypto worker) |

Additional headers:

- `X-Content-Type-Options: nosniff` -- prevents MIME type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin` -- limits referrer leakage

#### XSS Prevention (DOMPurify)

All user-provided text is sanitized before rendering or storage:

- `sanitizeText(input)` -- strips **all** HTML tags, returns plain text.
- `sanitizeHtml(input)` -- allows only safe formatting tags (`b`, `i`, `em`, `strong`, `p`, `br`, `ul`, `ol`, `li`, `a`, `code`, `pre`) with restricted attributes (`href`, `target`, `rel` only). Data attributes are blocked.
- `sanitizeStringField(value)` -- validates type is string, then sanitizes.

#### Input Validation

**URL Validation** (`src/lib/security/validate.ts`):

- Only `http:` and `https:` protocols allowed.
- Blocks `javascript:`, `data:`, `vbscript:`, `file:`, etc.
- Maximum URL length enforced (2048 characters).
- Auto-prepends `https://` if no protocol is specified.
- URLs are parsed and reconstructed to normalize them.

**Email Validation:**

- RFC 5322 simplified regex pattern.

**Numeric Range Validation:**

- Ensures values are finite numbers within min/max bounds.
- Used for hourly rates, quantities, and other numeric inputs.

#### Secure External Links

All external links include `rel="noopener noreferrer"` to prevent:

- `window.opener` exploitation (tabnapping).
- Referrer information leakage to external sites.

**Key files:**

- XSS sanitization: `src/lib/security/sanitize.ts`
- Input validation: `src/lib/security/validate.ts`
- CSP and security headers: `index.html`

---

### Tier 4 - Network & Transport Security

**Concept:** The application has no backend, making server-side attack vectors irrelevant.
All data stays local.

#### Zero-Knowledge Architecture

```
  +-------------------+                      +--------------------+
  | User's Browser    |                      | GitHub Pages       |
  |                   |   HTTPS (static)     |                    |
  | - All data local  | <----- serves -----> | - HTML/JS/CSS only |
  | - Encrypted       |                      | - No server logic  |
  | - Never leaves    |                      | - No data access   |
  +-------------------+                      +--------------------+
```

- **No backend API**: There are no server endpoints to attack (no rate limiting or CORS needed).
- **No cookies or session tokens**: Authentication is local passphrase-based.
- **No environment variables or secrets**: The app requires no API keys or external service credentials.
- **HTTPS enforced**: GitHub Pages serves all content over HTTPS by default.
- **No external network requests**: `connect-src 'self'` in CSP blocks outbound requests.

---

### Tier 5 - Code Quality & Security Tooling

**Concept:** Automated tooling catches security issues before they reach production.

#### TypeScript Strict Mode

The project uses TypeScript with maximum strictness (`tsconfig.app.json`):

- `strict: true` -- enables all strict type-checking options.
- `noUnusedLocals: true` -- prevents dead code.
- `noUnusedParameters: true` -- prevents unused function parameters.
- `noFallthroughCasesInSwitch: true` -- prevents missing `break` in switch cases.

#### Pre-Commit Hooks

Husky + lint-staged automatically run on every commit:

- ESLint checks for code quality and security issues.
- Prettier enforces consistent formatting.
- Prevents committing code that doesn't pass linting.

#### Security-Focused Testing

Dedicated test files cover security-critical code:

| Test File                              | Covers                                                 |
| -------------------------------------- | ------------------------------------------------------ |
| `src/lib/security/crypto.test.ts`      | Key derivation, encrypt/decrypt, sentinel verification |
| `src/lib/security/key-manager.test.ts` | Passphrase lifecycle (init, unlock, lock, change)      |
| `src/lib/security/validate.test.ts`    | URL protocol injection, email validation               |
| `src/lib/security/sanitize.test.ts`    | XSS payloads, script injection, HTML stripping         |
| `src/hooks/useAutoLock.test.ts`        | Inactivity detection, timer behavior                   |

#### Additional Safety Measures

- **React StrictMode** enabled in `src/main.tsx` -- catches unsafe lifecycle patterns.
- **Constant-time comparison** in passphrase verification -- prevents timing attacks.
- **Error handling** in crypto operations -- no sensitive data in error messages.
- **Non-extractable keys** -- `CryptoKey` objects cannot be exported from Web Crypto API.

---

## 4. Security Best Practices for Users

**Choosing a Strong Passphrase:**

- Use at least 8 characters (enforced by the app).
- Prefer a longer phrase with mixed words, numbers, and symbols.
- Do not reuse a passphrase from another service.
- Store your passphrase in a dedicated password manager.

**No Recovery Mechanism:**

- If you forget your passphrase, your data **cannot be recovered**.
- There is no "forgot password" flow -- this is by design (zero-knowledge).

**Auto-Lock Settings:**

- The default auto-lock timeout is 15 minutes.
- Adjust this in the app's settings to match your security needs.
- Setting it to 0 disables auto-lock (not recommended for shared devices).

**Browser Considerations:**

- Data is stored in your browser's IndexedDB. Clearing site data will delete your encrypted data.
- Use a browser that supports the Web Crypto API (all modern browsers do).
- Avoid using the app in incognito/private mode if you want data to persist.

---

## 5. Quick Reference

### Key File Paths

| Purpose                   | Path                                                |
| ------------------------- | --------------------------------------------------- |
| App entry point           | `src/main.tsx`                                      |
| Passphrase UI             | `src/components/features/auth/PassphraseScreen.tsx` |
| Crypto primitives         | `src/lib/security/crypto.ts`                        |
| Key manager               | `src/lib/security/key-manager.ts`                   |
| Crypto Web Worker         | `src/workers/crypto.worker.ts`                      |
| Encrypted storage adapter | `src/lib/automerge/encrypted-storage-adapter.ts`    |
| XSS sanitization          | `src/lib/security/sanitize.ts`                      |
| Input validation          | `src/lib/security/validate.ts`                      |
| Data migration            | `src/lib/security/migration.ts`                     |
| Auto-lock hook            | `src/hooks/useAutoLock.ts`                          |
| CSP / security headers    | `index.html`                                        |
| Vite config               | `vite.config.ts`                                    |
| TypeScript config         | `tsconfig.app.json`                                 |

### Key Security Settings

| Setting                   | Default      | Location                    |
| ------------------------- | ------------ | --------------------------- |
| Minimum passphrase length | 8 characters | `key-manager.ts`            |
| PBKDF2 iterations         | 100,000      | `crypto.worker.ts`          |
| AES key length            | 256 bits     | `crypto.worker.ts`          |
| IV length                 | 12 bytes     | `crypto.worker.ts`          |
| Salt length               | 16 bytes     | `crypto.worker.ts`          |
| Auto-lock timeout         | 15 minutes   | App settings (configurable) |
| Max URL length            | 2,048 chars  | `validate.ts`               |
