# SDD Proposal: Drenyra API Platform — Developer Platform for Third-Party Integration

**Última actualización:** 2026-07-25
**Estado:** Propuesta
**Plan SDD:** Nuevo — Platform & Developer Experience
**Capability:** CAP-STUD-02 (API developer platform)
**Fase:** F3 — Studio/Platform
**Dependencias:** `drenyra-api-contracts` (B1, proposal), `drenyra-x1-cross-stack-contracts` (✅ applied), `drenyra-x3-provider-architecture` (✅ applied)

---

## Executive Summary

Build the external developer platform that enables third-party developers, partners, and internal teams to integrate with Drenyra through a coherent, documented, and versioned API surface — complete with API key management, webhook delivery infrastructure, SDK generation, developer portal, interactive playground, and rate limiting. This transforms Drenyra from a closed financial OS into a platform that others can build on.

**Target:** "A developer registers on the portal, gets API keys in 30 seconds, reads typed SDK docs, tests endpoints in the playground, subscribes to webhooks, and ships an integration. All within a single afternoon."

---

## Problem

Drenyra has 27 API surfaces with ~90+ endpoints but zero external developer experience:

1. **No API key management** — No way for external developers to authenticate. The route protection matrix shows mixed auth modes (session, legacy-header-fallback, ai-surface, bearer-tenant, public) but no API-key-based auth for third parties.
2. **Rate limiting is fragmented** — Three separate implementations (`middleware/rate-limit.ts`, `shared/plugins/rate-limiter.ts`, `middleware/rate-limit.middleware.ts`) with 16 of 27 surfaces marked "missing" in the protection matrix. No per-API-key tiering.
3. **Webhook registration exists, delivery does not** — `api-marketplace` has CRUD for webhook registrations, but there is no delivery engine, no retry logic, no signature verification, and no dashboard for webhook events.
4. **No SDK generation** — `contracts/` directory exists with TS/Protobuf schemas, the `LLMGatewaySDK` exists for internal AI provider access, but no external SDK is generated from the API contracts for third-party consumers.
5. **No developer portal** — No public-facing docs, no getting-started guide, no API reference, no changelog. The internal `api-marketplace` is about _installing integrations_, not about _building them_.
6. **No API playground** — Developers cannot test endpoints interactively before writing code.
7. **No usage analytics** — API consumers have no visibility into their own request volume, error rates, or quota consumption.
8. **No formal API versioning strategy** — Versioning is ad hoc (`/api/v1/` appears inconsistently). The `drenyra-api-contracts` proposal addresses internal contracts but does not define an external versioning strategy.
9. **API surface inconsistency** — Envelope patterns vary: canonical, mixed, custom, plain-json. Schema systems vary: typebox, zod, mixed, none. Auth varies: 7 distinct modes across 27 surfaces.

### Current-state gap summary

| Component                    | Status            | Gap                                       |
| ---------------------------- | ----------------- | ----------------------------------------- |
| API key management           | Not built         | No external auth mechanism                |
| Rate limiting                | Fragmented        | 16/27 surfaces "missing", no tiering      |
| Webhook delivery             | Registration only | No delivery, retry, signatures, dashboard |
| SDK generation               | Not built         | Contracts exist, no codegen               |
| Developer portal             | Not built         | No external-facing docs or onboarding     |
| API playground               | Not built         | No interactive endpoint testing           |
| Usage analytics              | Not built         | No consumer-facing metrics                |
| API versioning               | Ad hoc            | No formal strategy                        |
| Changelog & migration guides | Not formalized    | Only internal changelog, no API changelog |

---

## Scope

### In scope (this SDD)

1. **API key management** — Key generation, rotation, revocation, scoping per company/RUC, principal types (`user`, `service`, `webhook` already defined in `tenant-auth.ts`)
2. **Unified rate limiting** — Consolidate the three existing implementations into a single tiered system: `free` (100 req/min), `pro` (1000 req/min), `enterprise` (custom). Per-key tracking with Redis-backed sliding window.
3. **Webhook delivery infrastructure** — Delivery engine with retry (exponential backoff), signature verification (HMAC-SHA256), delivery logs, and a webhook events dashboard.
4. **SDK generation pipeline** — Generate TypeScript SDK from API contracts (TypeBox/Elysia → OpenAPI → typed client). Future: Go, Python clients.
5. **Developer portal foundation** — Public-facing portal with API reference (generated from OpenAPI), getting-started guide, authentication walkthrough, SDK docs, and changelog.
6. **API playground** — Interactive endpoint tester embedded in the developer portal, with API key auth, request builder, and response inspector.
7. **Usage analytics for consumers** — Per-API-key dashboard showing request volume, error rates, latency percentiles, and quota consumption.
8. **API versioning strategy** — Formalize URL-path versioning (`/api/v{N}/`), deprecation policy (minimum 6 months notice), sunset headers, and migration guides.
9. **Changelog & migration guides** — Automated changelog from conventional commits, per-version migration guides for breaking changes.

