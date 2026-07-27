# SDD Proposal: Security Foundation — Auth, RBAC, Encryption & Threat Model

**Change:** `drenyra-security-foundation`
**Status:** proposal
**Created:** 2026-07-25
**Tags:** security, auth, rbac, encryption, threat-model, compliance, mfa, nist-csf, foundational
**Depends on:** drenyra-security-deploy (✅ applied), drenyra-x6-supply-chain-security (✅ applied), drenyra-h02-tenant-isolation (review-pending)
**PRs estimated:** 5
**Lines estimated:** ~650 (documentation + MFA implementation + RBAC migration)

---

## Executive Summary

Drenyra has production-grade auth code running — BetterAuth with HTTP-only cookies, bcrypt cost 10, email verification, password reset, account lockout, rate limiting, and a Route Protection Matrix covering 31 mounted surfaces. But the security posture is **undocumented, unmeasured, and split across two parallel RBAC systems** that are not synchronized. There is no threat model, no compliance baseline, and no MFA.

**This SDD formalizes, unifies, hardens, and documents the security foundation in one cohesive sweep.** It does not reimplement working code — it documents the baseline, unifies the two RBAC systems into a single canonical model, implements MFA immediately, hardens secret management, and establishes an incident response runbook.

**Target outcome:** "Every security decision is documented. The threat model is alive. RBAC is a single unified system. MFA is on. Secrets are managed with rotation. We know exactly what gaps remain and why."

---

## Finding: Current State

### Auth — Production-Grade but Incomplete

| Capability              | Status        | Detail                                                                                   |
| ----------------------- | ------------- | ---------------------------------------------------------------------------------------- |
| Authentication          | ✅ Production | BetterAuth + Drizzle adapter PostgreSQL                                                  |
| Session management      | ✅ Production | HTTP-only cookies, custom session plugin                                                 |
| Password hashing        | ✅ Production | bcrypt cost 10                                                                           |
| Email verification      | ✅ Production | Required, 24h expiry                                                                     |
| Password reset          | ✅ Production | 1h token expiry                                                                          |
| Account lockout         | ✅ Production | 5 attempts / 30 minutes                                                                  |
| Rate limiting           | ✅ Production | In-memory RateLimiter (AUTH, API, SUNAT, SENSITIVE tiers)                                |
| RUC validation          | ✅ Production | Peruvian tax ID validation at registration                                               |
| Audit logging           | ✅ Production | Access logs in rbac-guard, failed login tracking                                         |
| Spanish error messages  | ✅ Production | All auth errors in Spanish                                                               |
| Route Protection Matrix | ✅ Documented | 31 mounted surfaces with authMode/tenantSource/schemaSystem/envelope/rateLimit           |
| MFA / 2FA               | ❌ Missing    | Only documented as TODO; no TOTP, no WebAuthn                                            |
| OAuth / SSO             | ❌ Missing    | Schema prepared (`packages/persistence/src/schema/auth.schema.ts`) but no implementation |
| API keys                | ❌ Missing    | No programmatic access tokens                                                            |

### RBAC — Two Parallel, Unsynchronized Systems

**System 1 — `packages/infrastructure/src/auth/permissions.ts`** (Infrastructure RBAC):

- 4 roles: `owner`, `senior`, `junior`, `client`
- 22 permissions in `resource:action` format (`company:create`, `journal:read`, `sunat:declare`, `payroll:manage`, `audit:read`, etc.)
- Numeric hierarchy: client=1 → junior=2 → senior=3 → owner=4
- Guard functions: `roleHasPermission()`, `userHasPermission()`, `requirePermission()`, `isRoleHigher()`
- Test bypass: `shouldBypassRbacInTests()` active by default in test environment

**System 2 — `apps/api/src/features/security/rbac-policy.ts`** (API Security RBAC):

- 8 roles: `superadmin`, `admin`, `owner`, `senior`, `analyst`, `service`, `auditor`, `viewer`
- 18 `SecurityOperation` values (`ai:tool-permissions:manage`, `cognitive:stream`, `sire:submit`, `audit:trail:export`, `observability:batches:write`, etc.)
- Header-based actor resolution via `resolveSecurityActor()` (x-auth-user-id, x-user-role, x-company-id)
- `hasPermission(role, operation)` guard function
- `PROTECTED_RESOURCES` and `ADMIN_ONLY_ACTIONS` constants defined elsewhere in the security feature

**The divergence problem:**

