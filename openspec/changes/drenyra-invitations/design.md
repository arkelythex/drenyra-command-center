# Design: Invitations & Membership Flow

**Change**: drenyra-invitations
**Date**: 2026-07-14
**Status**: design

---

## 1. Data Model

### 1.1 `auth_invitations` Table (New)

```sql
CREATE TABLE auth_invitations (
  id              TEXT PRIMARY KEY,                        -- crypto.randomUUID()
  company_id      UUID NOT NULL,                           -- FK → companies.id
  inviter_user_id TEXT NOT NULL,                           -- FK → auth_users.id
  invitee_email   TEXT NOT NULL,                           -- normalized: lowercase + trim
  role            VARCHAR(50) NOT NULL,                    -- MembershipRole (except OWNER)
  token           TEXT NOT NULL UNIQUE,                    -- crypto.randomUUID()
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending|accepted|rejected|expired
  expires_at      TIMESTAMP NOT NULL,                      -- NOW() + 7 days
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_auth_invitations_company_status ON auth_invitations(company_id, status);
CREATE INDEX idx_auth_invitations_token ON auth_invitations(token);
CREATE UNIQUE INDEX idx_auth_invitations_pending_email ON auth_invitations(company_id, LOWER(invitee_email))
  WHERE status = 'pending';
```

**Drizzle schema definition** (in `packages/persistence/src/schema/auth.schema.ts`):

```typescript
export const authInvitations = pgTable(
  "auth_invitations",
  {
    id: text("id").primaryKey(),
    companyId: uuid("company_id").notNull(),
    inviterUserId: text("inviter_user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    inviteeEmail: text("invitee_email").notNull(),
    role: varchar("role", { length: 50 }).notNull(),
    token: text("token").notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    companyStatusIdx: index("idx_auth_invitations_company_status").on(
      table.companyId,
      table.status,
    ),
    tokenIdx: index("idx_auth_invitations_token").on(table.token),
    // Partial unique: only one pending invitation per company+email
    pendingEmailUidx: uniqueIndex("idx_auth_invitations_pending_email")
      .on(table.companyId, table.inviteeEmail)
      .where(sql`${table.status} = 'pending'`),
  }),
);
```

**Why partial unique index**: Prevents duplicate pending invitations to the same email for the same company. Already-accepted/rejected/expired invitations don't block new ones. This enforces idempotency at the database level.

### 1.2 `membership_status` Column on `authUserCompanies` (Migration)

Add to existing `authUserCompanies` table:

```sql
ALTER TABLE auth_user_companies
  ADD COLUMN membership_status VARCHAR(20) NOT NULL DEFAULT 'active';
```

**Drizzle schema update** in `authUserCompanies`:

```typescript
membershipStatus: varchar("membership_status", { length: 20 })
  .notNull()
  .default("active"),
```

**Default `active`**: All existing rows (bootstrap OWNER memberships) become `active`. No data migration needed — DEFAULT handles it.

**Valid values**: `active` | `suspended` | `revoked` | `expired` (matches `MembershipStatus` in `packages/domain/src/scope/types.ts`)

### 1.3 Relations

Add to `authInvitations` relations:

```typescript
export const authInvitationsRelations = relations(
  authInvitations,
  ({ one }) => ({
    inviter: one(authUsers, {
      fields: [authInvitations.inviterUserId],
      references: [authUsers.id],
    }),
  }),
);
```

Add to `authUsersRelations`:

```typescript
sentInvitations: many(authInvitations),
```

---

## 2. API Route Structure

### 2.1 File Organization

```
apps/api/src/features/auth/
├── invitations/
│   ├── index.ts                          # Barrel + routes export
│   ├── invitations.routes.ts             # Elysia route definitions
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-invitation.command.ts
│   │   │   ├── accept-invitation.command.ts
│   │   │   ├── reject-invitation.command.ts
│   │   │   └── cancel-invitation.command.ts
│   │   └── queries/
│   │       └── list-invitations.query.ts
│   └── domain/
│       ├── invitation.entity.ts          # Invitation type + validation
│       └── invitation.errors.ts          # Error codes + messages
```

