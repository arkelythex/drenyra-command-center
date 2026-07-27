# SDD Tasks: Drenyra API Platform — APIs, CLI, SDK & Developer Platform

**Date:** 2026-07-25
**Status:** Tasks
**SDD Change:** drenyra-api-platform
**Inputs:** spec, design, proposal

---

## Review Workload Forecast

| Field                   | Value                                             |
| ----------------------- | ------------------------------------------------- |
| Estimated changed lines | ~2,850                                            |
| 400-line budget risk    | High                                              |
| Chained PRs recommended | Yes                                               |
| Suggested split         | PR1 → PR2 → PR3 → PR4 → PR5a → PR5b → PR5c → PR5d |
| Delivery strategy       | ask-on-risk                                       |
| Chain strategy          | pending                                           |

---

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

---

## Dependency Graph

```text
PR1 (API Keys) ────────────────────────┐
PR2 (Rate Limiting) ───────────────────┤
PR3 (Webhooks) ────────────────────────┤
                                       ├──► PR5a (Envelope + Versioning)
                                       │       │
PR4 (SDK) ─────────────────────────────┘       ▼
                                          PR5b (Analytics)
                                               │
                                               ▼
                                          PR5c (Dev Portal)
                                               │
                                               ▼
                                          PR5d (Playground)
```

PR1–PR4 can proceed in parallel (different files). PR4 and PR5a–d depend on PR1 + PR2 + PR3 being merged.

---

## PR1: API Key Management + Developer Auth (~350 lines)

### 1.1 Schema — `api_keys` Table

- [ ] Create `packages/persistence/src/schema/api-keys.schema.ts`:
  - `apiKeys` Drizzle table: `id` (UUID PK), `companyId` (UUID FK → companies), `organizationId` (UUID), `label` (varchar 255), `keyPrefix` (varchar 12), `keyHash` (varchar 255 UNIQUE), `principalType` (enum: user/service/webhook, default 'service'), `status` (enum: active/rotated/revoked, default 'active'), `allowedDomains` (text[] nullable), `rotatedFrom` (UUID self-ref FK nullable), `expiresAt` (timestamptz nullable), `lastUsedAt` (timestamptz nullable), `createdBy` (UUID NOT NULL), timestamps.
  - PostgreSQL enums: `apiKeyStatus`, `apiKeyPrincipalType`.
  - Indexes: `idx_api_keys_company` on `(companyId, status)`, `idx_api_keys_hash` on `(keyHash)`, `idx_api_keys_prefix` on `(keyPrefix)`.
  - Acceptance: `drizzle-kit generate` produces valid migration; `vitest` schema test can insert/query a row.
  - Estimated: ~80 lines. <!-- sdd-owner: implementation -->

### 1.2 Schema — `dev_portal_users` Table

- [ ] Create `packages/persistence/src/schema/dev-accounts.schema.ts`:
  - `devPortalUsers` Drizzle table: `id` (UUID PK), `email` (varchar 255 UNIQUE), `passwordHash` (varchar 255), `name` (varchar 255 nullable), `companyName` (varchar 255 nullable), `emailVerified` (boolean default false), `verificationToken` (varchar 255 nullable), `verificationSentAt` (timestamptz nullable), timestamps.
  - Index: `idx_dev_users_email` on `(email)`.
  - Acceptance: migration produces valid SQL; schema test inserts/selects.
  - Estimated: ~45 lines. <!-- sdd-owner: implementation -->

### 1.3 Schema Barrel Export

- [ ] Update `packages/persistence/src/schema/index.ts`: export `apiKeys`, `apiKeyStatus`, `apiKeyPrincipalType` from `api-keys.schema.ts`; export `devPortalUsers` from `dev-accounts.schema.ts`.
  - Acceptance: `tsc --noEmit` passes; barrel re-exports resolve.
  - Estimated: ~8 lines. <!-- sdd-owner: implementation -->

### 1.4 Shared Lib — API Key Crypto

- [ ] **RED.** Write failing tests in `packages/shared/src/dev-platform/__tests__/api-keys.test.ts`:
  - `generateKey()` returns `dren_`-prefixed 44-char base64url string (no padding).
  - Same input produces a unique key each call (32 random bytes).
  - `hashKey(key)` returns consistent SHA-256 hex for same key.
  - `verifyKey(key, hash)` returns true for matching key, false for non-matching, constant-time.
  - `extractPrefix(key)` returns `dren_` + first 8 chars of base64url.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `packages/shared/src/dev-platform/api-keys.ts`:
  - `generateApiKey()`: 32 random bytes via `crypto.getRandomValues()`, encode as base64url (no padding), prefix `dren_`.
  - `hashApiKey(key: string)`: SHA-256 of full key string (hex output).
  - `verifyApiKey(key: string, hash: string)`: timing-safe comparison of SHA-256(key) vs stored hash.
  - `extractKeyPrefix(key: string)`: `dren_` + first 8 base64url chars for dashboard display.
  - Acceptance: all tests pass.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: empty string, non-`dren_` prefix, key with padding chars, Unicode input. Fix any failures.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

### 1.5 Shared Lib — Developer Platform Barrel

- [ ] Create `packages/shared/src/dev-platform/index.ts`: barrel export for `api-keys.ts`.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~4 lines. <!-- sdd-owner: implementation -->

### 1.6 API Plugin — API Key Auth Middleware

- [ ] **RED.** Write failing tests in `apps/api/src/shared/plugins/__tests__/api-key-auth.test.ts`:
  - Missing `x-api-key` header → 401, `API_KEY_REQUIRED`.
  - Malformed key (no `dren_` prefix) → 401, `API_KEY_MALFORMED`.
  - Valid key hash not in DB → 401, `API_KEY_INVALID`.
  - Revoked key → 401, `API_KEY_REVOKED`.
  - Rotated key past expiry → 401, `API_KEY_EXPIRED`.
  - `x-company-id` mismatch → 403, `COMPANY_MISMATCH`.
  - `allowedDomains` restriction → 403, `DOMAIN_NOT_ALLOWED`.
  - Valid active key → injects `TenantContext` into Elysia store with correct `companyId`, `organizationId`, `principal`, `role: 'api_key'`.
  - Acceptance: all test cases defined, expected failures are red.
  - Estimated: ~85 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/shared/plugins/api-key-auth.ts`:
  - Elysia plugin that reads `x-api-key` header, validates `dren_` prefix, hashes the key, queries `api_keys` table for active hash match, validates `x-company-id`, checks `allowedDomains`, injects `TenantContext`, updates `lastUsedAt` asynchronously.
  - Uses `getDb()` from existing persistence layer.
  - Error responses follow external envelope shape (or plain JSON with code + message in PR1; envelope added in PR5a).
  - Acceptance: all tests pass.
  - Estimated: ~80 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: concurrent requests with same key, key with special characters in label, key created by deleted developer. Fix any failures.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

### 1.7 API Feature — Key Management Handlers

- [ ] **RED.** Write failing tests in `apps/api/src/features/dev-platform/api-keys/__tests__/handlers.test.ts`:
  - `createKey`: returns full key (plaintext) exactly once, stores only hash, key prefix matches `dren_` + 8 chars.
  - `listKeys`: returns all keys for authenticated company, never includes full key or hash.
  - `getKey`: returns metadata (id, label, status, prefixes, createdAt) but never full key.
  - `rotateKey`: creates new key, marks old as `rotated` with `expiresAt` = now + 72h, sets `rotatedFrom` link, returns new full key once.
  - `revokeKey`: marks key as `revoked` immediately, records actor + timestamp.
  - `revokeKey` on already-revoked key: returns 409 with appropriate code.
  - Acceptance: all test cases defined and red.
  - Estimated: ~100 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/features/dev-platform/api-keys/handlers.ts`:
  - `createApiKey`, `listApiKeys`, `getApiKey`, `rotateApiKey`, `revokeApiKey` handlers.
  - `createApiKey`: generates key via `generateApiKey()`, stores hash + prefix, returns full key once.
  - `rotateApiKey`: calls `generateApiKey()`, creates row linked to `rotatedFrom`, updates old key status + expiry.
  - `revokeApiKey`: sets status to `revoked`, updates `updatedAt`.
  - All handlers read company from `TenantContext` injected by auth middleware.
  - Acceptance: all handler tests pass.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: rotate a rotated key (should fail), revoke a rotated key (should work), create key with empty label, list keys for company with zero keys. Fix any failures.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

