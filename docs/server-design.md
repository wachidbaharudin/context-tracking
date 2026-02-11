# Go Server Design

**Version:** 1.0
**Date:** February 9, 2026
**Status:** Draft

---

## Table of Contents

- [1. Technology Stack](#1-technology-stack)
- [2. Project Structure](#2-project-structure)
- [3. Database Schema](#3-database-schema)
- [4. API Endpoints](#4-api-endpoints)
- [5. Authentication](#5-authentication)
- [6. Middleware](#6-middleware)
- [7. Configuration](#7-configuration)
- [8. Deployment](#8-deployment)

---

## 1. Technology Stack

| Component        | Technology                 | Rationale                                                  |
| ---------------- | -------------------------- | ---------------------------------------------------------- |
| Language         | Go 1.22+                   | High performance, strong stdlib, good for API servers      |
| HTTP Router      | Chi or Echo                | Lightweight, idiomatic Go, middleware support              |
| Database         | PostgreSQL 16+             | Reliable, supports BYTEA for blob storage, UUID generation |
| DB Driver        | pgx/v5                     | High-performance PostgreSQL driver for Go                  |
| Migrations       | golang-migrate             | Standard migration tool                                    |
| JWT              | golang-jwt/jwt/v5          | Well-maintained JWT library                                |
| Password Hashing | golang.org/x/crypto/bcrypt | Standard bcrypt implementation                             |
| OAuth            | golang.org/x/oauth2        | Google OAuth2 support                                      |
| Configuration    | Environment variables      | 12-factor app compliance                                   |
| Containerization | Docker                     | Consistent deployment                                      |

---

## 2. Project Structure

```
server/
├── cmd/
│   └── api/
│       └── main.go                     # Entry point: config, DB, router, server start
│
├── internal/
│   ├── config/
│   │   └── config.go                   # Env-based configuration struct
│   │
│   ├── auth/
│   │   ├── jwt.go                      # JWT generation, validation, claims
│   │   ├── bcrypt.go                   # Password hashing and verification
│   │   └── oauth.go                    # Google OAuth2 flow (authorization URL, token exchange)
│   │
│   ├── handler/
│   │   ├── auth_handler.go             # POST /register, /login, /refresh, /password/reset
│   │   │                               # GET /oauth/google, /oauth/google/callback
│   │   ├── keys_handler.go             # POST /keys, GET /keys, PUT /keys
│   │   └── sync_handler.go             # PUT /sync/data, GET /sync/data, GET /sync/status
│   │
│   ├── middleware/
│   │   ├── auth_middleware.go           # JWT extraction and validation from Authorization header
│   │   ├── cors.go                     # CORS headers for browser client
│   │   └── ratelimit.go                # Token bucket / sliding window rate limiter
│   │
│   ├── model/
│   │   ├── user.go                     # User struct + validation
│   │   ├── key_bundle.go               # KeyBundle struct
│   │   └── encrypted_document.go       # EncryptedDocument struct
│   │
│   └── repository/
│       ├── user_repo.go                # User CRUD: create, find by email, find by OAuth ID
│       ├── key_bundle_repo.go          # KeyBundle: create, get by user, update
│       └── document_repo.go            # EncryptedDocument: upsert, get by user, get status
│
├── migrations/
│   ├── 001_create_users.up.sql
│   ├── 001_create_users.down.sql
│   ├── 002_create_key_bundles.up.sql
│   ├── 002_create_key_bundles.down.sql
│   ├── 003_create_encrypted_documents.up.sql
│   └── 003_create_encrypted_documents.down.sql
│
├── go.mod
├── go.sum
├── Dockerfile
├── docker-compose.yml                  # PostgreSQL + API for local dev
└── .env.example
```

---

## 3. Database Schema

### 3.1 Users Table

```sql
-- migrations/001_create_users.up.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255),
    oauth_provider  VARCHAR(50),
    oauth_id        VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- At least one auth method must be set
    CONSTRAINT users_auth_check CHECK (
        password_hash IS NOT NULL OR (oauth_provider IS NOT NULL AND oauth_id IS NOT NULL)
    )
);

-- For OAuth lookups
CREATE UNIQUE INDEX idx_users_oauth
    ON users(oauth_provider, oauth_id)
    WHERE oauth_provider IS NOT NULL;

-- For email lookups
CREATE INDEX idx_users_email ON users(email);
```

```sql
-- migrations/001_create_users.down.sql
DROP TABLE IF EXISTS users;
```

### 3.2 Key Bundles Table

```sql
-- migrations/002_create_key_bundles.up.sql

CREATE TABLE key_bundles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wrapped_mek     BYTEA NOT NULL,
    kek_salt        BYTEA NOT NULL,
    sentinel        BYTEA NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT key_bundles_user_unique UNIQUE(user_id)
);
```

```sql
-- migrations/002_create_key_bundles.down.sql
DROP TABLE IF EXISTS key_bundles;
```

### 3.3 Encrypted Documents Table

```sql
-- migrations/003_create_encrypted_documents.up.sql

CREATE TABLE encrypted_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data            BYTEA NOT NULL,
    version         BIGINT NOT NULL DEFAULT 1,
    size_bytes      BIGINT NOT NULL DEFAULT 0,
    checksum        VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT encrypted_documents_user_unique UNIQUE(user_id)
);

-- For version checking
CREATE INDEX idx_encrypted_documents_version
    ON encrypted_documents(user_id, version);
```

```sql
-- migrations/003_create_encrypted_documents.down.sql
DROP TABLE IF EXISTS encrypted_documents;
```

### Entity Relationship

```
users (1) ------ (0..1) key_bundles
users (1) ------ (0..1) encrypted_documents
```

Each user has at most one key bundle and one encrypted document.

---

## 4. API Endpoints

### 4.1 Auth Endpoints

#### POST /api/auth/register

Create a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "user_id": "uuid",
  "access_token": "jwt...",
  "refresh_token": "jwt..."
}
```

**Errors:**

- `400` - Invalid email or password too short (min 8 characters)
- `409` - Email already registered

**Implementation notes:**

- Hash password with bcrypt (cost 12)
- Generate access token (15 min expiry) and refresh token (30 day expiry)
- Rate limit: 3 registrations per hour per IP

---

#### POST /api/auth/login

Authenticate with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "user_id": "uuid",
  "access_token": "jwt...",
  "refresh_token": "jwt...",
  "has_key_bundle": true
}
```

**Errors:**

- `401` - Invalid email or password
- `429` - Too many login attempts

**Implementation notes:**

- Compare password with bcrypt hash
- `has_key_bundle` tells the client whether to show encryption passphrase setup or unlock screen
- Rate limit: 5 attempts per minute per IP

---

#### POST /api/auth/refresh

Exchange a refresh token for new access + refresh tokens.

**Request:**

```json
{
  "refresh_token": "jwt..."
}
```

**Response (200):**

```json
{
  "access_token": "jwt...",
  "refresh_token": "jwt..."
}
```

**Errors:**

- `401` - Invalid or expired refresh token

**Implementation notes:**

- Refresh token rotation: old refresh token is invalidated
- If refresh token is reused (replay attack), invalidate all tokens for the user

---

#### POST /api/auth/password/reset-request

Request a password reset email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "message": "If an account exists with this email, a reset link has been sent."
}
```

**Implementation notes:**

- Always return 200 regardless of whether email exists (prevent enumeration)
- Generate a time-limited reset token (1 hour expiry)
- Send email with reset link (requires email service integration)

---

#### POST /api/auth/password/reset

Reset account password using a reset token.

**Request:**

```json
{
  "token": "reset-token",
  "new_password": "newpassword123"
}
```

**Response (200):**

```json
{
  "message": "Password has been reset."
}
```

**Errors:**

- `400` - Invalid or expired token, password too short
- `404` - Token not found

**Implementation notes:**

- This resets the **account password** only (used for server authentication)
- The encryption passphrase is NOT affected
- Invalidate all existing refresh tokens for the user

---

#### GET /api/auth/oauth/google

Initiate Google OAuth2 flow.

**Response:** 302 redirect to Google's authorization endpoint.

**Query parameters sent to Google:**

- `client_id` - From server config
- `redirect_uri` - `{SERVER_URL}/api/auth/oauth/google/callback`
- `scope` - `openid email profile`
- `state` - CSRF-protection token
- `response_type` - `code`

---

#### GET /api/auth/oauth/google/callback

Handle Google OAuth2 callback.

**Query parameters (from Google):**

- `code` - Authorization code
- `state` - CSRF token (must match)

**Response:** Redirect to client app with tokens.

Redirect to: `{CLIENT_URL}/auth/callback?access_token=...&refresh_token=...&user_id=...&has_key_bundle=...`

**Implementation notes:**

- Exchange authorization code for Google tokens
- Fetch user profile (email, OAuth ID)
- Find or create user by OAuth provider + OAuth ID
- If user already exists with same email (password auth), link the OAuth identity
- Generate JWT tokens
- Redirect back to client with tokens in URL fragment (not query params, for security)

---

### 4.2 Key Bundle Endpoints

All key bundle endpoints require JWT authentication.

#### POST /api/keys

Store a new key bundle after first-time encryption setup.

**Headers:** `Authorization: Bearer <access_token>`

**Request:**

```json
{
  "wrapped_mek": "<base64>",
  "kek_salt": "<base64>",
  "sentinel": "<base64>"
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "created_at": "2026-02-09T..."
}
```

**Errors:**

- `400` - Missing or invalid fields
- `401` - Invalid JWT
- `409` - Key bundle already exists for this user

**Validation:**

- `wrapped_mek` must be at least 44 bytes (12 IV + 32 key + GCM tag) when decoded
- `kek_salt` must be exactly 16 bytes when decoded
- `sentinel` must be at least 37 bytes (12 IV + 25 plaintext + GCM tag) when decoded

---

#### GET /api/keys

Retrieve the key bundle for the authenticated user.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

```json
{
  "wrapped_mek": "<base64>",
  "kek_salt": "<base64>",
  "sentinel": "<base64>",
  "updated_at": "2026-02-09T..."
}
```

**Errors:**

- `401` - Invalid JWT
- `404` - No key bundle set up yet

---

#### PUT /api/keys

Update the key bundle (after encryption passphrase change).

**Headers:** `Authorization: Bearer <access_token>`

**Request:**

```json
{
  "wrapped_mek": "<base64>",
  "kek_salt": "<base64>"
}
```

**Response (200):**

```json
{
  "updated_at": "2026-02-09T..."
}
```

**Errors:**

- `400` - Missing or invalid fields
- `401` - Invalid JWT
- `404` - No key bundle exists (must POST first)

**Implementation notes:**

- Only `wrapped_mek` and `kek_salt` are updated (sentinel stays the same since MEK doesn't change)
- Rate limit: 5 updates per hour per user

---

### 4.3 Sync Endpoints

All sync endpoints require JWT authentication.

#### PUT /api/sync/data

Upload an encrypted document blob.

**Headers:**

- `Authorization: Bearer <access_token>`
- `Content-Type: application/octet-stream`
- `X-Base-Version: <number>` (optional, for optimistic concurrency)

**Request body:** Raw encrypted bytes.

**Response (200):**

```json
{
  "version": 6,
  "size_bytes": 102400,
  "updated_at": "2026-02-09T..."
}
```

**Errors:**

- `401` - Invalid JWT
- `409` - Version conflict (server version != X-Base-Version)
- `413` - Payload too large (> 50 MB)

**Implementation notes:**

- If `X-Base-Version` is provided and doesn't match current server version, return 409
- Version is auto-incremented on each successful upload
- `size_bytes` is calculated from the request body length
- SHA-256 checksum of the blob is stored for integrity verification

---

#### GET /api/sync/data

Download the encrypted document blob.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

- **Headers:**
  - `Content-Type: application/octet-stream`
  - `X-Version: <number>`
  - `X-Checksum: <sha256>`
- **Body:** Raw encrypted bytes

**Errors:**

- `401` - Invalid JWT
- `404` - No document uploaded yet

---

#### GET /api/sync/status

Check the current sync status without downloading data.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**

```json
{
  "version": 6,
  "size_bytes": 102400,
  "checksum": "sha256hex...",
  "updated_at": "2026-02-09T..."
}
```

**Errors:**

- `401` - Invalid JWT
- `404` - No document uploaded yet

---

## 5. Authentication

### 5.1 JWT Structure

**Access Token (short-lived):**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "type": "access",
  "iat": 1739000000,
  "exp": 1739000900
}
```

- Expiry: 15 minutes
- Signed with HMAC-SHA256 (symmetric) or RS256 (asymmetric, preferred for production)

**Refresh Token (long-lived):**

```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "jti": "unique-token-id",
  "iat": 1739000000,
  "exp": 1741592000
}
```

- Expiry: 30 days
- `jti` (JWT ID) enables token revocation
- Stored in a server-side allowlist (or blocklist) for revocation support

### 5.2 Token Storage (Client-Side)

- Access token: In-memory only (JavaScript variable). Never in localStorage.
- Refresh token: `httpOnly` cookie or localStorage (tradeoff: XSS vs. CSRF).
- Recommended: `httpOnly` secure cookie for refresh token if server supports it.

### 5.3 Password Hashing

```go
// Register
hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)

// Login
err := bcrypt.CompareHashAndPassword(hash, []byte(password))
```

Cost factor 12 provides ~250ms hashing time on modern hardware.

---

## 6. Middleware

### 6.1 Auth Middleware

Applied to all `/api/keys/*` and `/api/sync/*` endpoints.

```go
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 1. Extract "Bearer <token>" from Authorization header
        // 2. Parse and validate JWT (check signature, expiry, type=access)
        // 3. Extract user_id from claims
        // 4. Set user_id in request context
        // 5. Call next handler
    })
}
```

### 6.2 CORS Middleware

```go
func CORSMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
    // Allow: specified origins (e.g., http://localhost:5173, https://app.example.com)
    // Methods: GET, POST, PUT, DELETE, OPTIONS
    // Headers: Authorization, Content-Type, X-Base-Version
    // Expose: X-Version, X-Checksum
    // Max-Age: 86400 (24 hours)
}
```

### 6.3 Rate Limiter

```go
type RateLimitConfig struct {
    LoginPerMinutePerIP      int  // 5
    RegisterPerHourPerIP     int  // 3
    KeyBundlePerHourPerUser  int  // 10
    SyncPerMinutePerUser     int  // 30
    GeneralPerMinutePerUser  int  // 100
}
```

Implementation: Token bucket or sliding window, backed by in-memory store (or Redis for multi-instance).

---

## 7. Configuration

### Environment Variables

```env
# Server
PORT=8080
ENVIRONMENT=development          # development | staging | production

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/context_tracking?sslmode=disable

# JWT
JWT_SECRET=your-256-bit-secret   # For HMAC-SHA256
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=720h             # 30 days

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/oauth/google/callback

# Client
CLIENT_URL=http://localhost:5173  # For CORS and OAuth redirect
ALLOWED_ORIGINS=http://localhost:5173,https://app.example.com

# Rate Limiting
RATE_LIMIT_LOGIN=5               # Per minute per IP
RATE_LIMIT_REGISTER=3            # Per hour per IP

# Sync
MAX_DOCUMENT_SIZE=52428800       # 50 MB in bytes
```

### Config Struct

```go
type Config struct {
    Port        string
    Environment string
    DatabaseURL string

    JWTSecret     string
    JWTAccessTTL  time.Duration
    JWTRefreshTTL time.Duration

    GoogleClientID     string
    GoogleClientSecret string
    GoogleRedirectURL  string

    ClientURL      string
    AllowedOrigins []string

    RateLimitLogin    int
    RateLimitRegister int

    MaxDocumentSize int64
}
```

---

## 8. Deployment

### Docker Setup

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /api ./cmd/api

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /api /api
EXPOSE 8080
CMD ["/api"]
```

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: context_tracking
      POSTGRES_USER: ctuser
      POSTGRES_PASSWORD: ctpass
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - '8080:8080'
    environment:
      PORT: '8080'
      ENVIRONMENT: development
      DATABASE_URL: postgres://ctuser:ctpass@db:5432/context_tracking?sslmode=disable
      JWT_SECRET: dev-secret-change-in-production
      CLIENT_URL: http://localhost:5173
      ALLOWED_ORIGINS: http://localhost:5173
    depends_on:
      - db

volumes:
  pgdata:
```

### Production Considerations

- Use a managed PostgreSQL instance (e.g., AWS RDS, GCP Cloud SQL)
- Put the API behind a reverse proxy (nginx, Caddy) with TLS termination
- Use RS256 (asymmetric) JWT signing in production instead of HMAC
- Set up database connection pooling (pgBouncer or pgx pool)
- Add structured logging (zerolog or slog)
- Add health check endpoint (`GET /health`)
- Set up monitoring and alerting (Prometheus metrics, Grafana)
- Use secrets management (Vault, AWS Secrets Manager) for JWT secret and OAuth credentials