This follows the existing pattern in `apps/api/src/features/auth/` — application/commands, application/queries, handlers, routes. The invitation domain logic (validation, error codes) lives under `invitations/domain/` because it's a sub-feature of auth.

### 2.2 Route Definitions (`invitations.routes.ts`)

Following the exact pattern from `auth.routes.ts` (Elysia + TypeBox, handler separated from route):

```typescript
import { Elysia, t } from "elysia";

export const invitationRoutes = new Elysia({ prefix: "/api" })
  // ── Company-scoped (firm admin) ──
  .post(
    "/companies/:companyId/invitations",
    (ctx) => createInvitation({ companyId: ctx.params.companyId, body: ctx.body }, ctx),
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        role: t.String(),  // validated in handler against MembershipRole - OWNER
      }),
      params: t.Object({
        companyId: t.String(),
      }),
    },
  )
  .get(
    "/companies/:companyId/invitations",
    (ctx) => listInvitations({ companyId: ctx.params.companyId }, ctx),
    {
      params: t.Object({
        companyId: t.String(),
      }),
    },
  )
  .delete(
    "/companies/:companyId/invitations/:id",
    (ctx) => cancelInvitation({
      companyId: ctx.params.companyId,
      invitationId: ctx.params.id,
    }, ctx),
    {
      params: t.Object({
        companyId: t.String(),
        id: t.String(),
      }),
    },
  )

  // ── Token-scoped (invitee) ──
  .post(
    "/invitations/:token/accept",
    (ctx) => acceptInvitation({ token: ctx.params.token }, ctx),
    {
      params: t.Object({
        token: t.String(),
      }),
    },
  )
  .post(
    "/invitations/:token/reject",
    (ctx) => rejectInvitation({ token: ctx.params.token }, ctx),
    {
      params: t.Object({
        token: t.String(),
      }),
    },
  );
```

**Route prefix**: `/api` matches the existing auth routes pattern.

**Why `companyId` in URL**: Matches the proposal spec (`POST /api/companies/:companyId/invitations`). Company context comes from URL, not body. The handler validates that the authenticated user has `user:invite` permission in that company.

### 2.3 Auth Middleware in Handlers

Each handler resolves auth context via `resolveSessionIdentityFromHeaders(headers)`:

```typescript
// Pattern used in all invitation handlers
import { resolveSessionIdentityFromHeaders } from "../../handlers/session-identity";

async function createInvitation(input, ctx) {
  const identity = await resolveSessionIdentityFromHeaders(ctx.headers);
  if (!identity.authUserId) {
    ctx.set.status = 401;
    return fail("Authentication required", "AUTH_REQUIRED");
  }
  // ... validate permission, create invitation
}
```

This is the same auth pattern used by `authenticated-caller.ts`. No middleware injection needed — handlers read session directly.

---

## 3. Token Generation & Validation

### 3.1 Generation

```typescript
import { randomUUID } from "node:crypto";

function generateInvitationToken(): string {
  return randomUUID(); // 128-bit random, unpredictable
}
```

**Why `crypto.randomUUID()`**: Cryptographically secure, 128 bits of entropy, no external dependencies, standard UUID format.

### 3.2 Expiry

- **Default**: 7 days from creation
- **Stored as**: `expires_at` TIMESTAMP on `auth_invitations`
- **Check**: `expiresAt < new Date()` — if true, mark as `expired` and reject

### 3.3 Token Lookup (Anti-Enumeration)

Single lookup pattern with unified error:

