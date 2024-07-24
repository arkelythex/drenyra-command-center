# Invitations Specification

## Purpose

Enable multi-user organizations in Drenyra by allowing OWNER and ADMIN members to invite colleagues via email. Invited users receive a token-based invitation, accept or reject it, and upon acceptance gain membership with a designated role. This completes the membership circuit: the `authUserCompanies` bridge, `MembershipRole` matrix, and `ROLE_PERMISSIONS` already exist — invitations add the creation path.

## Requirements

### Requirement: Invitation Data Model

The system MUST persist invitations in a new `auth_invitations` table with the following columns, constraints, and indexes.

**Columns:**

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `text` / `uuid` | PRIMARY KEY |
| `companyId` | `uuid` | NOT NULL, FK → `auth_companies(id)` ON DELETE CASCADE |
| `organizationId` | `text` | NOT NULL, FK → `organizations(id)` ON DELETE CASCADE |
| `inviterUserId` | `text` | NOT NULL, FK → `auth_users(id)` ON DELETE CASCADE |
| `inviteeEmail` | `text` | NOT NULL |
| `role` | `varchar(50)` | NOT NULL, valid `MembershipRole` except OWNER |
| `token` | `text` | NOT NULL, UNIQUE |
| `status` | `varchar(20)` | NOT NULL, DEFAULT `pending` |
| `expiresAt` | `timestamp` | NOT NULL |
| `createdAt` | `timestamp` | NOT NULL, DEFAULT NOW() |
| `updatedAt` | `timestamp` | NOT NULL, DEFAULT NOW() |

**Status values:** `pending`, `accepted`, `rejected`, `expired`, `revoked`.

**Indexes:**
- `auth_invitations_token_idx` on `token` (unique lookup for accept/reject)
- `auth_invitations_company_status_idx` on `(companyId, status)` (list pending per company)
- `auth_invitations_email_company_idx` on `(inviteeEmail, companyId)` (duplicate check)

**Constraints:**
- UNIQUE on `(inviteeEmail, companyId, status)` where status = `pending` — only one pending invitation per email per company

#### Scenario: Invitation table creation

- GIVEN the database migration runs
- WHEN the `auth_invitations` table is inspected
- THEN all columns, indexes, and constraints are present as specified

#### Scenario: Cascade delete on company removal

- GIVEN a pending invitation exists for company X
- WHEN company X is deleted
- THEN the invitation row is removed via FK cascade

---

### Requirement: Membership Status Column on authUserCompanies

The system MUST add a `membershipStatus` column to the `auth_user_companies` table.

**Column:** `membershipStatus` — `varchar(20)`, NOT NULL, DEFAULT `active`.

**Status values:** `active`, `suspended`, `revoked`, `expired`.

**Migration behavior:** All existing rows receive `membershipStatus = active`.

#### Scenario: Migration sets existing memberships to active

- GIVEN the `auth_user_companies` table has 3 existing rows with no `membershipStatus` column
- WHEN the migration is applied
- THEN all 3 rows have `membershipStatus` = `active`

#### Scenario: New membership defaults to active

- GIVEN a user accepts an invitation
- WHEN the `authUserCompanies` row is created
- THEN `membershipStatus` is `active` by default

---

### Requirement: Scope Resolver Filters by Active Membership

The system MUST update the scope resolver to filter `authUserCompanies` rows by `membershipStatus = active` when constructing `OrganizationMembership` entries.

Only memberships with `membershipStatus = active` SHALL be included in the authenticated context. Rows with `suspended`, `revoked`, or `expired` status MUST be excluded from scope resolution.

#### Scenario: Active membership included in scope

- GIVEN a user has `membershipStatus = active` for company X
- WHEN the scope resolver runs
- THEN that membership is included in `AuthenticatedContext.memberships`

#### Scenario: Revoked membership excluded from scope

- GIVEN a user has `membershipStatus = revoked` for company X
- WHEN the scope resolver runs
- THEN that membership is NOT included in `AuthenticatedContext.memberships`

#### Scenario: Suspended membership excluded from scope

- GIVEN a user has `membershipStatus = suspended` for company X
- WHEN the scope resolver runs
- THEN that membership is NOT included in `AuthenticatedContext.memberships`

---

### Requirement: Create Invitation

The system MUST provide `POST /api/companies/:companyId/invitations` to create an invitation.

**Authorization:** Only users with `user:invite` permission (OWNER, ADMIN) on the target company.

**Request body:**
```json
{
  "inviteeEmail": "colleague@firm.com",
  "role": "ACCOUNTANT"
}
```

