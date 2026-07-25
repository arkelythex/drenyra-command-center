# Proposal: Invitations & Membership Flow

**Change**: drenyra-invitations
**Date**: 2026-07-14
**Author**: el Gentleman

---

## Problem

Drenyra organizations are single-user by default. The only path to membership is `ensureUserCompanyMembershipFromRuc`, which auto-creates an OWNER membership during signup bootstrap. There is no mechanism to:

1. **Invite a colleague** to an existing organization
2. **Accept or reject** an invitation
3. **Assign roles** other than OWNER (the bootstrap path always sets OWNER)

Every Drenyra organization today has exactly one human member: the founder. Multi-user firms — accounting teams, audit firms, companies with both accountants and approvers — cannot onboard their actual team structure. The `ROLE_PERMISSIONS` matrix and `MembershipRole` type already define six roles with granular permissions, but only OWNER is ever assigned.

**Why now**: The `authUserCompanies` membership bridge was built for this. The domain layer already has `OrganizationMembership`, `MembershipRole`, `MembershipStatus`, and `ROLE_PERMISSIONS`. Adding invitations completes the circuit: users can actually join organizations with roles other than OWNER.

---

## Target Users & Situations

| Who | Situation | Urgency |
|-----|-----------|---------|
| Firm owner (OWNER) | Just signed up, needs to invite their accountant and reviewer | High — blocked without this |
| Firm admin (ADMIN) | Managing day-to-day team; needs to onboard new hires | High |
| Accountant / Reviewer / Approver / Viewer | Receives email invitation, clicks link, accepts | Normal |
| Invited user who isn't registered yet | Clicks invitation link → signs up → membership auto-activated | Normal |

---

## Product Outcome

After this change:

1. An OWNER or ADMIN can **create an invitation** specifying email + role for their company
2. The invited user receives a **token-based invitation** (link or code)
3. The invited user can **accept** (membership created with assigned role, status `active`) or **reject** (invitation closed, no membership)
4. Invitations have **expiry** (7 days), preventing stale dangling tokens
5. Only non-members can be invited; inviting an existing member is rejected

### What should feel different

- An OWNER signs up, sees an empty team, and knows exactly how to invite their first colleague
- An accountant receives an invitation email, clicks, and immediately has access to the right company with the right permissions
- No manual DB intervention needed to add a second user to an organization

---

## Current-State Gap

| Capability | Current | After |
|------------|---------|-------|
| Membership creation | Only via RUC bootstrap (OWNER) | Via invitation accept (any role except OWNER) |
| Role assignment | Hardcoded to OWNER | Inviter selects role from allowed set |
| Multi-user orgs | Not possible | Fully supported |
| Invitation entity | Does not exist | `auth_invitations` table |
| Accept/reject flow | Does not exist | Token-based endpoints |
| Membership status | Not tracked at DB level | `status` field added to `authUserCompanies` |

Key gap: `authUserCompanies` has no `status` column — it needs one for membership lifecycle (active/suspended/revoked/expired). This is a small but necessary schema migration.

---

## Scope — First Slice

### In scope

1. **`auth_invitations` table** — `id`, `companyId`, `organizationId`, `inviterUserId`, `inviteeEmail`, `role`, `token` (crypto random), `status` (pending|accepted|rejected|expired), `expiresAt`, `createdAt`, `updatedAt`
2. **Create invitation** — `POST /api/companies/:companyId/invitations` — OWNER/ADMIN only, validates email is not already a member, assigns a non-OWNER role
3. **Accept invitation** — `POST /api/invitations/:token/accept` — validates token (exists, pending, not expired), creates `authUserCompanies` row with assigned role and status `active`
4. **Reject invitation** — `POST /api/invitations/:token/reject` — marks invitation as rejected
5. **List pending invitations** — `GET /api/companies/:companyId/invitations` — OWNER/ADMIN only, filters by status pending
6. **Cancel invitation** — `DELETE /api/companies/:companyId/invitations/:id` — OWNER/ADMIN only, marks as revoked
7. **`status` column on `authUserCompanies`** — migration adding `membership_status` (default `active` for existing rows)
8. **`user:invite` permission enforcement** — only roles with this permission (OWNER, ADMIN) can create/cancel invitations

### Out of scope (future slices)

- **Bulk invitation** — CSV upload, multi-email invites
- **SSO / OIDC auto-join** — domain-based automatic membership
- **SCIM provisioning** — enterprise identity integration
- **Role management API** — changing a member's role post-acceptance
- **Membership revocation/suspension** — status change lifecycle API
- **Email delivery** — transactional email sending is a separate concern; this slice stores the invitation and returns the token; email dispatch is orchestrated externally or in a follow-up
- **Invitation resend** — regenerate token and reset expiry
- **Audit log for invitations** — separate from the core flow

---

## Business Rules

### Invitation creation

- **RBAC**: Only roles with `user:invite` permission (OWNER, ADMIN) can create invitations
- **Role constraint**: Invited role must be a valid `MembershipRole` except OWNER (one OWNER per company; OWNER transfer is a separate flow)
- **Duplicate prevention**: Cannot invite an email that already has an active membership in the same company
- **Idempotency**: Inviting the same email again while a pending invitation exists returns the existing invitation (no duplicate tokens)
- **Email normalization**: Lowercase + trim before storage and lookup
- **Organization scoping**: Invitation is bound to `organizationId` from the authenticated context, never from request body

### Token security

- **Generation**: `crypto.randomUUID()` — 128-bit random, not predictable
- **Expiry**: 7 days from creation. Expired tokens reject with a specific error.
- **Single use**: Accepted or rejected invitations cannot be reused
- **No enumeration**: Token lookup returns same error for invalid vs. expired (prevents token scanning)