```typescript
async function findInvitationByToken(token: string): Promise<Invitation | null> {
  // Single query — no differentiation between invalid/expired at DB level
  const rows = await db
    .select()
    .from(authInvitations)
    .where(eq(authInvitations.token, token))
    .limit(1);
  return rows[0] ?? null;
}

// Usage:
const invitation = await findInvitationByToken(token);
if (!invitation) {
  // Same error for: not found, expired, already accepted, already rejected
  return fail("Invitation not found or no longer valid", "INVITATION_NOT_FOUND");
}
if (invitation.status === "expired" || invitation.expiresAt < new Date()) {
  // Lazy-expire: mark as expired on first expired access
  await markExpired(invitation.id);
  return fail("Invitation not found or no longer valid", "INVITATION_NOT_FOUND");
}
if (invitation.status === "accepted") {
  return fail("Invitation not found or no longer valid", "INVITATION_NOT_FOUND");
}
if (invitation.status === "rejected") {
  return fail("Invitation not found or no longer valid", "INVITATION_NOT_FOUND");
}
// Only 'pending' + not expired reaches here
```

**No timing leak**: Same error code `INVITATION_NOT_FOUND` for all non-pending-valid states.

---

## 4. Membership Creation on Accept

### 4.1 Flow

```
POST /api/invitations/:token/accept
  │
  ├─ 1. Resolve session identity (must be authenticated)
  ├─ 2. Find invitation by token
  ├─ 3. Validate: exists, pending, not expired
  ├─ 4. Validate: session email matches inviteeEmail (case-insensitive)
  ├─ 5. Check: user is not already a member of this company
  ├─ 6. BEGIN transaction
  │     ├─ INSERT INTO auth_user_companies
  │     │   (id, userId, companyId, membershipRole, isDefault, membershipStatus)
  │     │   VALUES (generateId(), invitee.id, invitation.companyId,
  │     │           invitation.role, false, 'active')
  │     └─ UPDATE auth_invitations SET status = 'accepted', updated_at = NOW()
  │        WHERE id = invitation.id
  └─ 7. Return success + membership details
```

### 4.2 ID Generation

Membership ID follows existing pattern from `ensureUserCompanyMembershipFromRuc`:

```typescript
const membershipId = `${userId}:${companyId}`;
```

This ensures compatibility with the existing `userCompanyUniqueIdx` unique constraint on `(userId, companyId)`.

### 4.3 `isDefault` Logic

- New memberships from invitations: **`isDefault = false`**
- The first (OWNER) membership remains `isDefault = true`
- If the user has no memberships yet (pre-registration scenario, future slice), the first would be `true`

### 4.4 Idempotency

The `auth_user_companies_user_company_uidx` unique constraint prevents duplicate membership. If accept is called twice:

```typescript
await db
  .insert(authUserCompanies)
  .values({ ... })
  .onConflictDoNothing(); // Safe — no error on duplicate
```

---

## 5. Status Filter in Scope Resolver

### 5.1 Problem

The `listUserCompanyMemberships` function in `company-membership.ts` currently queries all `authUserCompanies` rows for a user without filtering by status. After migration, revoked/suspended memberships would still appear.

### 5.2 Fix

Add `membershipStatus = 'active'` filter:

```typescript
// In listUserCompanyMemberships (apps/api/src/features/auth/handlers/company-membership.ts)
export async function listUserCompanyMemberships(
  userId: string,
): Promise<AccessibleCompany[]> {
  const rows = await db
    .select({ ... })
    .from(authUserCompanies)
    .innerJoin(companies, eq(authUserCompanies.companyId, companies.id))
    .where(
      and(
        eq(authUserCompanies.userId, userId),
        eq(authUserCompanies.membershipStatus, "active"),  // ← NEW
      ),
    )
    .orderBy(desc(authUserCompanies.isDefault), asc(companies.businessName));
  // ...
}
```

### 5.3 Scope Resolver Integration

The `OrganizationMembership` type in `packages/domain/src/scope/types.ts` already defines `status: MembershipStatus` and `isActiveMembership()`. The infrastructure layer just needs to return only `active` rows; the domain layer validates status.

