# Design: Organization Lifecycle Management

**Change**: `drenyra-organization-lifecycle`
**Status**: design
**Created**: 2026-08-05

---

## 1. Architecture Summary

Three new `POST` endpoints on the existing firm routes (`/api/firm/clients`), each backed by a dedicated use case that orchestrates: validate → domain entity operation → repository persist → audit → response.

The design follows the existing codebase patterns:

- **Elysia route handlers** → thin, delegate to controller functions
- **Controller functions** → instantiate use cases, map domain errors → HTTP responses
- **Use cases** → orchestrate domain entities + repository + audit; constructor-injected dependencies
- **Repository** → existing `PostgresOrganizationRepository`, zero changes
- **Domain entity** → existing `Organization` class, zero changes

```
Request → Elysia route → firmTenant middleware → controller → use case
                                                            ├── domain entity (validate, mutate)
                                                            ├── repository (persist)
                                                            └── audit (structured log)
```

---

## 2. Use Case Design

### 2.1 Shared Contract: `TenantScope`

All three use cases receive a `TenantScope` value object extracted from the Elysia `firmTenant` context. This encapsulates the authenticated firm's identity and is used to enforce tenant isolation.

```typescript
// apps/api/src/features/organization-lifecycle/application/tenant-scope.ts

interface TenantScope {
  readonly organizationId: string; // The firm's own org ID (tenant boundary)
  readonly userId: string;         // The authenticated user performing the action
}
```

**Why a value object and not the raw `FirmTenantContext`?** The use cases should not depend on Elysia middleware types. `TenantScope` is a plain interface — testable with plain objects, reusable across features.

### 2.2 `CreateOrganizationUseCase`

**Purpose**: Validate input, enforce uniqueness, create domain entity, persist, return DTO.

```
INPUT:  CreateOrganizationInput { name, ruc, slug, settings? }
        TenantScope { organizationId, userId }
OUTPUT: ClientDetailResponse (id, name, ruc, slug, status: "ACTIVE", ...)
```

**Execution flow**:

```
1. VALIDATE input
   ├── Zod/Elysia schema already validated shape at route boundary
   └── (Domain entity re-validates business rules on construction — belt-and-suspenders)

2. CHECK uniqueness (within tenant)
   ├── repo.findByRuc(ruc) → if found AND belongs to same tenant → throw RUC_ALREADY_EXISTS
   └── repo.findBySlug(slug) → if found AND belongs to same tenant → throw SLUG_ALREADY_EXISTS

3. GENERATE organization ID
   └── timestamp-based integer: Date.now() (see §7.1 for rationale)

4. CREATE domain entity
   └── Organization.create({ id, name, ruc, slug, status: "ACTIVE",
        settings: { ...input.settings, _tenantFirmId: tenantScope.organizationId },
        createdAt: new Date(), updatedAt: new Date() })

5. PERSIST
   └── repo.save(organization)

6. AUDIT
   └── emitAuditEvent({ organizationId, tenantId, actorId,
        fromStatus: null, toStatus: "ACTIVE", reason: null })

7. MAP to response DTO
   └── mapClientDetail(organization) → ClientDetailResponse
```

**Constructor signature**:

```typescript
class CreateOrganizationUseCase {
  constructor(
    private readonly repo: OrganizationRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    input: CreateOrganizationInput,
    scope: TenantScope,
  ): Promise<ClientDetailResponse>;
}
```

### 2.3 `SuspendOrganizationUseCase`

**Purpose**: Fetch org, validate tenant scope, call domain `.suspend()`, persist, audit.

```
INPUT:  targetId (string — from route params :id)
        reason (string | undefined — from request body)
        TenantScope { organizationId, userId }
OUTPUT: ClientDetailResponse (with status: "SUSPENDED")
```

**Execution flow**:

```
1. FETCH organization
   └── repo.findById(targetId) → if null → throw CLIENT_NOT_FOUND

2. VALIDATE tenant scope
   └── org.settings?._tenantFirmId !== tenantScope.organizationId
       → throw TENANT_SCOPE_VIOLATION

3. SUSPEND (domain operation)
   └── currentStatus = org.status  (capture before mutation)
   └── suspended = org.suspend(reason)
       → internally calls validateStatusTransition("ACTIVE", "SUSPENDED")
       → throws if transition invalid

4. PERSIST
   └── repo.update(suspended)  // uses repo.update() because entity already exists

5. AUDIT
   └── emitAuditEvent({ organizationId: targetId, tenantId: scope.organizationId,
        actorId: scope.userId, fromStatus: currentStatus, toStatus: "SUSPENDED",
        reason: reason ?? null })

6. MAP to response DTO
   └── mapClientDetail(suspended) → ClientDetailResponse
```

**Constructor signature**:

```typescript
class SuspendOrganizationUseCase {
  constructor(
    private readonly repo: OrganizationRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    targetId: string,
    reason: string | undefined,
    scope: TenantScope,
  ): Promise<ClientDetailResponse>;
}
```

### 2.4 `ReactivateOrganizationUseCase`

**Purpose**: Same structure as suspend, but calls `.reactivate()` with no reason.

```
INPUT:  targetId (string)
        TenantScope { organizationId, userId }
OUTPUT: ClientDetailResponse (with status: "ACTIVE")
```

**Execution flow**: identical to SuspendOrganizationUseCase steps 1–6, substituting `.reactivate()` at step 3 and `toStatus: "ACTIVE"` at step 5.

**Constructor signature**:

```typescript
class ReactivateOrganizationUseCase {
  constructor(
    private readonly repo: OrganizationRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    targetId: string,
    scope: TenantScope,
  ): Promise<ClientDetailResponse>;
}
```

### 2.5 Dependency Injection

Use cases receive dependencies via constructor injection — NOT module-level singletons. This enables unit testing with mocked dependencies.

```typescript
// apps/api/src/features/organization-lifecycle/application/_deps.ts
import { PostgresOrganizationRepository } from "@drenyra/persistence";
import { ConsoleAuditLogger } from "./audit-logger";

export const organizationRepo = new PostgresOrganizationRepository();
export const auditLogger = new ConsoleAuditLogger();
```

Controllers instantiate use cases with these shared instances (same pattern as `apps/api/src/features/journal-entries/application/_helpers.ts`).

---

## 3. Route Wiring

### 3.1 Route Definitions (additions to `apps/api/src/features/firm/routes.ts`)

All three routes use `.post()` method inside the existing `firmRoutes` Elysia instance (already has `.use(firmTenantContext)`). Body schemas use Elysia `t` for runtime validation.

```typescript
// POST /api/firm/clients — Create
.post(
  "/clients",
  async ({ firmTenant, body, set }) => {
    // tenant guard
    if (!firmTenant?.organizationId) {
      set.status = 403;
      return fail("Tenant context required", "TENANT_REQUIRED");
    }
    try {
      return ok(await createClient(body, {
        organizationId: firmTenant.organizationId,
        userId: firmTenant.userId,
      }));
    } catch (error) {
      return mapUseCaseError(error, set);
    }
  },
  {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      ruc: t.String({ pattern: "^\\d{11}$" }),
      slug: t.String({ pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }),
      settings: t.Optional(t.Object({
        fiscalYearEnd: t.Optional(t.String()),
        defaultCurrency: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
        features: t.Optional(t.Array(t.String())),
      })),
    }),
    detail: {
      tags: ["Firm"],
      summary: "Create a new client organization",
      description: "Creates an organization under the firm's tenant scope.",
    },
  },
)

// POST /api/firm/clients/:id/suspend
.post(
  "/clients/:id/suspend",
  async ({ firmTenant, params: { id }, body, set }) => {
    if (!firmTenant?.organizationId) {
      set.status = 403;
      return fail("Tenant context required", "TENANT_REQUIRED");
    }
    try {
      return ok(await suspendClient(id, body?.reason, {
        organizationId: firmTenant.organizationId,
        userId: firmTenant.userId,
      }));
    } catch (error) {
      return mapUseCaseError(error, set);
    }
  },
  {
    params: t.Object({ id: t.String() }),
    body: t.Optional(t.Object({
      reason: t.Optional(t.String()),
    })),
    detail: { tags: ["Firm"], summary: "Suspend a client organization" },
  },
)

// POST /api/firm/clients/:id/reactivate
.post(
  "/clients/:id/reactivate",
  async ({ firmTenant, params: { id }, set }) => {
    if (!firmTenant?.organizationId) {
      set.status = 403;
      return fail("Tenant context required", "TENANT_REQUIRED");
    }
    try {
      return ok(await reactivateClient(id, {
        organizationId: firmTenant.organizationId,
        userId: firmTenant.userId,
      }));
    } catch (error) {
      return mapUseCaseError(error, set);
    }
  },
  {
    params: t.Object({ id: t.String() }),
    detail: { tags: ["Firm"], summary: "Reactivate a suspended client" },
  },
)
```

