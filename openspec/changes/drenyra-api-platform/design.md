# SDD Design: Drenyra API Platform — APIs, CLI, SDK & Developer Platform

**Date:** 2026-07-25
**Status:** Design
**SDD Change:** drenyra-api-platform
**Capability:** CAP-STUD-02 (API developer platform)

---

## Executive Summary

Design for the 9-capability external developer platform. All components are grounded in the existing codebase: Elysia + TypeBox API, Drizzle ORM + PostgreSQL persistence, BullMQ + Redis infrastructure, and the route protection matrix already auditing 27 surfaces. The design reuses `PrincipalType`, `TenantContext`, the `getRedisConnection()` singleton, and the existing `integrationWebhooks` schema while adding purpose-built tables for API keys, webhook deliveries, and usage analytics.

---

## Architecture (ASCII)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                        Developer Platform                                  │
│                                                                            │
│  ┌──────────────────────────┐   ┌──────────────────────────────────────┐  │
│  │    apps/dev-portal/      │   │        apps/api/ (extensions)         │  │
│  │    (Next.js 14 App Dir)  │   │                                      │  │
│  │                          │   │  ┌────────────────────────────────┐  │  │
│  │  / (Home)                │   │  │  API Gateway Middleware Stack   │  │  │
│  │  /getting-started        │   │  │                                │  │  │
│  │  /api-reference          │◄──┼──│  1. api-key-auth (Elysia)      │  │  │
│  │  /docs/sdk               │   │  │  2. rate-limiter (unified)     │  │  │
│  │  /docs/webhooks          │   │  │  3. usage-tracker              │  │  │
│  │  /playground             │   │  │  4. envelope-transform         │  │  │
│  │  /dashboard              │   │  └───────────────┬────────────────┘  │  │
│  │  /dashboard/api-keys     │   │                  │                    │  │
│  │  /dashboard/webhooks     │   │  ┌───────────────┴────────────────┐  │  │
│  │  /dashboard/usage        │   │  │  27 Existing Route Surfaces    │  │  │
│  │  /changelog              │   │  │  (ledger-mvp, invoices, ...)   │  │  │
│  └──────────┬───────────────┘   │  └────────────────────────────────┘  │  │
│             │                   │                                      │  │
│             │  ┌────────────────┴────────────────────────────────────┐ │  │
│             │  │           packages/shared/                           │ │  │
│             │  │  /dev-platform/                                      │ │  │
│             │  │    api-keys.ts     (crypto, hash, verify)            │ │  │
│             │  │    rate-limiter.ts (sliding window, tiers)           │ │  │
│             │  │    webhook-sign.ts (HMAC-SHA256 sign/verify)         │ │  │
│             │  │    envelope.ts     (external response transform)     │ │  │
│             │  │    analytics.ts    (metric collectors, types)        │ │  │
│             │  └────────────────────┬────────────────────────────────┘ │  │
│             │                      │                                   │  │
│             │  ┌───────────────────┴────────────────────────────────┐  │  │
│             │  │         packages/persistence/                       │  │  │
│             │  │  /schema/                                           │  │  │
│             │  │    api-keys.schema.ts       (api_keys table)        │  │  │
│             │  │    webhook-deliveries.schema.ts (deliveries)        │  │  │
│             │  │    usage-analytics.schema.ts (usage_events)         │  │  │
│             │  │    dev-accounts.schema.ts   (dev_portal_users)      │  │  │
│             │  └─────────────────────────────────────────────────────┘  │  │
│             │                                                           │  │
│  ┌──────────┴──────────────────────────────────────────────────────┐    │  │
│  │                    Infrastructure                                 │    │  │
│  │                                                                  │    │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐  │    │  │
│  │  │  Redis   │  │   BullMQ     │  │   PostgreSQL              │  │    │  │
│  │  │ (sliding │  │  (webhook    │  │   (api_keys, webhook_     │  │    │  │
│  │  │ windows, │  │  delivery    │  │    deliveries, usage_     │  │    │  │
│  │  │ counters)│  │  jobs)       │  │    events, dev accounts)  │  │    │  │
│  │  └──────────┘  └──────────────┘  └───────────────────────────┘  │    │  │
│  └─────────────────────────────────────────────────────────────────┘    │  │
│                                                                         │  │
│  ┌──────────────────────────────────────────────────────────────────┐   │  │
│  │              SDK Generation Pipeline (CI/CD)                      │   │  │
│  │                                                                   │   │  │
│  │  contracts/ ──► OpenAPI 3.1 spec ──► openapi-ts ──► @drenyra/api-client │
│  │  (TypeBox)      (auto-generated)      (codegen)      (npm publish)      │
│  └──────────────────────────────────────────────────────────────────┘   │  │
│                                                                           │  │
└───────────────────────────────────────────────────────────────────────────┘
```

### Component Diagram — Request Flow

```text
External Request
       │
       ▼
┌──────────────────┐
│  x-api-key header │──► api-key-auth middleware
│  x-company-id     │      │
└──────────────────┘      ▼
                    ┌──────────────┐
                    │ Lookup hash  │──► api_keys (PostgreSQL)
                    │ Validate key │
                    │ Inject ctx   │──► TenantContext in Elysia store
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Rate Limiter │──► Redis sliding window
                    │ Per key+tier │──► X-RateLimit-* headers
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Usage Tracker│──► usage_events (async write)
                    │ (non-block)  │
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Envelope     │──► Transform response
                    │ Transform    │    { data, meta, error }
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Route Handler│──► Existing API surface
                    │ (domain)     │
                    └──────────────┘
```

---

## Capability 1: API Key Lifecycle Management

### Data Model — `api_keys`

```sql
CREATE TYPE api_key_status AS ENUM ('active', 'rotated', 'revoked');
CREATE TYPE api_key_principal_type AS ENUM ('user', 'service', 'webhook');

CREATE TABLE api_keys (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id),
    organization_id UUID NOT NULL,  -- denormalized for fast lookup
    label         VARCHAR(255) NOT NULL,            -- human-readable name
    key_prefix    VARCHAR(12) NOT NULL,              -- "dren_" + first 8 chars of hash
    key_hash      VARCHAR(255) NOT NULL UNIQUE,       -- SHA-256 of full key
    principal_type api_key_principal_type NOT NULL DEFAULT 'service',
    status        api_key_status NOT NULL DEFAULT 'active',
    allowed_domains TEXT[],                          -- NULL = all, ["invoices","customers"] = restricted
    rotated_from  UUID REFERENCES api_keys(id),      -- links to predecessor
    expires_at    TIMESTAMPTZ,                       -- rotation grace period end
    last_used_at  TIMESTAMPTZ,
    created_by    UUID NOT NULL,                     -- developer account (dev_portal_users)
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_company ON api_keys(company_id, status);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
```

### Key Generation Algorithm

```text
1. Generate 32 random bytes via crypto.getRandomValues()
2. Encode as base64url (no padding)
3. Prefix with "dren_"
4. Result: dren_<44-char-base64url>