**Validation rules:**
1. `inviteeEmail` MUST be normalized (lowercase + trim) before storage and lookup
2. `role` MUST be a valid `MembershipRole` except `OWNER`
3. Invited email MUST NOT already have an active membership in the same company
4. Inviter MUST NOT invite their own email
5. Organization scoping: `organizationId` comes from authenticated context, never the request body

**Idempotency:** If a `pending` invitation already exists for the same `(inviteeEmail, companyId)`, return the existing invitation (200 OK, not 409).

**Token generation:** `crypto.randomUUID()` — 128-bit random.

**Expiry:** `expiresAt` = `NOW() + 7 days`.

**Response (201 Created):**
```json
{
  "invitation": {
    "id": "uuid",
    "companyId": "uuid",
    "inviteeEmail": "colleague@firm.com",
    "role": "ACCOUNTANT",
    "status": "pending",
    "token": "uuid-token",
    "expiresAt": "ISO-8601",
    "createdAt": "ISO-8601"
  }
}
```

#### Scenario: OWNER creates invitation successfully

- GIVEN an authenticated OWNER of company X
- AND `colleague@firm.com` has no membership in company X
- WHEN POST `/api/companies/{companyXId}/invitations` with `{"inviteeEmail": "colleague@firm.com", "role": "ACCOUNTANT"}`
- THEN the response is 201 Created with a pending invitation containing a UUID token
- AND `expiresAt` is exactly 7 days from now

#### Scenario: ADMIN creates invitation successfully

- GIVEN an authenticated ADMIN of company X (has `user:invite` permission)
- WHEN POST with valid email and role
- THEN the response is 201 Created

#### Scenario: VIEWER cannot create invitation (403)

- GIVEN an authenticated VIEWER of company X (lacks `user:invite`)
- WHEN POST `/api/companies/{companyXId}/invitations`
- THEN the response is 403 Forbidden
- AND no invitation is created

#### Scenario: Cannot invite OWNER role

- GIVEN an authenticated OWNER of company X
- WHEN POST with `{"inviteeEmail": "colleague@firm.com", "role": "OWNER"}`
- THEN the response is 422 Unprocessable Entity with error code `CANNOT_INVITE_OWNER`

#### Scenario: Cannot invite existing member

- GIVEN `colleague@firm.com` already has an active membership in company X
- WHEN OWNER POSTs an invitation for `colleague@firm.com`
- THEN the response is 409 Conflict with error code `ALREADY_MEMBER`

#### Scenario: Cannot invite self

- GIVEN an authenticated OWNER with email `owner@firm.com`
- WHEN POST with `{"inviteeEmail": "owner@firm.com", "role": "ADMIN"}`
- THEN the response is 422 Unprocessable Entity with error code `CANNOT_INVITE_SELF`

#### Scenario: Email normalization on creation

- GIVEN an authenticated OWNER of company X
- WHEN POST with `{"inviteeEmail": "  COLLEAGUE@Firm.COM  ", "role": "ACCOUNTANT"}`
- THEN `inviteeEmail` is stored as `colleague@firm.com`
- AND the response returns `colleague@firm.com`

#### Scenario: Idempotent re-invitation

- GIVEN a pending invitation already exists for `colleague@firm.com` in company X with role `ACCOUNTANT`
- WHEN the OWNER creates another invitation for the same email and role
- THEN the response is 200 OK returning the existing invitation (same token, same id)
- AND no duplicate row is created

#### Scenario: Organization scoping from auth context

- GIVEN an authenticated user whose `organizationId` is `org-abc`
- WHEN creating an invitation for company X (which belongs to `org-abc`)
- THEN `organizationId` in the invitation row is `org-abc`
- AND the request body cannot override this value

#### Scenario: Invalid role rejected

- GIVEN an authenticated OWNER
- WHEN POST with `{"role": "SUPERHERO"}`
- THEN the response is 422 Unprocessable Entity with error code `INVALID_ROLE`

---

### Requirement: List Pending Invitations

The system MUST provide `GET /api/companies/:companyId/invitations` to list pending invitations for a company.

**Authorization:** Only users with `user:invite` permission (OWNER, ADMIN) on the target company.

**Query:** Filters by `status = pending`. No pagination for the first slice.

**Response (200 OK):**
```json
{
  "invitations": [
    {
      "id": "uuid",
      "inviteeEmail": "colleague@firm.com",
      "role": "ACCOUNTANT",
      "status": "pending",
      "expiresAt": "ISO-8601",
      "createdAt": "ISO-8601"
    }
  ]
}
```

Tokens MUST NOT be included in the list response (token is only returned at creation time).

#### Scenario: List pending invitations for company