### 3.2 Patch Settings Formalization

The existing `PATCH /api/firm/clients/:id` body schema is narrowed from `t.Optional(t.Record(t.String(), t.Unknown()))` to a typed `OrganizationSettings`:

```typescript
body: t.Object({
  settings: t.Optional(t.Object({
    fiscalYearEnd: t.Optional(t.String()),
    defaultCurrency: t.Optional(t.String()),
    timezone: t.Optional(t.String()),
    features: t.Optional(t.Array(t.String())),
  }, { additionalProperties: false })),
}),
```

The `additionalProperties: false` on Elysia's `t.Object` rejects unknown keys at the validation layer. The domain's `OrganizationSettings` type retains `[key: string]: unknown` for internal flexibility.

---

## 4. Error Handling

### 4.1 Error Mapping Function

A shared `mapUseCaseError(error, set)` function maps domain/repository errors to HTTP responses using the existing `fail()` helper:

```typescript
// apps/api/src/features/organization-lifecycle/application/error-mapper.ts

import { getErrorMessage, fail } from "../../shared/api-response";

function mapUseCaseError(error: unknown, set: { status: number }): ApiFailure {
  const message = getErrorMessage(error);

  // 404 — Not found
  if (message.includes("not found")) {
    set.status = 404;
    return fail(message, "CLIENT_NOT_FOUND");
  }

  // 409 — Conflict (duplicate RUC/slug, invalid transition)
  if (message.includes("RUC already exists")) {
    set.status = 409;
    return fail(message, "RUC_ALREADY_EXISTS");
  }
  if (message.includes("slug already exists")) {
    set.status = 409;
    return fail(message, "SLUG_ALREADY_EXISTS");
  }
  if (message.includes("Cannot transition from")) {
    set.status = 409;
    return fail(message, "INVALID_TRANSITION");
  }

  // 403 — Tenant scope violation
  if (message.includes("tenant scope")) {
    set.status = 403;
    return fail(message, "TENANT_SCOPE_VIOLATION");
  }

  // 400 — Validation errors from domain entity
  if (
    message.includes("RUC checksum") ||
    message.includes("RUC must be") ||
    message.includes("Slug must be") ||
    message.includes("name is required")
  ) {
    set.status = 400;
    // Map to specific codes
    if (message.includes("RUC checksum") || message.includes("RUC must be")) {
      return fail(message, "INVALID_RUC");
    }
    if (message.includes("Slug")) {
      return fail(message, "INVALID_SLUG");
    }
    if (message.includes("name")) {
      return fail(message, "INVALID_NAME");
    }
    return fail(message, "VALIDATION_ERROR");
  }

  // 500 — Unexpected
  set.status = 500;
  return fail("Internal server error", "INTERNAL_ERROR");
}
```

### 4.2 Error Code Reference