### Out of scope (this SDD)

- Internal API contract standardization — covered by `drenyra-api-contracts` (B1)
- Fiscal contract cross-stack consistency — covered by `drenyra-x1-cross-stack-contracts` (applied)
- Custom skills & workflows marketplace — CAP-STUD-03, separate SDD
- Policy studio — CAP-STUD-05, separate SDD
- Drenyra Studio admin — CAP-STUD-06, separate SDD
- Changing existing internal endpoint behavior — only adding external-facing layers
- GraphQL or BFF layer — not in scope
- Third-party OAuth2 provider integration (Google, GitHub) — future SDD

### Relationship with drenyra-api-contracts (B1)

`drenyra-api-contracts` is an **internal** SDD: it standardizes how the frontend and backend communicate. This SDD is **external**: it builds the platform that third parties use. They are complementary:

| Concern           | `drenyra-api-contracts` (B1)   | `drenyra-api-platform` (this SDD)     |
| ----------------- | ------------------------------ | ------------------------------------- |
| Response envelope | Unified internal envelope      | External-facing envelope (may differ) |
| Type exports      | For frontend consumption       | SDK generation for third parties      |
| OpenAPI tags      | Internal surface documentation | Public API reference docs             |
| CORS              | Internal CORS                  | Public CORS for third-party domains   |
| Error codes       | Standardized internal errors   | Public error codes with docs          |
| API keys          | Not addressed                  | Core deliverable                      |
| Rate limiting     | Not addressed                  | Core deliverable                      |
| Developer portal  | Not addressed                  | Core deliverable                      |

**Delivery dependency:** `drenyra-api-platform` depends on `drenyra-api-contracts` completing PR1 (response envelope + error codes) before it can generate a stable public API reference. However, API key management, developer portal scaffold, and webhook infrastructure can proceed in parallel.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                   Developer Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Dev Portal   │  │ API Playground│  │ Usage Dashboard  │  │
│  │ (Next.js)    │  │ (React SPA)  │  │ (React + Charts) │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
│  ┌──────┴─────────────────┴────────────────────┴─────────┐  │
│  │              API Gateway Layer (Elysia)                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ API Key  │ │ Rate     │ │ Usage    │ │ Webhook  │ │  │
│  │  │ Auth     │ │ Limiter  │ │ Tracker  │ │ Dispatcher│ │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────┴──────────────────────────┐   │
│  │              Existing API Surfaces (27)              │   │
│  │   ledger-mvp │ invoices │ banking │ auth │ ...       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SDK Generation Pipeline                  │  │
│  │  contracts/ → OpenAPI spec → codegen → TS/Go/Python   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component breakdown

#### 1. API Key Management

- **Store:** `api_keys` table in Drenyra DB (tenant-scoped, per-company/RUC)
- **Auth mode:** `x-api-key` header + optional `x-company-id` for tenant scoping
- **Lifecycle:** generate → active → rotated → revoked (never deleted for audit)
- **Scoping:** keys bound to specific companies/RUCs, with optional endpoint-level permissions
- **Principal type:** extends the existing `PrincipalType` union: `"user" | "service" | "webhook"` (already in `tenant-auth.ts`)

#### 2. Rate Limiting

- **Consolidation:** Replace three fragmented implementations with one `rate-limiter` plugin
- **Storage:** Redis (sliding window) with in-memory fallback for dev
- **Tiers:** `free` (100 req/min), `pro` (1000 req/min), `enterprise` (configurable)
- **Headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Per-surface configurability:** Retain the route matrix's per-surface awareness

#### 3. Webhook Delivery

- **Engine:** Outbox-pattern delivery with BullMQ jobs
- **Retry:** Exponential backoff (1min, 5min, 15min, 1h, 6h, 24h), max 7 attempts
- **Signatures:** HMAC-SHA256 with per-webhook secrets
- **Dashboard:** Delivery logs, success/failure rates, last delivery timestamp
- **Events catalog:** `invoice.created`, `invoice.updated`, `siro.status_changed`, `connection.activated`, `connection.error`