- System 1 governs core business operations (journal, SUNAT, payroll, users)
- System 2 governs AI/cognitive/observability/SIRE surfaces
- Role sets are incompatible: System 1 has no `superadmin`/`admin`/`analyst`/`service`/`auditor`/`viewer`; System 2 has no `junior`/`client`
- Permission namespaces are disjoint: System 1 uses `resource:action`; System 2 uses `domain:resource:action`
- No shared role resolution, no unified guard, no single source of truth
- Features crossing both domains (e.g., SIRE audit by an owner) need ad-hoc bridging or duplicate checks

### Encryption — Partial Coverage

| Layer               | Status         | Detail                                                                                                         |
| ------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| Fiscal data at rest | ✅ AES-256-GCM | `packages/shared/src/security/encryption/e2e-encryption.ts` — passphrase-based, PBKDF2 100K iterations SHA-512 |
| AI tool context     | ✅ AES-256-GCM | `apps/api/src/features/security/aes-256.service.ts` — envelope with AAD binding (run + tool call)              |
| Database at-rest    | ❌ Missing     | No TDE, no pgcrypto, no column-level encryption                                                                |
| Key rotation        | ❌ Missing     | No rotation mechanism; passphrases are static                                                                  |
| Key management      | ❌ Missing     | Keys derived from env var passphrases (DRENYRA_MASTER_KEY, LLM_GATEWAY_KEY_PASSPHRASE)                         |

### Secret Management — Environment Variables Only

All secrets live in `.env` files and environment variables:

- `BETTER_AUTH_SECRET` — session signing
- `DATABASE_URL` — database credentials
- `SUNAT_CLIENT_ID` / `SUNAT_CLIENT_SECRET` — SUNAT API credentials
- `DRENYRA_MASTER_KEY` — master encryption passphrase
- `LLM_GATEWAY_KEY_PASSPHRASE` — AI gateway encryption
- R2/S3 keys for object storage

No vault (HashiCorp Vault, Infisical, Doppler), no secrets rotation, no audit trail for secret access. `.env.example` is documented but `.env` files exist in the repo tree and must never contain production values.

### Threat Model — None

No STRIDE, no attack trees, no risk assessment matrix, no documented trust boundaries, no data flow diagrams with security annotations. Security decisions are made ad-hoc without a formal framework.

---

## Scope

### Phase 0: Threat Model + NIST CSF Baseline (Foundational)

**PR1 — Security Baseline & Threat Model**

- Produce a STRIDE threat model covering the full Drenyra system:
  - Trust boundaries: client ↔ API, API ↔ DB, API ↔ SUNAT, API ↔ AI providers, API ↔ R2 storage
  - Data flows: auth sessions, fiscal data, AI cognitive state, SUNAT submissions
  - ≥ 15 threat scenarios with severity, likelihood, and mitigation mapping
- Map current security controls against NIST CSF 2.0 categories (Identify, Protect, Detect, Respond, Recover)
- Document which subcategories are satisfied, partially satisfied, or missing
- No certification goal — baseline only
- Output: `docs/05-security/threat-model.md` + `docs/05-security/nist-csf-baseline.md`

### Phase 1: RBAC Unification (Prescriptive — Decide NOW, Migrate NOW)

**PR2 — RBAC Unification**

**Canonical model decision (prescriptive):**

The unified RBAC system merges both worlds into a single role hierarchy with two permission namespaces:

**Unified roles** (8):
`superadmin` > `admin` > `owner` > `senior` > `analyst` > `junior` > `client` > `viewer`

Roles from System 1 + System 2 are reconciled:

- `superadmin`, `admin`, `analyst`, `service`, `auditor`, `viewer` from System 2 are adopted
- `owner`, `senior` from both systems are unified
- `junior`, `client` from System 1 are adopted
- `service` and `auditor` from System 2 are mapped to specialized roles with limited permissions
- The hierarchy is strictly numeric: superadmin=8 → viewer=1

**Unified permission namespaces** (two complementary sets):

1. **Business permissions** (`business:*`) — inherits System 1's 22 permissions with prefix normalization:
   - `business:company:create`, `business:journal:read`, `business:sunat:declare`, `business:payroll:manage`, etc.

2. **Platform permissions** (`platform:*`) — inherits System 2's 18 SecurityOperations with prefix normalization:
   - `platform:ai:tool-permissions:manage`, `platform:cognitive:stream`, `platform:sire:submit`, `platform:audit:trail:export`, etc.

**Migration strategy:**

- Dual-write phase: both old and new guards run in parallel; discrepancies are logged but old system decides
- Full test suite gate: every route's RBAC behavior is verified with both old and new systems before cutover
- Cutover: old guard functions become wrappers that delegate to the unified system
- Old imports are deprecated with `@deprecated` JSDoc tags pointing to the unified API
- Rollback capability: feature flag `UNIFIED_RBAC_ENABLED` allows instant fallback to old guards