### 1.8 API Feature — Key Management Routes

- [ ] Create `apps/api/src/features/dev-platform/api-keys/routes.ts`:
  - Elysia router with prefix `/api/v1/keys`.
  - `POST /` — create key (label, principal_type in body). Protected by `api-key-auth`.
  - `GET /` — list keys for company. Protected by `api-key-auth`.
  - `GET /:id` — get key metadata. Protected by `api-key-auth`.
  - `POST /:id/rotate` — rotate key. Protected by `api-key-auth`.
  - `POST /:id/revoke` — revoke key. Protected by `api-key-auth`.
  - DELETE not implemented (keys never deleted).
  - Body validation via TypeBox schemas.
  - Acceptance: integration test calls each endpoint with valid auth, verifies response shape + status.
  - Estimated: ~60 lines. <!-- sdd-owner: implementation -->

### 1.9 API Feature — Developer Auth Endpoints

- [ ] **RED.** Write failing tests in `apps/api/src/features/dev-platform/auth/__tests__/routes.test.ts`:
  - `POST /api/dev-auth/register` with valid email + password → 201, account created, verification token generated.
  - `POST /api/dev-auth/register` with duplicate email → 409, `EMAIL_EXISTS`.
  - `POST /api/dev-auth/register` with weak password (< 8 chars) → 400, `VALIDATION_ERROR`.
  - `POST /api/dev-auth/login` with correct credentials (verified) → 200, JWT in httpOnly cookie.
  - `POST /api/dev-auth/login` with unverified account → 403, `EMAIL_NOT_VERIFIED`.
  - `POST /api/dev-auth/login` with wrong password → 401, `INVALID_CREDENTIALS`.
  - `GET /api/dev-auth/verify?token=...` with valid token → 200, account verified.
  - `GET /api/dev-auth/verify?token=...` with expired/missing token → 400/404.
  - Acceptance: all test cases defined and red.
  - Estimated: ~85 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/features/dev-platform/auth/routes.ts`:
  - Elysia router under `/api/dev-auth`.
  - `POST /register`: bcrypt hash password, create `devPortalUsers` row, generate verification token (SHA-256 of random bytes), store hashed token with TTL.
  - `POST /login`: verify password with bcrypt, check `emailVerified`, issue JWT (access 15min + refresh 7d), set httpOnly cookie.
  - `GET /verify`: validate token hash against stored hash, check expiry (< 24h), set `emailVerified = true`, clear token.
  - Acceptance: all auth tests pass.
  - Estimated: ~80 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: login after password change, verify token used twice, registration with missing fields. Ensure bcrypt timing attacks not exploitable. Fix any failures.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

### 1.10 Route Protection Matrix — Add `api-key` Auth Mode

- [ ] Update `apps/api/src/features/security/route-protection/types.ts`: add `"api-key"` to `RouteAuthMode` union.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~3 lines. <!-- sdd-owner: implementation -->

- [ ] Update `apps/api/src/features/security/route-protection/matrix.ts`: add rows for new dev-platform routes with `authMode: "api-key"`, `tenantSource: "x-company-id"`.
  - Acceptance: matrix test verifies new rows.
  - Estimated: ~15 lines. <!-- sdd-owner: implementation -->

### 1.11 API App Registration

- [ ] Update `apps/api/src/app-core.ts`:
  - Import and register `apiKeyAuth` plugin globally (or on specific guard groups).
  - Import and register `apiKeyRoutes`, `devAuthRoutes`.
  - Acceptance: `tsc --noEmit` passes; app starts without errors.
  - Estimated: ~12 lines. <!-- sdd-owner: implementation -->

### PR1 Bounded Review

- [ ] Run `vitest` on all PR1 touched files — all tests pass (green). <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — dominant risk: security/permissions → `review-risk` lens). <!-- sdd-owner: parent -->

---

## PR2: Unified Rate Limiting (~400 lines)

### 2.1 Shared Lib — Rate Limiter Algorithm

- [ ] **RED.** Write failing tests in `packages/shared/src/dev-platform/__tests__/rate-limiter.test.ts`:
  - Sliding window allows exactly `limit` requests and rejects `limit + 1`.
  - Requests outside window boundaries reset correctly.
  - Weighted calculation blends current + previous window proportionally.
  - `getTierConfig('free')` returns `{ requestsPerMinute: 100 }`.
  - `getTierConfig('pro')` returns `{ requestsPerMinute: 1000 }`.
  - `getTierConfig('enterprise')` returns `{ requestsPerMinute: 5000 }`.
  - `getTierConfig('unknown')` falls back to 'free'.
  - In-memory fallback works when Redis client is null.
  - Acceptance: all test cases defined and red.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `packages/shared/src/dev-platform/rate-limiter.ts`:
  - `checkRateLimit(redis, bucket, limit, windowSec)` — sliding window algorithm with Redis pipeline (`INCR` current + `GET` previous), weighted calculation.
  - `DEFAULT_TIERS` constant: free (100/min), pro (1000/min), enterprise (5000/min).
  - `resolveTierLimit(companyId, tierOverride?)` — looks up tier, returns limit.
  - In-memory fallback: `Map<string, { count, window }>` when Redis unavailable.
  - Returns `{ allowed, remaining, reset }`.
  - Acceptance: all tests pass.
  - Estimated: ~60 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: Redis pipeline failure falls back to in-memory, window exactly at boundary, concurrent requests within same ms, zero limit. Fix any failures.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

### 2.2 API Plugin — Unified Rate Limiter

- [ ] **RED.** Write failing tests in `apps/api/src/shared/plugins/__tests__/rate-limiter.test.ts`:
  - `mode: 'external'` enforces per-API-key bucket using `x-api-key` hash as identifier.
  - `mode: 'internal'` with `keyBy: 'session'` enforces per-session bucket.
  - `mode: 'internal'` with `keyBy: 'ip'` enforces per-IP bucket.
  - `bypass` function skips rate limiting when returning true.
  - `customLimit` overrides tier limit.
  - `windowSeconds` uses custom window.
  - Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.
  - 429 response includes `Retry-After` header and `RATE_LIMIT_EXCEEDED` error code.
  - 429 response body follows external envelope `{ error: { code: "RATE_LIMIT_EXCEEDED", ... } }`.
  - Internal traffic with `x-internal: true` bypasses external mode.
  - Acceptance: all test cases defined and red.
  - Estimated: ~90 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/shared/plugins/rate-limiter.ts`:
  - Elysia plugin: `rateLimiter(options)`.
  - Options: `mode` (`'external' | 'internal'`), `keyBy` (`'session' | 'ip'`), `bypass` fn, `customLimit`, `windowSeconds`.
  - External mode: resolves bucket from api key hash in context, tier from company.
  - Internal mode: resolves bucket from session id or IP.
  - Uses `packages/shared/src/dev-platform/rate-limiter.ts` for the algorithm.
  - Sets response headers. Returns 429 on limit exceeded.
  - Uses `getRedisConnection()` singleton for Redis (dev/CI falls back to in-memory).
  - Acceptance: all tests pass.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: rate limiter with no Redis connection (in-memory fallback), nested route groups, multiple rate limiters on different scopes, custom limit of 0 (all requests blocked). Fix any failures.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