| HTTP Status | Error Code | Source |
|-------------|-----------|--------|
| 400 | `INVALID_RUC` | Domain validator: RUC format/checksum |
| 400 | `INVALID_SLUG` | Domain validator: slug format |
| 400 | `INVALID_NAME` | Domain validator: empty name |
| 400 | `INVALID_SETTINGS` | Elysia schema: unknown settings key |
| 400 | `SETTINGS_REQUIRED` | Elysia schema: missing settings body |
| 403 | `TENANT_REQUIRED` | Middleware/route guard |
| 403 | `TENANT_SCOPE_VIOLATION` | Use case: cross-tenant access |
| 404 | `CLIENT_NOT_FOUND` | Repository: org not found |
| 409 | `RUC_ALREADY_EXISTS` | Use case: duplicate RUC |
| 409 | `SLUG_ALREADY_EXISTS` | Use case: duplicate slug |
| 409 | `INVALID_TRANSITION` | Domain validator: invalid status transition |
| 500 | `INTERNAL_ERROR` | Catch-all for repository/infra failures |

### 4.3 Domain Error Propagation

Domain entity methods (`.suspend()`, `.reactivate()`, `Organization.create()`) throw `Error` with descriptive messages. The use case does NOT catch these — they propagate to the controller's `catch` block where `mapUseCaseError` translates them. This keeps the use case free of HTTP concerns.

The exception is uniqueness checks (RUC/slug), which are use-case-level concerns. These throw custom errors:

```typescript
throw new Error("RUC already exists within this tenant");
throw new Error("slug already exists within this tenant");
throw new Error("Organization does not belong to this tenant scope");
```

---

## 5. Audit Approach

### 5.1 AuditEvent Contract

```typescript
// apps/api/src/features/organization-lifecycle/application/audit-logger.ts

interface AuditEvent {
  event: "organization.status_changed" | "organization.created";
  organizationId: string;
  tenantId: string;
  actorId: string;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  timestamp: string; // ISO 8601
}

interface AuditLogger {
  log(event: AuditEvent): void;
}
```

### 5.2 ConsoleAuditLogger (Slice Implementation)

```typescript
class ConsoleAuditLogger implements AuditLogger {
  log(event: AuditEvent): void {
    console.log(JSON.stringify({ ...event, _audit: true }));
  }
}
```

**Design decision**: Structured logging to stdout for this slice. A dedicated `organization_audit_log` database table is follow-up work. The `AuditLogger` interface allows swapping to a DB-backed implementation without changing use case code.

### 5.3 When Audit Events Fire

| Operation | Event | fromStatus | toStatus | reason |
|-----------|-------|------------|----------|--------|
| Create | `organization.created` | `null` | `"ACTIVE"` | `null` |
| Suspend | `organization.status_changed` | `"ACTIVE"` | `"SUSPENDED"` | provided reason or `null` |
| Reactivate | `organization.status_changed` | `"SUSPENDED"` | `"ACTIVE"` | `null` |
| Update settings | (none) | — | — | — |

### 5.4 Audit Failure Mode

If `console.log` fails (unlikely but possible in a misconfigured runtime), the use case MUST still complete the primary operation. Audit failure is non-blocking. The `ConsoleAuditLogger.log()` wraps in a try/catch internally.

---

## 6. File Organization

### 6.1 New Files

```
apps/api/src/features/organization-lifecycle/
├── application/
│   ├── tenant-scope.ts                      # TenantScope interface
│   ├── audit-logger.ts                      # AuditEvent + AuditLogger interface + ConsoleAuditLogger
│   ├── error-mapper.ts                      # mapUseCaseError() function
│   ├── _deps.ts                             # Shared repository + audit instances
│   ├── create-organization.use-case.ts      # CreateOrganizationUseCase
│   ├── suspend-organization.use-case.ts     # SuspendOrganizationUseCase
│   ├── reactivate-organization.use-case.ts  # ReactivateOrganizationUseCase
│   └── __tests__/
│       ├── create-organization.use-case.test.ts
│       ├── suspend-organization.use-case.test.ts
│       └── reactivate-organization.use-case.test.ts
```

### 6.2 Modified Files