Example: dren_aGVsbG93b3JsZHRoaXNpc2F0aGlydHl0d29ieXRla2V5

Storage:
- key_hash = SHA-256(full key) stored in DB
- key_prefix = "dren_" + first 8 chars of base64url stored in DB (for dashboard display)
- Full key returned to developer exactly ONCE (at creation/rotation)
```

### Auth Middleware — `api-key-auth` Elysia Plugin

**File:** `apps/api/src/shared/plugins/api-key-auth.ts`

```typescript
// Flow:
// 1. Read x-api-key header
// 2. Validate "dren_" prefix
// 3. SHA-256 hash the key
// 4. Lookup in api_keys WHERE key_hash = ? AND status = 'active'
// 5. Validate x-company-id header matches key's company_id
// 6. If rotated key: check expires_at > NOW()
// 7. Inject TenantContext into Elysia store:
//    { userId: '', organizationId, companyId, role: 'api_key', memberships: [], principal: 'service'|'webhook' }
// 8. Update last_used_at (async, non-blocking)

// Error responses:
// - Missing header → 401, API_KEY_REQUIRED
// - Invalid format → 401, API_KEY_MALFORMED
// - Hash not found → 401, API_KEY_INVALID (indistinguishable timing)
// - Revoked → 401, API_KEY_REVOKED
// - Rotated + expired → 401, API_KEY_EXPIRED
// - Company mismatch → 403, COMPANY_MISMATCH
// - Domain not allowed → 403, DOMAIN_NOT_ALLOWED
```

### Key Management Routes

**Mount point:** `apps/api/src/features/dev-platform/api-keys/`

| Method | Path                      | Description                                                |
| ------ | ------------------------- | ---------------------------------------------------------- |
| POST   | `/api/v1/keys`            | Create key (label, principal_type) → returns full key once |
| GET    | `/api/v1/keys`            | List keys for authenticated developer's company            |
| GET    | `/api/v1/keys/:id`        | Get key metadata (never returns full key)                  |
| POST   | `/api/v1/keys/:id/rotate` | Rotate key → returns new full key once                     |
| POST   | `/api/v1/keys/:id/revoke` | Revoke key immediately                                     |
| DELETE | `/api/v1/keys/:id`        | Not implemented (keys are never deleted)                   |

### Key States & Transitions

```text
         generate
  (none) ────────► active
                      │
                      ├── rotate ──► active (new key)
                      │              old key → rotated (72h grace)
                      │
                      └── revoke ──► revoked (permanent, audit preserved)

  rotated ──(72h expires)──► revoked (automatic)
```

### Decisions

1. **Key format:** `dren_` prefix enables easy identification in logs, regex validation, and secret scanning tools. 32 bytes = 256 bits of entropy, well above OWASP recommendations.
2. **Hash-only storage:** SHA-256 of the full key. The raw key never hits persistent storage after the initial response.
3. **No deletion:** `revoked` is a terminal status. Records preserved for audit trail.
4. **PrincipalType reuse:** The existing `PrincipalType` union (`"user" | "service" | "webhook"`) maps directly to the key's `principal_type` column. Keys default to `"service"`.
5. **TenantContext injection:** The auth middleware writes a `TenantContext`-compatible object into Elysia's store so existing route handlers see the same shape they already use from `tenant-auth.ts`.

---

## Capability 2: Unified Rate Limiting

### Architecture

```text
┌──────────────────────────────────────────────────┐
│              Unified Rate Limiter                 │
│                                                   │
│  apps/api/src/shared/plugins/rate-limiter.ts      │
│  (replaces all 3 deprecated implementations)      │
│                                                   │
│  ┌─────────────────┐   ┌──────────────────────┐  │
│  │ Tier Resolver    │   │ Sliding Window Store │  │
│  │                  │   │                      │  │
│  │ free → 100/min   │   │ Redis (primary)      │  │
│  │ pro → 1000/min   │   │ In-memory (fallback) │  │
│  │ enterprise→custom│   │                      │  │
│  └────────┬────────┘   └──────────┬───────────┘  │
│           │                       │               │
│  ┌────────┴───────────────────────┴───────────┐  │
│  │           Rate Limiter Plugin               │  │
│  │                                             │  │
│  │  .use(rateLimiter({ mode: 'external' }))    │  │
│  │  .use(rateLimiter({ mode: 'internal' }))    │  │
│  │                                             │  │
│  │  Modes:                                     │  │
│  │  - external: per-api-key, tiered            │  │
│  │  - internal: per-session or per-IP          │  │
│  │  - per-route: custom limits                 │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Redis Key Schema

```text
rate:{bucket}:{identifier}:{window_timestamp}

External: rate:ext:dren_aGVsbG93b...:1714339200
Internal: rate:int:session:abc123:1714339200
Internal: rate:int:ip:192.168.1.1:1714339200
```

### Sliding Window Algorithm

```typescript
// Sliding window: count = current_window_count * (1 - elapsed_ratio) + previous_window_count * elapsed_ratio
// Window size: 60 seconds
// Redis operations per request: 2 (INCR current key + GET previous key)

async function checkRateLimit(
  redis: IORedis,
  bucket: string,
  limit: number,
  windowSec: number = 60
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const now = Math.floor(Date.now() / 1000)
  const currentWindow = Math.floor(now / windowSec) * windowSec
  const previousWindow = currentWindow - windowSec

  const currentKey = `rate:${bucket}:${currentWindow}`
  const previousKey = `rate:${bucket}:${previousWindow}`

  const elapsed = now - currentWindow
  const ratio = elapsed / windowSec

  // Pipeline for atomicity
  const [currentCount, previousCount] = await redis
    .pipeline()
    .incr(currentKey)
    .expire(currentKey, windowSec * 2) // TTL = 2x window for safety
    .get(previousKey)
    .exec()

  const previous = parseInt((previousCount?.[1] as string) || '0', 10)
  const current = parseInt((currentCount?.[1] as string) || '0', 10)

  const weighted = Math.floor(current * (1 - ratio) + previous * ratio)
  const remaining = Math.max(0, limit - weighted)

  return {
    allowed: weighted <= limit,
    remaining,
    reset: currentWindow + windowSec,
  }
}
```

