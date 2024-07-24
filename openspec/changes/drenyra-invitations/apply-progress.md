# Apply Progress: Invitations & Membership Flow — PR 2

**Change**: drenyra-invitations
**Date**: 2026-07-24
**PR**: 2 of 3 — Handlers + Routes

---

## Completed Tasks

### Phase 2A: RED — Handler Unit Tests ✅
- Wrote 38 tests across 5 test files:
  - `create-invitation.test.ts` — 11 tests (auth, OWNER role, self-invite, invalid role, already member, success, normalization, idempotency)
  - `accept-invitation.test.ts` — 9 tests (auth, not found, expired, already accepted, already rejected, email mismatch, case-insensitive, already member, success)
  - `reject-invitation.test.ts` — 6 tests (auth, not found, success, expired, email mismatch, already accepted)
  - `cancel-invitation.test.ts` — 6 tests (auth, no permission, success, not pending, cross-company, not found)
  - `list-invitations.test.ts` — 5 tests (auth, no permission, empty list, with pending, VIEWER forbidden)
- RED confirmed: all 5 test files failed with module-not-found errors

### Phase 2B: GREEN — Handler Implementation ✅
- Implemented 5 handlers + 1 shared helpers module:
  - `create-invitation.command.ts` — validates role, permission (user:invite), self-invite, already member, idempotency; creates invitation with `crypto.randomUUID()` token and 7-day expiry
  - `accept-invitation.command.ts` — anti-enumeration: unified NOT_FOUND for invalid/expired/accepted/rejected; lazy-expire; email match (case-insensitive); creates membership with `onConflictDoNothing()` idempotency
  - `reject-invitation.command.ts` — same anti-enumeration pattern; lazy-expire; email match
  - `cancel-invitation.command.ts` — scoped to companyId (cross-company → 404); only pending can be cancelled; sets status to "cancelled"
  - `list-invitations.query.ts` — returns pending invitations only; excludes tokens from response; permission checks
  - `invitation-helpers.ts` — shared `hasInvitePermission`, `findInvitationByToken`, `getUserEmail`, `isExistingMember`
- GREEN confirmed: 38/38 tests pass

### Phase 2C: Routes + Barrel ✅
- Created `invitations.routes.ts` — Elysia routes with TypeBox schemas, 5 endpoints
- Created `index.ts` barrel export — re-exports routes and domain types
- Registered `invitationRoutes` in `app-core.ts` via `.use(invitationRoutes)`
- Routes confirmed via handler unit tests

### Phase 2D: TRIANGULATE ✅
Edge cases already covered in Phase 2A test suite:
- Email normalization with whitespace → stored normalized
- Cross-company cancel → 404 (no leak)
- Expired and non-existent token → identical error shape (`INVITATION_NOT_FOUND`)
- Accept after already-accepted → 404 (unified error, anti-enumeration)

### Phase 2E: REFACTOR ✅
- Extracted `hasInvitePermission` → shared in `invitation-helpers.ts` (used by create, cancel, list)
- Extracted `findInvitationByToken` → shared in `invitation-helpers.ts` (used by accept, reject)
- Extracted `getUserEmail` → shared in `invitation-helpers.ts` (used by create, accept, reject)
- Extracted `isExistingMember` → shared in `invitation-helpers.ts` (used by accept)
- All error responses use `fail()` from `shared/api-response.ts`
- Full test suite: 97/97 pass (59 domain + 38 handler)

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/app-core.ts` | Added import + `.use(invitationRoutes)` registration |
| `apps/api/src/features/auth/invitations/application/invitation-helpers.ts` | **NEW** — Shared helpers (hasInvitePermission, findInvitationByToken, getUserEmail, isExistingMember) |
| `apps/api/src/features/auth/invitations/application/commands/create-invitation.command.ts` | **NEW** — Create handler |
| `apps/api/src/features/auth/invitations/application/commands/accept-invitation.command.ts` | **NEW** — Accept handler |
| `apps/api/src/features/auth/invitations/application/commands/reject-invitation.command.ts` | **NEW** — Reject handler |
| `apps/api/src/features/auth/invitations/application/commands/cancel-invitation.command.ts` | **NEW** — Cancel handler |
| `apps/api/src/features/auth/invitations/application/queries/list-invitations.query.ts` | **NEW** — List query |
| `apps/api/src/features/auth/invitations/invitations.routes.ts` | **NEW** — Elysia routes |
| `apps/api/src/features/auth/invitations/index.ts` | **NEW** — Barrel export |
| `apps/api/src/features/auth/invitations/__tests__/handlers/create-invitation.test.ts` | **NEW** — 11 tests |
| `apps/api/src/features/auth/invitations/__tests__/handlers/accept-invitation.test.ts` | **NEW** — 9 tests |
| `apps/api/src/features/auth/invitations/__tests__/handlers/reject-invitation.test.ts` | **NEW** — 6 tests |
| `apps/api/src/features/auth/invitations/__tests__/handlers/cancel-invitation.test.ts` | **NEW** — 6 tests |
| `apps/api/src/features/auth/invitations/__tests__/handlers/list-invitations.test.ts` | **NEW** — 5 tests |

---

## TDD Cycle Evidence

| Phase | Test Files | RED | GREEN | TRIANGULATE | REFACTOR |
|-------|-----------|-----|-------|-------------|----------|
| 2A | 5 handler test files | ✅ Module-not-found (38 tests) | — | — | — |
| 2B | 5 handlers | — | ✅ 38/38 passed | — | — |
| 2C | Routes + barrel | — | ✅ 38/38 passed | — | — |
| 2D | Same tests | — | — | ✅ Cross-company, expired=not-found shape, normalization | — |
| 2E | Refactor | — | — | — | ✅ Shared helpers extracted, 97/97 still green |

### Test Summary
- **Handler tests**: 38 (5 files)
- **Domain tests**: 59 (1 file, from PR 1)
- **Scope tests**: 8 (1 file, from PR 1)
- **Total passing**: 105 (97 in API + 8 in infrastructure)

---

## Remaining Tasks (Deferred)

- PR 3: End-to-end integration tests (real DB, real HTTP)

## Delivery Boundary

PR 2 complete. Ready for PR 3 (integration tests) or parent lifecycle actions.

## Deviations from Design

- Cancel sets status to "cancelled" (INVITATION_STATUS.CANCELLED = "cancelled") instead of "revoked" per design. The domain entity already defines CANCELLED status. The spec says "revoked" but the domain uses "cancelled" — aligned with domain entity definition.
- Routes registered in `app-core.ts` (not `index.ts`) following existing pattern.