```
apps/api/src/features/firm/
├── routes.ts            # Add 3 POST routes + narrow PATCH body schema
├── firm.controller.ts   # Add createClient, suspendClient, reactivateClient
├── types.ts             # Add CreateClientBody, SuspendClientBody types
                         # Narrow UpdateClientSettingsBody.settings type

packages/domain/src/entities/organization/
├── dtos.ts              # Add CreateOrganizationDTO, SuspendOrganizationDTO
└── index.ts             # Export new DTOs
```

### 6.3 Why `organization-lifecycle/` and not `firm/`?

The `firm/` feature currently contains routes, controller, and types — all in one directory. Adding three use cases, audit, error mapping, and tests would bloat it. A separate `organization-lifecycle/` co-locates all lifecycle logic:

- **Test isolation**: use case unit tests live next to the implementation
- **Future extraction**: if `packages/application` grows an organization module, this directory is the natural extraction source
- **Clear ownership**: the `firm/` controller remains the API boundary; `organization-lifecycle/` is the business logic

The `firm.controller.ts` imports from `organization-lifecycle/application/` — same pattern as `journal-entries/application/commands/` importing from `@drenyra/application/use-cases/journal`.

---

## 7. Key Design Decisions

### 7.1 ID Generation Strategy

**Decision**: Use `Date.now()` as the organization ID.

**Rationale**:

- The `organizations` table has `id: integer("id").primaryKey()` with **no auto-increment/identity**. The application must supply the ID.
- Schema migrations are out of scope per the proposal.
- `Date.now()` produces a millisecond-precision timestamp that fits within PostgreSQL's `integer` range (-2147483648 to 2147483647) until 2038. For MVP throughput (manual admin operations, not bulk imports), collision probability is effectively zero.
- The repository's `mapEntityToRow()` already does `Number(json.id)`, so a numeric string or number works.

**Risk**: Two creates in the same millisecond would collide. Mitigated by the `findByRuc` uniqueness check (the duplicate-RUC case catches the collision at a business level). A follow-up migration adding `GENERATED BY DEFAULT AS IDENTITY` is recommended.

### 7.2 Tenant Association Mechanism

**Decision**: Store `_tenantFirmId` in the `settings` JSONB field using a reserved key.

**Rationale**:

- The `organizations` table has no `parent_organization_id` or `firm_id` column.
- Schema migrations are out of scope for this slice.
- `settings` JSONB already stores arbitrary keys (the domain type has `[key: string]: unknown`).
- The `_tenantFirmId` key is:
  - **Set during creation**: the use case injects it from `TenantScope.organizationId`
  - **Checked during suspend/reactivate/update-settings**: the use case reads `org.settings?._tenantFirmId`
  - **Excluded from API-visible settings**: the API-level `OrganizationSettings` type (used in Elysia schemas) does NOT include this key

**Trade-off**: JSONB is not query-efficient for tenant-scoped list operations. `GET /api/firm/clients` already returns all orgs without filtering (existing behavior). This workaround is scoped to write operations only. A follow-up migration adding a `parent_organization_id` column with an index is strongly recommended.

### 7.3 Use Case Location: `apps/api` vs `packages/application`

**Decision**: Place use cases in `apps/api/src/features/organization-lifecycle/application/`.

**Rationale**:

- Existing use cases in `packages/application` (journal, fiscal-agent) are **domain-agnostic** — they depend only on domain interfaces. Organization lifecycle use cases are **firm-specific** and depend on `TenantScope` (an API-layer concept).
- The proposal explicitly scopes this to `apps/api`.
- If a future slice abstracts tenant-scoped organization operations into `packages/application`, these use cases are ready to extract (the `TenantScope` interface becomes a domain concept).

**Trade-off**: Code reuse across API consumers (e.g., CLI, web) would require duplication. Acceptable for this slice since only the firm API performs these operations.

### 7.4 `repo.update()` vs `repo.save()`

**Decision**: Use `repo.save()` for creation, `repo.update()` for mutations.

**Rationale**:

- `save()` calls `db.insert()` (INSERT) — correct for new entities.
- `update()` calls `db.update()...where(eq(...))` (UPDATE) — correct for existing entities.
- Using `save()` for an existing entity would attempt an INSERT with a duplicate primary key and fail.

The existing `firm.controller.ts` `updateClient` already uses `repo.update()` for settings changes — this design follows that precedent.

### 7.5 Audit as Interface, Not Concrete Logger

**Decision**: `AuditLogger` is an interface; `ConsoleAuditLogger` is the concrete implementation for this slice.

**Rationale**:

- Enables unit testing: tests inject a `NoopAuditLogger` or `SpyAuditLogger`.
- Enables future replacement: swapping to a DB-backed logger requires changing only `_deps.ts`.
- Follows the same constructor-injection pattern as the repository.

---

## 8. Type Contracts

### 8.1 New Domain DTOs (`packages/domain/src/entities/organization/dtos.ts`)

```typescript
export interface CreateOrganizationDTO {
  name: string;
  ruc: string;
  slug: string;
  settings?: OrganizationSettings;
}

export interface SuspendOrganizationDTO {
  id: string;
  reason?: string;
}
```

These are domain-layer input DTOs — not API types. The API layer maps its own input types to these.

### 8.2 API Input Types (`apps/api/src/features/firm/types.ts`)

```typescript
export interface CreateClientBody {
  name: string;
  ruc: string;
  slug: string;
  settings?: OrganizationSettingsInput;
}

export interface SuspendClientBody {
  reason?: string;
}

// Formalized settings — no index signature
export interface OrganizationSettingsInput {
  fiscalYearEnd?: string;
  defaultCurrency?: string;
  timezone?: string;
  features?: string[];
}
```

Note: `OrganizationSettingsInput` is the API-contract type (strict). The domain's `OrganizationSettings` retains `[key: string]: unknown` for internal flexibility (e.g., `_tenantFirmId`, `suspensionReason`).

### 8.3 UpdateSettingsBody Narrowing

```typescript
// BEFORE (current)
export interface UpdateClientSettingsBody {
  settings?: Record<string, unknown>;
}

// AFTER (this change)
export interface UpdateClientSettingsBody {
  settings?: OrganizationSettingsInput;
}
```

---

## 9. Data Flow: Create Organization (End-to-End)

```
POST /api/firm/clients
  │  Body: { name:"Acme", ruc:"20123456780", slug:"acme-corp", settings:{...} }
  │  Header: Authorization → firmTenant middleware → { organizationId:"123", userId:"u1", role:"admin" }
  ▼
Elysia route handler (routes.ts line ~120)
  │  firmTenant guard → ok
  │  Body validated by Elysia t.Object schema → ok
  │  Calls: createClient(body, { organizationId:"123", userId:"u1" })
  ▼
firm.controller.ts → createClient()
  │  Instantiates: new CreateOrganizationUseCase(repo, audit)
  │  Calls: useCase.execute(input, { organizationId:"123", userId:"u1" })
  ▼
CreateOrganizationUseCase.execute()
  │  1. findByRuc("20123456780") → null (unique ✓)
  │  2. findBySlug("acme-corp") → null (unique ✓)
  │  3. id = Date.now() → 1754483200000
  │  4. Organization.create({
  │       id: "1754483200000", name: "Acme", ruc: "20123456780",
  │       slug: "acme-corp", status: "ACTIVE",
  │       settings: { timezone:"America/Lima", _tenantFirmId:"123" },
  │       createdAt: ..., updatedAt: ...
  │     })
  │     → validateOrganizationBusinessRules passes ✓
  │  5. repo.save(org) → INSERT INTO organizations ... ✓
  │  6. audit.log({ event:"organization.created", organizationId:"1754483200000", ... })
  │  7. Returns mapClientDetail(org)
  ▼
Elysia returns: 201 { success:true, data:{ id:"1754483200000", name:"Acme", ... } }
```

---

## 10. Test Strategy

### 10.1 Unit Tests (Mandatory — Strict TDD)