### Tier Configuration

```typescript
interface RateLimitTier {
  tier: 'free' | 'pro' | 'enterprise'
  requestsPerMinute: number
  burstMultiplier?: number // temporary burst allowance
}

const DEFAULT_TIERS: Record<string, RateLimitTier> = {
  free: { tier: 'free', requestsPerMinute: 100 },
  pro: { tier: 'pro', requestsPerMinute: 1000 },
  enterprise: { tier: 'enterprise', requestsPerMinute: 5000 },
}

// Tier is resolved from company settings → company_tiers table (future) or env default
// For initial release: all companies default to 'free', upgraded via ops
```

### Elysia Plugin API

```typescript
// External (API key) usage:
app.use(rateLimiter({ mode: 'external' }))

// Internal (session) usage:
app.use(rateLimiter({ mode: 'internal', keyBy: 'session' }))

// Custom per-route:
app.use(
  rateLimiter({
    mode: 'external',
    customLimit: 300, // override tier limit
    windowSeconds: 120, // custom window
  })
)

// Internal traffic bypass:
app.use(
  rateLimiter({
    mode: 'external',
    bypass: (ctx) => ctx.headers['x-internal'] === 'true',
  })
)
```

### Response Headers

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1714339260
Retry-After: 18 (only on 429)
```

### Migration Path

1. Audit all 27 surfaces via the route protection matrix
2. Apply `rateLimiter({ mode: 'external' })` to all surfaces
3. Mark internal-only surfaces with `rateLimiter({ mode: 'internal' })`
4. Remove `middleware/rate-limit.ts`, `middleware/rate-limit.middleware.ts`, `shared/plugins/rate-limiter.ts`
5. Remove SIRE-specific rate limiter, configure via custom limit on the unified plugin

### Decisions

1. **Redis primary, in-memory fallback:** Redis stores counters. When Redis is unavailable (dev, CI), fall back to in-memory Map. This matches existing infrastructure patterns (BullMQ + Redis).
2. **Sliding window over fixed window:** Prevents the "thundering herd at window boundary" problem. Slightly more expensive (2 Redis ops vs 1) but fairer.
3. **Internal bypass via `x-internal` header:** Already used in codebase for internal service-to-service communication. IP-range bypass as secondary check.
4. **Tier stored on company, not on API key:** A company has one tier; all its API keys share that tier. Simplifies management.

---

## Capability 3: Webhook Delivery Infrastructure

### Architecture — Outbox Pattern

```text
┌─────────────────────────────────────────────────────────────┐
│                   Webhook Delivery Engine                    │
│                                                             │
│  Domain Event (e.g., invoice.created)                       │
│       │                                                     │
│       ▼                                                     │
│  ┌──────────────┐                                           │
│  │ Event Emitter │──► writes to webhook_outbox (PostgreSQL) │
│  │ (in DB tx)   │                                           │
│  └──────────────┘                                           │
│       │                                                     │
│       ▼ (async, separate process)                           │
│  ┌──────────────────┐                                       │
│  │ Outbox Relay     │──► polls webhook_outbox every 5s     │
│  │ (Cron / setInterval)                                     │
│  └──────┬───────────┘                                       │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────┐                                       │
│  │ BullMQ Queue     │──► webhook-delivery queue            │
│  │ add(jobId, data) │                                       │
│  └──────┬───────────┘                                       │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────┐                                       │
│  │ Delivery Worker  │──► HTTP POST to webhook URL          │
│  │ (BullMQ Worker)  │    HMAC-SHA256 signature              │
│  │                  │    Retry with backoff on failure      │
│  └──────┬───────────┘                                       │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────┐                                       │
│  │ Delivery Logger  │──► webhook_deliveries (PostgreSQL)   │
│  │                  │    status, latency, response_code     │
│  └──────────────────┘                                       │
│                                                             │
│  Failure path:                                              │
│  ┌──────────────────┐                                       │
│  │ Retry Scheduler  │──► 1min, 5min, 15min, 1h, 6h, 24h   │
│  │ (BullMQ backoff) │    Max 7 attempts                     │
│  └──────┬───────────┘                                       │
│         │ (7 attempts exhausted)                            │
│         ▼                                                   │
│  ┌──────────────────┐                                       │
│  │ Dead Letter Queue│──► webhook_deliveries.status='failed'│
│  │                  │    Manual replay from dashboard       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

```sql
-- Extended webhook registrations (extends existing integrationWebhooks)
CREATE TABLE webhook_registrations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    url             VARCHAR(1000) NOT NULL,
    label           VARCHAR(255) NOT NULL,
    event_types     TEXT[] NOT NULL,               -- ["invoice.created", "invoice.updated"]
    secret_hash     VARCHAR(255) NOT NULL,          -- SHA-256 of webhook secret
    secret_prefix   VARCHAR(16) NOT NULL,           -- "whsec_" + first 8 chars
    is_active       BOOLEAN NOT NULL DEFAULT true,
    verified_at     TIMESTAMPTZ,                    -- null until verification ping succeeds
    created_by      UUID NOT NULL,                   -- developer account
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_reg_company ON webhook_registrations(company_id, is_active);

-- Webhook delivery outbox (written in same DB tx as the triggering event)
CREATE TABLE webhook_outbox (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES webhook_registrations(id),
    event_type      VARCHAR(100) NOT NULL,
    event_id        UUID NOT NULL,
    payload         JSONB NOT NULL,
    enqueued_at     TIMESTAMPTZ,                    -- null until relay picks it up
    bullmq_job_id   VARCHAR(255),                   -- for dedup
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_outbox_pending ON webhook_outbox(enqueued_at)
    WHERE enqueued_at IS NULL;

-- Delivery attempt log
CREATE TABLE webhook_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbox_id       UUID NOT NULL REFERENCES webhook_outbox(id),
    registration_id UUID NOT NULL REFERENCES webhook_registrations(id),
    attempt_number  INT NOT NULL DEFAULT 1,
    status          VARCHAR(20) NOT NULL,            -- 'delivered' | 'failed' | 'pending'
    request_url     VARCHAR(1000) NOT NULL,
    response_code   INT,
    response_body   TEXT,
    latency_ms      INT,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_reg ON webhook_deliveries(registration_id, created_at DESC);
```

### Event Catalog (Initial)

Defined in `apps/api/src/features/dev-platform/webhooks/event-catalog.ts`:

