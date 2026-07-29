# Implementation Tasks — drenyra-security-foundation

**Phase:** tasks
**Generated:** 2026-07-25
**Design:** openspec/changes/drenyra-security-foundation/design.md
**Spec:** openspec/changes/drenyra-security-foundation/spec.md

---

## Review Workload Forecast

| Field                   | Value                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Estimated changed lines | ~2800–3400                                                                                                             |
| 400-line budget risk    | High                                                                                                                   |
| Chained PRs recommended | Yes                                                                                                                    |
| Suggested split         | PR1: Phases 0+1 (RBAC ~1500 lines) → PR2: Phase 2 (MFA ~900 lines) → PR3: Phases 3+4 (Secrets + Monitoring ~700 lines) |
| Delivery strategy       | auto-chain                                                                                                             |
| Chain strategy          | pending                                                                                                                |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

---

## Phase 0: Threat Model & NIST CSF Baseline

> **Note:** The STRIDE threat model (`docs/05-security/threat-model.md`) is already written with 18 threat scenarios. Phase 0 tasks focus on the NIST CSF baseline and documentation index.

### Task 0.1 — Create NIST CSF 2.0 baseline document

- [x] Create `docs/05-security/nist-csf-baseline.md` with:
  - All 6 Identify (ID) subcategories scored (ID.AM, ID.BE, ID.GV, ID.RA, ID.RM, ID.SC) with rationale
  - All 6 Protect (PR) subcategories scored (PR.AA, PR.AT, PR.DS, PR.IR, PR.MA, PR.PS) with rationale
  - All 2 Detect (DE) subcategories scored (DE.AE, DE.CM) with rationale
  - All 4 Respond (RS) subcategories scored (RS.MA, RS.AN, RS.CO, RS.MI) with rationale
  - All 2 Recover (RC) subcategories scored (RC.RP, RC.CO) with rationale
  - Prioritized gap summary mapping each Missing/Partially-Satisfied subcategory to recommended remediation and effort level
  - Explicit disclaimer that this is a self-assessment, not a formal certification
- **AC:** Document matches the gap structure in the design doc §0.3; every subcategory has a score + rationale; gap summary is ordered by priority.
- **Deps:** None (documentation-only).
- **Est. lines:** ~250 (new file).

### Task 0.2 — Create security docs README

- [x] Create `docs/05-security/README.md` with a one-line description and file listing for:
  - `threat-model.md`
  - `nist-csf-baseline.md`
  - `incident-response-runbook.md` (links forward to Phase 4)
  - `monitoring-strategy.md` (links forward to Phase 4)
- **AC:** All four documents referenced; each has a one-line Spanish description; README states the review cadence from the design.
- **Deps:** Task 0.1.
- **Est. lines:** ~40 (new file).

<!-- sdd-owner: implementation -->

- [ ] Start or reuse bounded review. <!-- sdd-owner: parent -->

---

## Phase 1: RBAC Unification (PR1 Core)

### Task 1.1 — Create `packages/security` package scaffold

- [x] Create `packages/security/package.json` with:
  - Name `@drenyra/security`, type `module`, private
  - Exports: `.` → `./src/index.ts`, `./rbac` → `./src/rbac/index.ts`, `./secrets` → `./src/secrets/index.ts`, `./mfa` → `./src/mfa/index.ts`
  - Scripts: `typecheck` (tsc7.sh), `test` (vitest run)
  - Dependencies: none initially (added incrementally as modules are built)
- [x] Create `packages/security/tsconfig.json` extending `../../tsconfig.base.json`
- [x] Create `packages/security/src/index.ts` with commented barrel structure
- [x] Add `packages/security` to root `package.json` workspaces array (auto-detected by `packages/*` glob — verify)
- **AC:** `bun run typecheck --filter @drenyra/security` passes on empty package; package is importable from sibling packages.
- **Deps:** None.
- **Est. lines:** ~50 (3 new files).

### Task 1.2 — Define unified role hierarchy

- [x] Create `packages/security/src/rbac/unified-roles.ts`:
  - `UNIFIED_ROLES` const object with 8 roles (superadmin → viewer)
  - `UnifiedRole` type from `typeof UNIFIED_ROLES[keyof typeof UNIFIED_ROLES]`
  - `ROLE_HIERARCHY: Record<UnifiedRole, number>` with numeric levels 8→1
  - `SPECIAL_ROLE_MAPPINGS` for `service` → analyst(4) and `auditor` → viewer(1)
  - `isRoleHigher(roleA, roleB): boolean` using numeric comparison
  - `getRoleLevel(role): number` helper
- **AC:** All 8 roles present; hierarchy is strictly numeric; special role mappings resolve to correct levels.
- **Deps:** Task 1.1.
- **Est. lines:** ~60.

### Task 1.3 — Define unified permission namespaces