### 2.3 Rate Limiter Consolidation — Apply to All Surfaces

- [ ] Audit all 27 surfaces in `apps/api/src/features/security/route-protection/matrix.ts`: mark all 16 `rateLimit: "missing"` surfaces as `rateLimit: "implemented"`. Update notes where appropriate.
  - Acceptance: matrix test passes with updated rows.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

- [ ] Apply `rateLimiter({ mode: 'external' })` to all external-facing route groups in `apps/api/src/app-core.ts`. Apply `rateLimiter({ mode: 'internal' })` to internal-only groups.
  - Acceptance: all 27 surfaces have rate limiting active; integration test verifies rate limit headers on at least 3 different surfaces.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

### 2.4 Remove Deprecated Rate Limiter Files

- [ ] Delete `apps/api/src/middleware/rate-limit.ts`.
  - Acceptance: file removed; `tsc --noEmit` passes after import cleanup.
  - Estimated: ~1 line (removal). <!-- sdd-owner: implementation -->

- [ ] Delete `apps/api/src/middleware/rate-limit.middleware.ts`.
  - Acceptance: file removed; `tsc --noEmit` passes.
  - Estimated: ~1 line (removal). <!-- sdd-owner: implementation -->

- [ ] Delete `apps/api/src/shared/plugins/rate-limiter.ts` (old version).
  - Acceptance: old file removed; imports point to new unified plugin.
  - Estimated: ~1 line (removal). <!-- sdd-owner: implementation -->

- [ ] Delete any SIRE-specific rate limiter middleware file (locate via `grep` for `rate-limit` in `apps/api/src/features/sire/` or similar).
  - Acceptance: no remaining `rate-limit` imports to deprecated files; `tsc --noEmit` passes.
  - Estimated: ~5 lines. <!-- sdd-owner: implementation -->

- [ ] Update any remaining imports that referenced deleted files to use the new unified `apps/api/src/shared/plugins/rate-limiter.ts`.
  - Acceptance: `grep -r "rate-limit" apps/api/src/` shows only references to the new unified plugin; `tsc --noEmit` passes.
  - Estimated: ~15 lines. <!-- sdd-owner: implementation -->

### 2.5 Update Shared Lib Barrel

- [ ] Update `packages/shared/src/dev-platform/index.ts`: export `rate-limiter.ts`.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~2 lines. <!-- sdd-owner: implementation -->

### PR2 Bounded Review

- [ ] Run `vitest` on all PR2 touched files — all tests pass (green). <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — dominant risk: behavior/state/regressions → `review-reliability` lens). <!-- sdd-owner: parent -->

---

## PR3: Webhook Delivery Infrastructure (~500 lines)

### 3.1 Schema — Webhook Registration, Outbox, Deliveries

- [ ] Create `packages/persistence/src/schema/webhook-deliveries.schema.ts`:
  - `webhookRegistrations` Drizzle table: `id` (UUID PK), `companyId` (UUID FK), `url` (varchar 1000), `label` (varchar 255), `eventTypes` (text[]), `secretHash` (varchar 255), `secretPrefix` (varchar 16), `isActive` (boolean default true), `verifiedAt` (timestamptz nullable), `createdBy` (UUID), timestamps.
  - `webhookOutbox` Drizzle table: `id` (UUID PK), `registrationId` (UUID FK), `eventType` (varchar 100), `eventId` (UUID), `payload` (jsonb), `enqueuedAt` (timestamptz nullable), `bullmqJobId` (varchar 255 nullable), `createdAt` (timestamptz default NOW).
  - `webhookDeliveries` Drizzle table: `id` (UUID PK), `outboxId` (UUID FK), `registrationId` (UUID FK), `attemptNumber` (int default 1), `status` (varchar 20: delivered/failed/pending), `requestUrl` (varchar 1000), `responseCode` (int nullable), `responseBody` (text nullable), `latencyMs` (int nullable), `errorMessage` (text nullable), `createdAt` (timestamptz default NOW).
  - Indexes: `idx_webhook_reg_company` on `(companyId, isActive)`, `idx_webhook_outbox_pending` partial on `(enqueuedAt)` WHERE NULL, `idx_webhook_deliveries_reg` on `(registrationId, createdAt DESC)`.
  - Acceptance: `drizzle-kit generate` produces valid migration; schema test inserts/selects all three tables.
  - Estimated: ~90 lines. <!-- sdd-owner: implementation -->

### 3.2 Schema Barrel Export

- [ ] Update `packages/persistence/src/schema/index.ts`: export `webhookRegistrations`, `webhookOutbox`, `webhookDeliveries` from `webhook-deliveries.schema.ts`.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~5 lines. <!-- sdd-owner: implementation -->

### 3.3 Shared Lib — Webhook Signing

- [ ] **RED.** Write failing tests in `packages/shared/src/dev-platform/__tests__/webhook-sign.test.ts`:
  - `signWebhook(payload, secret, timestamp)` returns `t=<unix>,v1=<hmac-hex>`.
  - `verifyWebhook(payload, signatureHeader, secret)` returns true for valid signature.
  - `verifyWebhook` returns false for tampered payload.
  - `verifyWebhook` returns false for wrong secret.
  - `verifyWebhook` returns false for timestamp outside tolerance (default 300s).
  - `verifyWebhook` accepts custom tolerance.
  - `generateWebhookSecret()` returns `whsec_`-prefixed 32-byte base64url secret.
  - Acceptance: all test cases defined and red.
  - Estimated: ~55 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `packages/shared/src/dev-platform/webhook-sign.ts`:
  - `signWebhook(payload, secret, timestamp)`: HMAC-SHA256 of `${timestamp}.${payload}`, format `t=<ts>,v1=<hex>`.
  - `verifyWebhook(payload, header, secret, toleranceSec?)`: parse header, check timestamp tolerance, timing-safe compare.
  - `generateWebhookSecret()`: 32 random bytes, base64url, prefix `whsec_`.
  - `hashWebhookSecret(secret)`: SHA-256 hex for DB storage.
  - Acceptance: all tests pass.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: empty payload, malformed header, header missing timestamp, signature with extra whitespace. Fix any failures.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

### 3.4 Webhook — Event Catalog

- [ ] Create `apps/api/src/features/dev-platform/webhooks/event-catalog.ts`:
  - `WEBHOOK_EVENT_CATALOG` const object: `invoice.created`, `invoice.updated`, `invoice.status_changed`, `siro.status_changed`, `connection.activated`, `connection.error`.
  - Each entry: `description`, `payloadSchema` (TypeBox reference), `category`.
  - `getEventCatalog()` returns the catalog.
  - `isValidEventType(type)` validates against catalog keys.
  - Acceptance: catalog test verifies all 6 events defined with correct types.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

### 3.5 Webhook — Registration Handlers