```typescript
export const WEBHOOK_EVENT_CATALOG = {
  'invoice.created': {
    description: 'A new invoice has been created',
    payloadSchema: 'InvoiceResource',
    category: 'invoices',
  },
  'invoice.updated': {
    description: 'An invoice has been modified',
    payloadSchema: 'InvoiceResource',
    category: 'invoices',
  },
  'invoice.status_changed': {
    description: 'An invoice status has changed (draft → issued → paid → void)',
    payloadSchema: 'InvoiceStatusChangedPayload',
    category: 'invoices',
  },
  'siro.status_changed': {
    description: 'SIRO submission status has changed',
    payloadSchema: 'SiroStatusPayload',
    category: 'fiscal',
  },
  'connection.activated': {
    description: 'A banking/ERP connection has been activated',
    payloadSchema: 'ConnectionActivatedPayload',
    category: 'connections',
  },
  'connection.error': {
    description: 'A banking/ERP connection has encountered an error',
    payloadSchema: 'ConnectionErrorPayload',
    category: 'connections',
  },
} as const
```

### Signature Scheme (HMAC-SHA256)

```typescript
// Signing (server-side)
function signWebhook(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signedPayload = `${timestamp}.${payload}`
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}

// The header sent: X-Drenyra-Signature: t=1714340000,v1=abc123def456...

// Verification (client-side)
function verifyWebhook(
  payload: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): boolean {
  const [tPart, v1Part] = signatureHeader.split(',')
  const timestamp = parseInt(tPart.split('=')[1], 10)
  const expectedSig = v1Part.split('=')[1]

  // Reject if timestamp too old (replay protection)
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false

  const signedPayload = `${timestamp}.${payload}`
  const computed = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')

  return timingSafeEqual(computed, expectedSig)
}
```

### Retry Strategy

```typescript
const RETRY_BACKOFF = [
  60_000, // 1 minute
  300_000, // 5 minutes
  900_000, // 15 minutes
  3_600_000, // 1 hour
  21_600_000, // 6 hours
  86_400_000, // 24 hours
]

// Max 7 attempts total (1 initial + 6 retries)
// After exhaustion: status = 'failed', moved to dead letter queue
// Developer can replay from dashboard → creates new outbox row with fresh counter
```

### Decisions

1. **Outbox pattern over direct queue dispatch:** The domain event and the outbox write share a DB transaction. This guarantees at-least-once delivery without distributed transactions.
2. **BullMQ for delivery workers:** Reuses existing BullMQ infrastructure (`packages/infrastructure/src/queues/`). Adds a `webhook-delivery` queue alongside `document-processor`, `fiscal-agent`, `csv-batch`.
3. **Separate `webhook_registrations` table** from `integrationWebhooks`: The existing `integrationWebhooks` is tightly coupled to `integrationConnections` (marketplace model). Developer-facing webhooks need a standalone model scoped to company and event types.
4. **Signature scheme follows Stripe's pattern:** `t=<unix>,v1=<hmac>` is well-understood, has client libraries in all languages, and includes replay protection via timestamp tolerance.

---

## Capability 4: SDK Generation Pipeline (TypeScript)

### Pipeline Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 SDK Generation Pipeline                      │
│                                                             │
│  Step 1: Extract Schemas                                    │
│  ┌──────────────────────────────────────────┐              │
│  │ apps/api/src/shared/plugins/openapi.ts   │              │
│  │                                          │              │
│  │ Walks all registered Elysia routes       │              │
│  │ Extracts TypeBox schemas via introspection │            │
│  │ Generates OpenAPI 3.1 JSON               │              │
│  │ Output: openapi.json (committed to repo)  │              │
│  └────────────────┬─────────────────────────┘              │
│                   │                                         │
│                   ▼                                         │
│  Step 2: Codegen                                           │
│  ┌──────────────────────────────────────────┐              │
│  │ Tool: @hey-api/openapi-ts                 │              │
│  │ (or openapi-typescript + openapi-fetch)   │              │
│  │                                          │              │
│  │ Input: openapi.json                      │              │
│  │ Output: packages/api-client/src/          │              │
│  │   /invoices/                             │              │
│  │   /banking/                              │              │
│  │   /ledger/                               │              │
│  │   /... (per OpenAPI tag/domain)          │              │
│  │   /core/ (types, client, auth)           │              │
│  └────────────────┬─────────────────────────┘              │
│                   │                                         │
│                   ▼                                         │
│  Step 3: Build & Test                                      │
│  ┌──────────────────────────────────────────┐              │
│  │ packages/api-client/                      │              │
│  │   tsup (bundler) → dist/                  │              │
│  │   vitest → unit + integration tests       │              │
│  │   TypeScript strict mode                  │              │
│  └────────────────┬─────────────────────────┘              │
│                   │                                         │
│                   ▼                                         │
│  Step 4: Publish                                           │
│  ┌──────────────────────────────────────────┐              │
│  │ npm publish @drenyra/api-client           │              │
│  │ (CI trigger: tag push or manual dispatch) │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Package Structure

```text
packages/api-client/
├── package.json            # name: @drenyra/api-client, version, exports
├── tsconfig.json
├── tsup.config.ts          # Build config, tree-shakeable ESM + CJS
├── LICENSE                 # MIT
├── README.md
├── openapi.json            # Committed snapshot of the spec
├── codegen.config.ts       # @hey-api/openapi-ts configuration
├── src/
│   ├── index.ts            # Main entry: DrenyraClient class
│   ├── core/
│   │   ├── client.ts       # DrenyraClient: constructor, auth headers
│   │   ├── types.ts        # Shared types (TenantContext, ApiError, etc.)
│   │   ├── errors.ts       # Error classes (ApiKeyError, RateLimitError, etc.)
│   │   └── fetch.ts        # Wrapped fetch with retry, timeout, logging
│   ├── invoices/            # Generated from OpenAPI tag "Invoices"
│   │   ├── index.ts
│   │   └── types.ts
│   ├── banking/
│   │   ├── index.ts
│   │   └── types.ts
│   ├── ledger/
│   │   ├── index.ts
│   │   └── types.ts
│   └── ... (per domain)
├── test/
│   ├── client.test.ts
│   ├── auth.test.ts
│   └── integration/        # Tests against a running API
└── scripts/
    └── codegen.ts           # CI entry: regenerate from openapi.json
```

### Client API Design

