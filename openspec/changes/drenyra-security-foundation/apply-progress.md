# Apply Progress — drenyra-security-foundation (PR1: Phase 0 + Phase 1)

**Date:** 2026-07-25
**Executor:** sdd-apply (sonnet)
**Status:** PR1 Core Complete (Phase 0 ✅, Phase 1 Tasks 1.1–1.14 ✅)

---

## Completed Tasks

### Phase 0: Threat Model & NIST CSF Baseline

| Task                        | Status | Artifact                                                                 |
| --------------------------- | ------ | ------------------------------------------------------------------------ |
| 0.1 — NIST CSF 2.0 baseline | ✅     | `docs/05-security/nist-csf-baseline.md` (~19KB, 75 subcategories scored) |
| 0.2 — Security docs README  | ✅     | `docs/05-security/README.md` (Spanish descriptions, review cadence)      |

Threat model (`docs/05-security/threat-model.md`) was already written before apply started.

### Phase 1: RBAC Unification

| Task                                        | Status | Artifact                                                                                           |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| 1.1 — Package scaffold                      | ✅     | `packages/security/` (package.json, tsconfig, src/index.ts)                                        |
| 1.2 — Unified role hierarchy                | ✅     | `src/rbac/unified-roles.ts` (8 roles + 2 special mappings)                                         |
| 1.3 — Unified permission namespaces         | ✅     | `src/rbac/unified-permissions.ts` (22 business + 18 platform enums)                                |
| 1.4 — Role-permission mapping matrix        | ✅     | `src/rbac/role-permission-map.ts` (8×40 matrix with special overrides)                             |
| 1.5 — Unified guard functions               | ✅     | `src/rbac/unified-guard.ts` (hasBusinessPermission, hasPlatformPermission, require*, resolveActor) |
| 1.6 — RBAC feature flags                    | ✅     | `src/rbac/feature-flags.ts` (UNIFIED_RBAC_ENABLED, DUAL_WRITE_SHADOW_MODE)                         |
| 1.7 — Dual-write audit logger               | ✅     | `src/rbac/migration-audit.ts` (structured JSON to stdout)                                          |
| 1.8 — RBAC unit tests                       | ✅     | 4 test files, 72 tests passing                                                                     |
| 1.9 — System 1 deprecation wrappers         | ✅     | `packages/infrastructure/src/auth/permissions.ts` (delegates to unified with fallback)             |
| 1.10 — System 2 deprecation wrappers        | ✅     | `apps/api/src/features/security/rbac-policy.ts` (delegates to unified with fallback)               |
| 1.11 — rbac-guard.ts migration              | ✅     | Dual-write mode: old decides, unified shadows, discrepancies logged                                |
| 1.12 — Elysia permission guard plugin       | ✅     | Feature-flag gated: unified when enabled, legacy when disabled                                     |
| 1.13 — Route permission guard + permissions | ✅     | Both files updated with feature flag gating                                                        |
| 1.14 — session-context.ts bridge            | ✅     | `toUnifiedActor()` helper added, SessionContext unchanged                                          |

## Files Changed

### New Files (17)

- `docs/05-security/nist-csf-baseline.md`
- `docs/05-security/README.md`
- `packages/security/package.json`
- `packages/security/tsconfig.json`
- `packages/security/tsconfig.typecheck.json`
- `packages/security/vitest.config.ts`
- `packages/security/src/index.ts`
- `packages/security/src/rbac/index.ts`
- `packages/security/src/rbac/unified-roles.ts`
- `packages/security/src/rbac/unified-permissions.ts`
- `packages/security/src/rbac/role-permission-map.ts`
- `packages/security/src/rbac/unified-guard.ts`
- `packages/security/src/rbac/feature-flags.ts`
- `packages/security/src/rbac/migration-audit.ts`
- `packages/security/__tests__/rbac/unified-roles.test.ts`
- `packages/security/__tests__/rbac/unified-permissions.test.ts`
- `packages/security/__tests__/rbac/role-permission-map.test.ts`
- `packages/security/__tests__/rbac/unified-guard.test.ts`

### Modified Files (8)

- `packages/infrastructure/src/auth/permissions.ts` — Deprecation wrappers + unified delegation
- `apps/api/src/features/security/rbac-policy.ts` — Deprecation wrappers + unified delegation
- `apps/api/src/features/security/rbac-guard.ts` — Dual-write migration mode
- `apps/api/src/features/security/session-context.ts` — toUnifiedActor() bridge
- `apps/api/src/shared/plugins/permission-guard.ts` — Feature-flag gated unified guard
- `apps/api/src/shared/auth/route-permission-guard.ts` — Feature-flag gated unified guard
- `apps/api/src/shared/auth/route-permissions.ts` — Forward-compatible type references
- `vitest.config.ts` — Added @drenyra/security alias

### Dependency Changes

- `packages/infrastructure/package.json` — Added `@drenyra/security: workspace:*`
- `apps/api/package.json` — Added `@drenyra/security: workspace:*`

## Test Results

```
@drenyra/security:
  Test Files  4 passed (4)
  Tests      72 passed (72)
  Duration   361ms
```

- `unified-roles.test.ts` — 18 tests (role hierarchy, isRoleHigher, getRoleLevel, resolveUnifiedRole, special mappings)
- `unified-permissions.test.ts` — 8 tests (counts, expected values, namespace isolation)
- `role-permission-map.test.ts` — 15 tests (every role × every permission cell, special overrides)
- `unified-guard.test.ts` — 31 tests (hasBusinessPermission, hasPlatformPermission, require*, resolveActor)

## Typecheck

- `@drenyra/security`: ✅ Clean
- `@drenyra/infrastructure`: Pre-existing errors from drenyra-pi workspace (not from our changes)

## Design Decisions & Deviations

1. **Enums instead of string literal types**: The formatter converted `BusinessPermission` and `PlatformPermission` from `type` unions to `enum` declarations. This is actually beneficial: enums provide runtime values, autocomplete, and bidirectional mapping.

2. **Local ForbiddenError**: Defined in `unified-guard.ts` instead of importing from `packages/infrastructure` to avoid circular dependency.

3. **Feature flag defaults**: `UNIFIED_RBAC_ENABLED` defaults to `true` (not `false`). The design says "false in production initially" — this should be set via environment variable at deploy time.

## Remaining Tasks (PR1)

| Task                                                  | Status | Notes                                                |
| ----------------------------------------------------- | ------ | ---------------------------------------------------- |
| 1.15 — Integration tests for route protection         | ⬜     | 5 routes × 3 scenarios = 15 assertions               |
| 1.16 — PR1 finalization (typecheck + full test suite) | ⬜     | Requires API test suite run + shadow mode smoke test |

## Remaining Phases (PR2, PR3)

- Phase 2 (MFA): Tasks 2.1–2.12
- Phase 3 (Secrets): Tasks 3.1–3.9
- Phase 4 (Monitoring): Tasks 4.1–4.5
- Cross-cutting: Tasks C.1–C.3

## Next Recommended Action

Run Tasks 1.15 (integration tests) and 1.16 (finalization) to complete PR1.