**Implementation deliverables:**

- `packages/security/src/rbac/unified-roles.ts` — single role type, hierarchy, and role-permission mapping
- `packages/security/src/rbac/unified-guard.ts` — `hasBusinessPermission()`, `hasPlatformPermission()`, `requirePermission()`, `resolveActor()`
- Migration of all existing call sites (estimated ~15-20 files)
- Deprecation of `packages/infrastructure/src/auth/permissions.ts` and `apps/api/src/features/security/rbac-policy.ts`
- Test suite: unit tests for every role-permission combination + integration tests for every protected route

### Phase 2: MFA/2FA Implementation (Immediate — Not Roadmap)

**PR3 — MFA/2FA Implementation**

- Implement TOTP-based 2FA (RFC 6238) integrated with BetterAuth session flow
- Database schema: `user.totp_secret`, `user.totp_enabled`, `user.totp_verified_at` (extend existing auth schema in `packages/persistence/src/schema/auth.schema.ts`)
- Enrollment flow: generate secret → show QR code → verify code → enable
- Login flow: password → if TOTP enabled → require TOTP code → issue session
- Recovery codes: generate 8 one-time use codes, bcrypt-hashed at rest, shown once at enrollment
- Session step-up: sessions created before MFA enrollment must re-authenticate for MFA-protected routes
- MFA-protected route marker: decorator or middleware marking routes that require step-up (`requireMfa: true` in Route Protection Matrix)
- Audit log: MFA enrollment, disable, recovery code use, failed TOTP attempts
- Rate limiting: TOTP verification under the existing AUTH rate limit tier

**Non-goals for this phase:** WebAuthn/passkeys (roadmap), SMS fallback (not planned — TOTP only), hardware token enforcement.

### Phase 3: Secret Management Hardening

**PR4 — Secret Management Hardening**

- Document the complete secrets inventory: every secret, its scope, rotation frequency, and blast radius
- Implement a secrets abstraction layer that reads from env vars today but supports vault backends:
  - `packages/security/src/secrets/provider.ts` — `SecretProvider` interface with `getSecret(name): Promise<string>`
  - `packages/security/src/secrets/env-provider.ts` — current env-var implementation
  - `packages/security/src/secrets/validation.ts` — validates secrets at startup (non-empty, minimum entropy, format)
- Define vault migration strategy: Infisical (open-source, self-hostable) as target; document migration path
- Add `.env` to `.gitignore` enforcement: pre-commit hook that rejects commits containing secret patterns
- Document key rotation procedure for `BETTER_AUTH_SECRET` and encryption passphrases

**Non-goals for this phase:** Actually deploying Infisical (separate SDD), implementing auto-rotation (separate SDD).

### Phase 4: Security Monitoring & Incident Response Runbook

**PR5 — Security Monitoring & Incident Response**

- Document current monitoring: what is logged, where, retention, alerting gaps
- Define security-relevant metrics and log events that SHOULD trigger alerts
- Produce incident response runbook with ≥ 4 playbooks:
  1. Credential compromise (session hijack, leaked API keys)
  2. Brute force / credential stuffing attack
  3. Data exfiltration suspicion (unusual SUNAT query patterns, bulk export)
  4. Privilege escalation attempt (RBAC bypass, role change without audit)
- Define security review cadence: threat model review every 6 months, NIST CSF re-baseline annually, RBAC permission audit quarterly
- Output: `docs/05-security/incident-response-runbook.md` + `docs/05-security/monitoring-strategy.md`

---

## Non-Goals (Explicitly Out of Scope)

This SDD formalizes and documents — it does **NOT** reimplement working code. Specifically out of scope:

- ❌ Reimplementing BetterAuth or the auth flow — existing code is the base
- ❌ Implementing OAuth/SSO — schema is prepared but implementation is a separate SDD
- ❌ Implementing API keys / programmatic access — separate SDD
- ❌ Implementing WebAuthn/passkeys — roadmap after MFA
- ❌ Deploying a vault (Infisical, Vault) — strategy only; deployment is a separate SDD
- ❌ Implementing database at-rest encryption (TDE, pgcrypto) — roadmap
- ❌ Implementing auto-rotation for secrets or encryption keys — roadmap
- ❌ Deploying a SIEM or security dashboard — roadmap
- ❌ Rewriting existing encryption implementations — they work; document and harden

**Gaps discovered during this SDD are documented as explicit roadmaps with priority and rationale** — they are not silently left as TODOs.

---

## Risks & Mitigations