```typescript
// Initialization
const client = new DrenyraClient({
  apiKey: 'dren_aGVsbG93b3JsZHRoaXNpc2F0aGlydHl0d29ieXRla2V5',
  companyId: 'c0a80121-1234-5678-abcd-ef0123456789',
  // optional:
  baseUrl: 'https://api.drenyra.com',  // default: production
  timeout: 30_000,                      // default: 30s
  retries: 1,                           // default: 1 (idempotent only)
});

// Domain-based access (tree-shakeable)
const invoices = await client.invoices.list({ status: 'issued' });
const invoice = await client.invoices.get('inv_123');
const created = await client.invoices.create({ ... });

// Raw request (for endpoints not yet in SDK)
const data = await client.request('GET', '/api/v1/custom/endpoint');

// Error handling
try {
  await client.invoices.get('nonexistent');
} catch (err) {
  if (err instanceof DrenyraError) {
    console.log(err.code);    // 'INVOICE_NOT_FOUND'
    console.log(err.status);  // 404
    console.log(err.requestId); // 'uuid-for-tracing'
  }
}
```

### SDK CI Integration

```yaml
# .github/workflows/sdk-check.yml (conceptual)
sdk-check:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: oven-sh/setup-bun@v1

    # Step 1: Generate OpenAPI spec from API
    - run: bun run apps/api scripts/generate-openapi.ts

    # Step 2: Regenerate SDK
    - run: bun run packages/api-client scripts/codegen.ts

    # Step 3: Check for changes (fail if SDK is stale)
    - run: |
        if ! git diff --exit-code packages/api-client/src/; then
          echo "SDK is out of date. Run 'bun codegen' and commit the changes."
          exit 1
        fi

    # Step 4: Run SDK tests
    - run: bun test --filter @drenyra/api-client
```

### Decisions

1. **`@hey-api/openapi-ts`** as the codegen tool: It produces tree-shakeable per-domain modules, supports OpenAPI 3.1, and generates typed fetch clients. Alternative: `openapi-typescript` + `openapi-fetch`.
2. **Committed `openapi.json`:** The OpenAPI spec is generated and committed to the repo. This makes the SDK pipeline reproducible and allows inspecting API changes in PRs.
3. **Tree-shakeable by domain:** Each OpenAPI tag generates a separate barrel export. Bundlers eliminate unused domains.
4. **MIT license:** As decided. The SDK is open source; the platform is the product.
5. **TypeScript only for initial release:** Go and Python clients are follow-up SDDs.

---

## Capability 5: Developer Portal Foundation

### App Structure — `apps/dev-portal/`

```text
apps/dev-portal/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── public/
│   ├── logo.svg
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (nav, footer, theme)
│   │   ├── page.tsx                # Home: hero, features, CTAs
│   │   ├── getting-started/
│   │   │   └── page.tsx            # Step-by-step guide
│   │   ├── api-reference/
│   │   │   ├── page.tsx            # OpenAPI-rendered docs
│   │   │   └── [[...slug]]/
│   │   │       └── page.tsx        # Per-endpoint detail
│   │   ├── docs/
│   │   │   ├── sdk/
│   │   │   │   └── page.tsx        # SDK documentation
│   │   │   └── webhooks/
│   │   │       └── page.tsx        # Webhooks guide + event catalog
│   │   ├── playground/
│   │   │   └── page.tsx            # Interactive API playground
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout (auth gate, sidebar)
│   │   │   ├── page.tsx            # Overview: keys count, usage summary
│   │   │   ├── api-keys/
│   │   │   │   └── page.tsx        # Key management UI
│   │   │   ├── webhooks/
│   │   │   │   └── page.tsx        # Webhook management + delivery log
│   │   │   └── usage/
│   │   │       └── page.tsx        # Usage analytics
│   │   ├── changelog/
│   │   │   └── page.tsx            # Automated changelog
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── verify/
│   │   │       └── page.tsx
│   │   └── api/
│   │       └── auth/
│   │           └── [...nextauth]/
│   │               └── route.ts    # NextAuth.js or custom auth
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DashboardSidebar.tsx
│   │   ├── api-reference/
│   │   │   ├── EndpointCard.tsx
│   │   │   ├── SchemaViewer.tsx
│   │   │   └── CodeSample.tsx
│   │   ├── playground/
│   │   │   ├── PlaygroundEditor.tsx
│   │   │   ├── RequestBuilder.tsx
│   │   │   ├── ResponseViewer.tsx
│   │   │   └── CodeSnippetTabs.tsx
│   │   ├── dashboard/
│   │   │   ├── ApiKeyCard.tsx
│   │   │   ├── UsageChart.tsx
│   │   │   ├── WebhookDeliveryRow.tsx
│   │   │   └── QuotaGauge.tsx
│   │   └── ui/                     # Shared primitives (button, input, card)
│   ├── lib/
│   │   ├── auth.ts                 # Auth config (NextAuth or custom)
│   │   ├── api-client.ts           # Browser-side API client
│   │   ├── openapi.ts              # OpenAPI spec fetcher + parser
│   │   └── analytics.ts            # Client-side analytics helpers
│   └── styles/
│       └── globals.css
```

### Data Model — `dev_portal_users`

```sql
CREATE TABLE dev_portal_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255),
    company_name    VARCHAR(255),                  -- optional at registration
    email_verified  BOOLEAN NOT NULL DEFAULT false,
    verification_token VARCHAR(255),               -- time-limited, hashed
    verification_sent_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dev_users_email ON dev_portal_users(email);
```

### Authentication Flow

```text
Register:
  1. POST /api/dev-auth/register { email, password, name?, company_name? }
  2. Server: hash password (bcrypt), create unverified account
  3. Server: generate verification token (SHA-256 hash of random bytes)
  4. Server: send email with link: /auth/verify?token=<token>
  5. User clicks link → account verified → redirect to dashboard

Login:
  1. POST /api/dev-auth/login { email, password }
  2. Server: verify credentials, check email_verified
  3. Server: issue JWT (short-lived access + longer refresh)
  4. Client: store in httpOnly cookie (separate domain from main app)
  5. Redirect to dashboard

Session:
  - JWT stored in httpOnly cookie, domain: developers.drenyra.com
  - Separate auth domain from main app (app.drenyra.com)
  - No session sharing between portal and main app
```

### Portal → API Communication

```text
Browser (dev-portal)           API (apps/api)
       │                           │
       │  GET /api/v1/keys         │
       ├──────────────────────────►│
       │  x-api-key: dren_...      │
       │  x-company-id: UUID       │
       │                           │
       │  The portal stores the    │
       │  developer's API key in   │
       │  the portal session and   │
       │  proxies it to the API.   │
       │                           │
       │  OR: the API key is       │
       │  stored in the browser    │
       │  (localStorage) and sent  │
       │  directly.                │
```