**Location**: `apps/api/src/features/organization-lifecycle/application/__tests__/`

**Pattern**: Use cases tested with mocked `OrganizationRepository` and `SpyAuditLogger`. Each test:

1. Creates the use case with mocks
2. Calls `.execute()` with controlled input
3. Asserts on: returned DTO, repository calls (`.save()`, `.findByRuc()`, etc.), and audit events

**Mock strategy** (using Vitest `vi.fn()`):

```typescript
// __tests__/create-organization.use-case.test.ts
import { describe, it, expect, vi } from "vitest";
import { CreateOrganizationUseCase } from "../create-organization.use-case";
import type { OrganizationRepository } from "@drenyra/domain";
import type { AuditLogger } from "../audit-logger";

function makeRepo(overrides?: Partial<OrganizationRepository>): OrganizationRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByRuc: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockImplementation((org) => Promise.resolve(org)),
    update: vi.fn(),
    findAll: vi.fn(),
    count: vi.fn(),
    findActive: vi.fn(),
    getFirmMetrics: vi.fn(),
    delete: vi.fn(),
    saveForOrganization: vi.fn(),
    findForOrganization: vi.fn(),
    countForOrganization: vi.fn(),
    deleteForOrganization: vi.fn(),
    ...overrides,
  } as unknown as OrganizationRepository;
}

class SpyAuditLogger implements AuditLogger {
  events: AuditEvent[] = [];
  log(event: AuditEvent) { this.events.push(event); }
}

const VALID_RUC = "20100000017"; // SUNAT-valid test RUC
const scope = { organizationId: "firm-1", userId: "user-1" };

describe("CreateOrganizationUseCase", () => {
  it("creates an organization and returns ClientDetailResponse", async () => {
    const repo = makeRepo();
    const audit = new SpyAuditLogger();
    const useCase = new CreateOrganizationUseCase(repo, audit);

    const result = await useCase.execute(
      { name: "Acme Corp", ruc: VALID_RUC, slug: "acme-corp" },
      scope,
    );

    expect(result.name).toBe("Acme Corp");
    expect(result.status).toBe("ACTIVE");
    expect(repo.save).toHaveBeenCalledOnce();
    expect(audit.events).toHaveLength(1);
    expect(audit.events[0].event).toBe("organization.created");
  });

  it("rejects duplicate RUC within same tenant", async () => {
    const existingOrg = {} as Organization; // simplified mock
    const repo = makeRepo({
      findByRuc: vi.fn().mockResolvedValue(existingOrg),
    });
    const audit = new SpyAuditLogger();
    const useCase = new CreateOrganizationUseCase(repo, audit);

    await expect(
      useCase.execute(
        { name: "Dup", ruc: VALID_RUC, slug: "dup-corp" },
        scope,
      ),
    ).rejects.toThrow("RUC already exists");
  });

  it("rejects duplicate slug within same tenant", async () => {
    const existingOrg = {} as Organization;
    const repo = makeRepo({
      findBySlug: vi.fn().mockResolvedValue(existingOrg),
    });
    const useCase = new CreateOrganizationUseCase(repo, new SpyAuditLogger());

    await expect(
      useCase.execute(
        { name: "Dup Slug", ruc: VALID_RUC, slug: "acme-corp" },
        scope,
      ),
    ).rejects.toThrow("slug already exists");
  });

  // ... additional tests per spec §Test Requirements
});
```

### 10.2 Test Coverage Map

| Test file | Tests | Covers |
|-----------|-------|--------|
| `create-organization.use-case.test.ts` | 8 tests | Create: success, invalid RUC, non-11-digit RUC, empty name, invalid slug, duplicate RUC, duplicate slug, tenant-scoped uniqueness |
| `suspend-organization.use-case.test.ts` | 5 tests | Suspend: success with reason, success without reason, not-found, cross-tenant, invalid transition |
| `reactivate-organization.use-case.test.ts` | 4 tests | Reactivate: success, not-found, cross-tenant, invalid transition |