### Acceptance

- **Authentication required**: Invited user must be authenticated (Better Auth session)
- **Email match**: Authenticated user's email must match `inviteeEmail` (case-insensitive)
- **Status check**: Only `pending` invitations can be accepted
- **Expiry check**: Expired invitations are rejected before any state change
- **Result**: Creates `authUserCompanies` row with: `membershipRole` = invited role, `isDefault` = false (first-created membership stays default), `membershipStatus` = `active`

### Rejection

- **Authentication required**: Same as acceptance
- **Email match**: Same constraint
- **Result**: Marks invitation status as `rejected`, no membership created

---

## Edge Cases

| Edge case | Handling |
|-----------|----------|
| Token expired | Return `TOKEN_EXPIRED` error; invitation status becomes `expired` on first expired access |
| Token already accepted | Return `INVITATION_ALREADY_ACCEPTED`; idempotent — no duplicate memberships |
| Token already rejected | Return `INVITATION_ALREADY_REJECTED` |
| Token not found (invalid) | Return `INVITATION_NOT_FOUND` (same error shape as expired, no enumeration leak) |
| Invited email already a member | Reject at creation time with `ALREADY_MEMBER` |
| Invited user doesn't have an account yet | Acceptance requires auth; user must sign up first. Invitation token can be carried through signup flow (future enhancement). |
| Inviter loses permission after creating invite | Invitation remains valid; acceptance is independent of inviter's current status |
| Company deleted while invitation pending | Cascade delete via FK; invitation disappears |
| Attempt to invite with OWNER role | Reject at creation with `CANNOT_INVITE_OWNER` |
| Inviter tries to invite themselves | Reject at creation with `CANNOT_INVITE_SELF` |
| Cross-org invitation leakage | Token is org-scoped; company lookup always includes organizationId from the authenticated invitee's session |
| Multiple pending invites to same email for different companies | Allowed — each is independent (different company + organization) |

---

## Implications & Impact

| Area | Impact |
|------|--------|
| **Database** | New `auth_invitations` table + `membership_status` column on `authUserCompanies` — one migration |
| **Domain** | New `Invitation` entity in `packages/domain/src/membership/`; extends `MembershipRole` constraints |
| **API surface** | 4 new endpoints under companies; invitation accept/reject are top-level (no company context needed) |
| **Auth middleware** | No changes — `requireAuthContext()` already provides organizationId and memberships |
| **Scope resolver** | Needs update: `authUserCompanies` rows now include non-OWNER roles and must be filtered by `membershipStatus = active` |
| **Signup flow** | No changes required for first slice. Future: carry invitation token through signup. |
| **Frontend** | New invitation management UI (not in this proposal scope; API contract is the boundary) |
| **Email** | Not in first slice; API returns invitation data including token; email sending is external |
| **Testing** | New unit tests for invitation domain logic + integration tests for endpoints + property-based tests for token uniqueness and expiry |

---

## Decision Gaps

These are product-level unknowns that should be resolved before spec:

1. **Invitation email delivery**: Should the API trigger email sending directly, or should it emit an event that a separate worker consumes? (Recommendation: event-driven — API creates invitation and emits `invitation.created` event; email worker consumes it. This keeps the API fast and email failures don't block invitation creation.)

2. **Pre-registration invitations**: If an invited user doesn't have an account, should they be able to sign up and auto-claim the invitation? (Recommendation: yes, but in a follow-up slice. First slice requires the user to already be registered.)

3. **Invitation to existing member with different role**: Should we allow "re-inviting" someone to change their role? (Recommendation: no. Role changes are a separate role-management flow, not part of invitations.)

---

## Delivery Constraints

- **Review budget**: 400 lines (changed, non-documentation)
- **Estimated lines**: ~350 (schema migration ~40, domain entity + validation ~80, command handlers ~120, routes ~80, tests ~30)
- **PRs**: 1 (within budget)
- **TDD**: Strict mode active — domain logic tests first, then handlers, then integration

---

## Risks & Tradeoffs

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Schema migration breaks existing memberships | Low | Default `membership_status = active` for all existing rows |
| Token enumeration via timing attack | Low | Constant-time comparison not needed for UUID lookups; same error shape for invalid/expired |
| Scope resolver misses `status` filter and grants access to revoked members | Medium | Add `membershipStatus = active` filter in resolver; integration test covers revoked access |
| Invitation token leaked in logs/URLs | Medium | Token in response body only, not in query strings; recommend POST (body) for accept/reject |
| Race condition: two accepts on same token | Low | Database unique constraint on `authUserCompanies(userId, companyId)` prevents duplicate membership; application-layer check prevents double-accept |

---

## Rollback

- Drop `auth_invitations` table
- Drop `membership_status` column from `authUserCompanies`
- Revert scope resolver filter change
- No data loss: memberships created via invitation acceptance are valid memberships; rollback removes the invitation mechanism but not the memberships themselves

---

## Success Criteria

1. OWNER can create an invitation for `accountant@firm.com` with role `ACCOUNTANT`
2. `accountant@firm.com` can accept the invitation via valid token → membership created with `ACCOUNTANT` role and `active` status
3. `accountant@firm.com` can reject a different invitation → invitation marked `rejected`, no membership
4. Expired token (8+ days) returns clear error
5. Inviting an existing member returns `ALREADY_MEMBER`
6. Inviting with OWNER role returns `CANNOT_INVITE_OWNER`
7. VIEWER role cannot create invitations (403)
8. Scope resolver returns only `active` memberships after migration
9. All existing memberships remain `active` after migration
10. Test suite passes with strict TDD compliance