- [ ] **RED.** Write failing tests in `apps/api/src/features/dev-platform/webhooks/__tests__/handlers.test.ts`:
  - `registerWebhook`: creates registration, returns `whsec_` secret once, stores hashed secret.
  - `registerWebhook` with invalid event type → 400, `INVALID_EVENT_TYPE`.
  - `listWebhooks`: returns all registrations for company, never exposes secret.
  - `getWebhook`: returns single registration with metadata, delivery stats.
  - `updateWebhook`: updates URL, event types, or label; returns updated registration.
  - `deleteWebhook`: marks as `isActive = false`, cancels pending deliveries.
  - `verifyWebhookEndpoint`: sends ping with challenge, marks `verifiedAt` on success.
  - Acceptance: all test cases defined and red.
  - Estimated: ~90 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/features/dev-platform/webhooks/handlers.ts`:
  - `registerWebhook`, `listWebhooks`, `getWebhook`, `updateWebhook`, `deleteWebhook`, `verifyEndpoint`.
  - `registerWebhook`: generates secret via `generateWebhookSecret()`, stores hash + prefix, validates event types against catalog.
  - `verifyEndpoint`: sends POST with event type `webhook.verification`, challenge token in payload, expects 200 + challenge echo within 10s.
  - All scoped to company via `TenantContext`.
  - Acceptance: all handler tests pass.
  - Estimated: ~90 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: register webhook with duplicate URL + event types, verify already-verified webhook, delete already-inactive webhook. Fix any failures.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

### 3.6 Webhook — Routes

- [ ] Create `apps/api/src/features/dev-platform/webhooks/routes.ts`:
  - Elysia router with prefix `/api/v1/webhooks`.
  - `POST /` — register webhook (url, label, event_types). Protected by `api-key-auth`.
  - `GET /` — list webhooks for company.
  - `GET /:id` — get webhook with delivery stats.
  - `PATCH /:id` — update webhook.
  - `DELETE /:id` — deactivate webhook.
  - `POST /:id/verify` — verify endpoint.
  - `GET /:id/deliveries` — list delivery attempts with filters (date range, status).
  - `POST /:id/deliveries/:deliveryId/replay` — replay failed delivery.
  - Body validation via TypeBox schemas.
  - Acceptance: integration test calls each endpoint, validates response shape.
  - Estimated: ~65 lines. <!-- sdd-owner: implementation -->

### 3.7 Webhook — Delivery Worker (BullMQ)

- [ ] **RED.** Write failing tests in `apps/api/src/features/dev-platform/webhooks/__tests__/delivery-worker.test.ts`:
  - Worker picks up job from `webhook-delivery` queue.
  - Sends HTTP POST to webhook URL with JSON payload (event type, event ID, timestamp, data).
  - Request includes `X-Drenyra-Signature` header with HMAC signature.
  - On HTTP 200: logs delivery as `delivered` with response code + latency.
  - On HTTP 500: logs as `failed`, schedules retry with correct backoff step.
  - On 7th failure: marks as permanently `failed`, does not retry further.
  - Backoff sequence: 1min, 5min, 15min, 1h, 6h, 24h.
  - Acceptance: all test cases defined and red.
  - Estimated: ~65 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/features/dev-platform/webhooks/delivery-worker.ts`:
  - BullMQ Worker on `webhook-delivery` queue.
  - On job: parse outbox row, sign payload, HTTP POST with `fetch()`, record delivery attempt in `webhookDeliveries` table.
  - On success: status `delivered`.
  - On failure: increment `attemptNumber`, check if < 7, schedule retry with `RETRY_BACKOFF[attemptNumber - 1]` delay; otherwise mark permanently failed.
  - Uses `getRedisConnection()` for queue connection.
  - Acceptance: all worker tests pass.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: webhook URL timeout, DNS resolution failure, non-JSON response body, concurrent deliveries for same registration. Fix any failures.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

### 3.8 Webhook — Outbox Relay

- [ ] Create `apps/api/src/features/dev-platform/webhooks/outbox-relay.ts`:
  - Polls `webhookOutbox` every 5 seconds for rows with `enqueuedAt IS NULL`.
  - Enqueues each to BullMQ `webhook-delivery` queue, sets `enqueuedAt` + `bullmqJobId`.
  - Runs as a setInterval in the API process (or separate entry point for production).
  - Idempotent: checks `bullmqJobId` before enqueueing to prevent duplicates.
  - Acceptance: integration test writes outbox row, waits for relay to pick it up, verifies BullMQ job exists.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

### 3.9 API App Registration

- [ ] Update `apps/api/src/app-core.ts`:
  - Import and register `webhookRoutes`.
  - Start outbox relay on app startup (guarded by env flag or process role).
  - Acceptance: `tsc --noEmit` passes; webhook endpoints reachable.
  - Estimated: ~10 lines. <!-- sdd-owner: implementation -->

### 3.10 Route Protection Matrix

- [ ] Update `apps/api/src/features/security/route-protection/matrix.ts`: add rows for webhook routes with `authMode: "api-key"`.
  - Acceptance: matrix test passes.
  - Estimated: ~8 lines. <!-- sdd-owner: implementation -->

### PR3 Bounded Review

- [ ] Run `vitest` on all PR3 touched files — all tests pass (green). <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — dominant risk: shell/process integration + partial failures → `review-resilience` lens). <!-- sdd-owner: parent -->

---

## PR4: SDK Generation Pipeline (~400 lines)

### 4.1 OpenAPI Spec Generator

- [ ] **RED.** Write failing tests in `apps/api/scripts/__tests__/generate-openapi.test.ts`:
  - Script walks all registered Elysia routes.
  - Extracts TypeBox schemas via Elysia introspection.
  - Generates valid OpenAPI 3.1 JSON.
  - Output includes all tags, endpoints, request/response schemas, and error codes.
  - Output is deterministic (same routes → same JSON).
  - Output validates against OpenAPI 3.1 schema.
  - Acceptance: all test cases defined and red.
  - Estimated: ~45 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/scripts/generate-openapi.ts`:
  - Uses `@elysiajs/swagger` or manual Elysia route introspection to extract schemas.
  - Generates OpenAPI 3.1 spec with `openapi: "3.1.0"`, `info`, `servers`, `paths`, `components.schemas`.
  - Writes to `packages/api-client/openapi.json` (committed snapshot).
  - Handles TypeBox → JSON Schema conversion.
  - Acceptance: script runs, produces valid `openapi.json`.
  - Estimated: ~65 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: routes with no TypeBox schema, routes with union types, routes with nested objects. Ensure all generate correct OpenAPI. Fix any failures.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

### 4.2 SDK Package Scaffold

- [ ] Create `packages/api-client/package.json`:
  - `name: "@drenyra/api-client"`, `version: "0.1.0"`, `license: "MIT"`.
  - `exports` field with tree-shakeable ESM + CJS paths.
  - `devDependencies`: `tsup`, `typescript`, `vitest`, `@hey-api/openapi-ts` (or `openapi-typescript`).
  - `scripts`: `build`, `codegen`, `test`, `check`.
  - Acceptance: `bun install` succeeds; package is part of monorepo workspaces.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/tsconfig.json`: strict mode, ESM module resolution, path aliases.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~15 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/tsup.config.ts`: ESM + CJS dual output, tree-shakeable, sourcemaps.
  - Acceptance: `bun run build` produces `dist/` with both ESM and CJS.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/LICENSE`: MIT license text.
  - Acceptance: file exists, contains MIT license.
  - Estimated: ~5 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/README.md`: usage examples, installation, quickstart.
  - Acceptance: README renders correctly on npm.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

### 4.3 SDK Codegen Configuration

- [ ] Create `packages/api-client/codegen.config.ts`: `@hey-api/openapi-ts` configuration pointing to `openapi.json`, output to `src/`, per-tag barrel exports.
  - Acceptance: `bun run codegen` generates per-domain modules under `src/`.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/scripts/codegen.ts`: CI entry that runs codegen from committed `openapi.json`.
  - Acceptance: script runs without error and regenerates `src/`.
  - Estimated: ~10 lines. <!-- sdd-owner: implementation -->