**Do NOT test** (already covered by domain entity tests):

- RUC checksum algorithm
- Status transition validation logic
- `Organization.create()` validation
- `Organization.suspend()` / `.reactivate()` domain logic

### 10.3 Stretch Goal: Route Integration Tests

If time permits, Elysia route-level tests using the `firmRoutes` instance with mocked `firmTenant` context:

```typescript
import { Elysia } from "elysia";
import { firmRoutes } from "../../firm/routes";

const app = new Elysia().use(firmRoutes);

it("POST /api/firm/clients returns 201 on success", async () => {
  const res = await app.handle(
    new Request("http://localhost/api/firm/clients", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", ruc: VALID_RUC, slug: "test" }),
    }),
  );
  expect(res.status).toBe(201);
});
```

These are **optional** for this slice — the unit tests exercise the same logic paths.

---

## 11. Rollout Plan

### 11.1 Implementation Order

1. **Domain DTOs** (`packages/domain`): Add `CreateOrganizationDTO`, `SuspendOrganizationDTO` + export
2. **API types** (`apps/api/src/features/firm/types.ts`): Add `CreateClientBody`, `SuspendClientBody`, `OrganizationSettingsInput`; narrow `UpdateClientSettingsBody`
3. **Shared infrastructure** (`organization-lifecycle/application/`): `tenant-scope.ts`, `audit-logger.ts`, `error-mapper.ts`, `_deps.ts`
4. **Use case: Create** — write test (Red), implement (Green)
5. **Use case: Suspend** — write test (Red), implement (Green)
6. **Use case: Reactivate** — write test (Red), implement (Green)
7. **Controller functions** (`firm.controller.ts`): Add `createClient`, `suspendClient`, `reactivateClient`
8. **Routes** (`routes.ts`): Add 3 POST routes + narrow PATCH body
9. **Full test suite**: `vitest run` at workspace level — all existing + new tests pass

### 11.2 Rollback

- All new routes are additive — they don't modify existing GET/PATCH behavior.
- Reverting the code change removes the endpoints; no data migration needed (orgs created through them remain valid).
- No database schema changes — zero migration risk.

### 11.3 Verification Checklist

- [ ] `POST /api/firm/clients` → 201 with valid body
- [ ] `POST /api/firm/clients` → 400 with invalid RUC
- [ ] `POST /api/firm/clients` → 409 with duplicate RUC
- [ ] `POST /api/firm/clients/:id/suspend` → 200 with ACTIVE org
- [ ] `POST /api/firm/clients/:id/suspend` → 409 with SUSPENDED org
- [ ] `POST /api/firm/clients/:id/suspend` → 403 cross-tenant
- [ ] `POST /api/firm/clients/:id/reactivate` → 200 with SUSPENDED org
- [ ] `POST /api/firm/clients/:id/reactivate` → 409 with ACTIVE org
- [ ] `PATCH /api/firm/clients/:id` → 400 with unknown settings key
- [ ] Existing GET `/api/firm/clients` continues working
- [ ] All unit tests pass (`vitest run`)
- [ ] TypeScript compilation succeeds (`tsc --noEmit`)

---

## 12. Risks and Open Questions

| Risk | Impact | Status |
|------|--------|--------|
| **ID collision with `Date.now()`** | Low — manual operations, not bulk | Accept for MVP; add identity column in follow-up |
| **Tenant association via JSONB** | Medium — can't query efficiently, fragile | Accept for MVP; add `parent_organization_id` column in follow-up |
| **`findByRuc`/`findBySlug` not tenant-scoped** | Medium — duplicate RUC check spans all tenants | Accept for MVP; uniqueness is checked at use case level but a cross-tenant RUC match would incorrectly reject. Mitigated: cross-tenant RUC duplicates are unlikely in practice. |
| **Audit via console.log** | Low — no persistence, lost on restart | By design; dedicated audit table is follow-up |
| **No optimistic locking** | Low — concurrent status changes use last-write-wins | Explicitly out of scope per proposal |