- [x] Create `packages/security/src/rbac/unified-permissions.ts`:
  - `BusinessPermission` type with all 22 business permissions from System 1 (`packages/infrastructure/src/auth/permissions.ts`), prefixed `business:`:
    `company:create|delete|update|read`, `journal:read|create|update|update_draft|delete`, `sunat:declare|read`, `accounting:close|open`, `reports:read_all|read_operational|read_basic`, `payroll:read|manage`, `users:create_staff|invite_team|read`, `audit:read`
  - `PlatformPermission` type with all 18 operations from System 2 (`apps/api/src/features/security/rbac-policy.ts`), prefixed `platform:`:
    `ai:tool-permissions:manage|read`, `cognitive:stream|state:read|approval:resolve|recover`, `documents:query:read|review:update|upload:create`, `sire:audit:stream|submit`, `audit:trail:read|export`, `observability:runs:read|runs:events:read|batches:read|batches:write|memory:read`
  - `ALL_BUSINESS_PERMISSIONS` const array and `ALL_PLATFORM_PERMISSIONS` const array
- **AC:** Permission count matches design (22 business + 18 platform); prefix normalization consistent; no overlap between namespaces.
- **Deps:** Task 1.2.
- **Est. lines:** ~80.

### Task 1.4 — Define canonical role-permission mapping matrix

- [x] Create `packages/security/src/rbac/role-permission-map.ts`:
  - `BUSINESS_ROLE_PERMISSION_MAP: Record<UnifiedRole, ReadonlySet<BusinessPermission>>` — maps each of 8 roles to their business permissions per design §1.1 matrix
  - `PLATFORM_ROLE_PERMISSION_MAP: Record<UnifiedRole, ReadonlySet<PlatformPermission>>` — maps each of 8 roles to their platform permissions
  - `SERVICE_ROLE_OVERRIDE` and `AUDITOR_ROLE_OVERRIDE` for special role permission sets
  - Use `new Set([...])` for each role for fast `O(1)` lookups
- **AC:** Every cell in the design matrix §1.1 is correctly encoded; service role gets only 4 platform perms; auditor role gets only 4 platform perms; superadmin gets all perms.
- **Deps:** Tasks 1.2, 1.3.
- **Est. lines:** ~200.

### Task 1.5 — Implement unified guard functions

- [x] Create `packages/security/src/rbac/unified-guard.ts`:
  - `UnifiedActor` interface: `{ userId, authUserId, legacyUserId, role: UnifiedRole, companyId }`
  - `hasBusinessPermission(role, permission): boolean` — checks role map + special overrides
  - `hasPlatformPermission(role, permission): boolean` — checks role map + special overrides
  - `requireBusinessPermission(actor, permission): void` — throws `ForbiddenError` on deny
  - `requirePlatformPermission(actor, permission): void` — throws `ForbiddenError` on deny
  - `getPermissionsForRole(role): { business, platform }` — returns all permissions for introspecting
  - `resolveActor(headers, session?): UnifiedActor | null` — placeholder (call-site migration later delegates to session-context)
  - Reuse existing `ForbiddenError` from `packages/infrastructure/src/auth/permissions.ts` (or define own if circular)
- **AC:** Guard functions return correct results for all 8 roles × 40 permissions; special roles (service/auditor) get overridden sets; `require*` throws with descriptive Spanish message.
- **Deps:** Tasks 1.2, 1.3, 1.4.
- **Est. lines:** ~120.

### Task 1.6 — Implement RBAC feature flags

- [x] Create `packages/security/src/rbac/feature-flags.ts`:
  - `RBAC_FEATURE_FLAGS.UNIFIED_RBAC_ENABLED` → reads `process.env.UNIFIED_RBAC_ENABLED !== "false"` (default: true in test, false in production initially)
  - `RBAC_FEATURE_FLAGS.DUAL_WRITE_SHADOW_MODE` → reads `process.env.DUAL_WRITE_SHADOW_MODE !== "false"`
- **AC:** Flags read from env; `UNIFIED_RBAC_ENABLED=false` disables unified path; `DUAL_WRITE_SHADOW_MODE=true` enables shadow logging when unified is disabled.
- **Deps:** Task 1.5.
- **Est. lines:** ~25.

### Task 1.7 — Implement dual-write migration audit logger

- [x] Create `packages/security/src/rbac/migration-audit.ts`:
  - `logRbacDiscrepancy(route, operation, role, oldResult, unifiedResult)` function
  - Logs WARNING when old=ALLOW and unified=DENY (regression risk)
  - Logs INFO when old=DENY and unified=ALLOW (new grant)
  - Structured JSON log to stdout (consumable by Fly.io / log aggregation)
  - Deterministic: logs the same inputs the same way each time
- **AC:** Dual-write logger emits correct severity level; log format includes route, operation, role, old_result, unified_result, timestamp.
- **Deps:** Task 1.6.
- **Est. lines:** ~60.

### Task 1.8 — Write RBAC unit tests (role-permission matrix)

- [x] Create `packages/security/__tests__/rbac/unified-roles.test.ts`:
  - Every role resolves to correct numeric level
  - `isRoleHigher` returns correct comparisons for all 28 role pairs
  - Special roles map to correct levels
- [x] Create `packages/security/__tests__/rbac/unified-permissions.test.ts`:
  - 22 business permissions exist in type
  - 18 platform permissions exist in type
  - No overlap between namespaces
- [x] Create `packages/security/__tests__/rbac/role-permission-map.test.ts`:
  - Every role × every business permission tested (8 × 22 = 176 assertions)
  - Every role × every platform permission tested (8 × 18 = 144 assertions)
  - Service role override verified
  - Auditor role override verified