| Risk                                                                    | Severity   | Likelihood | Mitigation                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RBAC unification breaks existing access control during migration        | **HIGH**   | Medium     | Dual-write during migration: both old and new guards run, discrepancies logged, old system decides until full test suite passes. Feature flag `UNIFIED_RBAC_ENABLED` allows instant rollback. |
| MFA implementation locks users out during enrollment                    | **MEDIUM** | Low        | Recovery codes generated at enrollment. MFA is opt-in during rollout window. Admin override for account recovery documented.                                                                  |
| Gap analysis reveals vulnerabilities requiring urgent separate SDDs     | **MEDIUM** | Medium     | Findings are prioritized and documented; CRITICAL findings trigger an immediate incident SDD outside this scope.                                                                              |
| H02 tenant isolation still in review — Phase 0 threat model assumes H02 | **LOW**    | Low        | Threat model documents H02 as a dependency; if H02 changes materially, threat model is updated before PR1 merge.                                                                              |
| Documentation becomes stale without review cadence                      | **LOW**    | Medium     | Phase 4 embeds review cadence (6-month threat model, annual NIST CSF, quarterly RBAC audit). Enforce via calendar reminders in the runbook.                                                   |

---

## Success Criteria

### Phase 0

- [ ] STRIDE threat model with ≥ 15 threat scenarios, each with severity, likelihood, and mitigation
- [ ] Trust boundary diagram (text or visual) covering client→API→DB→SUNAT→AI→R2
- [ ] NIST CSF 2.0 baseline mapping: every subcategory scored (satisfied / partial / missing)
- [ ] Gap summary with prioritized recommendations

### Phase 1

- [ ] Single unified role hierarchy: 8 roles, numeric ordering, no ambiguity
- [ ] Single unified permission system: business + platform namespaces
- [ ] All existing call sites migrated (estimated 15-20 files)
- [ ] Old RBAC files deprecated with `@deprecated` JSDoc and migration comments
- [ ] Full test suite: every role-permission combination + every protected route passes under unified RBAC
- [ ] Feature flag `UNIFIED_RBAC_ENABLED` with rollback capability

### Phase 2

- [ ] TOTP enrollment flow working end-to-end (generate → QR → verify → enable)
- [ ] Login flow with MFA step-up: password → TOTP challenge → session
- [ ] Recovery codes generated, hashed at rest, single-use
- [ ] MFA-protected route marker integrated with Route Protection Matrix
- [ ] Audit log entries for all MFA events
- [ ] Rate limiting applied to TOTP verification

### Phase 3

- [ ] Complete secrets inventory documented with scope, rotation, and blast radius
- [ ] `SecretProvider` abstraction with env-var implementation
- [ ] Startup secret validation (non-empty, minimum entropy)
- [ ] Pre-commit hook rejecting secret patterns in staged files
- [ ] Vault migration strategy documented (Infisical target)
- [ ] Key rotation procedure documented

### Phase 4

- [ ] Current monitoring documented: what is logged, where, retention
- [ ] Security-relevant alert triggers defined
- [ ] Incident response runbook with ≥ 4 playbooks
- [ ] Security review cadence documented (6-month / annual / quarterly)

### Cross-Cutting

- [ ] All artifacts saved to both `openspec/changes/drenyra-security-foundation/` and Engram
- [ ] No regression in existing auth, RBAC, or encryption behavior
- [ ] All new code passes existing lint, typecheck, and test gates
- [ ] Documentation lives under `docs/05-security/`

---

## Rollback

- **RBAC unification:** Feature flag `UNIFIED_RBAC_ENABLED=false` switches all guards back to the old dual-system behavior. Migration is additive — old code is deprecated but not deleted until the next major cleanup SDD.
- **MFA:** `TOTP_ENABLED=false` disables MFA challenges at the middleware level. Existing sessions are unaffected.
- **Secret validation:** Startup validation logs warnings but does not crash the process in production (configurable strict mode for CI).
- **Documentation:** No rollback needed — documentation is additive.

---

## Artifacts

| Artifact               | Path / Topic Key                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Proposal               | `openspec/changes/drenyra-security-foundation/proposal.md` / `sdd/drenyra-security-foundation/proposal` |
| Spec (to be written)   | `openspec/changes/drenyra-security-foundation/spec.md` / `sdd/drenyra-security-foundation/spec`         |
| Design (to be written) | `openspec/changes/drenyra-security-foundation/design.md` / `sdd/drenyra-security-foundation/design`     |
| Tasks (to be written)  | `openspec/changes/drenyra-security-foundation/tasks.md` / `sdd/drenyra-security-foundation/tasks`       |