### 5.4 Migration Impact

- Existing rows default to `active` → no change in behavior
- New revoke/suspend features (future slices) will set other statuses; the filter is already in place
- `isActiveMembership()` at the domain level adds defense-in-depth

---

## 6. Error Handling

### 6.1 Error Codes

| Code | HTTP | When |
|------|------|------|
| `AUTH_REQUIRED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Authenticated but lacks `user:invite` permission |
| `ALREADY_MEMBER` | 409 | Invitee email is already an active member of this company |
| `CANNOT_INVITE_OWNER` | 422 | Invited role is OWNER |
| `CANNOT_INVITE_SELF` | 422 | Inviter tries to invite their own email |
| `INVALID_ROLE` | 422 | Role is not a valid MembershipRole |
| `INVITATION_NOT_FOUND` | 404 | Token invalid, expired, accepted, or rejected (unified) |
| `EMAIL_MISMATCH` | 403 | Authenticated email ≠ inviteeEmail |
| `INVITATION_ALREADY_ACCEPTED` | 409 | Idempotency — already accepted (only surfaced for explicit re-accept after success) |

### 6.2 Response Shape

All errors use the existing `fail()` helper from `features/shared/api-response.ts`:

```typescript
return fail("User is already a member of this company", "ALREADY_MEMBER");
```

Success uses `ok()`:

```typescript
return ok({ invitation: { id, token, status, expiresAt, ... } });
```

### 6.3 Input Validation

TypeBox schemas on routes validate:
- Email format (`format: "email"`)
- Required fields

Business rule validation happens in handlers:
- Role validation (valid MembershipRole, not OWNER)
- Permission check (`user:invite`)
- Duplicate member check
- Self-invite check
- Token expiry and status

---

## 7. Command Handlers — Detailed Contracts

### 7.1 `createInvitation`

```
Input:
  companyId: string (from URL param)
  email: string (normalized)
  role: MembershipRole

Preconditions:
  - Auth user has active session
  - Auth user has 'user:invite' permission in companyId
  - role ∈ MembershipRole \ {OWNER}
  - normalized(email) ≠ auth user's email
  - normalized(email) is not already an active member of companyId

Side effects:
  - INSERT into auth_invitations (or return existing pending if idempotent)

Returns:
  { invitation: { id, token, status, expiresAt, role, inviteeEmail } }
```

### 7.2 `acceptInvitation`

```
Input:
  token: string (from URL param)

Preconditions:
  - Auth user has active session
  - Token exists, status = 'pending', not expired
  - Auth user's email (normalized) matches inviteeEmail (normalized)
  - Auth user is not already an active member of the invitation's company

Side effects (transaction):
  - INSERT into auth_user_companies (membershipRole=invitation.role, isDefault=false, membershipStatus='active')
  - UPDATE auth_invitations SET status = 'accepted'

Returns:
  { membership: { companyId, role, status: 'active' } }
```

### 7.3 `rejectInvitation`

```
Input:
  token: string (from URL param)

Preconditions:
  - Auth user has active session
  - Token exists, status = 'pending', not expired
  - Auth user's email (normalized) matches inviteeEmail (normalized)

Side effects:
  - UPDATE auth_invitations SET status = 'rejected'

Returns:
  { success: true }
```

### 7.4 `cancelInvitation`

```
Input:
  companyId: string (from URL param)
  invitationId: string (from URL param)

Preconditions:
  - Auth user has active session
  - Auth user has 'user:invite' permission in companyId
  - Invitation exists, belongs to companyId, status = 'pending'

Side effects:
  - UPDATE auth_invitations SET status = 'expired' (treated as cancelled)

Returns:
  { success: true }
```

### 7.5 `listInvitations`

```
Input:
  companyId: string (from URL param)