### 4.4 SDK Core — Client Class

- [ ] **RED.** Write failing tests in `packages/api-client/test/client.test.ts`:
  - `new DrenyraClient({ apiKey, companyId })` stores credentials.
  - `client.request('GET', '/api/v1/invoices')` sends request with `x-api-key` and `x-company-id` headers.
  - `client.invoices.list()` delegates to generated method.
  - `client.invoices.get('inv_123')` delegates with path param.
  - On 401: throws `DrenyraError` with code `API_KEY_INVALID`.
  - On 429: throws `DrenyraError` with code `RATE_LIMIT_EXCEEDED` and `retryAfter` in ms.
  - `client.request` with `timeout` option aborts after timeout.
  - Acceptance: all test cases defined and red.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `packages/api-client/src/core/client.ts`:
  - `DrenyraClient` class: constructor takes `apiKey`, `companyId`, optional `baseUrl`, `timeout`, `retries`.
  - `request(method, path, options?)` — wrapped `fetch` with auth headers, timeout via `AbortController`, retry on idempotent methods.
  - Domain getters: `invoices`, `banking`, `ledger`, etc. — each returns typed methods.
  - Acceptance: all client tests pass.
  - Estimated: ~55 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/src/core/errors.ts`:
  - `DrenyraError` class: `code`, `status`, `requestId`, `retryAfter?`.
  - `ApiKeyError`, `RateLimitError`, `NotFoundError` subclasses.
  - Acceptance: error tests pass.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/src/core/types.ts`: shared types (`TenantContext`, `ApiResponse`, `ApiError`).
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/src/core/fetch.ts`: wrapped `fetch` with default headers, error mapping from response to `DrenyraError`.
  - Acceptance: fetch tests pass.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `packages/api-client/src/index.ts`: main entry exporting `DrenyraClient`, error classes, types.
  - Acceptance: consumer can `import { DrenyraClient } from '@drenyra/api-client'`.
  - Estimated: ~8 lines. <!-- sdd-owner: implementation -->

### 4.5 SDK CI Integration

- [ ] Create `.github/workflows/sdk-check.yml`:
  - On PR: generate OpenAPI spec, run codegen, check `git diff --exit-code packages/api-client/src/` (fail if stale), run SDK tests with `vitest`.
  - Acceptance: CI passes on valid PR, fails on stale SDK.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

### 4.6 OpenAPI Spec — Commit Snapshot

- [ ] Run `bun run apps/api/scripts/generate-openapi.ts` and commit `packages/api-client/openapi.json`.
  - Acceptance: `openapi.json` is in git and valid OpenAPI 3.1.
  - Estimated: ~1 line (commit). <!-- sdd-owner: implementation -->

### PR4 Bounded Review

- [ ] Run `vitest` on all SDK tests — all tests pass (green). <!-- sdd-owner: implementation -->
- [ ] Run `bun run build` for `@drenyra/api-client` — builds without errors. <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — dominant risk: naming/maintainability → `review-readability` lens). <!-- sdd-owner: parent -->

---

## PR5a: External Envelope + API Versioning (~250 lines)

### 5a.1 Shared Lib — External Envelope

- [ ] **RED.** Write failing tests in `packages/shared/src/dev-platform/__tests__/envelope.test.ts`:
  - `wrapSuccess(response, requestId)` returns `{ data, meta: { requestId, timestamp } }`.
  - `wrapSuccess` does not double-wrap already-enveloped responses.
  - `wrapError(code, message, requestId)` returns `{ error: { code, message, requestId } }`.
  - `mapToPublicError('INVOICE_NOT_FOUND')` returns `{ code: 'INVOICE_NOT_FOUND', status: 404 }`.
  - `mapToPublicError('UNKNOWN_CODE')` returns `{ code: 'INTERNAL_ERROR', status: 500 }` (never leaks internal details).
  - `ERROR_CODE_MAP` contains all documented public error codes.
  - Acceptance: all test cases defined and red.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `packages/shared/src/dev-platform/envelope.ts`:
  - `wrapSuccess(data, requestId)`, `wrapError(error, requestId)`.
  - `ERROR_CODE_MAP` with all 13+ public error codes mapped to HTTP status.
  - `mapToPublicError(internalCode)`: looks up public code, falls back to `INTERNAL_ERROR`.
  - Acceptance: all tests pass.
  - Estimated: ~45 lines. <!-- sdd-owner: implementation -->

### 5a.2 API Plugin — External Envelope

- [ ] **RED.** Write failing tests in `apps/api/src/shared/plugins/__tests__/external-envelope.test.ts`:
  - Plugin wraps successful response in `{ data, meta }` envelope.
  - Plugin wraps error response in `{ error }` envelope.
  - Plugin maps internal error codes to public codes.
  - Plugin never exposes stack traces or internal error details.
  - Plugin does not double-wrap responses that are already in external format.
  - Plugin adds `requestId` to meta.
  - Acceptance: all test cases defined and red.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/shared/plugins/external-envelope.ts`:
  - Elysia plugin using `onAfterHandle` and `onError` hooks.
  - `onAfterHandle`: wrap response in `{ data, meta }` unless already wrapped.
  - `onError`: map error to public code, return `{ error }` envelope.
  - Uses `packages/shared/src/dev-platform/envelope.ts`.
  - Acceptance: all tests pass.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: handler throws non-Error object, response is a string, response is null, error with custom status code. Fix any failures.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

### 5a.3 API Plugin — API Versioning