#### 4. SDK Generation

- **Source:** TypeBox/Elysia schemas → OpenAPI 3.1 spec → typed client
- **TypeScript SDK:** `@drenyra/api-client` — tree-shakeable, per-domain modules
- **Future:** Go client (`drenyra-go`), Python client (`drenyra-py`)
- **Pipeline:** CI job that regenerates on contract changes, fails if SDK breaks

#### 5. Developer Portal

- **Tech:** Next.js app under `apps/dev-portal/` or integrated into landing
- **Pages:** Home, Getting Started, API Reference (OpenAPI-rendered), SDK Docs, Webhooks Guide, Changelog
- **Auth:** Separate from main app — developer accounts with email/password or GitHub OAuth

#### 6. API Playground

- **Embedded:** Within the developer portal
- **Features:** Endpoint selector, method/URL/headers/body builder, response viewer with syntax highlighting, code snippet generator (curl, TS, Go, Python)
- **Auth:** Uses the developer's own API keys from portal

#### 7. Usage Analytics

- **Collection:** Middleware records (api_key, endpoint, status, latency, timestamp) → time-series DB
- **Dashboard:** Per-key graphs — request volume, error rate (4xx/5xx), p50/p95/p99 latency, quota %
- **Retention:** 90 days for free tier, 365 for pro, custom for enterprise

#### 8. API Versioning

- **Strategy:** URL-path versioning: `/api/v1/`, `/api/v2/`
- **Deprecation:** `Sunset` header + `Deprecation` header, minimum 6 months notice
- **Breaking change policy:** New major version for breaking changes; minor additions in current version
- **Migration guides:** Per-version guide published in developer portal

---

## Delivery

**Estrategia:** auto-chain — 5 PRs encadenados

| PR  | Scope                                                | Files | Líneas | Depende de                  |
| --- | ---------------------------------------------------- | ----- | ------ | --------------------------- |
| PR1 | API Key Management + Auth Middleware                 | 8-12  | ~350   | —                           |
| PR2 | Unified Rate Limiting (Redis + tiers)                | 6-10  | ~400   | PR1                         |
| PR3 | Webhook Delivery Engine                              | 10-14 | ~500   | —                           |
| PR4 | SDK Generation Pipeline (TS)                         | 8-12  | ~400   | `drenyra-api-contracts` PR1 |
| PR5 | Developer Portal Foundation + Playground + Analytics | 20-30 | ~1200  | PR1, PR4                    |

**Total estimado:** ~2,850 líneas · 52-78 archivos · 5 PRs

### Delivery dependency graph

```text
drenyra-api-contracts PR1 (envelope + error codes)
    │
    ├──→ PR4 (SDK) ──→ PR5 (Portal)
    │
PR1 (API Keys) ──→ PR2 (Rate Limiting)
    │
    └──→ PR5 (Portal)

PR3 (Webhooks) — independiente, puede correr en paralelo
```

### Review workload forecast

| PR                       | Líneas | Review time | Risk                            |
| ------------------------ | ------ | ----------- | ------------------------------- |
| PR1: API Keys            | ~350   | 25 min      | Medium — auth surface           |
| PR2: Rate Limiting       | ~400   | 30 min      | Low — mechanical consolidation  |
| PR3: Webhooks            | ~500   | 35 min      | Medium — delivery guarantees    |
| PR4: SDK Generation      | ~400   | 25 min      | Low — codegen pipeline          |
| PR5: Portal + Playground | ~1200  | 90 min      | High — needs split into sub-PRs |

**PR5 risk:** 1,200 lines is high. Consider splitting into PR5a (portal scaffold + API reference), PR5b (playground), PR5c (analytics dashboard).

---

## Success Criteria

- [ ] External developer can register on the portal and generate an API key in under 60 seconds
- [ ] API key authenticates against all 27 API surfaces with proper tenant scoping
- [ ] Rate limiting is active on 100% of external-facing endpoints, with correct tier enforcement
- [ ] Webhook delivery achieves >99% success rate within 3 retries
- [ ] TypeScript SDK is published to npm as `@drenyra/api-client` with tree-shakeable modules
- [ ] Developer portal renders complete API reference from live OpenAPI spec
- [ ] Playground allows testing any endpoint with the developer's own API key
- [ ] Usage dashboard shows accurate request counts, error rates, and latency within 60 seconds of request
- [ ] API versioning strategy is documented and enforced — breaking changes require a new major version
- [ ] Changelog is auto-generated and published on every release

