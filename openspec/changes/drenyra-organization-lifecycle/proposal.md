# Proposal: Organization Lifecycle Management

**Change**: `drenyra-organization-lifecycle`
**Status**: proposal
**Created**: 2026-08-05
**Author**: el-gentleman

---

## 1. Business Problem

Drenyra is a multi-tenant financial operating system where each tenant (a firm or accounting practice) manages multiple client organizations. Today, the only way to create an organization is through a direct database seed or the `PostgresOrganizationRepository.save()` method — there is no API endpoint, no application use case, and no UI-accessible flow.

**Pain**: Onboarding a new firm or client company requires database-level intervention. This blocks self-service adoption, creates operational burden (every new client = developer ticket), and prevents product-led growth. The domain entity already models create, suspend, reactivate, and updateSettings — but none of these are wired to the application or API layer.

**Why now**: The firm dashboard (`/api/firm`) already reads and displays organizations via the repository. The missing piece is write operations: create org, suspend/reactivate, and update settings. These are the minimum viable lifecycle to close the loop between the existing domain model and real-world firm workflows.

**Cost of not doing it**: Every new Drenyra firm requires manual database seeding; suspending a client (e.g., non-payment) requires a SQL UPDATE; there is no audit trail for status transitions. The product cannot scale beyond a handful of demo firms.

---

## 2. Target Users and Situations

| Actor | Situation | Urgency |
|-------|-----------|---------|
| **Firm administrator** | Onboarding a new client company; needs to create an org with RUC, name, slug. | High — blocks self-service adoption. |
| **Firm administrator** | Suspending a client for non-payment or compliance issues; needs predictable status transition. | Medium — currently done via SQL. |
| **Firm administrator** | Reactivating a previously suspended client. | Medium — rare but high-stakes. |
| **Firm administrator** | Updating org settings (timezone, fiscal year end, default currency, feature flags). | Low-medium — partially exists via PATCH `/api/firm/clients/:id`. |

---

## 3. Product Outcome

When this change is **done**:

1. A firm administrator can create a new organization via `POST /api/firm/clients`, providing name, RUC, and slug. The API validates RUC checksum, slug format, and uniqueness constraints.
2. A firm administrator can suspend an organization via `POST /api/firm/clients/:id/suspend` with an optional reason. The API enforces the status transition machine (ACTIVE → SUSPENDED).
3. A firm administrator can reactivate an organization via `POST /api/firm/clients/:id/reactivate`. The API enforces SUSPENDED → ACTIVE.
4. The existing `PATCH /api/firm/clients/:id` settings update is formalized with typed settings (not `Record<string, unknown>`).
5. Every status transition generates an audit event with tenant context, actor identity, timestamp, and reason.
6. All operations are tenant-scoped — a firm cannot create, suspend, or reactivate orgs outside its own tenant boundary.

**What should feel different**: Creating or managing a client no longer requires touching the database. The firm dashboard becomes self-service for client lifecycle.

---

## 4. Current-State Gap Analysis

### What EXISTS (do not rebuild)

| Component | Location | Status |
|-----------|----------|--------|
| Organization entity | `packages/domain/src/entities/organization/` | Complete: `create()`, `suspend()`, `reactivate()`, `updateSettings()`, `updateHealthScore()` |
| Status transition validator | `packages/domain/src/entities/organization/validators.ts` | Complete: `validateStatusTransition()` enforces ACTIVE↔SUSPENDED↔INACTIVE |
| RUC validator | `packages/domain/src/entities/organization/validators.ts` | Complete: 11-digit format + checksum algorithm |
| Organization repository interface | `packages/domain/src/repositories/organization.repository.ts` | Complete: `findById`, `findAll`, `save`, `update`, `delete`, `findByRuc`, `findBySlug`, `findActive` |
| Postgres repository impl | `packages/persistence/src/repositories/postgres-organization/` | Complete: full Drizzle ORM implementation |
| Firm routes (read-only) | `apps/api/src/features/firm/routes.ts` | Complete: GET dashboard, clients, clients/:id, alerts |
| Firm routes (partial write) | `apps/api/src/features/firm/routes.ts` | Partial: PATCH clients/:id updates settings only |
| Firm controller | `apps/api/src/features/firm/firm.controller.ts` | Complete: maps domain entities → response types |
| Firm types | `apps/api/src/features/firm/types.ts` | Complete: Dashboard, ClientSummary, ClientDetail, Alert |
| Tenant context middleware | `apps/api/src/middleware/tenant-context.ts` + `tenant.middleware.ts` | Complete: extracts organizationId, userId, role, plan, companyType |
| Domain DTOs | `packages/domain/src/entities/organization/dtos.ts` | Partial: only `CompanySummaryDTO`, `FirmDashboardDTO`, `FirmAlertDTO` — no CreateOrganizationDTO, SuspendOrganizationDTO |