- GIVEN company X has 2 pending and 1 accepted invitation
- WHEN OWNER requests GET `/api/companies/{companyXId}/invitations`
- THEN the response returns only the 2 pending invitations
- AND tokens are not included in the response

#### Scenario: VIEWER cannot list invitations

- GIVEN an authenticated VIEWER of company X
- WHEN GET `/api/companies/{companyXId}/invitations`
- THEN the response is 403 Forbidden

#### Scenario: Empty list when no pending invitations

- GIVEN company X has 0 pending invitations (all either accepted, rejected, or expired)
- WHEN OWNER requests GET `/api/companies/{companyXId}/invitations`
- THEN the response is 200 OK with `{"invitations": []}`

---

### Requirement: Cancel Invitation

The system MUST provide `DELETE /api/companies/:companyId/invitations/:id` to cancel a pending invitation.

**Authorization:** Only users with `user:invite` permission (OWNER, ADMIN) on the target company.

**Effect:** Sets invitation `status` to `revoked`. Does NOT delete the row.

**Constraints:**
- Only `pending` invitations can be cancelled
- Cancelling an already accepted/rejected invitation returns 409 Conflict

**Response (200 OK):**
```json
{
  "invitation": {
    "id": "uuid",
    "status": "revoked",
    "updatedAt": "ISO-8601"
  }
}
```

#### Scenario: Cancel pending invitation

- GIVEN a pending invitation for `colleague@firm.com` in company X
- WHEN OWNER sends DELETE `/api/companies/{companyXId}/invitations/{invitationId}`
- THEN the invitation status becomes `revoked`
- AND the response is 200 OK

#### Scenario: Cannot cancel non-pending invitation

- GIVEN an invitation with status `accepted`
- WHEN OWNER sends DELETE for that invitation
- THEN the response is 409 Conflict with error code `INVITATION_NOT_PENDING`

#### Scenario: VIEWER cannot cancel invitations

- GIVEN an authenticated VIEWER
- WHEN DELETE `/api/companies/{companyXId}/invitations/{invitationId}`
- THEN the response is 403 Forbidden

#### Scenario: Cross-company access denied

- GIVEN an OWNER of company X
- WHEN they attempt to DELETE an invitation belonging to company Y
- THEN the response is 404 Not Found (do not leak existence)

---

### Requirement: Accept Invitation

The system MUST provide `POST /api/invitations/:token/accept` to accept an invitation.

**Authentication:** Required. The authenticated user's email MUST match `inviteeEmail` (case-insensitive).

**Validation rules (in order):**
1. Token MUST exist in `auth_invitations` table
2. Invitation `status` MUST be `pending`
3. `expiresAt` MUST be in the future
4. Authenticated user's email MUST match `inviteeEmail` (case-insensitive)
5. User MUST NOT already have an active membership in the invitation's company (belt-and-suspenders check)

**Side effects:**
1. Updates invitation `status` to `accepted`, sets `updatedAt`
2. Creates `authUserCompanies` row with:
   - `userId` = authenticated user's ID
   - `companyId` = invitation's `companyId`
   - `membershipRole` = invitation's `role`
   - `isDefault` = `false` (first-created membership through bootstrap stays default)
   - `membershipStatus` = `active`

**Error responses:** All error shapes for invalid token, expired token, and non-existent token MUST be identical to prevent token enumeration.

**Idempotency:** If the same user calls accept on an already-accepted invitation they own, return 200 OK with the existing membership data (no duplicate row thanks to the unique constraint on `authUserCompanies(userId, companyId)`).

**Response (200 OK):**
```json
{
  "membership": {
    "userId": "user-uuid",
    "companyId": "company-uuid",
    "membershipRole": "ACCOUNTANT",
    "membershipStatus": "active",
    "isDefault": false
  }
}
```

#### Scenario: Successful acceptance

- GIVEN a pending invitation for `colleague@firm.com` with role `ACCOUNTANT`, not expired
- AND the authenticated user is `colleague@firm.com`
- WHEN POST `/api/invitations/{token}/accept`
- THEN invitation status becomes `accepted`
- AND a new `authUserCompanies` row is created with `membershipRole = ACCOUNTANT` and `membershipStatus = active`
- AND the response is 200 OK with membership data

#### Scenario: Token not found

- GIVEN token `00000000-0000-0000-0000-000000000000` does not exist
- WHEN POST `/api/invitations/00000000-0000-0000-0000-000000000000/accept`
- THEN the response is 404 Not Found with error code `INVITATION_NOT_FOUND`
- AND no membership is created

#### Scenario: Token expired

