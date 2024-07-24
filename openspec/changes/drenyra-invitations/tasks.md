# Tasks: Invitations & Membership Flow

**Change**: drenyra-invitations
**Date**: 2026-07-14
**Status**: tasks

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~664 (non-test: ~464, tests: ~200) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |
| PR 1 scope | Schema + Domain types + Error codes + Scope resolver + Domain unit tests (~186 lines) |
| PR 2 scope | All command handlers + Routes + Barrel + Handler unit tests (~398 lines) |
| PR 3 scope | End-to-end integration tests (~80 lines) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

---

## PR 1: Foundation — Schema, Domain & Scope Resolver

All tasks in PR 1 are self-contained: no API surface, no handler logic. Verifiable via unit tests + `db:push`.

### Phase 1A: RED — Domain Unit Tests (write FIRST)

- [x] Write unit tests for `normalizeEmail()` — trimming, lowercasing, mixed case, already-normal idempotency. File: `apps/api/src/features/auth/invitations/__tests__/domain/invitation.entity.test.ts` <!-- sdd-owner: implementation -->
- [x] Write unit tests for `isValidInvitationRole()` — valid roles pass, invalid string fails. Same file. <!-- sdd-owner: implementation -->
- [x] Write unit tests for `isInvitableRole()` — all roles except OWNER pass. Same file. <!-- sdd-owner: implementation -->
- [x] Write unit tests for `isExpired()` — past date true, future date false, current exact boundary. Same file. <!-- sdd-owner: implementation -->
- [x] Write unit tests for `generateInvitationToken()` — returns string, valid UUID v4 format. Same file. <!-- sdd-owner: implementation -->
- [x] Write unit tests for status transition validation — valid (pending→accepted, pending→rejected, pending→expired, pending→cancelled) and invalid (all terminal states → anything). Same file. <!-- sdd-owner: implementation -->
- [x] Write property-based test for token uniqueness — generating N tokens produces N distinct values. File: `apps/api/src/features/auth/invitations/__tests__/domain/invitation.entity.test.ts`. <!-- sdd-owner: implementation -->
- [x] Write property-based test for email normalization idempotency — `normalize(normalize(email)) === normalize(email)`. Same file. <!-- sdd-owner: implementation -->
- [x] Run tests — confirm ALL FAIL (RED phase). <!-- sdd-owner: implementation -->

### Phase 1B: GREEN — Domain Implementation

- [x] Create `apps/api/src/features/auth/invitations/domain/invitation.entity.ts` with `Invitation` interface, `InvitationStatus` const type, and validation functions (`normalizeEmail`, `isValidInvitationRole`, `isInvitableRole`, `isExpired`, `generateInvitationToken`, `isValidStatusTransition`). Follow TypeScript skill: `const STATUS = { ... } as const` pattern. <!-- sdd-owner: implementation -->
- [x] Create `apps/api/src/features/auth/invitations/domain/invitation.errors.ts` with error code constants (`INVITATION_NOT_FOUND`, `ALREADY_MEMBER`, `CANNOT_INVITE_OWNER`, `CANNOT_INVITE_SELF`, `INVALID_ROLE`, `EMAIL_MISMATCH`, `INVITATION_ALREADY_ACCEPTED`, `INVITATION_ALREADY_REJECTED`, `INVITATION_NOT_PENDING`). Use `as const` object pattern. <!-- sdd-owner: implementation -->
- [x] Run domain unit tests — confirm ALL PASS (GREEN phase). <!-- sdd-owner: implementation -->

### Phase 1C: TRIANGULATE — Edge Cases & Property Tests

- [x] Add edge-case test: `normalizeEmail` with non-ASCII characters, empty string, only whitespace. <!-- sdd-owner: implementation -->
- [x] Add edge-case test: `isExpired` with Date objects created via different constructors, with millisecond precision. <!-- sdd-owner: implementation -->
- [x] Add edge-case test: status transition matrix exhaustively — every combination of (current × attempted) produces correct boolean. <!-- sdd-owner: implementation -->
- [x] Add property-based test: token uniqueness and idempotency covered in Phase 1A test file. <!-- sdd-owner: implementation -->

### Phase 1D: Schema Migration + Scope Resolver