### What's MISSING (this change fills)

| Gap | Consequence |
|-----|-------------|
| No `POST /api/firm/clients` (create) | New orgs require database intervention |
| No `POST /api/firm/clients/:id/suspend` | Suspension requires raw SQL |
| No `POST /api/firm/clients/:id/reactivate` | Reactivation requires raw SQL |
| No application-layer use cases | Domain entities are called directly from controllers; no orchestration, no audit, no cross-cutting concerns |
| No CreateOrganizationDTO / SuspendOrganizationDTO | Domain DTOs don't cover write operations |
| No audit trail for status transitions | Suspensions and reactivations happen silently |
| RUC uniqueness not enforced at API boundary | Repository has `findByRuc()` but no call site checks for duplicates before create |
| Slug uniqueness not enforced at API boundary | Same — `findBySlug()` exists in repo but unused at API layer |
| `updateSettings` typed as `Record<string, unknown>` | No type safety for settings payload |

---

## 5. First Implementation Slice (Scope)

### In scope

1. **Create Organization** — `POST /api/firm/clients`
   - Input: `{ name: string, ruc: string, slug: string, settings?: OrganizationSettings }`
   - Business rules: RUC format + checksum validation, slug kebab-case validation, RUC uniqueness check, slug uniqueness check
   - Tenant scoping: the created org belongs to the authenticated firm's tenant
   - Response: `201 Created` with `ClientDetailResponse`

2. **Suspend Organization** — `POST /api/firm/clients/:id/suspend`
   - Input: `{ reason?: string }`
   - Business rules: current status must be ACTIVE; transition validated by domain entity
   - Response: `200 OK` with updated `ClientDetailResponse`

3. **Reactivate Organization** — `POST /api/firm/clients/:id/reactivate`
   - Input: none
   - Business rules: current status must be SUSPENDED; transition validated by domain entity
   - Response: `200 OK` with updated `ClientDetailResponse`

4. **Application-layer use cases** (new files under `apps/api/src/features/organization-lifecycle/application/` or extend `apps/api/src/features/firm/`)
   - `CreateOrganizationUseCase` — validates, creates entity, saves via repo, returns DTO
   - `SuspendOrganizationUseCase` — fetches entity, calls `.suspend()`, saves via repo
   - `ReactivateOrganizationUseCase` — fetches entity, calls `.reactivate()`, saves via repo

5. **Domain DTOs** — add `CreateOrganizationDTO`, `SuspendOrganizationDTO` to `packages/domain/src/entities/organization/dtos.ts`

6. **API validation schemas** — Zod/Elysia schemas for create and suspend inputs

7. **Settings type formalization** — narrow `updateSettings` from `Record<string, unknown>` to typed `OrganizationSettings` with known keys

### Out of scope (future slices)

- Invitation system for org membership
- Team/role management beyond existing auth memberships
- Organization deletion (archive only)
- INACTIVE status path (no clear product need yet)
- Batch operations (bulk suspend)
- Organization transfer between firms
- UI implementation (this is an API-only slice)
- Webhook/notification on status change
- Organization metrics recalculation on status change

---

## 6. Key Business Rules

### 6.1 Tenant Isolation