Preconditions:
  - Auth user has active session
  - Auth user has 'user:invite' permission in companyId

Returns:
  { invitations: Array<{ id, inviteeEmail, role, status, expiresAt, createdAt }> }
```

**Filter**: Only `status = 'pending'` by default. Optionally `?status=pending|accepted|rejected|expired` query param.

---

## 8. Domain Types

### 8.1 `Invitation` Entity

```typescript
// apps/api/src/features/auth/invitations/domain/invitation.entity.ts

const INVITATION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

type InvitationStatus = (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

interface Invitation {
  id: string;
  companyId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: MembershipRole;           // from domain/scope
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 8.2 Validation Functions

```typescript
function isValidInvitationRole(role: string): role is MembershipRole {
  const VALID_ROLES: MembershipRole[] = ["OWNER", "ADMIN", "ACCOUNTANT", "REVIEWER", "APPROVER", "VIEWER"];
  return VALID_ROLES.includes(role as MembershipRole);
}

function isInvitableRole(role: MembershipRole): boolean {
  return role !== "OWNER"; // One OWNER per company — OWNER transfer is separate flow
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}
```

---

## 9. Permission Enforcement

### 9.1 Checking `user:invite`

The invitation create/cancel/list endpoints need to verify the authenticated user has `user:invite` permission in the target company. 

**Approach**: Query `authUserCompanies` for the user's role in the company, then check `ROLE_PERMISSIONS[role].includes("user:invite")`.

```typescript
async function hasInvitePermission(userId: string, companyId: string): Promise<boolean> {
  const rows = await db
    .select({ membershipRole: authUserCompanies.membershipRole })
    .from(authUserCompanies)
    .where(
      and(
        eq(authUserCompanies.userId, userId),
        eq(authUserCompanies.companyId, companyId),
        eq(authUserCompanies.membershipStatus, "active"),
      ),
    )
    .limit(1);

  if (rows.length === 0) return false;

  const role = rows[0].membershipRole as MembershipRole;
  return ROLE_PERMISSIONS[role]?.includes("user:invite") ?? false;
}
```

**Roles with `user:invite`**: OWNER, ADMIN (per `ROLE_PERMISSIONS` in `packages/domain/src/scope/types.ts`).

---

## 10. Migration Plan

### 10.1 Single Migration File

Both schema changes in one migration (Drizzle generates from schema diff):

1. `CREATE TABLE auth_invitations` with indexes
2. `ALTER TABLE auth_user_companies ADD COLUMN membership_status VARCHAR(20) NOT NULL DEFAULT 'active'`

### 10.2 Execution

```bash
bun run --filter @drenyra/infrastructure db:push
```

Drizzle Kit reads the updated `auth.schema.ts` and generates/applies the migration.

### 10.3 Verification Queries

```sql
-- Verify column default
SELECT membership_status, count(*) FROM auth_user_companies GROUP BY membership_status;
-- Expected: all rows = 'active'

-- Verify table exists
SELECT * FROM auth_invitations LIMIT 0;
```

### 10.4 Index Verification

```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'auth_invitations';
-- Expected: idx_auth_invitations_company_status, idx_auth_invitations_token, idx_auth_invitations_pending_email
```

---

## 11. Testing Strategy (Strict TDD)

### 11.1 Test Order (TDD Compliance)

1. **Domain logic tests** (unit — write first, no DB)
   - `normalizeEmail()` — trimming, lowercasing
   - `isValidInvitationRole()` — valid/invalid/OWNER
   - `isInvitableRole()` — excludes OWNER
   - `isExpired()` — past/present/future dates
   - `generateInvitationToken()` — format (UUID), uniqueness (property-based)

2. **Handler tests** (unit with mocked DB)
   - `createInvitation` — success, duplicate pending (idempotent), OWNER role rejected, self-invite rejected, already member rejected, no permission (403)
   - `acceptInvitation` — success, expired token, wrong email, already member, already accepted, already rejected
   - `rejectInvitation` — success, expired token, wrong email, already processed
   - `cancelInvitation` — success, no permission, already processed invitation
   - `listInvitations` — empty, with pending, filtered by status

3. **Integration tests** (real DB)
   - Full create → accept flow
   - Full create → reject flow
   - Create → expire → attempt accept
   - Duplicate membership prevention (accept + re-accept)
   - Permission check (VIEWER cannot create)
   - Cross-company isolation (user from company A can't see company B's invitations)
   - Email normalization (mixed case, whitespace)
   - Session requirement (no auth → 401)

### 11.2 Test Files

```
apps/api/src/features/auth/invitations/__tests__/
├── domain/
│   └── invitation.entity.test.ts       # Unit tests for domain logic
├── handlers/
│   ├── create-invitation.test.ts       # Unit with mocked DB
│   ├── accept-invitation.test.ts
│   ├── reject-invitation.test.ts
│   ├── cancel-invitation.test.ts
│   └── list-invitations.test.ts
└── integration/
    └── invitations.integration.test.ts  # Real DB integration
```

---

## 12. Rollback Plan

```sql
DROP TABLE IF EXISTS auth_invitations;
ALTER TABLE auth_user_companies DROP COLUMN IF EXISTS membership_status;
```

Then `db:push` to sync schema. No data loss — memberships created during the feature's lifetime remain valid memberships.

---

## 13. Changes Summary

| File | Change | Lines (est.) |
|------|--------|------|
| `packages/persistence/src/schema/auth.schema.ts` | Add `authInvitations` table + `membershipStatus` column + relations | ~40 |
| `apps/api/src/features/auth/invitations/domain/invitation.entity.ts` | Invitation types + validation functions | ~50 |
| `apps/api/src/features/auth/invitations/domain/invitation.errors.ts` | Error codes | ~30 |
| `apps/api/src/features/auth/invitations/application/commands/create-invitation.command.ts` | Create handler | ~70 |
| `apps/api/src/features/auth/invitations/application/commands/accept-invitation.command.ts` | Accept handler | ~70 |
| `apps/api/src/features/auth/invitations/application/commands/reject-invitation.command.ts` | Reject handler | ~40 |
| `apps/api/src/features/auth/invitations/application/commands/cancel-invitation.command.ts` | Cancel handler | ~40 |
| `apps/api/src/features/auth/invitations/application/queries/list-invitations.query.ts` | List handler | ~50 |
| `apps/api/src/features/auth/invitations/invitations.routes.ts` | Elysia routes + TypeBox schemas | ~60 |
| `apps/api/src/features/auth/invitations/index.ts` | Barrel export | ~8 |
| `apps/api/src/features/auth/handlers/company-membership.ts` | Add `membershipStatus = 'active'` filter | ~2 |
| `packages/persistence/src/schema/index.ts` | Re-export new table + relations | ~4 |
| **Tests** | Unit + integration | ~200 |
| **Total (non-test)** | | ~464 |
| **Total (with tests)** | | ~664 |

**Note**: Non-test line estimate (~464) slightly exceeds the 400-line review budget. Mitigation: domain validation (~50 lines) is pure functions with no side effects, and error codes (~30 lines) are constants — both have near-zero review risk. Core logic (~384 lines of handlers + routes + schema) is within budget.

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `membershipStatus` filter breaks existing session enrichment | Default `'active'` for all rows; integration test verifies bootstrap flow still works |
| Partial unique index not supported by Drizzle | Manual SQL in migration; Drizzle `uniqueIndex().where()` handles it in schema |
| Token leaked in URL for accept/reject | Token in path param (`:token`), but accept/reject use POST (body not URL query). Path params are logged by some middleware — acceptable for first slice per proposal |
| Race: two simultaneous accepts | DB unique constraint on `authUserCompanies(userId, companyId)` + application-level status check in transaction |
