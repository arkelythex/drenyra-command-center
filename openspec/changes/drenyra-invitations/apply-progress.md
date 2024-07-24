# Apply Progress: Invitations & Membership Flow — PR 1

**Change**: drenyra-invitations
**Date**: 2026-07-24
**PR**: 1 of 3 — Schema + Domain + Scope Resolver

---

## Completed Tasks

### Phase 1A: RED — Domain Unit Tests ✅
- Wrote 59 tests across 6 describe blocks in `invitation.entity.test.ts`
- Tests cover: `normalizeEmail` (7 tests), `isValidInvitationRole` (9), `isInvitableRole` (6), `isExpired` (6), `generateInvitationToken` (4), `isValidStatusTransition` (27)
- RED confirmed: test file failed to import non-existent module — expected

### Phase 1B: GREEN — Domain Implementation ✅
- Created `invitation.entity.ts` with:
  - `INVITATION_STATUS` const object + `InvitationStatus` type
  - `Invitation` interface (flat, TypeScript-compliant)
  - Validation functions: `normalizeEmail`, `isValidInvitationRole`, `isInvitableRole`, `isExpired`, `generateInvitationToken`, `isValidStatusTransition`
- Created `invitation.errors.ts` with 9 error code constants using `as const` pattern
- GREEN confirmed: 59/59 tests pass

### Phase 1C: TRIANGULATE ✅
- All edge cases already covered in initial test file:
  - Non-ASCII email characters
  - Empty/whitespace-only strings
  - Date constructors (string vs numeric)
  - Millisecond precision boundary
  - Exhaustive status transition matrix (5×5 = 25 transitions)
  - Token uniqueness verified with 100-iteration Set test

### Phase 1D: Schema Migration + Scope Resolver ✅
- Added `membershipStatus` column to `authUserCompanies` (varchar(20), default 'active')
- Added `authInvitations` table with all columns, indexes, and partial unique index
- Added `authInvitationsRelations` and extended `authUsersRelations`
- Re-exported from `packages/persistence/src/schema/index.ts`
- Updated `listUserCompanyMemberships` with `membershipStatus = 'active'` filter
- Wrote `h02-invitation-scope.test.ts` (8 tests) — all pass
- Added `./scope` export to `packages/domain/package.json` (required for existing scope-resolver imports)

### Phase 1E: REFACTOR ✅
- All types follow TypeScript skill: `as const` objects, flat interfaces, no `any`
- No circular imports between `invitation.entity.ts` and `invitation.errors.ts`
- Full test suite: 82/82 pass (59 domain + 23 scope resolver)

---

## Files Changed

| File | Change |
|------|--------|
| `packages/domain/package.json` | Added `"./scope"` export |
| `packages/persistence/src/schema/auth.schema.ts` | Added `membershipStatus` column + `authInvitations` table + relations |
| `packages/persistence/src/schema/index.ts` | Re-exported `authInvitations`, `authInvitationsRelations` |
| `apps/api/src/features/auth/handlers/company-membership.ts` | Added `membershipStatus = 'active'` filter + `and` import |
| `apps/api/src/features/auth/invitations/domain/invitation.entity.ts` | **NEW** — Invitation types + validation |
| `apps/api/src/features/auth/invitations/domain/invitation.errors.ts` | **NEW** — Error codes |
| `apps/api/src/features/auth/invitations/__tests__/domain/invitation.entity.test.ts` | **NEW** — 59 domain tests |
| `packages/infrastructure/src/auth/__tests__/h02-invitation-scope.test.ts` | **NEW** — 8 scope resolver tests |

---

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1A (domain tests) | `invitation.entity.test.ts` | Unit | N/A (new) | ✅ Written (import fail) | ✅ 59/59 passed | ✅ All edge cases in RED | ➖ Clean |
| 1B (domain impl) | `invitation.entity.test.ts` | Unit | ✅ 0→59 | N/A | ✅ 59/59 passed | N/A | ✅ TS-compliant |
| 1C (triangulate) | `invitation.entity.test.ts` | Unit | ✅ 59/59 | Already covered | ✅ 59/59 passed | ✅ 100 tokens unique, 5×5 matrix | ➖ None needed |
| 1D (schema) | `h02-invitation-scope.test.ts` | Unit | ✅ 15/15 existing | ✅ Written | ✅ 8/8 passed | ✅ All statuses tested | ➖ Clean |
| 1E (refactor) | Both test files | Unit | ✅ 82/82 | N/A | ✅ 82/82 passed | N/A | ✅ No circular deps |

### Test Summary
- **Total tests written**: 67 (59 domain + 8 scope)
- **Total tests passing**: 82 (67 new + 15 existing scope resolver)
- **Layers used**: Unit (82)
- **Pure functions created**: 5 (`normalizeEmail`, `isValidInvitationRole`, `isInvitableRole`, `isExpired`, `isValidStatusTransition`)
- **Approval tests**: None — no refactoring of existing code

---

## Remaining Tasks (Deferred)

- `db:push` migration application — requires running database
- Verify existing `auth_user_companies` rows — requires running database

## Delivery Boundary

PR 1 complete. Ready for PR 2 (handlers + routes).

## Infrastructure Note

- Found and fixed missing `./scope` export in `@drenyra/domain` package.json — the existing `scope-resolver.ts` imported from `@drenyra/domain/scope` but the export wasn't registered. Tests now pass.
- All tests run via `npx vitest run --config vitest.config.ts <file>` from the respective package directory.