- Every write operation requires `firmTenant` context with a valid `organizationId`.
- The authenticated firm can only manage orgs within its own tenant scope. The tenant boundary is the firm's `organizationId`, not the target org's ID — meaning a firm manages its own clients (orgs).
- **Scoping rule**: Create associates the new org with the firm's tenant. Suspend/reactivate validates the target org is within the firm's tenant boundary (the firm cannot suspend another firm's clients).

### 6.2 RUC Validation

- Must be exactly 11 digits (`/^\d{11}$/`).
- Must pass the SUNAT checksum algorithm (already implemented in `validators.ts`).
- Duplicate RUC within the same tenant is rejected at the use case level with a domain-appropriate error.
- RUC is immutable after creation — it cannot be changed via `updateSettings`.

### 6.3 Status Transition Machine

```
ACTIVE ──→ SUSPENDED ──→ ACTIVE
  │            │
  └────────────┼──→ INACTIVE ←──┘
```

- `ACTIVE` → `SUSPENDED`: allowed. Optionally records a suspension reason.
- `SUSPENDED` → `ACTIVE`: allowed (reactivation).
- `ACTIVE` → `INACTIVE`: allowed (decommission).
- `SUSPENDED` → `INACTIVE`: allowed.
- `INACTIVE` → `ACTIVE`: allowed (recommission).
- All other transitions: rejected with a descriptive error.

The domain entity's `validateStatusTransition()` already enforces this. The use case layer must not bypass it.

### 6.4 Slug Rules

- Must be kebab-case (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`).
- Must be unique within the tenant.
- Slug is immutable after creation.

### 6.5 Audit Trail

Every status transition must produce an audit event containing:
- `organizationId` (target org)
- `tenantId` (firm context)
- `actorId` (user who performed the action)
- `fromStatus` → `toStatus`
- `reason` (for suspensions)
- `timestamp`

For this slice, the audit mechanism can be a structured log or a dedicated audit table. The exact persistence mechanism is a design decision for the specs phase.

---

## 7. Affected Areas and Dependencies

### Files that WILL change

| File | Change |
|------|--------|
| `packages/domain/src/entities/organization/dtos.ts` | Add `CreateOrganizationDTO`, `SuspendOrganizationDTO` |
| `packages/domain/src/entities/organization/index.ts` | Export new DTOs |
| `apps/api/src/features/firm/routes.ts` | Add POST create, POST suspend, POST reactivate routes |
| `apps/api/src/features/firm/firm.controller.ts` | Add `createClient`, `suspendClient`, `reactivateClient` handlers |
| `apps/api/src/features/firm/types.ts` | Add `CreateClientBody`, `SuspendClientBody` types |

### New files

| File | Purpose |
|------|---------|
| `apps/api/src/features/organization-lifecycle/application/create-organization.use-case.ts` | Orchestrate creation: validate, check duplicates, create entity, save, return DTO |
| `apps/api/src/features/organization-lifecycle/application/suspend-organization.use-case.ts` | Orchestrate suspension: fetch, validate tenant scope, suspend, save, audit |
| `apps/api/src/features/organization-lifecycle/application/reactivate-organization.use-case.ts` | Orchestrate reactivation: fetch, validate tenant scope, reactivate, save, audit |
| `apps/api/src/features/organization-lifecycle/application/__tests__/*.test.ts` | Use case unit tests (Strict TDD) |

### Packages affected

- `packages/domain` — DTO additions only
- `apps/api` — routes, controllers, use cases, tests

### Packages NOT affected

- `packages/persistence` — no schema changes needed; existing repo methods are sufficient
- `packages/application` — no shared application package exists for this domain
- `apps/web`, `apps/landing`, `apps/data-engine`, `apps/cli`

---

## 8. Edge Cases and Risks

### Edge Cases

| Case | Handling |
|------|----------|
| **Duplicate RUC on create** | Use case calls `findByRuc()` before `save()`. Returns `409 Conflict` with `RUC_ALREADY_EXISTS`. |
| **Duplicate slug on create** | Use case calls `findBySlug()` before `save()`. Returns `409 Conflict` with `SLUG_ALREADY_EXISTS`. |
| **Suspending an already-suspended org** | Domain entity's `validateStatusTransition()` throws. Controller catches and returns `409 Conflict` with `INVALID_TRANSITION`. |
| **Reactivating an active org** | Same — domain throws, controller returns 409. |
| **Operating on a non-existent org** | `findById()` returns null. Controller returns `404 Not Found` with `CLIENT_NOT_FOUND`. |
| **Missing tenant context** | Middleware returns 403. No special handling needed in use case. |
| **Cross-tenant access** | Use case validates target org belongs to firm's tenant scope. Returns `403 Forbidden`. |
| **Empty/short name** | Domain entity validates name is non-empty on construction. Returns `400 Bad Request`. |
| **Invalid RUC checksum** | Domain entity validates checksum on construction. Returns `400 Bad Request` with `INVALID_RUC`. |
| **Concurrent status changes** | Repository's `update()` overwrites. Last write wins — acceptable for MVP; optimistic locking is a future concern. |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Scope creep into team/invitation management** | Medium | Delays delivery and exceeds review budget | Strict first-slice boundary; invitation is explicitly out of scope |
| **Audit trail over-engineering** | Medium | Blows review budget on infrastructure | Accept structured logging for this slice; dedicated audit table in a follow-up |
| **Tenant scoping ambiguity** | Low | Security bug if firms can suspend other firms' clients | Explicit test cases for cross-tenant rejection |
| **INACTIVE status undefined behavior** | Low | Product confusion | INACTIVE transitions exist in domain validator but are not wired to API routes in this slice |
| **400-line review budget exceeded** | Medium | Chained PRs delay delivery | Estimate: ~200 lines net-new (use cases ~60 lines each, routes ~40 lines, DTOs ~20 lines, tests ~80 lines). Stay under budget by reusing existing controller patterns. |

---

## 9. Delivery Constraints

### Review Budget

- **Budget**: 400 changed lines (openspec configured)
- **Estimated new/changed lines**: ~280 lines
  - Use cases: ~60 lines × 3 = ~180 lines
  - Routes (additions to existing): ~40 lines
  - DTOs: ~20 lines
  - Types: ~20 lines
  - Domain index exports: ~5 lines
  - Tests: ~80 lines (unit tests for use cases)
- **Risk level**: Low — well within the 400-line budget

### Strict TDD

- Test runner: `vitest` at workspace level
- All use cases must have unit tests written FIRST (Red phase), then implementation (Green phase)
- Domain entity tests already exist for validators and status transitions; do not duplicate
- Integration tests for API routes are optional for this slice (Elysia route testing with in-memory repo mocks)

### Chained PRs

Not required for this change. The estimated line count fits within a single 400-line PR.

---

## 10. Rollback Plan

1. All new routes are additive — they don't modify existing GET/PATCH behavior.
2. If the create endpoint is rolled back, organizations created through it remain valid in the database (they were created through the same domain entity and repository).
3. Status transitions are reversible at the data level (status is just a column). A bad migration can set status back manually.
4. No database schema migration is required — the `organizations` table is already in production.

---

## 11. Success Criteria

1. ✅ `POST /api/firm/clients` creates an organization and returns 201 with valid `ClientDetailResponse`.
2. ✅ Duplicate RUC returns 409 with `RUC_ALREADY_EXISTS`.
3. ✅ Duplicate slug returns 409 with `SLUG_ALREADY_EXISTS`.
4. ✅ Invalid RUC checksum returns 400 with `INVALID_RUC`.
5. ✅ `POST /api/firm/clients/:id/suspend` transitions ACTIVE → SUSPENDED, records reason.
6. ✅ Suspending a SUSPENDED org returns 409.
7. ✅ `POST /api/firm/clients/:id/reactivate` transitions SUSPENDED → ACTIVE.
8. ✅ Reactivating an ACTIVE org returns 409.
9. ✅ Cross-tenant access returns 403.
10. ✅ Missing tenant context returns 403.
11. ✅ All use cases have unit tests that pass before implementation (Strict TDD: Red → Green).
12. ✅ Existing GET `/api/firm/clients` and PATCH `/api/firm/clients/:id` continue to work without regression.

---

## 12. Proposal Assumptions (to validate with user)

1. **Tenant scoping model**: A firm (organization) manages its own clients (also organizations). The firm's `organizationId` from `firmTenant` is the tenant boundary. Created orgs are associated with this firm. Is this the correct parent-child model, or do organizations have independent tenancy?

2. **INACTIVE status**: The domain validator supports INACTIVE transitions, but this slice does not expose a `/deactivate` (or archive) endpoint. Is INACTIVE a future need, or should we add it now while the codebase is open?

3. **Audit persistence**: This slice proposes structured logging for audit events. A dedicated `organization_audit_log` table would be a follow-up. Is that acceptable, or is audit-table persistence a hard requirement for the first slice?

4. **Settings type formalization**: Currently `OrganizationSettings` has `fiscalYearEnd`, `defaultCurrency`, `timezone`, `features`, and an index signature (`[key: string]: unknown`). Should we lock down the index signature to only known keys, or keep the flexible bag for now?

5. **Slug generation**: Should the API auto-generate a slug from the name if not provided, or should it be explicitly required? The domain entity currently requires it — should we add a slug-generation utility?
