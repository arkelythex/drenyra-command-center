# Security Foundation — Architecture & Design

**Change:** `drenyra-security-foundation`
**Phase:** design
**Version:** 1.0.0
**Last Reviewed:** 2026-07-25

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Phase 0: Threat Model & NIST CSF Baseline](#phase-0-threat-model--nist-csf-baseline)
4. [Phase 1: RBAC Unification](#phase-1-rbac-unification)
5. [Phase 2: MFA/2FA Implementation](#phase-2-mfa2fa-implementation)
6. [Phase 3: Secret Management Hardening](#phase-3-secret-management-hardening)
7. [Phase 4: Security Monitoring & Incident Response](#phase-4-security-monitoring--incident-response)
8. [Data Models](#data-models)
9. [API Contracts](#api-contracts)
10. [Migration Strategy](#migration-strategy)
11. [Risk Register](#risk-register)

---

## Executive Summary

This design formalizes Drenyra's security foundation across five phases: (0) threat modeling and NIST CSF baseline, (1) RBAC unification merging two parallel authorization systems, (2) MFA implementation with passkeys (FIDO2/WebAuthn) as primary and TOTP as fallback, integrated with BetterAuth, (3) secret management hardening with a vault-ready abstraction layer, and (4) security monitoring and incident response runbook.

> **2026 update**: Based on current best practices (OWASP ASVS 5.0, NIST SP 800-63-4), passkeys (FIDO2/WebAuthn) are the gold standard for financial application MFA. They provide phishing resistance (AAL3 equivalent) and better UX than TOTP. This design prioritizes passkeys as the primary MFA method, with TOTP as a fallback for users/browsers that cannot support WebAuthn.

The architecture is **defense-in-depth**: threat model informs RBAC design, MFA protects authentication, secret abstraction protects credentials, and monitoring closes the loop.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web / Mobile)                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ BetterAuth │  │Passkeys+MFA│  │  Session  │  │ Route Protection │  │
│  │  Cookies   │  │  QR+Code  │  │  Cookie   │  │    Matrix        │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
└────────┼──────────────┼──────────────┼─────────────────┼────────────┘
         │              │              │                 │
═════════╪══════════════╪══════════════╪═════════════════╪═══════════
         │  TRUST BOUNDARY: Client ↔ API                           │
═════════╪══════════════╪══════════════╪═════════════════╪═══════════
         ▼              ▼              ▼                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          API (Elysia + Bun)                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    MIDDLEWARE PIPELINE                         │   │
│  │  RateLimiter → Session → MFA Step-Up → Tenant → RBAC Guard   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │ BetterAuth     │  │ Unified RBAC     │  │ SecretProvider      │  │
│  │ (session,      │  │ Guard            │  │ (env → vault-ready) │  │
│  │  email, pwd,   │  │                  │  │                     │  │
│  │  MFA plugin)   │  │ business:*       │  │ getSecret()         │  │
│  │                │  │ platform:*       │  │ validateSecrets()   │  │
│  └───────┬────────┘  └────────┬─────────┘  └──────────┬──────────┘  │
│          │                    │                        │             │
│  ┌───────┴────────────────────┴────────────────────────┴──────────┐ │
│  │                   Security Monitoring                           │ │
│  │  Access Logs → Audit Events → Alert Triggers → Runbook          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
         │                    │                        │
═════════╪════════════════════╪════════════════════════╪═══════════════
         │  TRUST BOUNDARY:   │  TRUST BOUNDARY:       │  TRUST
         │  API ↔ DB          │  API ↔ SUNAT           │  BOUNDARY:
         │                    │                        │  API ↔ AI
═════════╪════════════════════╪════════════════════════╪═══════════════
         ▼                    ▼                        ▼
┌──────────────┐  ┌──────────────────┐  ┌─────────────────────────────┐
│ PostgreSQL   │  │ SUNAT API        │  │ AI Providers                │
│ (Drizzle)    │  │ (RUC validation, │  │ (Gemini, OpenAI, etc.)      │
│              │  │  tax submission) │  │                             │
│ AES-256-GCM  │  │                  │  │ AES-256-GCM envelope        │
│ (fiscal E2E) │  │ SUNAT_CLIENT_*   │  │ with AAD binding            │
└──────────────┘  └──────────────────┘  └─────────────────────────────┘
```

### Core Architectural Principles

1. **Single source of truth** — one role hierarchy, one guard, one permission registry
2. **Graceful degradation** — feature flags allow instant rollback of RBAC and MFA
3. **Defense in depth** — rate limiting → session → MFA → RBAC → audit
4. **Vault readiness** — `SecretProvider` abstraction decouples consumers from env vars
5. **Documentation as code** — threat model and runbook live alongside code, versioned

---

## Phase 0: Threat Model & NIST CSF Baseline

### 0.1 Trust Boundaries (STRIDE Scope)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  CLIENT  │ ──▶ │   API    │ ──▶ │    DB    │     │  SUNAT   │     │    AI    │
│ (Browser)│     │ (Elysia) │     │(Postgres)│     │   API    │     │Providers │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
       │               │                │                │                │
       │          ┌──────────┐           │                │                │
       │          │  SESSION │           │                │                │
       │          │  STORE   │           │                │                │
       │          └──────────┘           │                │                │
       │                                 │                │                │
       │                          ┌──────────┐           │                │
       │                          │    R2    │           │                │
       │                          │ (Storage)│           │                │
       │                          └──────────┘           │                │
       │                                 │                │                │
```

**Five trust boundaries:**

| #   | Boundary           | Data Flow                                          | Critical Assets                                         |
| --- | ------------------ | -------------------------------------------------- | ------------------------------------------------------- |
| TB1 | Client ↔ API       | Auth cookies, request payloads, TOTP codes         | Sessions, credentials, fiscal data in transit           |
| TB2 | API ↔ Database     | User data, fiscal records, RBAC state, MFA secrets | PII, fiscal data, password hashes, TOTP secrets         |
| TB3 | API ↔ SUNAT        | RUC validation, tax declarations, query responses  | Tax IDs, fiscal submissions, SUNAT credentials          |
| TB4 | API ↔ AI Providers | Prompt context, AI tool state, cognitive data      | API keys, user context in prompts, encrypted tool state |
| TB5 | API ↔ R2 Storage   | Document uploads, backups, exports                 | Fiscal documents, audit exports, tenant data            |

### 0.2 STRIDE Threat Scenarios (≥15)

#### TB1: Client ↔ API

| #   | Threat                                 | STRIDE              | Severity | Likelihood | Mitigation                                                        |
| --- | -------------------------------------- | ------------------- | -------- | ---------- | ----------------------------------------------------------------- |
| T1  | Session cookie theft via XSS           | I (Info Disclosure) | HIGH     | Medium     | HttpOnly + Secure + SameSite=Strict cookies; CSP headers          |
| T2  | CSRF on state-changing endpoints       | T (Tampering)       | HIGH     | Medium     | SameSite cookies; CSRF tokens for sensitive operations            |
| T3  | Credential stuffing via login endpoint | S (Spoofing)        | HIGH     | High       | Rate limiting (AUTH tier); account lockout (5/30min); MFA step-up |
| T4  | TOTP code brute force                  | S (Spoofing)        | MEDIUM   | Low        | 5-failure invalidation; AUTH rate limit tier                      |
| T5  | MITM on HTTP connections               | I (Info Disclosure) | CRITICAL | Low        | TLS enforcement; HSTS header                                      |
| T6  | Session fixation                       | S (Spoofing)        | MEDIUM   | Low        | Session regeneration on login; binding to IP/user-agent           |

#### TB2: API ↔ Database

| #   | Threat                                    | STRIDE              | Severity | Likelihood | Mitigation                                                        |
| --- | ----------------------------------------- | ------------------- | -------- | ---------- | ----------------------------------------------------------------- |
| T7  | SQL injection via unvalidated inputs      | T (Tampering)       | CRITICAL | Low        | Drizzle ORM parameterized queries; input validation (TypeBox/Zod) |
| T8  | Direct DB access with leaked DATABASE_URL | I (Info Disclosure) | CRITICAL | Low        | `SecretProvider`; IP allowlisting; TLS for DB connections         |
| T9  | Unauthorized cross-tenant data access     | E (Elevation)       | CRITICAL | Medium     | H02 tenant isolation; unified RBAC; company-scoped queries        |
| T10 | TOTP secret extraction from DB            | I (Info Disclosure) | HIGH     | Low        | Encrypt TOTP secrets at rest; DB access controls                  |

#### TB3: API ↔ SUNAT

| #   | Threat                                      | STRIDE              | Severity | Likelihood | Mitigation                                                |
| --- | ------------------------------------------- | ------------------- | -------- | ---------- | --------------------------------------------------------- |
| T11 | SUNAT credential leakage via env/logs       | I (Info Disclosure) | CRITICAL | Medium     | `SecretProvider`; pre-commit hook; log redaction          |
| T12 | Replay attacks on SUNAT declarations        | R (Repudiation)     | HIGH     | Low        | Idempotency keys; audit trail per declaration             |
| T13 | SUNAT API unavailable (DoS from SUNAT side) | D (Denial)          | MEDIUM   | Medium     | Circuit breaker; retry with backoff; graceful degradation |

#### TB4: API ↔ AI Providers

| #   | Threat                                            | STRIDE              | Severity | Likelihood | Mitigation                                                     |
| --- | ------------------------------------------------- | ------------------- | -------- | ---------- | -------------------------------------------------------------- |
| T14 | AI provider API key exfiltration                  | I (Info Disclosure) | CRITICAL | Medium     | `SecretProvider`; key rotation procedure; audit log access     |
| T15 | Prompt injection exposing tenant data across orgs | I (Info Disclosure) | HIGH     | Medium     | AES-256-GCM envelope with AAD binding; org-scoped AI state     |
| T16 | AI tool permission bypass via crafted tool calls  | E (Elevation)       | HIGH     | Medium     | Platform RBAC namespace; tool-call authorization per operation |

#### TB5: API ↔ R2 Storage

| #   | Threat                                              | STRIDE              | Severity | Likelihood | Mitigation                                                         |
| --- | --------------------------------------------------- | ------------------- | -------- | ---------- | ------------------------------------------------------------------ |
| T17 | Publicly readable document uploads                  | I (Info Disclosure) | CRITICAL | Low        | Presigned URLs with expiry; tenant-scoped prefixes; access logging |
| T18 | Malicious file upload (malware in document storage) | T (Tampering)       | MEDIUM   | Low        | File type validation; virus scanning (roadmap); size limits        |

### 0.3 NIST CSF 2.0 Gap Analysis Structure

The NIST CSF baseline (`docs/05-security/nist-csf-baseline.md`) will map every subcategory across the five functions:

```
IDENTIFY (ID)
├── ID.AM  — Asset Management         → Partial (inventory exists, no formal CMDB)
├── ID.BE  — Business Environment     → Partial (mission documented, dependencies not mapped)
├── ID.GV  — Governance               → Partial (policies exist, no formal risk committee)
├── ID.RA  — Risk Assessment          → Missing  (this SDD creates baseline)
├── ID.RM  — Risk Management Strategy → Missing  (roadmap)
└── ID.SC  — Supply Chain Risk Mgmt   → Partial (drenyra-x6 addresses this)

PROTECT (PR)
├── PR.AA  — Identity Mgmt & Access   → Partial (unified RBAC + MFA address this)
├── PR.AT  — Awareness & Training     → Missing  (roadmap)
├── PR.DS  — Data Security            → Partial (encryption exists, no TDE)
├── PR.IR  — Technology IR            → Missing  (this SDD creates runbook)
├── PR.MA  — Maintenance              → Partial (CI/CD exists, patch policy missing)
└── PR.PS  — Platform Security        → Partial (hardening not formalized)

DETECT (DE)
├── DE.AE  — Anomalies & Events       → Partial (access logs exist, no anomaly detection)
├── DE.CM  — Continuous Monitoring    → Missing  (Phase 4 documents gap)

RESPOND (RS)
├── RS.MA  — Incident Management      → Missing  (this SDD creates runbook)
├── RS.AN  — Analysis                 → Missing  (forensic capability gap)
├── RS.CO  — Communication            → Missing  (notification templates in runbook)
└── RS.MI  — Mitigation               → Partial (rate limiting, lockout exist)

RECOVER (RC)
├── RC.RP  — Recovery Planning        → Partial (backup exists, RTO/RPO not defined)
└── RC.CO  — Communications           → Missing  (roadmap)
```

The baseline document will score each subcategory with rationale and prioritize gaps as Critical / High / Medium / Low.

---

## Phase 1: RBAC Unification

### 1.1 Canonical Model

#### Unified Role Hierarchy

```
Level 8: superadmin  ─── Platform owner; all business + platform permissions
Level 7: admin       ─── Platform administrator; all platform perms, most business
Level 6: owner       ─── Company owner; full business perms, limited platform
Level 5: senior      ─── Senior accountant; write business, read platform
Level 4: analyst     ─── Analyst; read business, limited platform write
Level 3: junior      ─── Junior accountant; basic business, read-only platform
Level 2: client      ─── External client; read-only own data
Level 1: viewer      ─── Read-only observer; audit trail access, no write
```

**Special roles:**

| Role      | Source System | Behavior                                                           |
| --------- | ------------- | ------------------------------------------------------------------ |
| `service` | System 2      | Maps to `analyst` level (4) with limited platform-only permissions |
| `auditor` | System 2      | Maps to `viewer` level (1) with elevated audit:* permissions       |

These are **mapped** rather than added as hierarchy levels. The `service` and `auditor` roles exist in the database but resolve to hierarchy levels 4 and 1 respectively with specialized permission sets that override the default level-based grants.

#### Unified Permission Namespaces

**Business namespace** (`business:*`) — 22 permissions from System 1, normalized:

```
business:company:create       business:company:delete
business:company:update       business:company:read
business:journal:read         business:journal:create
business:journal:update       business:journal:update_draft
business:journal:delete       business:sunat:declare
business:sunat:read           business:accounting:close
business:accounting:open      business:reports:read_all
business:reports:read_operational  business:reports:read_basic
business:payroll:read         business:payroll:manage
business:users:create_staff   business:users:invite_team
business:users:read           business:audit:read
```

**Platform namespace** (`platform:*`) — 18 permissions from System 2, normalized:

```
platform:ai:tool-permissions:manage    platform:ai:tool-permissions:read
platform:cognitive:stream              platform:cognitive:state:read
platform:cognitive:approval:resolve    platform:cognitive:recover
platform:documents:query:read          platform:documents:review:update
platform:documents:upload:create       platform:sire:audit:stream
platform:sire:submit                   platform:audit:trail:read
platform:audit:trail:export            platform:observability:runs:read
platform:observability:runs:events:read  platform:observability:batches:read
platform:observability:batches:write   platform:observability:memory:read
```

#### Role-Permission Mapping Matrix

```
                    superadmin  admin  owner  senior  analyst  junior  client  viewer
BUSINESS:
company:create          ✓        ✓      ✓       ✗       ✗        ✗       ✗       ✗
company:delete          ✓        ✓      ✓       ✗       ✗        ✗       ✗       ✗
company:update          ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
company:read            ✓        ✓      ✓       ✓       ✓        ✓       ✓       ✓
journal:read            ✓        ✓      ✓       ✓       ✓        ✓       ✗       ✗
journal:create          ✓        ✓      ✓       ✓       ✓        ✓       ✗       ✗
journal:update          ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
journal:update_draft    ✓        ✓      ✓       ✓       ✓        ✓       ✗       ✗
journal:delete          ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
sunat:declare           ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
sunat:read              ✓        ✓      ✓       ✓       ✓        ✓       ✗       ✗
accounting:close        ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
accounting:open         ✓        ✓      ✓       ✗       ✗        ✗       ✗       ✗
reports:read_all        ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
reports:read_operational ✓       ✓      ✓       ✓       ✓        ✓       ✗       ✗
reports:read_basic      ✓        ✓      ✓       ✓       ✓        ✓       ✓       ✗
payroll:read            ✓        ✓      ✓       ✓       ✗        ✗       ✓       ✗
payroll:manage          ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
users:create_staff      ✓        ✓      ✓       ✗       ✗        ✗       ✗       ✗
users:invite_team       ✓        ✓      ✓       ✓       ✗        ✗       ✓       ✗
users:read              ✓        ✓      ✓       ✓       ✓        ✓       ✗       ✗
audit:read              ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗

PLATFORM:
ai:tool-permissions:*   ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
cognitive:stream        ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✗
cognitive:state:read    ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✓
cognitive:approval:*    ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
cognitive:recover       ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✗
documents:query:read    ✓        ✓      ✓       ✓       ✓        ✗       ✓       ✓
documents:review:update ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✗
documents:upload:create ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✗
sire:audit:stream       ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✗
sire:submit             ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✗
audit:trail:read        ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✓
audit:trail:export      ✓        ✓      ✓       ✓       ✗        ✗       ✗       ✓
observability:runs:read ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✗
observability:events:*  ✓        ✓      ✓       ✓       ✓        ✗       ✗       ✗
observability:batches:read ✓     ✓      ✓       ✓       ✓        ✗       ✗       ✗
observability:batches:write ✓    ✓      ✓       ✓       ✗        ✗       ✗       ✗
observability:memory:read ✓     ✓      ✓       ✓       ✓        ✗       ✗       ✗
```

**Service role override:** `service` at hierarchy level 4 gets ONLY:

- `platform:cognitive:stream`, `platform:cognitive:state:read`, `platform:cognitive:recover`, `platform:documents:query:read`

**Auditor role override:** `auditor` at hierarchy level 1 gets ONLY:

- `platform:cognitive:state:read`, `platform:documents:query:read`, `platform:audit:trail:read`, `platform:audit:trail:export`

### 1.2 Package Architecture

```
packages/security/                      ← NEW PACKAGE
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                        ← Public API barrel
│   ├── rbac/
│   │   ├── index.ts
│   │   ├── unified-roles.ts            ← Role type, hierarchy, helpers
│   │   ├── unified-permissions.ts      ← Business + platform namespaces
│   │   ├── unified-guard.ts            ← hasBusinessPermission, hasPlatformPermission,
│   │   │                                   requirePermission, resolveActor
│   │   └── role-permission-map.ts      ← The canonical matrix (generated, not hand-maintained)
│   ├── secrets/
│   │   ├── index.ts
│   │   ├── provider.ts                 ← SecretProvider interface
│   │   ├── env-provider.ts             ← Env-var implementation
│   │   ├── validation.ts              ← Startup validation logic
│   │   └── inventory.ts               ← Secrets inventory constants
│   └── mfa/
│       ├── index.ts
│       ├── totp.ts                     ← TOTP generation/verification (RFC 6238)
│       ├── recovery-codes.ts           ← Recovery code generation & hashing
│       └── types.ts                    ← MFA-related types
└── __tests__/
    ├── rbac/
    │   ├── unified-roles.test.ts
    │   ├── unified-permissions.test.ts
    │   ├── unified-guard.test.ts
    │   └── role-permission-map.test.ts
    ├── secrets/
    │   ├── env-provider.test.ts
    │   └── validation.test.ts
    └── mfa/
        ├── totp.test.ts
        └── recovery-codes.test.ts
```

**Why a new `packages/security` package?** Both `apps/api` and `packages/infrastructure` need RBAC logic. MFA logic is used by auth routes and middleware. Secret provider is used everywhere. A dedicated package avoids circular dependencies and provides a single import path.

### 1.3 Unified Guard API

```typescript
// packages/security/src/rbac/unified-guard.ts

// ── Types ──

export interface UnifiedActor {
  userId: string
  authUserId: string
  legacyUserId: string | null
  role: UnifiedRole
  companyId: string
}

// ── Guard functions ──

/** Checks a business-namespace permission against role hierarchy */
export function hasBusinessPermission(
  role: UnifiedRole,
  permission: BusinessPermission
): boolean

/** Checks a platform-namespace permission against role hierarchy */
export function hasPlatformPermission(
  role: UnifiedRole,
  permission: PlatformPermission
): boolean

/** Asserts permission; throws ForbiddenError on denial */
export function requireBusinessPermission(
  actor: UnifiedActor,
  permission: BusinessPermission
): void

/** Asserts platform permission; throws ForbiddenError on denial */
export function requirePlatformPermission(
  actor: UnifiedActor,
  permission: PlatformPermission
): void

/** Extracts actor from request (replaces resolveSecurityActor + session context) */
export function resolveActor(
  headers: Record<string, unknown>,
  session?: SessionData
): UnifiedActor | null

/** Pure check: does roleA outrank roleB? */
export function isRoleHigher(roleA: UnifiedRole, roleB: UnifiedRole): boolean

/** Returns all permissions granted to a role */
export function getPermissionsForRole(role: UnifiedRole): {
  business: BusinessPermission[]
  platform: PlatformPermission[]
}
```

### 1.4 Dual-Write Migration Architecture

```
┌────────────────────────────────────────────────────────┐
│                   REQUEST FLOW                          │
│                                                        │
│  Request ──▶ resolveActor() ──▶ UNIFIED_RBAC_ENABLED?  │
│                                       │                │
│                     ┌─────────────────┴──────────────┐ │
│                     ▼                                ▼ │
│              ENABLED=true                    ENABLED=false
│                     │                                │ │
│           unifiedGuard            ┌──────────────────┤ │
│           evaluates               │ OLD System 1     │ │
│              │                    │ (permissions.ts) │ │
│              │                    │ decides          │ │
│              ├── ALLOW ───────────┤                  │ │
│              ├── DENY  ───────────┤                  │ │
│              │                    │ OLD System 2     │ │
│              │                    │ (rbac-policy.ts) │ │
│              │                    │ decides          │ │
│              ▼                    └──────┬───────────┘ │
│        ┌──────────┐                      │             │
│        │DUAL-WRITE│◀── also runs unified │             │
│        │  LOGGER  │    guard in shadow   │             │
│        │          │    mode; logs any    │             │
│        │          │    discrepancy      │             │
│        └──────────┘                      │             │
│              │                           ▼             │
│              ▼                     RETURN RESULT       │
│        RETURN RESULT                                    │
└────────────────────────────────────────────────────────┘
```

**Dual-write logger behavior (when `UNIFIED_RBAC_ENABLED=false`):**

1. Old system evaluates and returns the decision
2. Unified guard also evaluates the same request in shadow mode
3. If old=ALLOW and unified=DENY → log WARNING: "Shadow denial: [perm] for role [role] — unified system would block"
4. If old=DENY and unified=ALLOW → log INFO: "Shadow grant: [perm] for role [role] — unified system would allow"
5. Metrics: count discrepancies by route and role for pre-cutover audit

### 1.5 Feature Flag Design

```typescript
// packages/security/src/rbac/feature-flags.ts

export const RBAC_FEATURE_FLAGS = {
  /** Master switch: when false, old dual-system guards decide */
  UNIFIED_RBAC_ENABLED: process.env.UNIFIED_RBAC_ENABLED !== 'false',

  /** When UNIFIED_RBAC_ENABLED=false, run unified guard in shadow mode */
  DUAL_WRITE_SHADOW_MODE: process.env.DUAL_WRITE_SHADOW_MODE !== 'false',
} as const
```

**Flag lifecycle:**

1. Week 1-2: `UNIFIED_RBAC_ENABLED=false`, `DUAL_WRITE_SHADOW_MODE=true` — shadow mode, gather data
2. Week 3: `UNIFIED_RBAC_ENABLED=true` — cutover, old guards become wrappers
3. Week 4+: Remove `DUAL_WRITE_SHADOW_MODE` code; keep `UNIFIED_RBAC_ENABLED` as permanent rollback switch

### 1.6 Call Site Migration Map

Files importing from old RBAC systems (estimated ~15-20 files):

| Current Import                                  | New Import                             | Files Affected |
| ----------------------------------------------- | -------------------------------------- | -------------- |
| `@drenyra/infrastructure/auth` (permissions.ts) | `@drenyra/security/rbac`               | ~12 files      |
| `./rbac-policy` (System 2)                      | `@drenyra/security/rbac`               | ~6 files       |
| `./permission-guard` (Elysia plugin)            | Updated to use unified guard           | 1 file         |
| `./route-permission-guard`                      | Updated to use unified guard           | 1 file         |
| `./route-permissions`                           | Updated to use BusinessPermission type | 1 file         |

**Deprecation wrappers in old files:**

```typescript
// packages/infrastructure/src/auth/permissions.ts (post-migration)
/** @deprecated Use `@drenyra/security/rbac` — `hasBusinessPermission()` */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return hasBusinessPermission(
    mapLegacyRole(role),
    mapLegacyPermission(permission)
  )
}
```

### 1.7 Route Protection Matrix Audit

The 31 mounted surfaces must be audited for RBAC migration. Each surface's `authMode` maps to a guard strategy:

| authMode                 | Guard Strategy                                            | Mapped Namespace |
| ------------------------ | --------------------------------------------------------- | ---------------- |
| `public`                 | No guard                                                  | N/A              |
| `session`                | `requireBusinessPermission`                               | `business:*`     |
| `bearer-tenant`          | `requireBusinessPermission` + tenant validation           | `business:*`     |
| `legacy-header-fallback` | Dual guard during migration → `requireBusinessPermission` | `business:*`     |
| `ai-surface`             | `requirePlatformPermission`                               | `platform:*`     |
| `signed-machine`         | Machine caller validation + `requirePlatformPermission`   | `platform:*`     |

**Key surfaces requiring special attention:**

- `sire-audit` (AI surface) — currently shares prefix `/api/ai-swarm` with `ai-swarm` and `context-control-plane`; needs distinct RBAC mapping
- `fiscal-command-center` + `fiscal-truth` — bearer-tenant; business namespace with SUNAT permissions
- `banking-providers` — legacy-header-fallback; needs hardening to session-based auth

---

## Phase 2: MFA/2FA Implementation

> **2026 update**: Based on current best practices (OWASP ASVS 5.0, NIST SP 800-63-4), passkeys (FIDO2/WebAuthn) are the gold standard for financial application MFA. They provide **phishing resistance** (NIST AAL3 equivalent, resisting real-time credential harvesting and relay attacks that TOTP is vulnerable to) and **better UX** (biometric/platform-native, no codes to type).
>
> This design prioritizes **passkeys as the primary MFA method**, with **TOTP as fallback** for users/browsers that cannot support WebAuthn. The fallback path ensures zero users are locked out during the transition.

### 2.1 MFA Methods Hierarchy

```
MFA METHOD SELECTION
│
├── 1. Passkeys (FIDO2/WebAuthn) ← PRIMARY
│     └── Platform authenticator (Touch ID, Windows Hello, Android biometric)
│     └── Roaming authenticator (YubiKey, security key)
│     └── NIST AAL3 — phishing resistant
│
├── 2. TOTP (RFC 6238) ← FALLBACK
│     └── Authenticator app (Google Authenticator, Authy, 1Password)
│     └── NIST AAL2 — not phishing resistant
│
└── 3. Recovery codes (single-use, bcrypt-hashed) ← EMERGENCY
      └── 8 codes, each 10 characters
      └── Consumed one at a time, index-tracked
```

### 2.2 Integration Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BETTERAUTH FLOW                              │
│                                                                      │
│  ┌──────────┐    ┌──────────────┐     ┌──────────┐                 │
│  │ Password │───▶│ PASSKEY/TOTP │────▶│ Session  │                 │
│  │   Auth   │    │  Challenge   │     │  Issued  │                 │
│  │ (Better  │    │  (MFA Plugin)│     │ (HTTP-   │                 │
│  │  Auth)   │    │              │     │  Only)   │                 │
│  └──────────┘    └──────────────┘     └──────────┘                 │
│       │                │                     │                     │
│       │        ┌───────┴────────┐            │                     │
│       │        │  Passkey first │            │                     │
│       │        │  ├─ WebAuthn   │            │                     │
│       │        │  │  available? │            │                     │
│       │        │  │  ├─ yes →   │            │                     │
│       │        │  │  │  challenge│           │                     │
│       │        │  │  └─ no  →   │            │                     │
│       │        │  │     TOTP    │            │                     │
│       │        │  │     challenge│           │                     │
│       │        │  Recovery     │            │                     │
│       │        │  Code Path    │            │                     │
│       │        └───────────────┘            │                     │
│       ▼                                     ▼                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              MFA MIDDLEWARE                               │    │
│  │                                                            │    │
│  │  Route Matrix: requireMfa?                                 │    │
│  │  ┌──── yes ────▶ check session.mfaVerified                 │    │
│  │  │                 ├── true ──▶ proceed                    │    │
│  │  │                 └── false ──▶ step-up                   │    │
│  │  └──── no  ────▶ proceed                                   │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 BetterAuth MFA Plugin

BetterAuth ships a WebAuthn plugin from v1.x and does not ship a TOTP plugin. We implement a custom unified MFA plugin that supports both passkeys (WebAuthn) and TOTP, hooking into `auth.config.ts`:

```typescript
// packages/security/src/mfa/better-auth-mfa-plugin.ts

import type { BetterAuthPlugin } from 'better-auth'
import { webauthn } from 'better-auth/plugins'

export function mfaPlugin(options: MfaPluginOptions): BetterAuthPlugin {
  return {
    id: 'drenyra-mfa',
    hooks: {
      before: [
        {
          matcher: (context) => context.path === '/sign-in/email',
          handler: async (ctx) => {
            // 1. Password auth succeeds
            // 2. Check user's mfa_method preference: "passkey" | "totp" | "none"
            // 3. If passkey → return { mfa_required: true, mfa_type: "passkey", mfa_token }
            // 4. If totp → return { mfa_required: true, mfa_type: "totp", mfa_token }
            // 5. If none → proceed to session issuance
          },
        },
      ],
    },
    endpoints: {
      // POST /api/auth/mfa/passkey/register — register WebAuthn credential
      registerPasskey: async (ctx) => {
        /* ... */
      },
      // POST /api/auth/mfa/passkey/authenticate — authenticate with passkey
      authenticatePasskey: async (ctx) => {
        /* ... */
      },
      // POST /api/auth/mfa/totp/verify — verify TOTP code, issue session
      verifyTotp: async (ctx) => {
        /* ... */
      },
      // POST /api/auth/mfa/totp/enroll — start TOTP enrollment
      enrollTotp: async (ctx) => {
        /* ... */
      },
      // POST /api/auth/mfa/recover — redeem recovery code
      recoverMfa: async (ctx) => {
        /* ... */
      },
      // POST /api/auth/mfa/disable — disable MFA (requires recent session)
      disableMfa: async (ctx) => {
        /* ... */
      },
    },
  }
}
```

### 2.4 Passkey Implementation (FIDO2/WebAuthn)

```typescript
// packages/security/src/mfa/passkey.ts

import { webauthn } from 'better-auth/plugins'

/**
 * WebAuthn configuration for passkey registration/authentication.
 *
 * BetterAuth's webauthn plugin handles the WebAuthn ceremony.
 * We configure it with financial-grade settings:
 * - Require user verification (biometric/PIN, not just presence)
 * - Prefer platform authenticator over cross-platform
 * - RP ID: app.drenyrafounders.com (production), localhost (dev)
 * - Authenticator attachment: platform (preferred) | cross-platform (fallback)
 */
export const passkeyConfig = {
  name: 'Drenyra',
  rpID: process.env.WEBAUTHN_RP_ID ?? 'localhost',
  origin: process.env.WEBAUTHN_ORIGIN ?? 'http://localhost:5173',
  userVerification: 'required' as const, // biometric or PIN
  authenticatorSelection: {
    userVerification: 'required',
    residentKey: 'required', // discoverable credential
    authenticatorAttachment: 'platform', // platform authenticator preferred
  },
  attestation: 'none' as const, // skip attestation for privacy
}
```

**BetterAuth's webauthn plugin** handles the WebAuthn ceremony (credential creation, assertion, attestation). The Drenyra plugin layer adds:

- MFA session binding (passkey auth → session.mfaVerified = true)
- Audit logging of passkey registration and authentication
- Fallback to TOTP when WebAuthn is unavailable

### 2.5 TOTP Implementation (RFC 6238) — Fallback

```typescript
// packages/security/src/mfa/totp.ts

import { createHmac, randomBytes } from 'node:crypto'

const TOTP_DIGITS = 6
const TOTP_PERIOD = 30 // seconds
const TOTP_WINDOW = 1 // ±1 step tolerance

export interface TotpConfig {
  issuer: string // "Drenyra"
  account: string // user email
  secret: string // base32-encoded secret
  algorithm: 'sha1' | 'sha256' | 'sha512'
  digits: 6 | 8
  period: number
}

export function generateTotpSecret(): string {
  /* 20 random bytes → base32 */
}
export function generateTotpUri(config: TotpConfig): string {
  /* otpauth://totp/... */
}
export function verifyTotp(
  secret: string,
  code: string,
  window?: number
): boolean {
  /* ... */
}
```

### 2.6 MFA Session Step-Up Flow

```
User accesses route with requireMfa: true
        │
        ▼
┌─────────────────────┐
│ Session valid?      │── no ──▶ 401
└──────┬──────────────┘
       │ yes
       ▼
┌─────────────────────┐
│ session.mfaVerified │── yes ──▶ PROCEED
│ === true?           │
└──────┬──────────────┘
       │ no
       ▼
┌──────────────────────┐
│ User mfa_method?     │
│ "passkey" | "totp"   │
│ | undefined          │
└──────┬───────────────┘
       │
       ├── undefined ──▶ PROCEED (user never enrolled)
       │
       ├── "passkey" ──▶ Client POSTs /api/auth/mfa/passkey/authenticate
       │                    │ with mfa_token
       │                    ▼
       │              ┌─────────────────────┐
       │              │ WebAuthn assertion   │
       │              │ challenge + verify   │
       │              │ Update session       │
       │              │ mfaVerified = true   │
       │              └──────┬──────────────┘
       │                     │ success
       │                     ▼
       │                   PROCEED
       │
       └── "totp" ────▶ Client POSTs /api/auth/mfa/totp/verify
                            │ with mfa_token + totp_code
                            ▼
                      ┌─────────────────────┐
                      │ Verify TOTP code     │
                      │ Update session       │
                      │ mfaVerified = true   │
                      └──────┬──────────────┘
                             │ success
                             ▼
                           PROCEED
```

**Key UX flow for passkey step-up:**

1. Client calls protected endpoint → gets 401 with `code: MFA_STEPUP, mfa_type: "passkey"`
2. Client calls `navigator.credentials.get()` with the challenge from `/api/auth/mfa/passkey/authenticate`
3. Browser shows platform biometric dialog (Touch ID, Windows Hello)
4. Client POSTs the assertion to the API for verification
5. On success, session is updated with `mfaVerified: true`

This provides **phishing-resistant authentication** — even if an attacker tricks the user into visiting a fake site, the WebAuthn assertion is bound to the RP ID (origin), so it won't verify on the attacker's domain.

**MFA token (temporary):** A short-lived JWT (5 min) issued after password auth or step-up challenge. Contains `{ userId, purpose: "mfa_verify" | "mfa_enroll" }`. Signed with `BETTER_AUTH_SECRET`.

### 2.5 Recovery Codes

```typescript
// packages/security/src/mfa/recovery-codes.ts

const RECOVERY_CODE_COUNT = 8
const RECOVERY_CODE_LENGTH = 10 // e.g., "A1B2C3D4E5"

export function generateRecoveryCodes(): string[] {
  /* 8 random codes */
}
export function hashRecoveryCode(code: string): Promise<string> {
  /* bcrypt */
}
export function verifyRecoveryCode(
  code: string,
  hashes: string[]
): Promise<number | null> {
  /* Returns index of matched code, or null */
}
```

Recovery codes are bcrypt-hashed (cost 10) and stored as a JSON array in `auth_users.recovery_codes`. When a code is consumed, the hash at that index is replaced with `null`. This preserves index-based audit logging.

### 2.6 Route Protection Matrix Extension

Extend `RouteProtectionMatrixRow` with an optional `requireMfa` field:

```typescript
// New field in RouteProtectionMatrixRow
export interface RouteProtectionMatrixRow {
  // ... existing fields ...
  readonly requireMfa?: boolean // NEW: requires MFA step-up
}
```

Initial MFA-protected routes (conservative starting set):

- `/api/company-settings` — company-wide settings changes
- `/api/users/staff` — creating staff accounts
- `/api/sunat/api` — SUNAT declarations
- `/api/fiscal/command-center` — fiscal command operations
- `/api/fiscal/truth` — fiscal truth engine

### 2.7 MFA Feature Flag

```typescript
// apps/api/src/features/auth/mfa/feature-flags.ts

export const MFA_FEATURE_FLAGS = {
  /** Master switch: when false, MFA middleware is a no-op */
  TOTP_ENABLED: process.env.TOTP_ENABLED !== 'false',

  /** When true, MFA is opt-in (enrollment is available but not forced) */
  MFA_OPT_IN: process.env.MFA_OPT_IN !== 'false',
} as const
```

---

## Phase 3: Secret Management Hardening

### 3.1 SecretProvider Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   APPLICATION CODE                        │
│                                                          │
│  import { secrets } from "@drenyra/security/secrets";    │
│                                                          │
│  const dbUrl = await secrets.getSecret("DATABASE_URL");  │
│  // Consumer doesn't care if it's env var or vault       │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   SecretProvider Interface                │
│                                                          │
│  interface SecretProvider {                              │
│    getSecret(name: string): Promise<string>;             │
│    validateSecrets(): Promise<ValidationResult>;         │
│  }                                                       │
└──────────┬───────────────────────┬───────────────────────┘
           │                       │
           ▼                       ▼
┌──────────────────┐    ┌──────────────────────┐
│  EnvProvider     │    │  InfisicalProvider    │
│  (current)       │    │  (future/roadmap)     │
│                  │    │                       │
│  process.env[]   │    │  Infisical SDK        │
└──────────────────┘    └──────────────────────┘
```

### 3.2 Secrets Inventory

```typescript
// packages/security/src/secrets/inventory.ts

export interface SecretMetadata {
  name: string
  scope: 'dev' | 'staging' | 'prod' | 'all'
  rotation: '30d' | '90d' | '180d' | 'manual' | 'never'
  blastRadius: 'session' | 'encryption' | 'database' | 'api' | 'infrastructure'
  minEntropy?: number // bits
  required: boolean
  notes: string
}

export const SECRETS_INVENTORY: SecretMetadata[] = [
  {
    name: 'BETTER_AUTH_SECRET',
    scope: 'all',
    rotation: '90d',
    blastRadius: 'session',
    minEntropy: 128,
    required: true,
    notes: 'Session signing key. Rotation invalidates all sessions.',
  },
  {
    name: 'DATABASE_URL',
    scope: 'all',
    rotation: '180d',
    blastRadius: 'database',
    required: true,
    notes: 'PostgreSQL connection string. Contains credentials.',
  },
  {
    name: 'SUNAT_CLIENT_ID',
    scope: 'prod',
    rotation: 'manual',
    blastRadius: 'api',
    required: true,
    notes: 'SUNAT API OAuth client ID. Rotation requires SUNAT portal.',
  },
  {
    name: 'SUNAT_CLIENT_SECRET',
    scope: 'prod',
    rotation: 'manual',
    blastRadius: 'api',
    minEntropy: 128,
    required: true,
    notes: 'SUNAT API OAuth secret. Rotation requires SUNAT portal.',
  },
  {
    name: 'DRENYRA_MASTER_KEY',
    scope: 'all',
    rotation: 'manual',
    blastRadius: 'encryption',
    minEntropy: 128,
    required: true,
    notes:
      'Master passphrase for E2E encryption. Rotation requires data re-encryption.',
  },
  {
    name: 'LLM_GATEWAY_KEY_PASSPHRASE',
    scope: 'all',
    rotation: 'manual',
    blastRadius: 'encryption',
    minEntropy: 128,
    required: false,
    notes: 'AI tool context encryption passphrase.',
  },
  {
    name: 'ARKELYTHEX_AES256_KEY',
    scope: 'all',
    rotation: '90d',
    blastRadius: 'encryption',
    minEntropy: 256,
    required: false,
    notes: 'AI context AES-256 key (32 bytes).',
  },
  // R2/S3 keys
  {
    name: 'R2_ACCESS_KEY_ID',
    scope: 'all',
    rotation: '90d',
    blastRadius: 'infrastructure',
    required: false,
    notes: 'Cloudflare R2 access key.',
  },
  {
    name: 'R2_SECRET_ACCESS_KEY',
    scope: 'all',
    rotation: '90d',
    blastRadius: 'infrastructure',
    minEntropy: 128,
    required: false,
    notes: 'Cloudflare R2 secret key.',
  },
]
```

### 3.3 Startup Validation

```typescript
// packages/security/src/secrets/validation.ts

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  secretName: string
  reason: 'missing' | 'empty' | 'placeholder' | 'low_entropy'
  detail: string
}

export async function validateSecrets(
  provider: SecretProvider,
  options?: { strict?: boolean }
): Promise<ValidationResult> {
  // 1. Check every secret in SECRETS_INVENTORY
  // 2. For each required secret: non-empty, non-placeholder (e.g., "changeme")
  // 3. In strict mode: entropy check for cryptographic secrets
  // 4. In production (non-strict): log ERROR but don't crash
}
```

**Behavior by environment:**

| Environment                | Strict Mode | Missing Required  | Low Entropy       | Action                         |
| -------------------------- | ----------- | ----------------- | ----------------- | ------------------------------ |
| CI                         | true        | `process.exit(1)` | `process.exit(1)` | Hard fail                      |
| Development                | false       | WARN log          | WARN log          | Continue                       |
| Production (default)       | false       | ERROR log         | ERROR log         | Continue, health check reports |
| Production (opt-in strict) | true        | `process.exit(1)` | `process.exit(1)` | Hard fail                      |

### 3.4 Pre-Commit Hook

```bash
#!/bin/bash
# .husky/pre-commit (addition to existing hooks)

# Secret patterns to detect
PATTERNS=(
  # API keys (common formats)
  '[a-zA-Z0-9_-]{32,}'
  # Private key headers
  '-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----'
  # Connection strings with credentials
  '(mongodb|postgres|mysql|redis)://[^:]+:[^@]+@'
  # High-entropy base64 (possible secrets)
  '[A-Za-z0-9+/]{40,}={0,2}'
)

# Files to skip
SKIP_GLOBS="*.test.ts *.spec.ts *.md .env.example"

for pattern in "${PATTERNS[@]}"; do
  matches=$(git diff --cached --name-only | \
    grep -v -E "$(echo $SKIP_GLOBS | tr ' ' '|')" | \
    xargs grep -n -E "$pattern" 2>/dev/null | \
    grep -v "// nosec")

  if [ -n "$matches" ]; then
    echo "❌ SECURITY: Possible secret detected in staged files:"
    echo "$matches"
    echo ""
    echo "If this is a false positive, add '// nosec' on the line."
    echo "Otherwise, use environment variables or the SecretProvider."
    exit 1
  fi
done
```

### 3.5 Vault Migration Strategy (Infisical)

**Phase A — Assessment (now):**

- Complete secrets inventory (this SDD)
- `SecretProvider` abstraction implemented
- All code migrated to `secrets.getSecret()` instead of `process.env`

**Phase B — Infisical Deployment (separate SDD):**

1. Deploy Infisical (open-source) in staging environment
2. Import secrets from `.env` into Infisical
3. Implement `InfisicalProvider` implementing `SecretProvider`
4. Switch via `SECRET_PROVIDER=infisical` env var
5. Validate all secrets resolve correctly
6. Deprecate env-var secrets in production

**Phase C — Cleanup (separate SDD):**

1. Remove plaintext secrets from deployment environment
2. Enable Infisical audit logging
3. Rotate all secrets through Infisical
4. Remove `EnvProvider` from production path

### 3.6 Key Rotation Procedures

**BETTER_AUTH_SECRET rotation:**

1. Generate new 256-bit secret: `openssl rand -hex 32`
2. Deploy to all instances as `BETTER_AUTH_SECRET_NEW`
3. During maintenance window, swap: `BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET_NEW`
4. Restart all instances
5. **Blast radius:** All sessions invalidated. Users must re-login.
6. Recommend: 2 AM Saturday maintenance window, 15 min downtime

**DRENYRA_MASTER_KEY rotation:**

1. Generate new passphrase
2. Deploy as `DRENYRA_MASTER_KEY_NEW`
3. Run data migration script: reads all encrypted fiscal data with old key, re-encrypts with new key
4. Swap environment variable
5. **Blast radius:** All fiscal data re-encrypted. Migration duration depends on data volume.
6. **Current limitation:** No online rotation support. Requires read-only maintenance window.
7. Future: bring-your-own-key (BYOK) with key versioning would enable online rotation.

---

## Phase 4: Security Monitoring & Incident Response

### 4.1 Monitoring Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LOG SOURCES                           │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Access Logs  │  │ Auth Events  │  │ Error Logs   │  │
│  │ (ALLOW/DENY/ │  │ (login, MFA, │  │ (rate limit, │  │
│  │  FAILED)     │  │  lockout)    │  │  exceptions) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────┬───────┴─────────────────┘           │
│                   ▼                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │              LOG AGGREGATION                      │    │
│  │  (current: stdout + Fly logs)                     │    │
│  │  (roadmap: structured → Vector/ClickHouse)        │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │                                │
│                        ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │              ALERT TRIGGERS                       │    │
│  │                                                   │    │
│  │  ┌─ Threshold-based ───────────────────────────┐ │    │
│  │  │ • >10 failed logins/5min per account         │ │    │
│  │  │ • >5 failed MFA attempts per challenge       │ │    │
│  │  │ • >50 DENY events/1min across all routes      │ │    │
│  │  │ • Role/permission changes (each event)        │ │    │
│  │  │ • Destructive endpoint access by non-admin    │ │    │
│  │  │ • Secret validation failures at startup       │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Alert Trigger Definitions

| ID  | Trigger                     | Severity | Threshold                            | Response Time |
| --- | --------------------------- | -------- | ------------------------------------ | ------------- |
| A1  | Failed login spike          | HIGH     | >10 per account / 5 min              | 15 min        |
| A2  | MFA brute force             | HIGH     | >5 consecutive failures              | 15 min        |
| A3  | RBAC denial spike           | MEDIUM   | >50 DENY / 1 min                     | 30 min        |
| A4  | Role/permission change      | MEDIUM   | Any change                           | 1 hour        |
| A5  | Destructive endpoint access | HIGH     | Non-superadmin accessing DELETE/bulk | 15 min        |
| A6  | Secret validation failure   | CRITICAL | At startup                           | Immediate     |
| A7  | Unusual SUNAT query volume  | MEDIUM   | >2x baseline deviation               | 1 hour        |
| A8  | Session from new geo/IP     | LOW      | Per-user new IP detection            | 4 hours       |

### 4.3 Incident Response Playbooks

**Playbook 1: Credential Compromise**

```
DETECTION: Alert A1, A2, or user report
           │
           ▼
┌─────────────────────────────────┐
│ IMMEDIATE CONTAINMENT (15 min)   │
│ 1. Invalidate affected sessions  │
│ 2. Disable affected user account │
│ 3. Rotate BETTER_AUTH_SECRET     │
│    (if session hijack suspected) │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ INVESTIGATION (1 hour)           │
│ 1. Audit access logs for user   │
│ 2. Check for data exfiltration  │
│ 3. Identify compromise vector   │
│ 4. Check if other accounts      │
│    accessed same resources      │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ REMEDIATION                      │
│ 1. Force password reset          │
│ 2. Enable MFA if not enabled     │
│ 3. Rotate affected API keys      │
│ 4. Patch vulnerability           │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ NOTIFICATION                    │
│ 1. Notify affected user (email) │
│ 2. Internal incident report     │
│ 3. Regulatory notification      │
│    if PII affected (Peruvian    │
│    data protection law)         │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ POST-INCIDENT REVIEW (48 hours) │
│ 1. Root cause analysis          │
│ 2. Update threat model          │
│ 3. Update runbook if needed     │
│ 4. Schedule follow-up actions   │
└─────────────────────────────────┘
```

**Playbook 2: Brute Force / Credential Stuffing**

```
DETECTION: Alert A1 (sustained across multiple accounts)
           │
           ▼
┌─────────────────────────────────┐
│ IMMEDIATE CONTAINMENT (15 min)   │
│ 1. Reduce AUTH rate limit        │
│    window from 60s to 30s        │
│ 2. Block attacking IP ranges     │
│    (via Fly.io or WAF)           │
│ 3. Enable CAPTCHA if available   │
│    (roadmap — not yet)           │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ INVESTIGATION (1 hour)           │
│ 1. Identify targeted accounts   │
│ 2. Check for successful logins  │
│    from attacking IPs           │
│ 3. Geolocate attack source      │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ REMEDIATION                      │
│ 1. Force password reset for     │
│    targeted accounts            │
│ 2. Notify affected users        │
│ 3. Review rate limit config     │
│    for permanent hardening      │
└─────────────────────────────────┘
```

**Playbook 3: Data Exfiltration Suspicion**

```
DETECTION: Alert A7 (unusual SUNAT queries) or A5 (destructive access)
           │
           ▼
┌─────────────────────────────────┐
│ IMMEDIATE CONTAINMENT (15 min)   │
│ 1. Revoke suspect user's        │
│    sessions immediately         │
│ 2. Freeze suspect user's        │
│    account (not delete)         │
│ 3. Block egress if possible     │
│    (Fly.io network policies)    │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ INVESTIGATION (2-4 hours)        │
│ 1. Full access log audit for    │
│    suspect user (all time)      │
│ 2. Determine data scope: what   │
│    was accessed/queried         │
│ 3. Check tenant isolation:      │
│    cross-tenant access?         │
│ 4. Check for exports or bulk    │
│    data retrieval               │
│ 5. Preserve logs for forensics  │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ NOTIFICATION                    │
│ 1. Legal counsel review         │
│ 2. Peruvian data protection     │
│    authority notification       │
│    (if PII exfiltrated)         │
│ 3. Affected tenant notification │
│ 4. SUNAT notification if        │
│    fiscal data compromised      │
└─────────────────────────────────┘
```

**Playbook 4: Privilege Escalation Attempt**

```
DETECTION: Alert A4 (unauthorized role change) or A3 (RBAC denial spike)
           │
           ▼
┌─────────────────────────────────┐
│ IMMEDIATE CONTAINMENT (15 min)   │
│ 1. Revoke all sessions for      │
│    affected user               │
│ 2. Revert unauthorized role     │
│    changes in DB               │
│ 3. Enable UNIFIED_RBAC_ENABLED  │
│    = true (if disabled)        │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ INVESTIGATION (1-2 hours)        │
│ 1. Audit trail reconstruction:  │
│    who changed what, when       │
│ 2. Check if escalation was used │
│    to access protected data     │
│ 3. Identify escalation vector:  │
│    direct DB? API? session?     │
│ 4. Check for other accounts     │
│    with suspicious role changes │
└────────────┬────────────────────┘
             ▼
┌─────────────────────────────────┐
│ REMEDIATION                      │
│ 1. Patch escalation vector      │
│ 2. RBAC permission audit:       │
│    review all role assignments  │
│ 3. Add alerting for the         │
│    specific vector used         │
│ 4. Security review of RBAC      │
│    code path                    │
└─────────────────────────────────┘
```

### 4.4 Security Review Cadence

| Review                        | Frequency      | Trigger                                      | Owner            |
| ----------------------------- | -------------- | -------------------------------------------- | ---------------- |
| Threat model review           | Every 6 months | Calendar + post-incident + major arch change | Security lead    |
| NIST CSF re-baseline          | Annually       | Calendar                                     | Security lead    |
| RBAC permission audit         | Quarterly      | Calendar                                     | Engineering lead |
| Secret rotation audit         | Monthly        | Calendar                                     | DevOps           |
| Incident response drill       | Every 6 months | Calendar (tabletop)                          | Security lead    |
| Dependency vulnerability scan | Weekly         | CI automated                                 | CI pipeline      |

---

## Data Models

### Database Schema Changes

#### New columns on `auth_users`

```sql
-- MFA fields (Phase 2)
ALTER TABLE auth_users ADD COLUMN totp_secret TEXT;
ALTER TABLE auth_users ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE auth_users ADD COLUMN totp_verified_at TIMESTAMP;
ALTER TABLE auth_users ADD COLUMN recovery_codes JSONB;  -- bcrypt hash array
ALTER TABLE auth_users ADD COLUMN mfa_failure_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE auth_users ADD COLUMN mfa_last_failure_at TIMESTAMP;

-- Session MFA flag (Phase 2)
ALTER TABLE auth_sessions ADD COLUMN mfa_verified BOOLEAN NOT NULL DEFAULT false;
```

#### Drizzle Schema Extension

```typescript
// packages/persistence/src/schema/auth.schema.ts (additions)

export const authUsers = pgTable('auth_users', {
  // ... existing fields ...

  // MFA (Phase 2)
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
  totpVerifiedAt: timestamp('totp_verified_at'),
  recoveryCodes: jsonb('recovery_codes').$type<string[]>(),
  mfaFailureCount: integer('mfa_failure_count').notNull().default(0),
  mfaLastFailureAt: timestamp('mfa_last_failure_at'),
})

export const authSessions = pgTable('auth_sessions', {
  // ... existing fields ...

  // MFA step-up (Phase 2)
  mfaVerified: boolean('mfa_verified').notNull().default(false),
})
```

#### New RBAC Audit Table (Phase 1)

```sql
CREATE TABLE rbac_migration_audit (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  route TEXT NOT NULL,
  operation TEXT NOT NULL,
  role TEXT NOT NULL,
  old_result TEXT NOT NULL,   -- 'ALLOW' | 'DENY' | 'N/A'
  unified_result TEXT NOT NULL, -- 'ALLOW' | 'DENY' | 'N/A'
  discrepancy BOOLEAN NOT NULL DEFAULT false,
  details JSONB
);
```

### RBAC In-Memory Structures

```typescript
// packages/security/src/rbac/unified-roles.ts

export const UNIFIED_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  OWNER: 'owner',
  SENIOR: 'senior',
  ANALYST: 'analyst',
  JUNIOR: 'junior',
  CLIENT: 'client',
  VIEWER: 'viewer',
} as const

export type UnifiedRole = (typeof UNIFIED_ROLES)[keyof typeof UNIFIED_ROLES]

export const ROLE_HIERARCHY: Record<UnifiedRole, number> = {
  superadmin: 8,
  admin: 7,
  owner: 6,
  senior: 5,
  analyst: 4,
  junior: 3,
  client: 2,
  viewer: 1,
}

// Special role mappings (roles that exist in DB but not in hierarchy)
export const SPECIAL_ROLE_MAPPINGS: Record<
  string,
  { level: number; role: UnifiedRole }
> = {
  service: { level: 4, role: 'analyst' },
  auditor: { level: 1, role: 'viewer' },
}
```

---

## API Contracts

### MFA Endpoints

#### POST /api/auth/mfa/enroll

```
Auth: Session required
Body: -
Response 200:
{
  "secret": "JBSWY3DPEHPK3PXP",          // base32 TOTP secret
  "uri": "otpauth://totp/Drenyra:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Drenyra&algorithm=SHA1&digits=6&period=30",
  "qr_code": "data:image/png;base64,..."  // optional, can be generated client-side
}
Response 409: { "error": "MFA already enabled", "code": "MFA_ALREADY_ENABLED" }
```

#### POST /api/auth/mfa/verify-enrollment

```
Auth: Session required (enrollment session)
Body: { "code": "123456" }
Response 200:
{
  "success": true,
  "recovery_codes": ["A1B2C3D4E5", "F6G7H8I9J0", ...]  // 8 codes, shown once
}
Response 400: { "error": "Código TOTP inválido", "code": "INVALID_TOTP" }
Response 400: { "error": "Demasiados intentos. Reinicie el enrolamiento.", "code": "TOTP_ENROLL_LIMIT" }
```

#### POST /api/auth/mfa/verify

```
Auth: MFA token (short-lived JWT from password auth or step-up)
Body: { "mfa_token": "...", "code": "123456" }
Response 200:
{
  "success": true,
  "session": { /* BetterAuth session data */ }
}
Response 400: { "error": "Código TOTP inválido", "code": "INVALID_TOTP" }
Response 400: { "error": "Demasiados intentos. Vuelva a iniciar sesión.", "code": "TOTP_LIMIT_EXCEEDED" }
Response 401: { "error": "Token MFA expirado. Vuelva a iniciar sesión.", "code": "MFA_TOKEN_EXPIRED" }
```

#### POST /api/auth/mfa/recover

```
Auth: MFA token
Body: { "mfa_token": "...", "recovery_code": "A1B2C3D4E5" }
Response 200: { "success": true, "session": { ... } }
Response 400: { "error": "Código de recuperación inválido o ya utilizado", "code": "INVALID_RECOVERY_CODE" }
```

#### POST /api/auth/mfa/disable

```
Auth: Full session + recent MFA verification (within 5 min)
Body: -
Response 200: { "success": true }
Response 403: { "error": "Se requiere verificación MFA reciente", "code": "MFA_REQUIRED" }
```

### RBAC Guard API (Internal)

```typescript
// packages/security/src/rbac/unified-guard.ts

// Functional guard — returns boolean
hasBusinessPermission(role: UnifiedRole, permission: BusinessPermission): boolean
hasPlatformPermission(role: UnifiedRole, permission: PlatformPermission): boolean

// Assertive guard — throws ForbiddenError
requireBusinessPermission(actor: UnifiedActor, permission: BusinessPermission): void
requirePlatformPermission(actor: UnifiedActor, permission: PlatformPermission): void

// Actor resolution
resolveActor(headers: Record<string, unknown>, session?: SessionData): UnifiedActor | null

// Hierarchy check
isRoleHigher(roleA: UnifiedRole, roleB: UnifiedRole): boolean

// Introspection
getPermissionsForRole(role: UnifiedRole): { business: BusinessPermission[]; platform: PlatformPermission[] }
```

### SecretProvider API

```typescript
// packages/security/src/secrets/provider.ts

export interface SecretProvider {
  getSecret(name: string): Promise<string>
  validateSecrets(options?: { strict?: boolean }): Promise<ValidationResult>
}

// packages/security/src/secrets/env-provider.ts

export class EnvProvider implements SecretProvider {
  async getSecret(name: string): Promise<string>
  async validateSecrets(options?: {
    strict?: boolean
  }): Promise<ValidationResult>
}

// packages/security/src/secrets/index.ts (barrel)
import { EnvProvider } from './env-provider'

// Singleton — consumers do `import { secrets } from "@drenyra/security/secrets"`
export const secrets: SecretProvider = new EnvProvider()
```

---

## Migration Strategy

### Phase 1 RBAC Migration Sequence

```
WEEK 1               WEEK 2               WEEK 3               WEEK 4+
───────              ───────              ───────              ───────

1. Create            5. Write migration   8. Cutover:          11. Cleanup:
   packages/security    audit table         UNIFIED_RBAC_         Remove shadow
                                             ENABLED=true          mode code
2. Implement         6. Deploy with                           12. Keep feature
   unified roles,       DUAL_WRITE_       9. Monitor for         flag as
   permissions,         SHADOW_MODE=true     DENY spikes          permanent
   guard                                                         rollback
                     7. Run 48h in       10. Fix any
3. Write unit           production          discrepancies
   tests                (old decides)
4. Write migration
   wrappers in
   old modules
```

**Acceptance gate for cutover:**

- Shadow mode runs for ≥48 hours in production
- Zero HIGH-severity discrepancies (old=ALLOW, unified=DENY)
- All 31 route protection surfaces tested with unified RBAC
- Full test suite passes with `UNIFIED_RBAC_ENABLED=true`

### Phase 2 MFA Rollout

```
WEEK 1               WEEK 2               WEEK 3               WEEK 4+
───────              ───────              ───────              ───────

1. Implement TOTP    4. Internal team     7. MFA_OPT_IN=false  9. Enable MFA on
   logic in            dogfood MFA          (mandatory for       sensitive routes
   packages/security   enrollment           all users)
                                                               10. Monitor
2. DB migration      5. Fix UX issues     8. Communicate to      support load
   (new columns)                            all users
                     6. Write user docs
3. BetterAuth MFA
   plugin
```

### Phase 3 Secret Management

```
WEEK 1               WEEK 2               WEEK 3+
───────              ───────              ───────

1. Implement         3. Write migration   5. Audit all
   SecretProvider       guide for            process.env
   interface            Infisical            call sites
2. Implement         4. Deploy pre-       6. Migrate to
   EnvProvider          commit hook          secrets.getSecret()
   + validation
```

### Rollback Procedures

| Change            | Rollback Action                            | Downtime              |
| ----------------- | ------------------------------------------ | --------------------- |
| RBAC cutover      | `UNIFIED_RBAC_ENABLED=false` → restart     | ~5s (process restart) |
| MFA enrollment    | `TOTP_ENABLED=false` → restart             | ~5s                   |
| Secret validation | `SECRET_VALIDATION_STRICT=false` → restart | ~5s                   |
| Pre-commit hook   | Remove from `.husky/pre-commit`            | 0s (local only)       |

---

## Risk Register

| #   | Risk                                              | Severity | Mitigation                                             | Status |
| --- | ------------------------------------------------- | -------- | ------------------------------------------------------ | ------ |
| R1  | RBAC unification breaks production access         | CRITICAL | Dual-write shadow mode + feature flag rollback         | Design |
| R2  | MFA locks out users without recovery codes        | HIGH     | 8 recovery codes at enrollment; admin override         | Design |
| R3  | Secret validation crashes production              | HIGH     | Non-strict mode in production; health check visibility | Design |
| R4  | Route matrix has gaps not covered by unified RBAC | MEDIUM   | Full 31-surface audit as part of migration             | Design |
| R5  | H02 tenant isolation changes affect threat model  | LOW      | Threat model references H02 as dependency              | Design |
| R6  | Old RBAC call sites missed in migration           | MEDIUM   | Grep-based audit; deprecation warnings at import time  | Design |
| R7  | TOTP clock skew causes false rejections           | LOW      | RFC 6238 ±1 step window; NTP sync on servers           | Design |
| R8  | Pre-commit hook false positives block commits     | LOW      | `// nosec` bypass mechanism; test/spec file exclusion  | Design |

---

## File Change Summary

### New Files

| File                                                  | Phase | Purpose                                |
| ----------------------------------------------------- | ----- | -------------------------------------- |
| `packages/security/package.json`                      | P1    | New package manifest                   |
| `packages/security/tsconfig.json`                     | P1    | TypeScript config                      |
| `packages/security/src/index.ts`                      | P1    | Barrel export                          |
| `packages/security/src/rbac/unified-roles.ts`         | P1    | Role type, hierarchy, helpers          |
| `packages/security/src/rbac/unified-permissions.ts`   | P1    | Business + platform permission types   |
| `packages/security/src/rbac/role-permission-map.ts`   | P1    | Canonical matrix                       |
| `packages/security/src/rbac/unified-guard.ts`         | P1    | Guard functions                        |
| `packages/security/src/rbac/feature-flags.ts`         | P1    | UNIFIED_RBAC_ENABLED flag              |
| `packages/security/src/rbac/migration-audit.ts`       | P1    | Dual-write audit logger                |
| `packages/security/src/mfa/totp.ts`                   | P2    | TOTP RFC 6238                          |
| `packages/security/src/mfa/recovery-codes.ts`         | P2    | Recovery code generation               |
| `packages/security/src/mfa/better-auth-mfa-plugin.ts` | P2    | BetterAuth MFA plugin                  |
| `packages/security/src/secrets/provider.ts`           | P3    | SecretProvider interface               |
| `packages/security/src/secrets/env-provider.ts`       | P3    | Env var implementation                 |
| `packages/security/src/secrets/validation.ts`         | P3    | Startup validation                     |
| `packages/security/src/secrets/inventory.ts`          | P3    | Secrets inventory                      |
| `apps/api/src/features/auth/mfa/mfa-middleware.ts`    | P2    | MFA step-up middleware                 |
| `apps/api/src/features/auth/mfa/mfa-routes.ts`        | P2    | MFA endpoints                          |
| `apps/api/src/features/auth/mfa/feature-flags.ts`     | P2    | TOTP_ENABLED flag                      |
| `docs/05-security/threat-model.md`                    | P0    | STRIDE threat model                    |
| `docs/05-security/nist-csf-baseline.md`               | P0    | NIST CSF 2.0 baseline                  |
| `docs/05-security/incident-response-runbook.md`       | P4    | 4 playbooks                            |
| `docs/05-security/monitoring-strategy.md`             | P4    | Alert triggers + monitoring            |
| `docs/05-security/README.md`                          | P4    | Security docs index                    |
| `docs/05-security/secret-management.md`               | P3    | Secret inventory + rotation procedures |

### Modified Files

| File                                                        | Phase | Change                                     |
| ----------------------------------------------------------- | ----- | ------------------------------------------ |
| `packages/persistence/src/schema/auth.schema.ts`            | P2    | Add MFA columns to authUsers, authSessions |
| `apps/api/src/features/auth/auth.config.ts`                 | P2    | Register MFA plugin                        |
| `packages/infrastructure/src/auth/permissions.ts`           | P1    | Add `@deprecated` wrappers                 |
| `apps/api/src/features/security/rbac-policy.ts`             | P1    | Add `@deprecated` wrappers                 |
| `apps/api/src/features/security/rbac-guard.ts`              | P1    | Migrate to unified guard                   |
| `apps/api/src/shared/plugins/permission-guard.ts`           | P1    | Migrate to unified guard                   |
| `apps/api/src/shared/auth/route-permission-guard.ts`        | P1    | Migrate to unified guard                   |
| `apps/api/src/shared/auth/route-permissions.ts`             | P1    | Use BusinessPermission type                |
| `apps/api/src/features/security/route-protection/types.ts`  | P2    | Add `requireMfa` field                     |
| `apps/api/src/features/security/route-protection/matrix.ts` | P2    | Add requireMfa to sensitive routes         |
| `apps/api/src/features/security/session-context.ts`         | P1    | Use unified actor type                     |
| `package.json`                                              | P1    | Add `packages/security` to workspaces      |
| `.husky/pre-commit`                                         | P3    | Add secret pattern detection               |
| `apps/api/src/middleware/rate-limit.ts`                     | P2    | Ensure TOTP endpoints use AUTH tier        |

---

## Review Checklist

- [ ] Threat model covers all 5 trust boundaries with ≥15 scenarios
- [ ] NIST CSF baseline scores every subcategory across all 5 functions
- [ ] Unified RBAC preserves exact same allow/deny decisions as old dual-system
- [ ] Every call site importing old RBAC modules is identified and migrated
- [ ] Dual-write audit table captures all discrepancies before cutover
- [ ] MFA enrollment → verify → recovery flows tested end-to-end
- [ ] MFA step-up middleware correctly distinguishes MFA-protected routes
- [ ] `SecretProvider` abstraction allows drop-in vault replacement
- [ ] Secret validation does not crash production in default mode
- [ ] Pre-commit hook correctly flags secrets without false positives on test files
- [ ] All 4 incident response playbooks have clear triggers, containment, investigation, and remediation steps
- [ ] Feature flags enable instant rollback for all code changes
- [ ] No regression in existing auth, encryption, or session management
