# Drenyra Threat Model

**Document type:** Threat Model (STRIDE)
**Status:** Draft — Phase 0 of `drenyra-security-foundation`
**Last updated:** 2026-07-25
**Review cadence:** Quarterly or on significant architectural change
**Scope:** Drenyra financial OS — API, Web, CLi, AI agents, SUNAT integration, ledger

> This document is a live threat model. It MUST be consulted before any security-relevant architectural change.

---

## 1. System Overview

Drenyra is a multi-tenant financial OS serving Peruvian businesses. It handles:

- **Fiscal data**: RUC, invoices, SUNAT filings, tax calculations (IGV, detracciones, retenciones)
- **Accounting data**: Journal entries, ledger, trial balance, financial statements
- **Banking data**: Bank accounts, transactions, reconciliations, cashflow
- **PII**: User emails, names, company information
- **AI processing**: LLM-based fiscal analysis, invoice classification, SIRE reconciliation

### Architecture (high-level)

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Browser  │   │  Mobile   │   │   CLI    │   │   API    │
│  (React)  │   │  (Future) │   │   (Go)   │   │ Consumers│
└─────┬────┘   └─────┬────┘   └─────┬────┘   └─────┬────┘
      │ HTTPS        │ HTTPS        │ HTTPS        │ HTTPS
      ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────┐
│                CDN / Load Balancer                        │
│             (Cloudflare / ALB)                            │
├──────────────────────────────────────────────────────────┤
│               API Gateway (ElysiaJS)                      │
│         ~31 mounted route surfaces                        │
│   Auth: BetterAuth │ RBAC │ Session │ API Key │ AI-mode  │
├──────────────────────────────────────────────────────────┤
│              Application Layer                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────────────┐  │
│  │ Auth   │ │Banking │ │Ledger  │ │   AI Swarm        │  │
│  │ 52 f   │ │ 62 f   │ │ 23 f   │ │   144 files       │  │
│  └────────┘ └────────┘ └────────┘ └───────────────────┘  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────────────────┐  │
│  │Reports │ │Billing │ │Security│ │   Evidence Graph  │  │
│  │ 19 f   │ │ 64 f   │ │ 28 f   │ │   5+5 files       │  │
│  └────────┘ └────────┘ └────────┘ └───────────────────┘  │
├──────────────────────────────────────────────────────────┤
│                    Infrastructure                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Postgres │ │  Object  │ │  Cache   │ │  Message Q  │ │
│  │ (Drizzle)│ │  Store   │ │ (Future) │ │  (NATS)     │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │
└──────────────────────────────────────────────────────────┘
         │ HTTPS         │         │
         ▼               ▼         ▼