- [ ] **RED.** Write failing tests in `apps/api/src/shared/plugins/__tests__/api-versioning.test.ts`:
  - `apiVersion({ version: 1 })` sets `API-Version: 1` response header.
  - `apiVersion({ version: 1, deprecated: true, sunsetDate, successorPath })` sets `Deprecation: true`, `Sunset: <date>`, `Link: <path>; rel="successor-version"`.
  - `sunsetGuard(sunsetDate)` returns 410 when current date > sunsetDate with `API_VERSION_SUNSET` error.
  - `sunsetGuard(sunsetDate)` passes through when current date < sunsetDate.
  - Unversioned endpoint at `/api/endpoint` (no `/vN/`) returns 308 redirect or 400 `API_VERSION_REQUIRED`.
  - Acceptance: all test cases defined and red.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/shared/plugins/api-versioning.ts`:
  - `apiVersion(options)`: Elysia plugin that sets version headers.
  - `sunsetGuard(sunsetDate)`: `onBeforeHandle` that checks date and returns 410 if passed.
  - `redirectUnversioned()`: middleware that sends 308 redirect from `/api/resource` to `/api/v1/resource` (or 400 for legacy paths).
  - Acceptance: all tests pass.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: sunset exactly at boundary, multiple versions running simultaneously, version header on error responses. Fix any failures.
  - Estimated: ~15 lines. <!-- sdd-owner: implementation -->

### 5a.4 API App Registration

- [ ] Update `apps/api/src/app-core.ts`:
  - Register `externalEnvelope()` globally for all external-facing routes.
  - Register `apiVersion({ version: 1 })` on the `/api/v1` prefix group.
  - Acceptance: all API responses use external envelope; `API-Version: 1` header present.
  - Estimated: ~8 lines. <!-- sdd-owner: implementation -->

### 5a.5 Update Shared Lib Barrel

- [ ] Update `packages/shared/src/dev-platform/index.ts`: export `envelope.ts`.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~2 lines. <!-- sdd-owner: implementation -->

### PR5a Bounded Review

- [ ] Run `vitest` on all PR5a touched files — all tests pass (green). <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — dominant risk: behavior/state → `review-reliability` lens). <!-- sdd-owner: parent -->

---

## PR5b: Usage Analytics (~300 lines)

### 5b.1 Schema — `usage_events` + Materialized View

- [ ] Create `packages/persistence/src/schema/usage-analytics.schema.ts`:
  - `usageEvents` Drizzle table: `id` (bigserial PK), `apiKeyId` (UUID FK), `companyId` (UUID), `endpoint` (varchar 500), `method` (varchar 10), `statusCode` (int), `latencyMs` (int), `requestId` (UUID), `timestamp` (timestamptz default NOW).
  - Indexes: `idx_usage_events_key_time` on `(apiKeyId, timestamp DESC)`, `idx_usage_events_company_time` on `(companyId, timestamp DESC)`.
  - Raw SQL for `usage_hourly` materialized view with `p50`, `p95`, `p99` percentiles via `percentile_cont`.
  - Acceptance: `drizzle-kit generate` produces migration; raw SQL for mat view included as migration step.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

### 5b.2 Schema Barrel Export

- [ ] Update `packages/persistence/src/schema/index.ts`: export `usageEvents` from `usage-analytics.schema.ts`.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~3 lines. <!-- sdd-owner: implementation -->

### 5b.3 API Plugin — Usage Tracker

- [ ] **RED.** Write failing tests in `apps/api/src/shared/plugins/__tests__/usage-tracker.test.ts`:
  - Plugin fires async insert to `usageEvents` after response, without blocking the response.
  - Plugin records `endpoint`, `method`, `statusCode`, `latencyMs`, `requestId`, `apiKeyId`, `companyId`.
  - Plugin uses in-memory buffer when batch size not yet reached (flush on interval or size threshold).
  - Plugin handles DB write failure gracefully (logs error, does not crash request).
  - Plugin skips internal traffic (no `x-api-key` header).
  - Acceptance: all test cases defined and red.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/shared/plugins/usage-tracker.ts`:
  - Elysia plugin that wraps `onAfterHandle` to record metrics.
  - Non-blocking: fires `insert` via `setImmediate` or microtask.
  - Buffer: collects events in-memory, flushes every 5s or when buffer reaches 100 events.
  - Skips internal requests (no api key in context).
  - Graceful degradation: logs DB write errors, never throws.
  - Acceptance: all tests pass.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

- [ ] **TRIANGULATE.** Add edge-case tests: buffer flush during concurrent requests, buffer flush on process shutdown, DB connection lost mid-flush. Fix any failures.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

### 5b.4 Analytics — API Endpoints

- [ ] **RED.** Write failing tests in `apps/api/src/features/dev-platform/analytics/__tests__/routes.test.ts`:
  - `GET /api/v1/analytics/overview`: returns total requests, error rate (4xx%, 5xx%), p95 latency for last 24h.
  - `GET /api/v1/analytics/volume?range=7d&granularity=hour`: returns time-series array of `{ timestamp, count }`.
  - `GET /api/v1/analytics/errors?range=7d`: returns breakdown by endpoint + status code.
  - `GET /api/v1/analytics/latency?range=7d`: returns `{ timestamp, p50, p95, p99 }` time series.
  - `GET /api/v1/analytics/quota`: returns `{ used, limit, percentage, tier }`.
  - Analytics scoped to the authenticated API key's `apiKeyId` (not company-wide by default).
  - `range` param supports `24h`, `7d`, `30d`.
  - Acceptance: all test cases defined and red.
  - Estimated: ~60 lines. <!-- sdd-owner: implementation -->

- [ ] **GREEN.** Create `apps/api/src/features/dev-platform/analytics/routes.ts`:
  - Elysia router under `/api/v1/analytics`.
  - All endpoints protected by `api-key-auth`.
  - Queries `usage_hourly` materialized view for fast reads.
  - Falls back to `usageEvents` table for ranges within the last refresh window.
  - Quota endpoint: reads rate limit tier, computes current window usage %.
  - `packages/shared/src/dev-platform/analytics.ts` for metric types.
  - Acceptance: all analytics tests pass.
  - Estimated: ~55 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/api/src/features/dev-platform/analytics/queries.ts`:
  - `getOverview(apiKeyId, range)`, `getVolumeSeries(apiKeyId, range, granularity)`, `getErrorBreakdown(apiKeyId, range)`, `getLatencySeries(apiKeyId, range)`.
  - SQL query builders for each analytics endpoint.
  - Acceptance: query tests return expected shapes.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

### 5b.5 Shared Lib — Analytics Types

- [ ] Create `packages/shared/src/dev-platform/analytics.ts`:
  - TypeScript types: `UsageOverview`, `VolumeDataPoint`, `ErrorBreakdown`, `LatencyDataPoint`, `QuotaStatus`.
  - `RETENTION_DAYS` constant: free=90, pro=365, enterprise=∞.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

### 5b.6 API App Registration

- [ ] Update `apps/api/src/app-core.ts`:
  - Register `usageTracker()` plugin on external routes.
  - Register `analyticsRoutes`.
  - Acceptance: `tsc --noEmit` passes; analytics endpoints reachable.
  - Estimated: ~6 lines. <!-- sdd-owner: implementation -->

### 5b.7 Route Protection Matrix

- [ ] Update `apps/api/src/features/security/route-protection/matrix.ts`: add rows for analytics routes.
  - Acceptance: matrix test passes.
  - Estimated: ~5 lines. <!-- sdd-owner: implementation -->

### PR5b Bounded Review

- [ ] Run `vitest` on all PR5b touched files — all tests pass (green). <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — dominant risk: security/data exposure → `review-risk` lens). <!-- sdd-owner: parent -->

---

## PR5c: Developer Portal Foundation (~500 lines)

### 5c.1 Portal App Scaffold

- [ ] Create `apps/dev-portal/package.json`:
  - Next.js 14 App Router, React 19, Tailwind CSS 4, TypeScript strict.
  - `scripts`: `dev`, `build`, `start`, `lint`, `check`.
  - Depends on `@drenyra/api-client` for dashboard API calls.
  - Acceptance: `bun install` succeeds; `bun run dev` starts Next.js dev server.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/next.config.ts`: transpilePackages for `@drenyra/api-client`, images config, env vars.
  - Acceptance: Next.js builds without errors.
  - Estimated: ~15 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/tailwind.config.ts`: extend project design tokens (Glass & Steel).
  - Acceptance: Tailwind compiles with project tokens.
  - Estimated: ~10 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/tsconfig.json`: extends monorepo base, Next.js paths.
  - Acceptance: `tsc --noEmit` passes.
  - Estimated: ~10 lines. <!-- sdd-owner: implementation -->

### 5c.2 Portal — Root Layout + Navigation