- [x] Read current `packages/persistence/src/schema/auth.schema.ts`. Add `authInvitations` table definition following the exact Drizzle schema from the design (section 1.1). Include all columns, indexes (`companyStatusIdx`, `tokenIdx`, `pendingEmailUidx` partial unique), and FK references. <!-- sdd-owner: implementation -->
- [x] Add `membershipStatus` column to existing `authUserCompanies` table: `varchar("membership_status", { length: 20 }).notNull().default("active")`. <!-- sdd-owner: implementation -->
- [x] Add `authInvitationsRelations` (inviter → authUsers) and extend `authUsersRelations` with `sentInvitations: many(authInvitations)`. <!-- sdd-owner: implementation -->
- [x] Re-export `authInvitations` and `authInvitationsRelations` from `packages/persistence/src/schema/index.ts`. <!-- sdd-owner: implementation -->
- [ ] Run `bun run --filter @drenyra/infrastructure db:push` to apply migration. Verify table + column exist via Drizzle Studio or direct SQL. (Requires running database — defer to orchestrator/PR 2 environment) <!-- sdd-owner: implementation -->
- [ ] Verify existing `auth_user_companies` rows all have `membership_status = 'active'` after migration. (Requires running database — defer to orchestrator/PR 2 environment) <!-- sdd-owner: implementation -->
- [x] Update `listUserCompanyMemberships` in `apps/api/src/features/auth/handlers/company-membership.ts`: add `eq(authUserCompanies.membershipStatus, "active")` to the `.where()` clause. <!-- sdd-owner: implementation -->

### Phase 1E: REFACTOR — Domain Cleanup

- [x] Review domain types for TypeScript skill compliance: flat interfaces, no `any`, const type pattern for statuses. <!-- sdd-owner: implementation -->
- [x] Verify no circular imports between `invitation.entity.ts` and `invitation.errors.ts`. <!-- sdd-owner: implementation -->
- [x] Run full domain test suite — confirm all still green after any refactor. <!-- sdd-owner: implementation -->

### PR 1 Bounded Review (parent)

- [ ] Start or reuse bounded review for PR 1 diff. <!-- sdd-owner: parent -->
- [ ] Validate pre-commit receipt with `gentle-ai review validate --gate pre-commit --cwd <repo>`. <!-- sdd-owner: parent -->

---

## PR 2: API Surface — Handlers & Routes

PR 2 depends on PR 1 (schema + domain must exist). All handler logic + Elysia routes.

### Phase 2A: RED — Handler Unit Tests (mocked DB, write FIRST)

- [ ] Write unit tests for `createInvitation` handler: success (201), OWNER role rejected (422), self-invite rejected (422), already-member rejected (409), no-permission VIEWER (403), duplicate pending idempotent (200), email normalization applied, invalid role rejected (422), organization scoping from auth context. File: `apps/api/src/features/auth/invitations/__tests__/handlers/create-invitation.test.ts` <!-- sdd-owner: implementation -->
- [ ] Write unit tests for `acceptInvitation` handler: success (200 + membership created), token not found (404), expired token (410 + lazy expiry), already accepted (409), already rejected (409), email mismatch (403), email case-insensitive match, unauthenticated (401), cross-org access blocked (404). File: `apps/api/src/features/auth/invitations/__tests__/handlers/accept-invitation.test.ts` <!-- sdd-owner: implementation -->
- [ ] Write unit tests for `rejectInvitation` handler: success (200), expired (410), already accepted (409), email mismatch (403). File: `apps/api/src/features/auth/invitations/__tests__/handlers/reject-invitation.test.ts` <!-- sdd-owner: implementation -->
- [ ] Write unit tests for `cancelInvitation` handler: success on pending (200), non-pending rejected (409), no permission (403), cross-company returns 404. File: `apps/api/src/features/auth/invitations/__tests__/handlers/cancel-invitation.test.ts` <!-- sdd-owner: implementation -->
- [ ] Write unit tests for `listInvitations` handler: empty list (200), pending only filtered, tokens excluded from response, VIEWER forbidden (403), status filter param. File: `apps/api/src/features/auth/invitations/__tests__/handlers/list-invitations.test.ts` <!-- sdd-owner: implementation -->
- [ ] Run handler tests — confirm ALL FAIL (RED phase). <!-- sdd-owner: implementation -->

### Phase 2B: GREEN — Handler Implementation