┌──────────┐   ┌────────────┐   ┌──────────┐
│ SUNAT    │   │ AI Providers│   │  Banking │
│ OSE/API  │   │ (OpenAI,   │   │(Prometeo)│
│ SOL      │   │ Anthropic) │   │          │
└──────────┘   └────────────┘   └──────────┘
```

---

## 2. Trust Boundaries

| #   | Boundary                   | Type             | Description                                         |
| --- | -------------------------- | ---------------- | --------------------------------------------------- |
| B1  | Client ↔ API               | Network (HTTPS)  | Browser/mobile/CLI communicates with API over TLS   |
| B2  | API ↔ Database             | Internal Network | PostgreSQL accessed via Drizzle ORM                 |
| B3  | API ↔ SUNAT                | Network (HTTPS)  | SUNAT OSE/API/SOL integrations                      |
| B4  | API ↔ AI Providers         | Network (HTTPS)  | LLM API calls (OpenAI, Anthropic, Gemini)           |
| B5  | API ↔ Object Store         | Internal Network | R2/S3 for evidence/artifact storage                 |
| B6  | API ↔ Banking API          | Network (HTTPS)  | Prometeo/bank provider integrations                 |
| B7  | Internal ↔ Internal Module | Process Boundary | Between API route surfaces (e.g., banking → ledger) |
| B8  | API ↔ NATS/Message Queue   | Internal Network | Async job processing                                |

---

## 3. STRIDE Threat Analysis

### B1: Client ↔ API

| Threat              | ID    | Description                                                      | Severity     | Likelihood | Mitigation                                                                                               |
| ------------------- | ----- | ---------------------------------------------------------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| **Spoofing**        | B1-S1 | Attacker impersonates valid user via stolen session cookie       | **HIGH**     | Medium     | HTTP-only cookies, Secure flag, SameSite=Lax, signed with SECRET. Session invalidation on logout.        |
| **Spoofing**        | B1-S2 | Attacker uses leaked API keys to impersonate a tenant            | **HIGH**     | Medium     | API key rotation, scoped permissions, audit logging of API key usage                                     |
| **Tampering**       | B1-T1 | MITM modifies API request/response                               | **MEDIUM**   | Low        | TLS 1.3 enforced, HSTS headers. Protected by HTTPS.                                                      |
| **Repudiation**     | B1-R1 | User denies performing an action                                 | **MEDIUM**   | Medium     | Auth audit log tracks all auth events (SIGNUP, LOGIN, LOGOUT) with IP + user agent                       |
| **Info Disclosure** | B1-I1 | Error message reveals internal details (stack traces, DB schema) | **MEDIUM**   | Medium     | Production errors return generic messages. Route Protection Matrix documents envelope style per surface. |
| **Info Disclosure** | B1-I2 | Response includes sensitive fields (password hashes, tokens)     | **HIGH**     | Low        | Auth never returns password fields. Response contract validation via Zod.                                |
| **DoS**             | B1-D1 | Rate limiting bypass exhausts server resources                   | **MEDIUM**   | Medium     | Rate limiting documented per surface in Route Protection Matrix. Some surfaces show "missing".           |
| **EoP**             | B1-E1 | Vertical privilege escalation via role manipulation              | **CRITICAL** | Low        | RBAC guard enforces role hierarchy. Route Protection Matrix specifies authMode per surface.              |

### B2: API ↔ Database

| Threat              | ID    | Description                                       | Severity     | Likelihood | Mitigation                                                                                                                 |
| ------------------- | ----- | ------------------------------------------------- | ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Spoofing**        | B2-S1 | Unauthorized service connects to database         | **CRITICAL** | Low        | Network isolation (VPC, security groups). Connection requires client cert or IAM.                                          |
| **Tampering**       | B2-T1 | SQL injection via crafted input                   | **CRITICAL** | Low        | Drizzle ORM parameterized queries. Zod validation at API boundary. Input sanitization.                                     |
| **Tampering**       | B2-T2 | Direct DB modification bypasses application logic | **HIGH**     | Low        | DB credentials not exposed to clients. No public DB access.                                                                |
| **Info Disclosure** | B2-I1 | Query exposes data from other tenants             | **CRITICAL** | Medium     | Row-Level Security (RLS) via `rls-db-context.ts`. Company scope guard enforced per surface. Tenant assertions checked.     |
| **Info Disclosure** | B2-I2 | Backup leakage exposes all tenant data            | **HIGH**     | Medium     | Backups encrypted at rest. Access to backups restricted.                                                                   |
| **Tampering**       | B2-T3 | Audit log tampering                               | **HIGH**     | Medium     | Hash chain validates audit log integrity: `compute-audit-hash.ts` + `hash-chain.vo.ts`. `verify-chain` endpoint validates. |
| **DoS**             | B2-D1 | Unoptimized queries cause DB exhaustion           | **MEDIUM**   | Medium     | Connection pooling. Query timeout configuration.                                                                           |

### B3: API ↔ SUNAT (OSE/SOL)

| Threat              | ID    | Description                                     | Severity     | Likelihood | Mitigation                                                                                        |
| ------------------- | ----- | ----------------------------------------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| **Spoofing**        | B3-S1 | Attacker impersonates SUNAT to send fake CDR    | **CRITICAL** | Low        | CDR signature verification. Certificate chain validation. Webhook HMAC verification.              |
| **Tampering**       | B3-T1 | MITM modifies XML submitted to SUNAT            | **CRITICAL** | Low        | TLS to SUNAT. XML digital signature (XAdES-EPES) before submission. Signed XML verified by SUNAT. |
| **Info Disclosure** | B3-I1 | SUNAT credentials (SOL user/password) leaked    | **CRITICAL** | Low        | Credentials stored encrypted (AES-256-GCM). Not logged. Not in response.                          |
| **DoS**             | B3-D1 | SUNAT API rate limits cause submission failures | **MEDIUM**   | High       | Retry queue with exponential backoff (`sire/retry-queue`). Bulk submission batching.              |
| **Repudiation**     | B3-R1 | SUNAT denies receiving submission despite CDR   | **HIGH**     | Medium     | CDR stored as evidence in Evidence Graph. Full submission traceability via `CpeLifecycleService`. |

### B4: API ↔ AI Providers

| Threat              | ID    | Description                                          | Severity   | Likelihood | Mitigation                                                                                                             |
| ------------------- | ----- | ---------------------------------------------------- | ---------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Info Disclosure** | B4-I1 | Sensitive fiscal data sent to AI provider in prompts | **HIGH**   | High       | AI tool permission system (`ai-tool-permissions/`) gates which data is sent. Context control plane manages data scope. |
| **Tampering**       | B4-T1 | AI provider returns manipulated analysis             | **MEDIUM** | Low        | Fiscal truth engine validates AI outputs against deterministic rules. Human-in-the-loop for fiscal decisions.          |
| **Spoofing**        | B4-S1 | Fake AI provider endpoint intercepts API key         | **HIGH**   | Low        | Provider URLs configured in env vars (not hardcoded). TLS verification.                                                |
| **DoS**             | B4-D1 | AI provider latency blocks critical path             | **MEDIUM** | Medium     | Timeout configuration. Fallback to deterministic logic. Async processing for non-critical AI tasks.                    |
| **Repudiation**     | B4-R1 | Agent action without audit trail                     | **HIGH**   | Medium     | Agent audit trail (`agent-audit-trail/`) logs all AI decisions with hash chain. Cognitive stream has approval gates.   |

### B5: API ↔ Object Store

| Threat              | ID    | Description                                      | Severity | Likelihood | Mitigation                                                                                         |
| ------------------- | ----- | ------------------------------------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| **Info Disclosure** | B5-I1 | Unauthorized access to evidence/artifact storage | **HIGH** | Low        | Signed URLs with expiration. Object-level access control.                                          |
| **Tampering**       | B5-T1 | Evidence file tampered in storage                | **HIGH** | Low        | Content-addressed storage (SHA-256). Evidence hash tracked in database for integrity verification. |

### B6: API ↔ Banking Provider

| Threat              | ID    | Description                                            | Severity   | Likelihood | Mitigation                                                                                               |
| ------------------- | ----- | ------------------------------------------------------ | ---------- | ---------- | -------------------------------------------------------------------------------------------------------- |
| **Info Disclosure** | B6-I1 | Bank credentials exposed                               | **HIGH**   | Medium     | Bank credentials stored encrypted (AES-256-GCM). Not logged. Banking-providers routes authenticated.     |
| **Tampering**       | B6-T1 | Fake transaction data injected by compromised provider | **MEDIUM** | Low        | Reconciliation shadow mode (dual-run) validates transactions. Audit trail for all imported transactions. |

### B7: Internal Module → Module

| Threat              | ID    | Description                                                  | Severity   | Likelihood | Mitigation                                                                                                   |
| ------------------- | ----- | ------------------------------------------------------------ | ---------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| **EoP**             | B7-E1 | AI swarm surface accesses ledger data without proper scoping | **HIGH**   | Medium     | AI-surface auth mode enforces organization scope. Route Protection Matrix maps each surface's tenant source. |
| **Info Disclosure** | B7-E2 | Logging module exposes sensitive data from other modules     | **MEDIUM** | Medium     | Access log service redacts sensitive fields. Intentional design: data at rest encryption is per-module.      |

### B8: API ↔ Message Queue

| Threat        | ID    | Description                                  | Severity   | Likelihood | Mitigation                                                                                       |
| ------------- | ----- | -------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------------------ |
| **Tampering** | B8-T1 | Message tampered in queue                    | **MEDIUM** | Low        | Message signing. Idempotency keys for processing. Outbox pattern ensures at-least-once delivery. |
| **Spoofing**  | B8-S1 | Unauthorized publisher injects fake messages | **MEDIUM** | Low        | NATS authentication. Network-level isolation. Message schema validation.                         |

---

## 4. Data Classification

| Classification   | Examples                                           | Storage                        | Encryption                                    | Access                               |
| ---------------- | -------------------------------------------------- | ------------------------------ | --------------------------------------------- | ------------------------------------ |
| **Public**       | Product docs, marketing site, health endpoint      | Public                         | None                                          | Anyone                               |
| **Internal**     | API routes, feature flags, error logs              | Internal                       | At-rest (DB)                                  | Drenyra team                         |
| **Confidential** | Company info, financial reports, banking data      | DB + Object Store              | At-rest + E2E encryption for sensitive fields | Tenant-scoped (X-Company-Id)         |
| **Restricted**   | RUC, SUNAT credentials, encryption keys, passwords | DB (encrypted fields)          | AES-256-GCM field-level encryption            | Strict RBAC, audit logged            |
| **Regulated**    | Fiscal data subject to SUNAT audit requirements    | DB + Object Store + Hash Chain | At-rest + field-level + hash chain integrity  | Immutable, audited, retention-locked |

---

## 5. Current Security Controls (Verified)

| Control                  | Location                                                     | Effective | Notes                                                         |
| ------------------------ | ------------------------------------------------------------ | --------- | ------------------------------------------------------------- |
| Authentication           | `apps/api/src/features/auth/` (52 files)                     | ✅        | BetterAuth, bcrypt cost 10, HTTP-only cookies, RUC validation |
| Session Management       | `auth/handlers/session.handler.ts`                           | ✅        | HTTP-only, Secure, SameSite=Lax, signed                       |
| RBAC (System A)          | `apps/api/src/features/security/rbac-guard.ts`               | ✅        | 8 roles, 18 SecurityOperations                                |
| RBAC (System B)          | `packages/infrastructure/src/auth/`                          | ✅        | 4 roles, 22 permissions (parallel, unsynchronized)            |
| Route Protection Matrix  | `apps/api/src/features/security/route-protection-matrix.ts`  | ✅        | 31 surfaces documented                                        |
| Encryption (Field)       | `packages/shared/src/security/encryption/e2e-encryption.ts`  | ✅        | AES-256-GCM, passphrase-based                                 |
| Encryption (AES)         | `apps/api/src/features/security/aes-256.service.ts`          | ✅        | AES-256 service for protected payloads                        |
| Audit Trail              | `apps/api/src/features/agent-audit-trail/` (30 files)        | ✅        | Hash chain verification                                       |
| Auth Audit Log           | `auth_audit_logs` table                                      | ✅        | All auth events logged                                        |
| Tenant Isolation         | `apps/api/src/features/security/rls-db-context.ts`           | ✅        | RLS context per request                                       |
| Destructive Action Guard | `apps/api/src/features/security/destructive-action-guard.ts` | ✅        | Prevents harmful AI prompts                                   |
| Rate Limiting            | Per surface, documented in matrix                            | 🟡        | Partial coverage — some surfaces show "missing"               |
| MFA/2FA                  | —                                                            | ❌        | Planned (Phase 2 of security SDD)                             |
| Secret Management        | env vars                                                     | 🟡        | No vault, no rotation                                         |
| Supply Chain Security    | `drenyra-x6-supply-chain-security`                           | ✅        | Applied SDD                                                   |
| Security Deploy          | `drenyra-security-deploy`                                    | ✅        | Applied SDD                                                   |

---

## 6. Gap Analysis & Priority

| Gap                      | Severity   | Current State                              | Priority | Target Phase |
| ------------------------ | ---------- | ------------------------------------------ | -------- | ------------ |
| No unified RBAC model    | **HIGH**   | 2 parallel systems, not synchronized       | P0       | Phase 1      |
| No threat model          | **HIGH**   | This document is the first                 | P0       | Phase 0      |
| No MFA/2FA               | **HIGH**   | Planned in README only                     | P0       | Phase 2      |
| Secret management        | **MEDIUM** | All in env vars, no rotation               | P1       | Phase 3      |
| No vault strategy        | **MEDIUM** | Encryption keys managed by user passphrase | P1       | Phase 3      |
| Rate limiting incomplete | **MEDIUM** | Some surfaces "missing" in matrix          | P1       | Phase 4      |
| No incident response     | **MEDIUM** | No runbook exists                          | P1       | Phase 4      |
| No security monitoring   | **MEDIUM** | No SIEM/SOC integration                    | P2       | Phase 4      |
| No penetration testing   | **HIGH**   | No pen test evidence                       | P2       | Annual       |
| No bug bounty            | **LOW**    | Not established                            | P3       | Roadmap      |

---

## 7. Data Flow: Fiscal Transaction (Critical Path)

```
User                          API                          SUNAT
 │                            │                            │
 │ 1. Submit invoice          │                            │
 │───────────────────────────►│                            │
 │                            │ 2. Validate RUC            │
 │                            │───────────────────────────►│
 │                            │◄───────────────────────────│
 │                            │  (RUC valid)               │
 │                            │                            │
 │                            │ 3. Generate UBL XML        │
 │                            │    + XAdES-EPES signature  │
 │                            │                            │
 │                            │ 4. Submit CPE              │
 │                            │───────────────────────────►│
 │                            │◄───────────────────────────│
 │                            │  (CDR response)            │
 │                            │                            │
 │                            │ 5. Store CDR as evidence   │
 │                            │    + link to Evidence Graph│
 │                            │                            │
 │                            │ 6. Audit log (hash chain)  │
 │                            │                            │
 │◄───────────────────────────│                            │
 │ (200 OK + CDR)             │                            │