### Decisions

1. **Next.js 14 App Router:** Matches the monorepo's web app tech. Separate auth domain.
2. **Separate auth from main app:** `dev_portal_users` table is independent. No cross-contamination of sessions or permissions.
3. **Portal proxies API calls** using the developer's stored API key. The portal dashboard is an API consumer itself.
4. **Changelog auto-generated** from conventional commits filtered to `feat`, `fix`, and `BREAKING CHANGE` with scope `api`. Stored as a JSON file during CI and rendered by the portal.
5. **API Reference rendered client-side** using a library like `@scalar/api-reference` (React component) or `swagger-ui-react` that fetches the live OpenAPI spec from the API server.

---

## Capability 6: API Playground

### Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    API Playground                            │
│                                                             │
│  Component tree (in apps/dev-portal):                       │
│                                                             │
│  PlaygroundPage                                             │
│  ├── EndpointSelector                                       │
│  │   └── Dropdown: method + path (from OpenAPI spec)        │
│  ├── RequestBuilder                                         │
│  │   ├── PathParams: key-value inputs                       │
│  │   ├── QueryParams: key-value inputs                      │
│  │   ├── Headers: key-value (api-key auto-filled)           │
│  │   └── Body: JSON editor (CodeMirror)                     │
│  ├── SendButton                                             │
│  │   └── Executes fetch() with CORS proxy if needed         │
│  ├── ResponseViewer                                         │
│  │   ├── Status badge (200, 404, etc.)                      │
│  │   ├── Headers tab                                        │
│  │   ├── Body tab (syntax-highlighted JSON)                 │
│  │   └── Latency display                                    │
│  └── CodeSnippetTabs                                        │
│      ├── curl                                               │
│      ├── TypeScript (SDK)                                   │
│      ├── Go                                                 │
│      └── Python                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Notes

- **API key auto-fill:** Read from portal session/localStorage.
- **No API key banner:** Shown when no key exists, with link to `/dashboard/api-keys`.
- **CORS:** The API must allow CORS from `developers.drenyra.com`. The existing CORS config needs a public rule for the portal domain.
- **Code snippets generated client-side** from the request state. Each language has a template function.
- **State is URL-encodable:** The playground URL can be shared: `/playground?method=GET&path=/api/v1/invoices&companyId=...`

### Decisions

1. **Client-side execution:** The browser sends the request directly to the API (CORS). No server-side proxy needed. This gives accurate latency metrics and requires no additional infrastructure.
2. **CodeMirror for JSON body:** Lightweight, accessible, and already in the ecosystem.
3. **URL-shareable state:** Enables linking from documentation ("Try it" button on API Reference pages).

---

## Capability 7: Usage Analytics for API Consumers

### Data Model

```sql
CREATE TABLE usage_events (
    id              BIGSERIAL PRIMARY KEY,
    api_key_id      UUID NOT NULL REFERENCES api_keys(id),
    company_id      UUID NOT NULL,
    endpoint        VARCHAR(500) NOT NULL,          -- e.g., "/api/v1/invoices"
    method          VARCHAR(10) NOT NULL,            -- GET, POST, etc.
    status_code     INT NOT NULL,
    latency_ms      INT NOT NULL,
    request_id      UUID NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition by month for efficient retention management
-- CREATE TABLE usage_events_2026_07 PARTITION OF usage_events ...

CREATE INDEX idx_usage_events_key_time ON usage_events(api_key_id, timestamp DESC);
CREATE INDEX idx_usage_events_company_time ON usage_events(company_id, timestamp DESC);

-- Materialized view for hourly aggregation (refreshed by cron every 5 min)
CREATE MATERIALIZED VIEW usage_hourly AS
SELECT
    api_key_id,
    company_id,
    date_trunc('hour', timestamp) AS hour,
    COUNT(*) AS request_count,
    COUNT(*) FILTER (WHERE status_code >= 400 AND status_code < 500) AS error_4xx,
    COUNT(*) FILTER (WHERE status_code >= 500) AS error_5xx,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms) AS p50,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99
FROM usage_events
GROUP BY api_key_id, company_id, hour;

CREATE UNIQUE INDEX idx_usage_hourly_key ON usage_hourly(api_key_id, hour);
```

### Collection Flow

```text
Request completes
       │
       ▼
Usage Tracker Middleware (non-blocking)
       │
       │  Fire-and-forget insert into usage_events
       │  (or batch via in-memory buffer → flush every 5s)
       ▼
PostgreSQL usage_events
       │
       │  Cron: REFRESH MATERIALIZED VIEW usage_hourly (every 5 min)
       ▼
Dashboard queries usage_hourly (fast, pre-aggregated)
```

### Dashboard API

| Method | Path                                                 | Description                                            |
| ------ | ---------------------------------------------------- | ------------------------------------------------------ |
| GET    | `/api/v1/analytics/overview`                         | Summary: total requests, error rate, p95 latency (24h) |
| GET    | `/api/v1/analytics/volume?range=7d&granularity=hour` | Time-series request count                              |
| GET    | `/api/v1/analytics/errors?range=7d`                  | Error breakdown by endpoint + code                     |
| GET    | `/api/v1/analytics/latency?range=7d`                 | p50/p95/p99 time series                                |
| GET    | `/api/v1/analytics/quota`                            | Current window usage % + tier limit                    |

### Retention Policy

```typescript
const RETENTION_DAYS = {
  free: 90,
  pro: 365,
  enterprise: Infinity, // configured per contract
}
```

### Decisions

1. **PostgreSQL for analytics (not ClickHouse/TimescaleDB):** For the initial release, PostgreSQL handles the volume. The `usage_hourly` materialized view keeps dashboard queries fast. If volume exceeds ~10M events/day, migrate to a time-series store.
2. **Async, non-blocking collection:** The usage tracker middleware fires an async insert and never blocks the response. Uses a small in-memory buffer to batch inserts if needed.
3. **Per-API-key scoping:** Consumers only see their own key's data. Company admins see all keys for their company.
4. **No real-time requirement:** "Within 60 seconds" is acceptable. Materialized view refreshed every 5 minutes; dashboard displays the last refresh time.

---

## Capability 8: API Versioning Strategy

### URL Path Convention

```text
/api/v1/invoices          ← current version
/api/v2/invoices          ← future breaking-change version
/api/invoices             ← 308 redirect to /api/v1/invoices (or 400 if legacy)
```