- [ ] Create `apps/dev-portal/src/app/layout.tsx`:
  - Root layout with `<html>`, `<body>`, metadata, font loading.
  - Includes `<Navbar />` and `<Footer />` from components.
  - Theme provider (dark/light).
  - Acceptance: renders without errors; navigation visible.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/layout/Navbar.tsx`:
  - Links: Home, Getting Started, API Reference, Docs, Playground, Dashboard, Changelog.
  - Auth state: Login/Register or Dashboard (based on session).
  - Mobile responsive.
  - Acceptance: all links resolve correctly; auth state toggles.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/layout/Footer.tsx`:
  - Copyright, links to docs, GitHub, status page.
  - Acceptance: renders on all pages.
  - Estimated: ~15 lines. <!-- sdd-owner: implementation -->

### 5c.3 Portal — Home Page

- [ ] Create `apps/dev-portal/src/app/page.tsx`:
  - Hero section: headline ("Build on Drenyra"), subtitle, CTA ("Get Started" → /getting-started, "API Reference" → /api-reference).
  - Features section: API Keys, Webhooks, SDK, Rate Limiting — 4 cards with icons.
  - Quickstart code snippet (TypeScript, 5 lines using SDK).
  - Acceptance: renders hero, features, and snippet; CTAs navigate correctly.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

### 5c.4 Portal — Getting Started Page

- [ ] Create `apps/dev-portal/src/app/getting-started/page.tsx`:
  - Step-by-step guide: 1) Create account, 2) Generate API key, 3) First curl call, 4) Install SDK, 5) First SDK call, 6) Subscribe to webhook.
  - Each step has copy-pasteable code snippets in curl + TypeScript.
  - Embedded playground widget for "Try it" links.
  - Acceptance: renders all 6 steps; code snippets copy correctly.
  - Estimated: ~65 lines. <!-- sdd-owner: implementation -->

### 5c.5 Portal — API Reference Page

- [ ] Create `apps/dev-portal/src/app/api-reference/page.tsx`:
  - Fetches live OpenAPI spec from API server (`GET /api/openapi.json` or committed snapshot fallback).
  - Renders interactive documentation using `@scalar/api-reference` React component or `swagger-ui-react`.
  - Groups endpoints by domain (invoices, banking, ledger, etc.).
  - Each endpoint shows method, path, parameters table, request/response schema, example values.
  - Acceptance: renders OpenAPI docs interactively; endpoint groups present.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/api-reference/[[...slug]]/page.tsx`:
  - Per-endpoint detail page with deep linking.
  - "Try it" button links to playground with endpoint pre-loaded.
  - Acceptance: deep links work; playground link pre-fills endpoint.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/api-reference/EndpointCard.tsx`:
  - Card component: method badge (colored), path, summary, expandable details.
  - Acceptance: renders endpoint info correctly.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/api-reference/SchemaViewer.tsx`:
  - Renders JSON Schema as collapsible tree.
  - Acceptance: renders nested schema structures.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/api-reference/CodeSample.tsx`:
  - Tabbed code samples: curl, TypeScript, Go, Python.
  - Syntax highlighting via Shiki or Prism.
  - Acceptance: renders with correct language highlighting.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

### 5c.6 Portal — SDK Docs + Webhooks Guide

- [ ] Create `apps/dev-portal/src/app/docs/sdk/page.tsx`:
  - SDK installation (`npm install @drenyra/api-client`), initialization, domain access, error handling, timeout/retry configuration.
  - Full code examples for common patterns.
  - Links to npm package and GitHub repo.
  - Acceptance: renders SDK docs with working code examples.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/docs/webhooks/page.tsx`:
  - Webhooks overview: what they are, how to subscribe, signature verification, retry behavior.
  - Event catalog table: event type, description, payload schema, example payload.
  - Verification code snippet in TypeScript.
  - Acceptance: renders event catalog with all 6 initial events.
  - Estimated: ~45 lines. <!-- sdd-owner: implementation -->

### 5c.7 Portal — Changelog Page

- [ ] Create `apps/dev-portal/src/app/changelog/page.tsx`:
  - Reads changelog from committed JSON or static file.
  - Grouped by version, sorted by date descending.
  - Each entry: date, version, change type badge (added/modified/deprecated/removed), description, affected endpoints.
  - Breaking changes highlighted with migration guide links.
  - Acceptance: renders version-grouped changelog with correct entries.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

### 5c.8 Portal — Auth Pages

- [ ] Create `apps/dev-portal/src/app/auth/login/page.tsx`:
  - Email + password form.
  - POSTs to `/api/dev-auth/login`.
  - On success: redirect to `/dashboard`.
  - On error: display error message.
  - Link to register page.
  - Acceptance: form validates, login works end-to-end.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/auth/register/page.tsx`:
  - Email + password + name + company name form.
  - POSTs to `/api/dev-auth/register`.
  - On success: "Check your email" message.
  - On error: display validation errors.
  - Acceptance: form validates, registration works end-to-end.
  - Estimated: ~45 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/auth/verify/page.tsx`:
  - Reads `token` query param, sends to `/api/dev-auth/verify`.
  - On success: "Email verified" + redirect to dashboard.
  - On error: "Invalid or expired link" + resend option.
  - Acceptance: verification flow works end-to-end.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/lib/auth.ts`:
  - Auth config: cookie name, auth API base URL, session helpers.
  - `getSession()`, `login(email, password)`, `register(...)`, `logout()`.
  - Acceptance: auth helpers work in browser context.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/api/auth/[...nextauth]/route.ts` (or custom auth route):
  - API route for NextAuth.js or custom JWT session handling.
  - Acceptance: auth route handles login/logout/session.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

### 5c.9 Portal — Dashboard Layout

- [ ] Create `apps/dev-portal/src/app/dashboard/layout.tsx`:
  - Auth gate: redirect to `/auth/login` if no session.
  - Sidebar with `<DashboardSidebar />`: Overview, API Keys, Webhooks, Usage.
  - Content area.
  - Acceptance: redirects unauthenticated users; sidebar renders.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/layout/DashboardSidebar.tsx`:
  - Navigation links with active state.
  - User info: email, company name, logout button.
  - Acceptance: active link highlighted; logout clears session.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

### 5c.10 Portal — Dashboard Pages (Skeleton)

- [ ] Create `apps/dev-portal/src/app/dashboard/page.tsx`:
  - Overview: API key count, webhook count, quick usage summary (requests today, error rate).
  - Quick links to create key, register webhook.
  - Acceptance: renders stats and quick actions.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/dashboard/api-keys/page.tsx`:
  - Lists API keys: label, prefix, status badge, created date, last used.
  - "Create Key" button → modal with label + principal type fields → shows full key once.
  - "Rotate" and "Revoke" actions per key.
  - Uses `@drenyra/api-client` or direct `fetch` to `/api/v1/keys`.
  - Acceptance: lists keys, create/rotate/revoke works end-to-end.
  - Estimated: ~60 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/dashboard/webhooks/page.tsx`:
  - Lists webhook registrations: URL, label, events, status, last delivery.
  - "Register Webhook" button → modal with URL, label, event type checkboxes.
  - Delivery history table per webhook (expand row).
  - Dead letter queue: failed deliveries with "Replay" button.
  - Uses API to `/api/v1/webhooks`.
  - Acceptance: CRUD works; delivery history shows.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/app/dashboard/usage/page.tsx`:
  - Time-series chart of request volume (last 24h default, 7d, 30d selectable).
  - Error rate panel with breakdown.
  - Latency chart: p50, p95, p99.
  - Quota gauge: current % of tier limit.
  - Uses API to `/api/v1/analytics`.
  - Acceptance: charts render with data; range selector works.
  - Estimated: ~70 lines. <!-- sdd-owner: implementation -->

### 5c.11 Portal — API Client Lib

- [ ] Create `apps/dev-portal/src/lib/api-client.ts`:
  - Browser-side API client helper: reads API key from session/localStorage, sets headers.
  - `portalApi.get(path)`, `portalApi.post(path, body)` wrappers.
  - Error handling: maps API error codes to user-friendly messages.
  - Acceptance: helper functions work; headers include api key.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

### 5c.12 Portal — Shared UI Components

- [ ] Create basic UI primitives under `apps/dev-portal/src/components/ui/`:
  - `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `Tabs.tsx`.
  - Uses Glass & Steel design tokens.
  - Acceptance: components render with correct styles.
  - Estimated: ~100 lines total. <!-- sdd-owner: implementation -->