- [ ] Implement `createInvitation` handler. File: `apps/api/src/features/auth/invitations/application/commands/create-invitation.command.ts`. Follow existing pattern: import from `../../handlers/...`. Logic: resolve session identity, validate `user:invite` permission, normalize email, validate role (not OWNER, valid MembershipRole), check not self-invite, check not existing member, check idempotency (existing pending), generate token via `crypto.randomUUID()`, compute `expiresAt` (+7 days), insert into `authInvitations`, return `ok({ invitation })`. <!-- sdd-owner: implementation -->
- [ ] Implement `acceptInvitation` handler. File: `apps/api/src/features/auth/invitations/application/commands/accept-invitation.command.ts`. Logic: resolve session, find invitation by token, unified `INVITATION_NOT_FOUND` error for invalid/expired/rejected/accepted tokens, lazy-expire on expired access, validate email match (case-insensitive), check not already member, transaction: INSERT `authUserCompanies` (id=`${userId}:${companyId}`, `membershipRole`=invitation.role, `isDefault=false`, `membershipStatus=active`) + UPDATE invitation status to `accepted`. Use `onConflictDoNothing()` for idempotency. <!-- sdd-owner: implementation -->
- [ ] Implement `rejectInvitation` handler. File: `apps/api/src/features/auth/invitations/application/commands/reject-invitation.command.ts`. Logic: resolve session, find invitation, validate pending + not expired, validate email match, UPDATE status to `rejected`. <!-- sdd-owner: implementation -->
- [ ] Implement `cancelInvitation` handler. File: `apps/api/src/features/auth/invitations/application/commands/cancel-invitation.command.ts`. Logic: resolve session, validate `user:invite` permission, find invitation by id + companyId, validate status is `pending` (409 otherwise), UPDATE status to `revoked`. Cross-company access returns 404 (do not leak existence). <!-- sdd-owner: implementation -->
- [ ] Implement `listInvitations` handler. File: `apps/api/src/features/auth/invitations/application/queries/list-invitations.query.ts`. Logic: resolve session, validate `user:invite`, query `authInvitations` where `companyId` + `status = 'pending'` (or query param), exclude `token` from response, return `ok({ invitations })`. <!-- sdd-owner: implementation -->
- [ ] Run handler unit tests — confirm ALL PASS (GREEN phase). <!-- sdd-owner: implementation -->

### Phase 2C: Routes + Barrel