### Version Lifecycle

```text
  v1 (active)        v1 (deprecated)        v1 (sunset)
  ──────────►        ───────────────►       ──────────►
  New features        Deprecation: true      410 Gone
  No breaking chg     Sunset: <date>         Migration guide link
                      6-month minimum
```

### Headers

Every response from a versioned endpoint:

```text
API-Version: 1
```

Deprecated responses add:

```text
Deprecation: true
Sunset: Sat, 31 Jan 2027 00:00:00 GMT
Link: </api/v2/invoices>; rel="successor-version"
```

### Implementation

```typescript
// apps/api/src/shared/plugins/api-versioning.ts

export function apiVersion(options: {
  version: number
  deprecated?: boolean
  sunsetDate?: Date
  successorPath?: string
}) {
  return (app: Elysia) =>
    app.derive(({ set }) => {
      set.headers['API-Version'] = options.version.toString()

      if (options.deprecated) {
        set.headers['Deprecation'] = 'true'
        if (options.sunsetDate) {
          set.headers['Sunset'] = options.sunsetDate.toUTCString()
        }
        if (options.successorPath) {
          set.headers['Link'] =
            `<${options.successorPath}>; rel="successor-version"`
        }
      }
    })
}

// Usage:
new Elysia({ prefix: '/api/v1' }).use(apiVersion({ version: 1 }))
// ... routes

// Deprecated version:
new Elysia({ prefix: '/api/v1' }).use(
  apiVersion({
    version: 1,
    deprecated: true,
    sunsetDate: new Date('2027-01-31'),
    successorPath: '/api/v2',
  })
)
// ... routes (kept operational)
```

### Breaking Change Policy

```text
Breaking change = removing a field, changing a field type, removing an endpoint,
                  changing auth requirements, changing error codes

Non-breaking = adding an optional field, adding a new endpoint,
               adding a new enum value (clients should handle unknown values)

Process:
  1. Non-breaking change → add to current version, update changelog as "added"
  2. Breaking change → create new major version (/api/v2/...)
  3. Old version → mark deprecated with minimum 6-month sunset
  4. Publish migration guide in dev portal changelog
```

### Sunset Handler

```typescript
// Middleware that checks if the current date is past the sunset date
// Returns 410 Gone for sunset versions

export function sunsetGuard(sunsetDate: Date) {
  return (app: Elysia) =>
    app.onBeforeHandle(({ set }) => {
      if (new Date() > sunsetDate) {
        set.status = 410
        return {
          error: {
            code: 'API_VERSION_SUNSET',
            message: `This API version was sunset on ${sunsetDate.toUTCString()}`,
            migrationGuide:
              'https://developers.drenyra.com/changelog/v2-migration',
            successorVersion: '/api/v2',
          },
        }
      }
    })
}
```

### Decisions

1. **URL-path versioning** (not header-based, not query-param): Most explicit, easiest to document, simplest for caching/CDN. Industry standard (Stripe, GitHub, Twilio).
2. **v1 is the first external version:** Internal routes without `/v1` prefix are either internal-only or get 308 redirected. Gradual migration — not a big-bang rename.
3. **6-month minimum deprecation:** Industry-standard. Gives integrators time to migrate.
4. **`API-Version` response header:** Allows clients to programmatically detect version without parsing the URL.

---

## Capability 9: External-Facing API Envelope

### Shape

**Success:**

```json
{
  "data": { ... },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-07-25T10:30:00Z"
  }
}
```

**List (future enhancement — currently data is the array directly):**

```json
{
  "data": [ ... ],
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-07-25T10:30:00Z"
  }
}
```

**Error:**

```json
{
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "The requested invoice does not exist",
    "requestId": "uuid"
  }
}
```

### Implementation

```typescript
// apps/api/src/shared/plugins/external-envelope.ts

export function externalEnvelope() {
  return (app: Elysia) =>
    app
      .derive(({ requestId }) => ({ requestId }))
      .onAfterHandle(({ response, requestId, set }) => {
        // Don't double-wrap if already in external format
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          'meta' in response
        ) {
          return response
        }

        return {
          data: response,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
          },
        }
      })
      .onError(({ error, requestId, set, code }) => {
        // Map internal errors to public codes
        const publicError = mapToPublicError(error, code)

        set.headers['Content-Type'] = 'application/json'
        return {
          error: {
            code: publicError.code,
            message: publicError.message,
            requestId,
          },
        }
      })
}
```

### Error Code Mapping

```typescript
const ERROR_CODE_MAP: Record<string, { code: string; status: number }> = {
  NOT_FOUND: { code: 'RESOURCE_NOT_FOUND', status: 404 },
  INVOICE_NOT_FOUND: { code: 'INVOICE_NOT_FOUND', status: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400 },
  API_KEY_REQUIRED: { code: 'API_KEY_REQUIRED', status: 401 },
  API_KEY_INVALID: { code: 'API_KEY_INVALID', status: 401 },
  API_KEY_REVOKED: { code: 'API_KEY_REVOKED', status: 401 },
  API_KEY_EXPIRED: { code: 'API_KEY_EXPIRED', status: 401 },
  COMPANY_MISMATCH: { code: 'COMPANY_MISMATCH', status: 403 },
  COMPANY_SCOPE_REQUIRED: { code: 'COMPANY_SCOPE_REQUIRED', status: 400 },
  DOMAIN_NOT_ALLOWED: { code: 'DOMAIN_NOT_ALLOWED', status: 403 },
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', status: 429 },
  API_VERSION_SUNSET: { code: 'API_VERSION_SUNSET', status: 410 },
  API_VERSION_REQUIRED: { code: 'API_VERSION_REQUIRED', status: 400 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500 },
}

// Unknown errors → 'INTERNAL_ERROR' with no internal details exposed
function mapToPublicError(error: unknown, code: string) {
  const known = ERROR_CODE_MAP[code]
  if (known) return known

  // Generic fallback — never leak internal errors
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    status: 500,
  }
}
```

### Decisions

1. **Envelope differs from internal envelope:** The existing internal envelope has varying shapes (`canonical`, `mixed`, `custom`, `plain-json`). External consumers get a single consistent shape.
2. **`requestId` for tracing:** Every external response includes a request ID that correlates with server logs. This is already available via the internal request context.
3. **Error codes are public contracts:** The code string (e.g., `INVOICE_NOT_FOUND`) is stable and documented. The `message` is human-readable and may change.
4. **No pagination envelope in initial release:** When pagination is added (follow-up), it will extend `meta` with `page`, `pageSize`, `totalCount`, `totalPages`.