- [x] Create `packages/security/__tests__/rbac/unified-guard.test.ts`:
  - `hasBusinessPermission` and `hasPlatformPermission` return correct booleans
  - `requireBusinessPermission` throws for insufficient roles
  - `getPermissionsForRole` returns correct sets
- **AC:** All tests pass; coverage covers every role-permission cell; tests run with `vitest run` in the package.
- **Deps:** Tasks 1.2–1.5.
- **Est. lines:** ~450 (4 test files).

### Task 1.9 — Add deprecation wrappers to old System 1 module

- [x] Modify `packages/infrastructure/src/auth/permissions.ts`:
  - Add `@deprecated Use @drenyra/security/rbac — hasBusinessPermission()` JSDoc to all exports
  - Import `hasBusinessPermission`, `BusinessPermission`, and `UnifiedRole` from `@drenyra/security/rbac`
  - Add `mapLegacyRole(role: Role): UnifiedRole` mapping: owner→owner, senior→senior, junior→junior, client→client
  - Add `mapLegacyPermission(perm: Permission): BusinessPermission` by prefixing with `business:`
  - Rewrite `roleHasPermission` to delegate: `hasBusinessPermission(mapLegacyRole(role), mapLegacyPermission(permission))`
  - Rewrite `isRoleHigher` to delegate to unified
  - Keep `ForbiddenError` class in place (it's a re-export target)
  - Default all delegations: when `UNIFIED_RBAC_ENABLED=false`, old logic runs (keep existing implementation as fallback)
- **AC:** All existing imports from this module continue to work; deprecation warnings appear in IDE; delegation calls resolve to unified module correctly.
- **Deps:** Tasks 1.5, 1.6.
- **Est. lines:** ~80 (modified).

### Task 1.10 — Add deprecation wrappers to old System 2 module

- [x] Modify `apps/api/src/features/security/rbac-policy.ts`:
  - Add `@deprecated Use @drenyra/security/rbac — hasPlatformPermission()` JSDoc to all exports
  - Import `hasPlatformPermission`, `PlatformPermission`, `UnifiedRole` from `@drenyra/security/rbac`
  - Rewrite `hasPermission(role, operation)` to delegate: `hasPlatformPermission(role as UnifiedRole, mapLegacyOperation(operation))`
  - `mapLegacyOperation` prefixes `SecurityOperation` with `platform:`
  - Keep `SecurityActor` and `SecurityOperation` type exports (callers reference these)
- **AC:** All existing imports from this module continue to work; deprecation warnings appear; delegation resolves correctly.
- **Deps:** Tasks 1.5, 1.6.
- **Est. lines:** ~60 (modified).

### Task 1.11 — Migrate `rbac-guard.ts` to unified guard (dual-write mode)

- [x] Modify `apps/api/src/features/security/rbac-guard.ts`:
  - When `UNIFIED_RBAC_ENABLED=true`: use `requirePlatformPermission` from `@drenyra/security/rbac` instead of `hasPermission`
  - When `UNIFIED_RBAC_ENABLED=false` (shadow mode): run old logic, then also evaluate unified guard and call `logRbacDiscrepancy` if results differ
  - Maintain `authorizeOperation` signature and return type
  - Maintain `logSecurityAccess` calls for ALLOW/DENY
  - Preserve `shouldBypassRbacInTests()` behavior
- **AC:** In test env: UNIFIED_RBAC_ENABLED=true → unified guard decides; toggle flag → old guard decides; shadow mode logs discrepancies without affecting decision.
- **Deps:** Tasks 1.7, 1.9, 1.10.
- **Est. lines:** ~70 (modified).

### Task 1.12 — Migrate Elysia permission guard plugin

- [x] Modify `apps/api/src/shared/plugins/permission-guard.ts`:
  - Import `requirePermission` from `@drenyra/security/rbac` instead of old infra module
  - Update type references to `BusinessPermission`
  - Ensure feature flag gate: when disabled, fall back to old import path
- **AC:** `requirePermission` calls resolve to unified guard; existing test mock `vi.mock` patterns continue to work.
- **Deps:** Tasks 1.9, 1.11.
- **Est. lines:** ~20 (modified).

### Task 1.13 — Migrate route permission guard and permissions

- [x] Modify `apps/api/src/shared/auth/route-permission-guard.ts`:
  - Import from `@drenyra/security/rbac` instead of old System 1 module
  - Add feature flag gating
- [x] Modify `apps/api/src/shared/auth/route-permissions.ts`:
  - Update `Permission` type references to `BusinessPermission` from unified module
  - Verify route-permission mapping still matches
- **AC:** Route protection matrix 31 surfaces still resolve correctly; all route tests pass.
- **Deps:** Tasks 1.9, 1.12.
- **Est. lines:** ~30 (2 files modified).

### Task 1.14 — Update session-context to use unified actor type

- [x] Modify `apps/api/src/features/security/session-context.ts`:
  - Import `UnifiedActor` from `@drenyra/security/rbac`
  - Ensure `SessionContext` interface stays compatible but add a `toUnifiedActor()` helper
  - Do NOT break the existing `SessionContext` interface (15+ call sites depend on it)
- **AC:** `SessionContext` unchanged; new helper bridges to `UnifiedActor`; no call-site breakage.
- **Deps:** Task 1.5.
- **Est. lines:** ~30 (modified).

### Task 1.15 — Write RBAC integration tests for route protection

- [ ] Create test file verifying that at least 5 critical routes from the 31-surface matrix pass through the unified guard correctly:
  - A `session` business route (e.g., company settings)
  - A `bearer-tenant` route (e.g., fiscal-ledger)
  - An `ai-surface` route (e.g., sire-audit)
  - A `public` route (no guard)
  - A `legacy-header-fallback` route
- [ ] Each route test verifies: correct role → ALLOW, insufficient role → 403, no session → 401
- **AC:** 5 routes × 3 scenarios each = 15 integration assertions passing.
- **Deps:** Tasks 1.11–1.14.
- **Est. lines:** ~200 (new integration test file).

### Task 1.16 — RBAC PR1 finalization: typecheck + full test suite

- [ ] Run `bun run typecheck` from root — zero new errors
- [ ] Run `bun run test --filter @drenyra/security` — all new unit tests pass
- [ ] Run `bun run test --filter @drenyra/api` — no regressions in existing tests
- [ ] Run `bun run typecheck --filter @drenyra/infrastructure` — deprecation wrappers compile
- [ ] Verify shadow mode: set `UNIFIED_RBAC_ENABLED=false`, `DUAL_WRITE_SHADOW_MODE=true`, call a protected route, check stdout for discrepancy logs
- [ ] Verify cutover: set `UNIFIED_RBAC_ENABLED=true`, call same route, verify unified guard decides
- **AC:** Zero type errors; zero test regressions; shadow mode logs discrepancies correctly; cutover works.
- **Deps:** Tasks 1.1–1.15.
- **Est. lines:** ~0 (verification-only).

<!-- sdd-owner: implementation -->

- [ ] Bounded review: verify RBAC PR1 readiness. <!-- sdd-owner: parent -->

---

## Phase 2: MFA/2FA Implementation (PR2)

### Task 2.1 — Database migration: add MFA columns to auth schema

- [x] Modify `packages/persistence/src/schema/auth.schema.ts`:
  - Add to `authUsers`: `totpSecret: text("totp_secret")`, `totpEnabled: boolean("totp_enabled").notNull().default(false)`, `totpVerifiedAt: timestamp("totp_verified_at")`, `recoveryCodes: jsonb("recovery_codes").$type<string[]>()`, `mfaFailureCount: integer("mfa_failure_count").notNull().default(0)`, `mfaLastFailureAt: timestamp("mfa_last_failure_at")`
  - Add to `authSessions`: `mfaVerified: boolean("mfa_verified").notNull().default(false)`
- [ ] Run `bun run db:generate` to produce migration SQL
- [ ] Run `bun run db:migrate` to apply migration
- **AC:** Columns exist in dev DB; Drizzle schema compiles; migration is reversible (no data loss on rollback).
- **Deps:** Task 1.1 (package exists).
- **Est. lines:** ~25 (modified schema).

### Task 2.2 — Implement TOTP generation/verification (RFC 6238)

- [x] Create `packages/security/src/mfa/totp.ts`:
  - `generateTotpSecret(): string` — 20 random bytes → base32
  - `generateTotpUri(config: TotpConfig): string` — `otpauth://totp/...` URI
  - `verifyTotp(secret: string, code: string, window?: number): boolean` — SHA1 HMAC, 6 digits, 30s period, ±1 window
  - Use `node:crypto` `createHmac` (no external dependency)
  - `TotpConfig` interface: `{ issuer, account, secret, algorithm, digits, period }`
- **AC:** `verifyTotp` returns true for correct code within window; returns false for expired/incorrect code; cross-checked against Google Authenticator with same secret.
- **Deps:** Task 1.1.
- **Est. lines:** ~100.

### Task 2.3 — Implement recovery code generation and hashing

- [x] Create `packages/security/src/mfa/recovery-codes.ts`:
  - `generateRecoveryCodes(count?: number): string[]` — 8 codes, 10 chars each (e.g., `A1B2C3D4E5`)
  - `hashRecoveryCode(code: string): Promise<string>` — bcrypt (use `Bun.password.hash` with bcrypt cost 10)
  - `verifyRecoveryCode(code: string, hashes: (string | null)[]): Promise<number | null>` — returns matched index or null; skips null entries (consumed codes)
  - Use `crypto.randomBytes` for randomness
- **AC:** Generated codes are unique (8 distinct codes); `hashRecoveryCode` produces bcrypt hashes; `verifyRecoveryCode` correctly matches and rejects; consumed code (null in array) is not matchable.
- **Deps:** Task 1.1.
- **Est. lines:** ~70.

### Task 2.4 — Implement BetterAuth MFA plugin

- [x] Create `packages/security/src/mfa/better-auth-mfa-plugin.ts`:
  - `mfaPlugin(options): BetterAuthPlugin` with `id: "drenyra-mfa"`
  - Hook `before` matcher for `/sign-in/email`: after password validation succeeds → check `totp_enabled` → if enabled, return `{ mfa_required: true, mfa_token: "<jwt>" }` (short-lived, 5min, signed with `BETTER_AUTH_SECRET`)
  - Endpoint handlers (as BetterAuth endpoint callbacks):
    - `POST /api/auth/mfa/verify` — verify TOTP code against stored secret, issue full session with `mfaVerified: true`
    - `POST /api/auth/mfa/enroll` — generate secret, return URI (does NOT enable yet)
    - `POST /api/auth/mfa/verify-enrollment` — verify code, if valid: set `totp_enabled=true`, `totp_verified_at=now`, generate 8 recovery codes (hash + store), return plaintext codes once
    - `POST /api/auth/mfa/recover` — verify recovery code, consume it, issue session
    - `POST /api/auth/mfa/disable` — require recent MFA verification, clear `totp_secret`, set `totp_enabled=false`
  - All endpoints respect `TOTP_ENABLED` feature flag
- **AC:** Plugin registers in BetterAuth without errors; enrollment flow generates valid QR URI; verify flow returns valid session; recovery code flow consumes code correctly.
- **Deps:** Tasks 2.1, 2.2, 2.3.
- **Est. lines:** ~250.

### Task 2.5 — Register MFA plugin in auth config

- [x] Modify `apps/api/src/features/auth/auth.config.ts`:
  - Import `mfaPlugin` from `@drenyra/security/mfa`
  - Add to `plugins` array: `mfaPlugin({})`
  - Ensure plugin is registered after `customSession` plugin
- **AC:** Auth server starts without errors; MFA endpoints are accessible under `/api/auth/mfa/*`.
- **Deps:** Task 2.4.
- **Est. lines:** ~10 (modified).

### Task 2.6 — Implement MFA step-up middleware

- [x] Create `apps/api/src/features/auth/mfa/mfa-middleware.ts`:
  - Elysia middleware: checks `RouteProtectionMatrixRow.requireMfa`
  - If `requireMfa: true` and `TOTP_ENABLED=true`: check `session.mfaVerified`; if false → return 401 with `code: "MFA_STEPUP"` and short-lived MFA token
  - If user has `totp_enabled=false` → pass through (user never enrolled)
  - Respects `TOTP_ENABLED=false` → no-op
- **AC:** Route with `requireMfa: true` blocks unverified session; route without `requireMfa` passes through; session with `mfaVerified: true` passes through.
- **Deps:** Tasks 2.4, 2.5.
- **Est. lines:** ~60.

### Task 2.7 — Add `requireMfa` field to route protection types

- [x] Modify `apps/api/src/features/security/route-protection/types.ts`:
  - Add `readonly requireMfa?: boolean` to `RouteProtectionMatrixRow`
- [ ] Modify `apps/api/src/features/security/route-protection/matrix.ts`:
  - Set `requireMfa: true` for initial conservative set:
    - `company-settings`
    - `users-staff`
    - `sunat-api`
    - `fiscal-command-center`
    - `fiscal-truth`
- **AC:** TypeScript compiles; matrix rows with `requireMfa: true` trigger MFA middleware.
- **Deps:** Task 2.6.
- **Est. lines:** ~20 (2 files modified).

### Task 2.8 — Implement MFA route handlers

- [x] Create `apps/api/src/features/auth/mfa/mfa-routes.ts`:
  - Elysia route definitions for: POST `/api/auth/mfa/enroll`, POST `/api/auth/mfa/verify-enrollment`, POST `/api/auth/mfa/verify`, POST `/api/auth/mfa/recover`, POST `/api/auth/mfa/disable`
  - Each handler delegates to the MFA plugin endpoints registered in BetterAuth
  - Spanish error messages: "Código TOTP inválido", "Demasiados intentos. Vuelva a iniciar sesión.", etc.
  - Audit logging via existing `logSecurityAccess` pattern
- **AC:** All 5 MFA endpoints return appropriate responses; rate limiting applies (AUTH tier); error messages are in Spanish.
- **Deps:** Tasks 2.4, 2.5, 2.6.
- **Est. lines:** ~120.

### Task 2.9 — Implement MFA feature flags

- [x] Create `packages/security/src/mfa/feature-flags.ts`:
  - `MFA_FEATURE_FLAGS.TOTP_ENABLED` → `process.env.TOTP_ENABLED !== "false"`
  - `MFA_FEATURE_FLAGS.MFA_OPT_IN` → `process.env.MFA_OPT_IN !== "false"`
- **AC:** `TOTP_ENABLED=false` → MFA middleware no-op, enrollment endpoint returns "MFA not available".
- **Deps:** Task 2.6.
- **Est. lines:** ~15.

### Task 2.10 — Ensure TOTP endpoints use AUTH rate limit tier

- [ ] Modify `apps/api/src/middleware/rate-limit.ts` (or rate-limit config):
  - Verify or add TOTP endpoints (`/api/auth/mfa/*`) to the AUTH rate limit tier
- **AC:** TOTP verification endpoint rate-limited; 429 returned on excess; error message in Spanish.
- **Deps:** Task 2.8.
- **Est. lines:** ~10 (modified).

### Task 2.11 — Write MFA unit tests

- [x] Create `packages/security/__tests__/mfa/totp.test.ts`:
  - `generateTotpSecret` produces base32 string of expected length
  - `generateTotpUri` produces valid `otpauth://` URI with correct params
  - `verifyTotp` with known test vector (RFC 6238 test values)
  - `verifyTotp` rejects wrong code
  - `verifyTotp` rejects expired code (outside window)
- [x] Create `packages/security/__tests__/mfa/recovery-codes.test.ts`:
  - `generateRecoveryCodes` produces exactly 8 unique codes of length 10
  - `hashRecoveryCode` produces bcrypt hash
  - `verifyRecoveryCode` matches correct code and returns index
  - `verifyRecoveryCode` rejects wrong code
  - `verifyRecoveryCode` skips null entries (consumed codes)
- **AC:** All MFA unit tests pass; TOTP verified against RFC 6238 test vectors.
- **Deps:** Tasks 2.2, 2.3.
- **Est. lines:** ~200 (2 test files).

### Task 2.12 — MFA PR2 finalization: typecheck + integration smoke test

- [ ] Run `bun run typecheck` — zero new errors
- [ ] Run `bun run test --filter @drenyra/security` — MFA tests pass
- [ ] Run `bun run test --filter @drenyra/api` — no regressions
- [ ] Smoke test enrollment flow manually: POST `/api/auth/mfa/enroll` → scan QR → POST `/api/auth/mfa/verify-enrollment` → receive recovery codes
- [ ] Smoke test login step-up: login with MFA-enabled user → receive challenge → POST `/api/auth/mfa/verify` → session issued
- [ ] Smoke test recovery: use recovery code to bypass TOTP
- **AC:** Zero type errors; zero test regressions; enrollment, verify, and recovery flows work end-to-end.
- **Deps:** Tasks 2.1–2.11.
- **Est. lines:** ~0 (verification-only).

<!-- sdd-owner: implementation -->

- [ ] Bounded review: verify MFA PR2 readiness. <!-- sdd-owner: parent -->

---

## Phase 3: Secret Management Hardening (PR3)

### Task 3.1 — Define SecretProvider interface

- [x] Create `packages/security/src/secrets/provider.ts`:
  - `SecretProvider` interface:
    - `getSecret(name: string): Promise<string>` — resolves secret, throws `SecretNotFoundError` if missing
    - `validateSecrets(options?: { strict?: boolean }): Promise<ValidationResult>` — validates all known secrets
  - `SecretNotFoundError` class extending Error
  - `ValidationResult` interface: `{ valid: boolean; errors: ValidationError[]; warnings: ValidationWarning[] }`
  - `ValidationError` interface: `{ secretName: string; reason: "missing" | "empty" | "placeholder" | "low_entropy"; detail: string }`
- **AC:** Interface is clean; easily implementable by vault backends; error types are descriptive.
- **Deps:** Task 1.1.
- **Est. lines:** ~50.

### Task 3.2 — Implement secrets inventory

- [x] Create `packages/security/src/secrets/inventory.ts`:
  - `SECRETS_INVENTORY: SecretMetadata[]` with all secrets from design §3.2 (9 entries):
    `BETTER_AUTH_SECRET`, `DATABASE_URL`, `SUNAT_CLIENT_ID`, `SUNAT_CLIENT_SECRET`, `DRENYRA_MASTER_KEY`, `LLM_GATEWAY_KEY_PASSPHRASE`, `ARKELYTHEX_AES256_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
  - `SecretMetadata` interface: `{ name, scope, rotation, blastRadius, minEntropy?, required, notes }`
  - Each entry includes rotation frequency, blast radius, and notes per design
- **AC:** All 9 secrets documented; each has scope, rotation, and blast radius; inventory is importable and iterable.
- **Deps:** Task 3.1.
- **Est. lines:** ~80.

### Task 3.3 — Implement EnvProvider

- [x] Create `packages/security/src/secrets/env-provider.ts`:
  - `EnvProvider` class implementing `SecretProvider`
  - `getSecret(name)` → reads `process.env[name]`, throws `SecretNotFoundError` if undefined or empty
  - `validateSecrets(options?)` → iterates `SECRETS_INVENTORY`, checks:
    - Required secrets: non-empty, non-placeholder (rejects "changeme", "TODO", "your-secret-here")
    - In strict mode: entropy check for cryptographic secrets (≥ minEntropy bits)
    - In non-strict mode: log WARNING for missing, ERROR for required missing
  - Entropy estimation: Shannon entropy on value string (simple heuristic, not cryptographic)
- **AC:** `getSecret('BETTER_AUTH_SECRET')` returns env value; `getSecret('NONEXISTENT')` throws; `validateSecrets` reports missing secrets.
- **Deps:** Tasks 3.1, 3.2.
- **Est. lines:** ~90.

### Task 3.4 — Implement startup validation

- [x] Create `packages/security/src/secrets/validation.ts`:
  - `validateSecrets(provider, options?)` standalone function (can be used without EnvProvider instance)
  - Environment-aware behavior:
    - CI (`process.env.CI=true`): strict mode, `process.exit(1)` on failure
    - Development: non-strict, WARN log
    - Production (default): non-strict, ERROR log, health check reports
    - Production opt-in strict: `SECRET_VALIDATION_STRICT=true` → `process.exit(1)`
- **AC:** CI fails on missing required secret; dev logs warnings; production logs errors but doesn't crash.
- **Deps:** Tasks 3.2, 3.3.
- **Est. lines:** ~60.

### Task 3.5 — Create barrel export for secrets module

- [x] Create `packages/security/src/secrets/index.ts`:
  - Export `SecretProvider`, `SecretNotFoundError`, `ValidationResult`, `ValidationError`
  - Export `EnvProvider`
  - Export `SECRETS_INVENTORY`, `SecretMetadata`
  - Export `validateSecrets`
  - Create singleton: `export const secrets: SecretProvider = new EnvProvider()`
- **AC:** `import { secrets } from "@drenyra/security/secrets"` works; `secrets.getSecret('X')` resolves.
- **Deps:** Tasks 3.1–3.4.
- **Est. lines:** ~15.

### Task 3.6 — Add secret pattern detection to pre-commit hook

- [ ] Modify `.husky/pre-commit`:
  - Append secret detection block after existing `bunx lint-staged`:
    - Patterns: API key formats (32+ alphanum), private key headers (`BEGIN RSA/EC/OPENSSH/PGP PRIVATE KEY`), connection strings with credentials (`postgres://user:pass@`), high-entropy base64 (40+ chars)
    - Skip globs: `*.test.ts`, `*.spec.ts`, `*.md`, `.env.example`
    - Support `// nosec` inline bypass
    - On match: print `❌ SECURITY: Possible secret detected`, show file + line, `exit 1`
  - Use POSIX-compatible shell (no bashisms beyond basic grep/xargs)
- **AC:** Committing a file with `BETTER_AUTH_SECRET=sk-live-1234abcd...` is rejected; adding `// nosec` on the line bypasses; test files are not scanned.
- **Deps:** None (independent).
- **Est. lines:** ~40 (modified hook).

### Task 3.7 — Create secret management documentation

- [x] Create `docs/05-security/secret-management.md`:
  - Complete secrets inventory table (mirrors `SECRETS_INVENTORY` in code)
  - Rotation procedures for `BETTER_AUTH_SECRET` and `DRENYRA_MASTER_KEY` (per design §3.6)
  - Infisical migration strategy: Phase A (assessment now) → Phase B (deployment, separate SDD) → Phase C (cleanup, separate SDD)
  - Environment variable conventions (`.env.example` vs `.env`)
- **AC:** Document covers all 9 secrets; rotation procedures have step-by-step instructions; Infisical strategy has clear phases.
- **Deps:** Task 3.2.
- **Est. lines:** ~150.

### Task 3.8 — Write secrets unit tests

- [x] Create `packages/security/__tests__/secrets/env-provider.test.ts`:
  - `getSecret` returns env var value
  - `getSecret` throws for undefined var
  - `getSecret` throws for empty var
  - `validateSecrets` reports missing required secret
  - `validateSecrets` in strict mode catches placeholder values
  - `validateSecrets` in non-strict mode does not throw
- [ ] Create `packages/security/__tests__/secrets/validation.test.ts`:
  - Mock env to simulate CI, dev, and production modes
  - Verify CI strict mode → `process.exit` called
  - Verify dev mode → only warnings
  - Verify production default → errors logged, no crash
- **AC:** All secrets tests pass; CI mode correctly fails; dev mode correctly warns.
- **Deps:** Tasks 3.3, 3.4.
- **Est. lines:** ~150 (2 test files).

### Task 3.9 — Secrets PR3 finalization: typecheck + test

- [ ] Run `bun run typecheck` — zero new errors
- [ ] Run `bun run test --filter @drenyra/security` — secrets tests pass
- [ ] Verify pre-commit hook detects a test secret pattern (create temp file, attempt staged commit, confirm rejection)
- [ ] Verify `// nosec` bypass works
- **AC:** Zero type errors; secrets tests pass; pre-commit hook correctly blocks and allows.
- **Deps:** Tasks 3.1–3.8.
- **Est. lines:** ~0 (verification-only).

<!-- sdd-owner: implementation -->

- [ ] Bounded review: verify Secrets PR3 readiness. <!-- sdd-owner: parent -->

---

## Phase 4: Security Monitoring & Incident Response (PR3 — same PR as Phase 3)

### Task 4.1 — Create monitoring strategy document

- [x] Create `docs/05-security/monitoring-strategy.md`:
  - Current monitoring inventory: access logs (ALLOW/DENY), auth events (login, MFA, lockout), error logs (rate limit, exceptions)
  - Where logs are stored: stdout → Fly.io log aggregation (current); roadmap: structured → Vector/ClickHouse
  - Retention: Fly.io default (document what that is); recommended: 90 days for security events
  - Alerting gaps: what is logged but NOT alerted on
  - Alert trigger definitions table (8 triggers from design §4.2): A1 failed login spike, A2 MFA brute force, A3 RBAC denial spike, A4 role/permission change, A5 destructive endpoint access, A6 secret validation failure, A7 unusual SUNAT queries, A8 session from new geo/IP
  - Each trigger: severity, threshold, expected response time
  - Future roadmap: structured logging, SIEM integration, anomaly detection
- **AC:** All 8 alert triggers defined with severity and threshold; current gaps identified; roadmap is realistic.
- **Deps:** None (documentation-only).
- **Est. lines:** ~200.

### Task 4.2 — Create incident response runbook

- [x] Create `docs/05-security/incident-response-runbook.md`:
  - 4 playbooks from design §4.3:
    1. **Credential Compromise**: detection → immediate containment (15 min) → investigation (1 hour) → remediation → notification → post-incident review (48h)
    2. **Brute Force / Credential Stuffing**: detection → containment (rate limit adjustments, IP blocking) → investigation (targeted accounts) → remediation (password resets)
    3. **Data Exfiltration Suspicion**: detection → containment (revoke sessions, freeze account) → investigation (access log audit, scope determination) → notification (legal, regulatory)
    4. **Privilege Escalation Attempt**: detection → containment (revoke sessions, revert role) → investigation (audit trail, vector identification) → remediation (patch, RBAC audit)
  - Each playbook: Spanish-language playbook for Drenyra team (primary users are Spanish-speaking)
  - Escalation contacts section (placeholder — fill with real contacts before production)
  - Template: notification email to affected users
- **AC:** All 4 playbooks have clear triggers, containment steps, investigation steps, and remediation steps; each step has a time-bound SLA.
- **Deps:** None (documentation-only).
- **Est. lines:** ~350.

### Task 4.3 — Document security review cadence

- [ ] Add review cadence section to `docs/05-security/incident-response-runbook.md`:
  - Threat model review: every 6 months or on major architectural change
  - NIST CSF re-baseline: annually
  - RBAC permission audit: quarterly
  - Secret rotation audit: monthly
  - Incident response drill: every 6 months (tabletop)
  - Dependency vulnerability scan: weekly (CI automated)
  - Each review: owner, trigger, output (dated summary with findings)
- **AC:** All 6 review types documented; each has clear owner, frequency, and output format.
- **Deps:** Task 4.2.
- **Est. lines:** ~50 (section in runbook).

### Task 4.4 — Update security docs README with Phase 4 links

- [x] Modify `docs/05-security/README.md` (created in Task 0.2):
  - Update `incident-response-runbook.md` and `monitoring-strategy.md` from "forthcoming" to linked
  - Add `secret-management.md` link
  - Ensure all 5 documents are referenced with descriptions
- **AC:** README lists all 5 security docs; no dead links.
- **Deps:** Tasks 4.1, 4.2, 4.3.
- **Est. lines:** ~10 (modified).

### Task 4.5 — Phase 4 finalization: documentation review

- [ ] Verify all 4 security docs exist under `docs/05-security/`:
  - `threat-model.md` (Phase 0 — already written)
  - `nist-csf-baseline.md` (Phase 0)
  - `incident-response-runbook.md` (Phase 4)
  - `monitoring-strategy.md` (Phase 4)
  - `secret-management.md` (Phase 3)
  - `README.md` (Phase 0 + updated)
- [ ] Verify each document has version, date, and author
- [ ] Verify threat model references H02 dependency
- **AC:** 6 files present; all have version metadata; cross-references correct.
- **Deps:** Tasks 0.1–4.4.
- **Est. lines:** ~0 (verification-only).

<!-- sdd-owner: implementation -->

- [ ] Bounded review: verify Phase 4 documentation readiness. <!-- sdd-owner: parent -->

---

## Cross-Cutting Finalization (All Phases)

### Task C.1 — Full test suite regression check

- [ ] Run `bun run test` from root — all existing tests pass
- [ ] Run `bun run typecheck` from root — zero errors
- [ ] Run `bun run lint` if configured — no new warnings
- **AC:** Zero regressions across entire monorepo.
- **Deps:** All phase tasks.
- **Est. lines:** ~0 (verification-only).

### Task C.2 — Feature flag smoke matrix

- [ ] Verify with `UNIFIED_RBAC_ENABLED=false`: old dual-system decides, no unified code path executes
- [ ] Verify with `UNIFIED_RBAC_ENABLED=true`: unified guard decides
- [ ] Verify with `TOTP_ENABLED=false`: MFA middleware is no-op, enrollment returns "not available"
- [ ] Verify with `SECRET_VALIDATION_STRICT=true` + missing secret: `process.exit(1)` in CI
- [ ] Verify with `SECRET_VALIDATION_STRICT=false` + missing secret: process starts, ERROR logged
- **AC:** All 5 flag combinations produce expected behavior; rollback is instant (env var change + restart).
- **Deps:** Task C.1.
- **Est. lines:** ~0 (verification-only).

### Task C.3 — Engram persistence

- [ ] Save final tasks state to `sdd/drenyra-security-foundation/tasks` in Engram
- [ ] Verify artifact is retrievable via `mem_search` + `mem_get_observation`
- **AC:** Tasks artifact exists in Engram with correct topic key.
- **Deps:** All prior tasks.
- **Est. lines:** ~0 (metadata-only).

<!-- sdd-owner: implementation -->

- [ ] Cross-cutting bounded review: verify overall SDD readiness. <!-- sdd-owner: parent -->