- [ ] Create `apps/api/src/features/auth/invitations/invitations.routes.ts` with Elysia + TypeBox route definitions. Follow `auth.routes.ts` pattern: separate handler function per route, TypeBox schemas for body/params, `prefix: "/api"`. Routes: `POST /companies/:companyId/invitations`, `GET /companies/:companyId/invitations`, `DELETE /companies/:companyId/invitations/:id`, `POST /invitations/:token/accept`, `POST /invitations/:token/reject`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/auth/invitations/index.ts` barrel export: re-export `invitationRoutes` and domain types. <!-- sdd-owner: implementation -->
- [ ] Register invitation routes in the main API app (likely `apps/api/src/index.ts` or equivalent entry point) via `.use(invitationRoutes)`. <!-- sdd-owner: implementation -->
- [ ] Run handler unit tests — confirm routes don't break handler contracts. <!-- sdd-owner: implementation -->

### Phase 2D: TRIANGULATE — Handler Edge Cases

- [ ] Write/run test: create invitation with whitespace-padded email → stored normalized. <!-- sdd-owner: implementation -->
- [ ] Write/run test: accept with a token that belongs to a different organization → 404 (no leak). <!-- sdd-owner: implementation -->
- [ ] Write/run test: cancel invitation that belongs to different company (same org) → 404 (no leak). <!-- sdd-owner: implementation -->
- [ ] Write/run test: accept after inviter's membership was revoked → still succeeds (inviter independence). <!-- sdd-owner: implementation -->
- [ ] Write/run test: expired token and non-existent token return identical error shape (status code, error code, body structure). <!-- sdd-owner: implementation -->
- [ ] Write/run test: accept → re-accept same token by same user → 409 `INVITATION_ALREADY_ACCEPTED`. <!-- sdd-owner: implementation -->

### Phase 2E: REFACTOR — Handler Cleanup

- [ ] Extract shared `hasInvitePermission(userId, companyId)` helper if duplicated across create/cancel/list handlers. <!-- sdd-owner: implementation -->
- [ ] Extract shared `findInvitationByToken(token)` helper if duplicated across accept/reject handlers. <!-- sdd-owner: implementation -->
- [ ] Verify all error responses use `fail()` from `shared/api-response.ts` with consistent shape. <!-- sdd-owner: implementation -->
- [ ] Run full handler test suite — confirm all still green. <!-- sdd-owner: implementation -->

### PR 2 Bounded Review (parent)

- [ ] Start or reuse bounded review for PR 2 diff. <!-- sdd-owner: parent -->
- [ ] Validate pre-commit receipt with `gentle-ai review validate --gate pre-commit --cwd <repo>`. <!-- sdd-owner: parent -->

---

## PR 3: End-to-End Integration Tests

PR 3 depends on PR 2 (API must be functional). Real database, real HTTP calls via Elysia test helpers.

### Phase 3A: RED — Integration Tests (write FIRST)

- [ ] Write integration test: full create → accept flow. Create invitation as OWNER, accept as invited user, verify `authUserCompanies` row exists with correct role + `membershipStatus = active`. File: `apps/api/src/features/auth/invitations/__tests__/integration/invitations.integration.test.ts` <!-- sdd-owner: implementation -->
- [ ] Write integration test: full create → reject flow. Create invitation, reject as invited user, verify status is `rejected`, no membership row created. Same file. <!-- sdd-owner: implementation -->
- [ ] Write integration test: create → expire → attempt accept. Create invitation with past `expiresAt`, accept attempt returns 410 + `INVITATION_NOT_FOUND`, status becomes `expired`. Same file. <!-- sdd-owner: implementation -->
- [ ] Write integration test: duplicate membership prevention. Create + accept, then accept again → 409, no duplicate `authUserCompanies` row. Same file. <!-- sdd-owner: implementation -->
- [ ] Write integration test: permission enforcement. VIEWER attempts to create invitation → 403, no row inserted. Same file. <!-- sdd-owner: implementation -->
- [ ] Write integration test: cross-company isolation. User from company A cannot see/cancel company B's invitations (404). Same file. <!-- sdd-owner: implementation -->
- [ ] Write integration test: email normalization end-to-end. Create with `  Colleague@Firm.COM  `, stored + returned as `colleague@firm.com`. Same file. <!-- sdd-owner: implementation -->
- [ ] Write integration test: session requirement. Unauthenticated request to accept → 401. Same file. <!-- sdd-owner: implementation -->
- [ ] Write integration test: scope resolver with non-active memberships. Create a membership, manually set `membershipStatus = revoked`, verify scope resolver excludes it. Same file. <!-- sdd-owner: implementation -->
- [ ] Run integration tests — confirm ALL FAIL (RED phase). <!-- sdd-owner: implementation -->

### Phase 3B: GREEN — Fix Any Gaps

- [ ] Run integration tests against PR 2 implementation. Fix any handler/route bugs discovered. <!-- sdd-owner: implementation -->
- [ ] Run integration tests — confirm ALL PASS (GREEN phase). <!-- sdd-owner: implementation -->

### Phase 3C: TRIANGULATE — Integration Edge Cases

- [ ] Write/run integration test: create invitation with OWNER role → 422 `CANNOT_INVITE_OWNER`. <!-- sdd-owner: implementation -->
- [ ] Write/run integration test: self-invite → 422 `CANNOT_INVITE_SELF`. <!-- sdd-owner: implementation -->
- [ ] Write/run integration test: invite existing active member → 409 `ALREADY_MEMBER`. <!-- sdd-owner: implementation -->
- [ ] Write/run integration test: idempotent re-invitation (same email, same company, pending exists) → 200 with same token. <!-- sdd-owner: implementation -->
- [ ] Write/run integration test: cancel non-pending invitation → 409 `INVITATION_NOT_PENDING`. <!-- sdd-owner: implementation -->
- [ ] Write/run integration test: list invitations excludes tokens from response. <!-- sdd-owner: implementation -->

### PR 3 Bounded Review (parent)

- [ ] Start or reuse bounded review for PR 3 diff. <!-- sdd-owner: parent -->
- [ ] Validate pre-commit receipt with `gentle-ai review validate --gate pre-commit --cwd <repo>`. <!-- sdd-owner: parent -->

---

## Final Verification

- [ ] Run full test suite (domain + handler + integration): `bun run test` from worktree root. Confirm all green. <!-- sdd-owner: implementation -->
- [ ] Verify `db:push` applies cleanly on a fresh database. <!-- sdd-owner: implementation -->
- [ ] Manual smoke test: create invitation via API, capture token, accept invitation, verify membership appears in scope. <!-- sdd-owner: implementation -->
- [ ] Verify all 10 success criteria from the proposal are met. <!-- sdd-owner: implementation -->

### Final Bounded Review (parent)

- [ ] Validate pre-push receipt with `gentle-ai review validate --gate pre-push --cwd <repo>`. <!-- sdd-owner: parent -->