```

**Trust boundaries crossed:**

- B1 (Client → API) — TLS, session auth, RBAC
- B3 (API → SUNAT) — TLS, XML signature, certificate auth
- B2 (API → DB) — RLS, parameterized queries, audit hash chain

**Threats mitigated at each step:**

1. Session cookie secured (B1-S1)
2. RUC validation prevents spoofed taxpayer (B3-S1)
3. XML signature prevents tampering (B3-T1)
4. TLS prevents MITM (B3-T1, B1-T1)
5. Evidence Graph + hash chain ensures non-repudiation (B1-R1, B3-R1)
6. Audit log integrity via hash chain (B2-T3)

---

## 8. Trust Assumptions

1. **Network perimeter**: Internal network (API ↔ DB, API ↔ Object Store) is isolated from public internet
2. **AI provider trust**: AI providers (OpenAI, Anthropic, Gemini) are trusted not to store/persist prompt data for model training beyond stated policy. Users are informed.
3. **SUNAT infrastructure**: SUNAT OSE/API are trusted as authoritative sources for fiscal validation. Certificates are verified.
4. **Employee trust**: Drenyra employees with DB access are trusted not to access tenant data outside of support scenarios (logged).
5. **Third-party libraries**: Dependencies (npm, Go modules) are scanned for vulnerabilities via supply chain security SDD.
6. **Cloud provider**: Infrastructure provider (Vercel/AWS) is trusted for physical security and network isolation.

---

## 9. Review Log

| Date       | Reviewer     | Changes                        | Version |
| ---------- | ------------ | ------------------------------ | ------- |
| 2026-07-25 | el Gentleman | Initial threat model (Phase 0) | v0.1    |