### 5c.13 Portal — Dashboard Components

- [ ] Create `apps/dev-portal/src/components/dashboard/ApiKeyCard.tsx`:
  - Card showing key prefix, label, status badge, created date, actions (rotate, revoke).
  - "Reveal" toggle for newly created keys (shows full key with copy button).
  - Acceptance: renders key info; actions fire API calls.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/dashboard/UsageChart.tsx`:
  - Time-series area chart for request volume (using recharts or similar).
  - Toggle between 24h, 7d, 30d.
  - Acceptance: chart renders with data; toggle changes range.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/dashboard/WebhookDeliveryRow.tsx`:
  - Row showing event type, timestamp, status badge, response code, latency.
  - Expandable for payload + response body.
  - Acceptance: renders delivery info; expands on click.
  - Estimated: ~25 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/dashboard/QuotaGauge.tsx`:
  - Circular gauge showing usage % with color (green <80%, yellow <95%, red >95%).
  - Current count / limit label.
  - Acceptance: renders with correct percentage and color.
  - Estimated: ~20 lines. <!-- sdd-owner: implementation -->

### 5c.14 Portal — OpenAPI Utils

- [ ] Create `apps/dev-portal/src/lib/openapi.ts`:
  - `fetchOpenApiSpec()`: fetches live spec from API server, falls back to bundled `openapi.json`.
  - `getEndpoints(spec)`: extracts all endpoints grouped by tag.
  - `getSchema(spec, ref)`: resolves `$ref` to schema object.
  - Acceptance: fetches and parses spec; endpoints extract correctly.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

### PR5c Bounded Review

- [ ] Run `bun run build` for `apps/dev-portal` — builds without errors. <!-- sdd-owner: implementation -->
- [ ] Run `bun run lint` — no lint errors. <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — >400 lines but pure human documentation + UI → `review-readability` lens for code; portal pages that are docs-only are low risk). <!-- sdd-owner: parent -->

---

## PR5d: API Playground (~150 lines)

### 5d.1 Playground Page

- [ ] Create `apps/dev-portal/src/app/playground/page.tsx`:
  - Layout: endpoint selector (left), request builder (center), response viewer (right).
  - URL-encodable state: `?method=GET&path=/api/v1/invoices&companyId=...`.
  - Reads API key from session/localStorage (auto-fill header).
  - Banner when no API key: "You need an API key" with link to `/dashboard/api-keys`.
  - Acceptance: renders playground layout; URL params pre-fill fields.
  - Estimated: ~50 lines. <!-- sdd-owner: implementation -->

### 5d.2 Playground Components

- [ ] Create `apps/dev-portal/src/components/playground/PlaygroundEditor.tsx`:
  - Method selector dropdown (GET/POST/PUT/PATCH/DELETE).
  - Path input field.
  - Send button with loading state.
  - Acceptance: method + path selectable; send triggers request.
  - Estimated: ~30 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/playground/RequestBuilder.tsx`:
  - Path params: key-value input pairs.
  - Query params: key-value input pairs (add/remove).
  - Headers: key-value with `x-api-key` auto-filled.
  - Body: JSON editor using CodeMirror or simple textarea with syntax highlighting.
  - Acceptance: params and body editable; values included in request.
  - Estimated: ~40 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/playground/ResponseViewer.tsx`:
  - Status badge (colored by range: 2xx green, 4xx yellow, 5xx red).
  - Headers tab (collapsible table).
  - Body tab (syntax-highlighted JSON).
  - Latency display (ms).
  - Acceptance: response renders with status, headers, body, latency.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

- [ ] Create `apps/dev-portal/src/components/playground/CodeSnippetTabs.tsx`:
  - Tabs: curl, TypeScript, Go, Python.
  - Generates equivalent code snippet from request state.
  - Copy button per tab.
  - Acceptance: all 4 languages render; copy works.
  - Estimated: ~35 lines. <!-- sdd-owner: implementation -->

### 5d.3 CORS Configuration

- [ ] Update API CORS config (locate in `apps/api/src/app-core.ts` or similar) to allow `developers.drenyra.com` origin for playground direct requests.
  - Acceptance: playground can send fetch requests to API without CORS errors.
  - Estimated: ~5 lines. <!-- sdd-owner: implementation -->

### PR5d Bounded Review

- [ ] Run `bun run build` for `apps/dev-portal` — builds without errors. <!-- sdd-owner: implementation -->
- [ ] Verify playground sends request to API and displays response (manual smoke test or E2E). <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review (standard diff — <400 lines, UI + fetch → `review-readability` lens). <!-- sdd-owner: parent -->

---

## Cross-Cutting: Final Integration Verification

After all PRs are merged:

- [ ] Run full `vitest` suite — all tests pass (green). <!-- sdd-owner: implementation -->
- [ ] Run `tsc --noEmit` on the entire monorepo — no type errors. <!-- sdd-owner: implementation -->
- [ ] Run `bun run build` for `@drenyra/api-client` — builds successfully. <!-- sdd-owner: implementation -->
- [ ] Run `bun run build` for `apps/dev-portal` — builds successfully. <!-- sdd-owner: implementation -->
- [ ] Verify the end-to-end developer journey: register → verify email → create API key → call API → view usage → register webhook → receive webhook delivery. <!-- sdd-owner: implementation -->
- [ ] Run `apps/api/scripts/generate-openapi.ts` and confirm `openapi.json` matches SDK expectations. <!-- sdd-owner: implementation -->
- [ ] Run `bun run codegen` in `packages/api-client` and confirm `git diff --exit-code`. <!-- sdd-owner: implementation -->

---

## Task Summary

| PR        | Capability            | Est. Lines | Files         | Key Risk                          |
| --------- | --------------------- | ---------- | ------------- | --------------------------------- |
| PR1       | API Keys + Dev Auth   | ~350       | 11            | API key leak (HIGH)               |
| PR2       | Unified Rate Limiting | ~400       | 5 (4 deleted) | Internal traffic blocked (MEDIUM) |
| PR3       | Webhook Delivery      | ~500       | 8             | Missed deliveries (MEDIUM)        |
| PR4       | SDK Generation        | ~400       | 11            | SDK falls out of sync (LOW)       |
| PR5a      | Envelope + Versioning | ~250       | 4             | Breaking internal contracts (LOW) |
| PR5b      | Usage Analytics       | ~300       | 6             | DB performance (LOW)              |
| PR5c      | Developer Portal      | ~500       | 27            | Auth vulnerability (MEDIUM)       |
| PR5d      | API Playground        | ~150       | 5             | CORS misconfiguration (LOW)       |
| **Total** |                       | **~2,850** | **~77**       |                                   |

---

## Next Recommended

`apply` — Begin PR1: API Key Management + Developer Auth.