---

## File Manifest

### New Files

| File                                                             | Purpose                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `packages/shared/src/dev-platform/api-keys.ts`                   | Key generation, hashing, verification                           |
| `packages/shared/src/dev-platform/rate-limiter.ts`               | Sliding window algorithm, tier config                           |
| `packages/shared/src/dev-platform/webhook-sign.ts`               | HMAC-SHA256 sign/verify                                         |
| `packages/shared/src/dev-platform/envelope.ts`                   | External envelope transform                                     |
| `packages/shared/src/dev-platform/analytics.ts`                  | Metric types, collectors                                        |
| `packages/shared/src/dev-platform/index.ts`                      | Barrel export                                                   |
| `packages/persistence/src/schema/api-keys.schema.ts`             | `api_keys` Drizzle schema                                       |
| `packages/persistence/src/schema/webhook-deliveries.schema.ts`   | `webhook_registrations`, `webhook_outbox`, `webhook_deliveries` |
| `packages/persistence/src/schema/usage-analytics.schema.ts`      | `usage_events`, `usage_hourly` mat view                         |
| `packages/persistence/src/schema/dev-accounts.schema.ts`         | `dev_portal_users`                                              |
| `apps/api/src/shared/plugins/api-key-auth.ts`                    | Elysia API key auth plugin                                      |
| `apps/api/src/shared/plugins/rate-limiter.ts`                    | Unified rate limiter plugin (replaces 3 deprecated)             |
| `apps/api/src/shared/plugins/external-envelope.ts`               | External response envelope plugin                               |
| `apps/api/src/shared/plugins/api-versioning.ts`                  | Version header + sunset guard                                   |
| `apps/api/src/shared/plugins/usage-tracker.ts`                   | Async usage event recorder                                      |
| `apps/api/src/features/dev-platform/api-keys/routes.ts`          | Key CRUD endpoints                                              |
| `apps/api/src/features/dev-platform/api-keys/handlers.ts`        | Key lifecycle logic                                             |
| `apps/api/src/features/dev-platform/webhooks/routes.ts`          | Webhook registration endpoints                                  |
| `apps/api/src/features/dev-platform/webhooks/handlers.ts`        | Webhook CRUD logic                                              |
| `apps/api/src/features/dev-platform/webhooks/event-catalog.ts`   | Event type definitions                                          |
| `apps/api/src/features/dev-platform/webhooks/delivery-worker.ts` | BullMQ webhook delivery worker                                  |
| `apps/api/src/features/dev-platform/analytics/routes.ts`         | Analytics API endpoints                                         |
| `apps/api/src/features/dev-platform/analytics/queries.ts`        | Analytics query helpers                                         |
| `apps/api/src/features/dev-platform/auth/routes.ts`              | Dev portal auth endpoints                                       |
| `apps/api/scripts/generate-openapi.ts`                           | OpenAPI spec generation script                                  |
| `packages/api-client/`                                           | SDK package (full structure above)                              |
| `apps/dev-portal/`                                               | Developer portal app (full structure above)                     |

### Modified Files

| File                                                        | Change                                                     |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/persistence/src/schema/index.ts`                  | Export new schemas                                         |
| `apps/api/src/app-core.ts`                                  | Register new plugins + dev-platform routes                 |
| `apps/api/src/features/security/route-protection/matrix.ts` | Add `api-key` auth mode, update 16 `"missing"` rate limits |
| `apps/api/src/features/security/route-protection/types.ts`  | Add `"api-key"` to `RouteAuthMode` union                   |

### Removed Files

| File                                                             | Reason                                         |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `apps/api/src/middleware/rate-limit.ts`                          | Replaced by unified `rate-limiter.ts` plugin   |
| `apps/api/src/middleware/rate-limit.middleware.ts`               | Replaced by unified `rate-limiter.ts` plugin   |
| `apps/api/src/shared/plugins/rate-limiter.ts`                    | Replaced by new unified version                |
| `apps/api/src/features/sire/middleware/rate-limit.middleware.ts` | SIRE rate limits configured via unified plugin |

---

## Data Flow Summary

```text
External Developer
       │
       │  1. Registers on dev-portal → dev_portal_users row
       │  2. Creates API key → api_keys row, returns full key once
       │  3. SDK init with apiKey + companyId
       │
       ▼
SDK / curl / playground
       │
       │  HTTP request with x-api-key + x-company-id headers
       ▼
API Gateway Middleware (in order):
  1. api-key-auth    → validates key, injects TenantContext
  2. rate-limiter    → checks Redis sliding window, sets X-RateLimit-* headers
  3. usage-tracker   → async writes to usage_events (fire-and-forget)
  4. route handler   → delegates to existing route surface
  5. external-envelope → wraps response in { data, meta } or { error }
       │
       ▼
Response to developer

Webhook Flow (out-of-band):
  1. Domain event occurs (e.g., invoice.created)
  2. Event emitter writes to webhook_outbox (same DB tx)
  3. Outbox relay polls every 5s, enqueues to BullMQ
  4. Delivery worker: HTTP POST with HMAC signature
  5. Delivery logged to webhook_deliveries
  6. Developer views delivery history in portal dashboard
```

---

## Risks and Mitigations

| Risk                                            | Severity | Mitigation                                                                             |
| ----------------------------------------------- | -------- | -------------------------------------------------------------------------------------- |
| API key leak exposes tenant data                | HIGH     | Keys are hashed at rest, revocable within 60s, rate-limited, audit-logged              |
| Rate limiter blocks legitimate internal traffic | MEDIUM   | Internal traffic identified by `x-internal` header or IP range bypass                  |
| Webhook delivery misses events                  | MEDIUM   | Outbox pattern guarantees at-least-once; dead letter queue enables manual replay       |
| SDK falls out of sync with API contracts        | LOW      | CI check fails if SDK is stale; regeneration is a single command                       |
| Dev portal auth vulnerability                   | MEDIUM   | Separate auth domain from main app; standard bcrypt + JWT; email verification required |
| Analytics queries degrade DB performance        | LOW      | Materialized view absorbs read load; usage_events partitioned by month                 |
| Breaking API changes without proper versioning  | LOW      | CI gate: OpenAPI spec diff check; breaking change detection via schema comparison      |

---

## Next Recommended

`sdd-tasks` — Break down into task list for the 5-PR delivery plan.

## Skill Resolution

`paths-injected` — All skill paths resolved and injected by orchestrator.