- GIVEN a pending invitation with `expiresAt` in the past
- WHEN the matching user POSTs accept
- THEN the invitation status is updated to `expired` (lazy expiry)
- AND the response is 410 Gone with error code `INVITATION_NOT_FOUND` (same shape as not-found, no enumeration leak)
- AND no membership is created

#### Scenario: Token already accepted

- GIVEN an invitation with status `accepted`
- WHEN the matching user POSTs accept again
- THEN the response is 409 Conflict with error code `INVITATION_ALREADY_ACCEPTED`
- AND no duplicate membership is created

#### Scenario: Token already rejected

- GIVEN an invitation with status `rejected`
- WHEN the matching user POSTs accept
- THEN the response is 409 Conflict with error code `INVITATION_ALREADY_REJECTED`

#### Scenario: Email mismatch

- GIVEN a pending invitation for `colleague@firm.com`
- AND the authenticated user is `attacker@evil.com`
- WHEN POST `/api/invitations/{token}/accept`
- THEN the response is 403 Forbidden with error code `EMAIL_MISMATCH`

#### Scenario: Email match is case-insensitive

- GIVEN a pending invitation for `colleague@firm.com`
- AND the authenticated user's email is `Colleague@Firm.COM`
- WHEN POST accept
- THEN the email check passes
- AND the invitation is accepted successfully

#### Scenario: Unauthenticated request

- GIVEN a valid, pending invitation token
- WHEN an unauthenticated request POSTs accept
- THEN the response is 401 Unauthorized

---

### Requirement: Reject Invitation

The system MUST provide `POST /api/invitations/:token/reject` to reject an invitation.

**Authentication:** Required. The authenticated user's email MUST match `inviteeEmail` (case-insensitive).

**Validation rules:**
1. Token MUST exist
2. Invitation `status` MUST be `pending`
3. `expiresAt` MUST be in the future
4. Authenticated user's email MUST match `inviteeEmail` (case-insensitive)

**Side effect:** Sets invitation `status` to `rejected`, updates `updatedAt`. No membership is created.

**Response (200 OK):**
```json
{
  "invitation": {
    "id": "uuid",
    "status": "rejected",
    "updatedAt": "ISO-8601"
  }
}
```

#### Scenario: Successful rejection

- GIVEN a pending, non-expired invitation for `colleague@firm.com`
- AND the authenticated user is `colleague@firm.com`
- WHEN POST `/api/invitations/{token}/reject`
- THEN invitation status becomes `rejected`
- AND no `authUserCompanies` row is created
- AND the response is 200 OK

#### Scenario: Cannot reject already accepted invitation

- GIVEN an invitation with status `accepted`
- WHEN the matching user POSTs reject
- THEN the response is 409 Conflict with error code `INVITATION_ALREADY_ACCEPTED`

#### Scenario: Cannot reject expired invitation

- GIVEN an invitation with `expiresAt` in the past and status `pending`
- WHEN the matching user POSTs reject
- THEN the invitation status becomes `expired`
- AND the response is 410 Gone (same shape as accept-on-expired)

#### Scenario: Email mismatch on reject

- GIVEN a pending invitation for `colleague@firm.com`
- AND the authenticated user is `other@firm.com`
- WHEN POST reject
- THEN the response is 403 Forbidden with error code `EMAIL_MISMATCH`

---

### Requirement: Token Security

The system MUST enforce token security rules consistently across accept and reject endpoints.

1. Tokens MUST be generated using `crypto.randomUUID()` — 128-bit random, not predictable
2. Tokens MUST be single-use: once an invitation reaches terminal status (`accepted`, `rejected`, `expired`, `revoked`), the token cannot be reused
3. Enumeration prevention: invalid token, expired token, and non-existent token MUST return the same error code (`INVITATION_NOT_FOUND`) and HTTP status
4. Token MUST NOT appear in URLs (accept/reject use POST with token as path parameter; token is never in query strings)
5. Token MUST NOT appear in list-invitations response

#### Scenario: Expired token returns same error shape as invalid

- GIVEN a token that expired yesterday
- WHEN any user POSTs accept
- THEN the response shape (status code, error code, body structure) is identical to what a non-existent token returns

#### Scenario: Accepted token cannot be reused

- GIVEN an invitation that was already accepted
- WHEN any user POSTs accept with the same token
- THEN the response is 409 Conflict (status reflects the specific state, not enumeration-guarded)
- AND no state change occurs

#### Scenario: Token not leaked in list endpoint

- GIVEN a pending invitation with a valid token
- WHEN an admin lists invitations for the company
- THEN the token field is absent from every invitation in the response

---

### Requirement: Business Rule — Inviter Independence