---

## Risks

1. **Security surface expansion** — Exposing APIs externally increases attack surface. Every endpoint must pass the existing security review gate before being marked `external`.
2. **drenyra-api-contracts dependency** — If B1 is delayed, PR4 and PR5 are blocked. Mitigation: PR1-PR3 can proceed independently.
3. **Rate limiter consolidation** — Changing rate limiting behavior may affect existing internal consumers. Mitigation: internal traffic identified by `x-internal` header or separate middleware path.
4. **Webhook delivery reliability** — Missed webhooks could break partner integrations. Mitigation: outbox pattern + dead letter queue + manual replay.
5. **Developer portal scope creep** — "Portal" can become a full product. Mitigation: strict PR5 scope: API reference + playground + basic dashboard only.
6. **API key abuse** — Keys could be leaked and used maliciously. Mitigation: rate limiting per key, usage alerts, easy rotation.

---

## Non-goals

- Internal API contract standardization (B1 territory)
- GraphQL or BFF layer
- Third-party OAuth2 provider integration
- Custom skills marketplace (CAP-STUD-03)
- Policy studio (CAP-STUD-05)
- Changing existing endpoint behavior or schemas
- Real-time WebSocket API
- Multi-region API deployment

---

## Proposal Question Round

These questions help clarify business/product decisions before the proposal is finalized. The orchestrator will present them to the user for review.

### Q1: Target Developer Persona

Who is the primary developer we're building this platform for?

- **(a)** Internal frontend team consuming Drenyra APIs for the web app
- **(b)** Third-party SaaS companies building integrations (e.g., a payroll system that syncs journal entries)
- **(c)** Enterprise customers building custom automation on top of their Drenyra instance
- **(d)** All of the above, with different tiers/access levels

**Assumption:** (d) — but the first slice (PR1-PR3) targets internal + enterprise, with third-party onboarding in PR5.

### Q2: API Key Scoping Model

How granular should API key permissions be?

- **(a)** Per-company/RUC only — a key has access to all endpoints for one company
- **(b)** Per-company + per-domain — a key can access `invoices` but not `banking`
- **(c)** Full RBAC — keys inherit the same permission model as dashboard users

**Assumption:** (a) for initial release, with (b) as a fast-follow. Full RBAC adds significant complexity and is better addressed when the permission system is formalized (currently CAP-FOUND-02 is undrafted).

### Q3: Developer Portal — Separate App or Landing Section?

- **(a)** Separate Next.js app (`apps/dev-portal/`) with its own deployment
- **(b)** Section within the existing landing page (`apps/landing/`)
- **(c)** Integrated into the main web app (`apps/web/`) behind auth

**Assumption:** (a) — separate app gives us deployment independence, cleaner security boundary, and better SEO for developer docs. The landing page links to it.

### Q4: SDK Language Priority

Contracts exist in TypeScript/Protobuf. Which SDK should be generated first?

- **(a)** TypeScript only — covers 80%+ of expected integrators
- **(b)** TypeScript + Go — the CLI is in Go, and Go developers are common in fintech
- **(c)** TypeScript + Go + Python — the data engine is Python, and Python is dominant in data science

**Assumption:** (a) TypeScript first (PR4). Go and Python clients are generated from the same OpenAPI spec in a follow-up SDD or PR.

### Q5: Open Source vs. Proprietary SDK

- **(a)** Open source the SDK (`@drenyra/api-client` on npm, MIT license) — builds community, enables bug reports
- **(b)** Proprietary, available only through the developer portal after registration
- **(c)** Source-available (BSL or similar) — visible but with usage restrictions

**Assumption:** (a) — SDK is open source. The value is in the platform, not the client library. Open source builds trust and reduces support burden.

---

## Related Documents

- [drenyra-api-contracts proposal](../drenyra-api-contracts/proposal.md) — Internal API contract standardization
- [drenyra-x1-cross-stack-contracts proposal](../drenyra-x1-cross-stack-contracts/proposal.md) — Cross-stack fiscal contract consistency
- [Capability Map](../../../docs/architecture/capability-map.md) — CAP-STUD-02
- [Program Taxonomy](../../../docs/architecture/program-taxonomy.md) — F3 Studio/Platform phase
- [Drenyra Positioning](../../../docs/products/drenyra-positioning.md) — Dimension 6: API & Developer Platform
- [Route Protection Matrix](../../../apps/api/src/features/security/route-protection/matrix.ts) — Current API surface audit