The system MUST treat invitation validity as independent of the inviter's current status.

If the inviter's membership is suspended, revoked, or expired AFTER creating a valid invitation, the invitation SHALL remain valid and the invitee SHALL still be able to accept it.

#### Scenario: Invitee accepts after inviter loses access

- GIVEN OWNER A created a valid pending invitation for `colleague@firm.com`
- AND OWNER A's membership is subsequently revoked
- WHEN `colleague@firm.com` accepts the invitation
- THEN acceptance succeeds
- AND the membership is created with the invited role

---

### Requirement: Business Rule — Cross-Organization Isolation

The system MUST ensure invitations are organization-scoped and cannot leak across organizations.

When accepting an invitation, the `organizationId` from the invitation row MUST match the authenticated user's `organizationId` from their session context. This prevents cross-organization membership injection.

#### Scenario: Cross-org acceptance blocked

- GIVEN invitation token T is for `organizationId = org-A`
- AND the authenticated user belongs to `organizationId = org-B`
- WHEN the user POSTs accept with token T
- THEN the response is 404 Not Found (do not leak that the invitation exists in another org)

---

### Requirement: Business Rule — Expiry

The system MUST enforce invitation expiry with the following rules:

1. `expiresAt` = `NOW() + 7 days` at creation time
2. Expired invitations are rejected on accept/reject with a lazy status update to `expired`
3. Expiry is checked AFTER token lookup but BEFORE email match (prevents information leakage)
4. An invitation that expires while `pending` remains `expired` — no automatic background job required for the first slice

#### Scenario: Lazy expiry on first access after expiration

- GIVEN a pending invitation with `expiresAt` = 3 days ago
- WHEN the matching user POSTs accept
- THEN the invitation status is updated to `expired`
- AND the response is 410 Gone
- AND no membership is created

#### Scenario: Expiry is 7 days from creation

- GIVEN an invitation is created at `2026-07-14T12:00:00Z`
- THEN `expiresAt` is `2026-07-21T12:00:00Z`

---

## Test Requirements

### Unit Tests (domain logic)

1. **Token generation** — `crypto.randomUUID()` is called; output is a valid UUID v4
2. **Email normalization** — trimming and lowercase applied to various inputs
3. **Role validation** — invalid roles rejected, OWNER rejected, valid non-OWNER roles accepted
4. **Expiry calculation** — `expiresAt` is exactly `createdAt + 7 days`
5. **Status transitions** — valid: pending → accepted, pending → rejected, pending → revoked, pending → expired; invalid: accepted → anything, rejected → anything, revoked → anything, expired → anything
6. **Enumeration guard** — same error code and shape for invalid/expired/non-existent tokens

### Integration Tests (API endpoints)

7. **Create invitation** — 201 with valid data, 403 without `user:invite`, 422 for OWNER role, 409 for existing member, 422 for self-invite
8. **List invitations** — filters by pending only, excludes tokens, 403 for VIEWER
9. **Cancel invitation** — succeeds on pending, 409 on non-pending, 403 without permission
10. **Accept invitation** — 200 with membership creation, 404 for invalid token, 410 for expired, 409 for already accepted/rejected, 403 for email mismatch, 401 for unauthenticated
11. **Reject invitation** — 200 with status update, 409 for already accepted, 403 for email mismatch
12. **Scope resolver** — active membership included, revoked/suspended/expired excluded

### Property-Based Tests

13. **Token uniqueness** — generating N tokens produces N distinct values
14. **Email normalization idempotency** — normalizing an already-normalized email is a no-op
15. **Status transition matrix** — all valid and invalid transitions covered exhaustively

---

## Out of Scope

These capabilities are explicitly excluded from this spec and SHALL NOT be implemented in this change:

| Capability | Reason |
|------------|--------|
| Bulk invitation (CSV, multi-email) | Separate slice; requires batch processing and partial-failure semantics |
| SSO / OIDC auto-join | Domain-based auto-membership requires identity provider integration |
| SCIM provisioning | Enterprise identity standard; separate integration |
| Role management API (changing role post-acceptance) | Separate flow; has its own authorization rules |
| Membership suspension/revocation API | Lifecycle management beyond invitation acceptance |
| Email delivery (transactional email) | External concern; API returns token, email dispatch is orchestrated separately |
| Invitation resend (regenerate token) | Follow-up feature; requires new token generation and expiry reset |
| Audit log for invitation events | Separate observability concern |
| Pre-registration invitation flow | Invited user without account cannot accept; must sign up first (future enhancement) |
| OWNER role transfer | One-OWNER-per-company constraint; transfer is a separate privileged flow |
