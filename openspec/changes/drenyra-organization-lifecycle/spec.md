# Organization Lifecycle Specification

**Change**: `drenyra-organization-lifecycle`
**Domain**: organization-lifecycle
**Type**: New domain spec (no existing canonical spec)

---

## Purpose

Define the API contracts, business rules, and acceptance criteria for organization (client) lifecycle management at the firm API boundary. This spec covers creation, suspension, reactivation, and settings-type formalization — the minimum viable write operations to close the loop between the existing domain model and firm dashboard workflows.

---

## Requirements

### Requirement: Create Organization

The system MUST accept a `POST /api/firm/clients` request with name, RUC, slug, and optional settings, validate all business rules against the domain entity, enforce tenant scoping, and persist the new organization.

#### Scenario: Successful organization creation

- GIVEN a valid firm tenant context (`firmTenant.organizationId` present)
- AND the request body contains `{ name: "Acme Corp", ruc: "20123456780", slug: "acme-corp", settings: { timezone: "America/Lima", defaultCurrency: "PEN" } }`
- AND no organization with RUC `20123456780` exists within the same tenant
- AND no organization with slug `acme-corp` exists within the same tenant
- WHEN `POST /api/firm/clients` is called
- THEN the system validates RUC format (11 digits) and SUNAT checksum via `validateOrganizationBusinessRules`
- AND validates slug kebab-case format via the same validator
- AND creates a new `Organization` entity with status `ACTIVE`
- AND associates it with the firm tenant's scope
- AND persists it via `PostgresOrganizationRepository.save()`
- AND returns `201 Created` with a `ClientDetailResponse` body containing the new organization's id, name, ruc, slug, status `"ACTIVE"`, settings, createdAt, and updatedAt

#### Scenario: RUC checksum validation failure

- GIVEN a valid firm tenant context
- AND the request body contains `{ name: "Bad Corp", ruc: "12345678901", slug: "bad-corp" }`
- AND the RUC checksum is invalid (fails `validateRUCChecksum`)
- WHEN `POST /api/firm/clients` is called
- THEN the system returns `400 Bad Request` with error code `"INVALID_RUC"` and a descriptive message

#### Scenario: Duplicate RUC within same tenant

- GIVEN a valid firm tenant context
- AND an organization with RUC `20123456780` already exists within the tenant
- AND the request body contains `{ name: "Another Corp", ruc: "20123456780", slug: "another-corp" }`
- WHEN `POST /api/firm/clients` is called
- THEN the system returns `409 Conflict` with error code `"RUC_ALREADY_EXISTS"` and a descriptive message

#### Scenario: Duplicate slug within same tenant

- GIVEN a valid firm tenant context
- AND an organization with slug `acme-corp` already exists within the tenant
- AND the request body contains `{ name: "Other Name", ruc: "20987654321", slug: "acme-corp" }`
- WHEN `POST /api/firm/clients` is called
- THEN the system returns `409 Conflict` with error code `"SLUG_ALREADY_EXISTS"` and a descriptive message

#### Scenario: Missing tenant context

- GIVEN the request is made without a valid `firmTenant` (middleware rejects with 403)
- WHEN `POST /api/firm/clients` is called
- THEN the system returns `403 Forbidden` with error code `"TENANT_REQUIRED"`

#### Scenario: Empty or missing name

- GIVEN a valid firm tenant context
- AND the request body contains `{ name: "", ruc: "20123456780", slug: "test-corp" }`
- WHEN `POST /api/firm/clients` is called
- THEN the system returns `400 Bad Request` with a descriptive error indicating name is required

---

### Requirement: Suspend Organization

The system MUST accept a `POST /api/firm/clients/:id/suspend` request, validate the target organization exists and belongs to the firm's tenant, enforce the ACTIVE → SUSPENDED status transition, and record an audit event with the suspension reason.

#### Scenario: Successful suspension

- GIVEN a valid firm tenant context
- AND an organization with id `org-123` exists within the firm's tenant and has status `ACTIVE`
- AND the request body contains `{ reason: "Non-payment of Q2 invoice" }`
- WHEN `POST /api/firm/clients/org-123/suspend` is called
- THEN the system validates the organization exists and belongs to the firm's tenant scope
- AND calls the domain entity's `.suspend(reason)` method which invokes `validateStatusTransition("ACTIVE", "SUSPENDED")`
- AND persists the updated entity via `PostgresOrganizationRepository.update()`
- AND produces an audit event with `{ organizationId, tenantId, actorId, fromStatus: "ACTIVE", toStatus: "SUSPENDED", reason, timestamp }`
- AND returns `200 OK` with a `ClientDetailResponse` body where status is `"SUSPENDED"`

#### Scenario: Suspension without reason (optional)

- GIVEN a valid firm tenant context
- AND an organization with id `org-123` exists and is `ACTIVE`
- AND the request body contains `{}` (no reason) or `{ reason: undefined }`
- WHEN `POST /api/firm/clients/org-123/suspend` is called
- THEN the system suspends the organization successfully
- AND the audit event records `reason: null`
- AND returns `200 OK`

#### Scenario: Suspending an already-suspended organization

- GIVEN a valid firm tenant context
- AND an organization with id `org-123` has status `SUSPENDED`
- WHEN `POST /api/firm/clients/org-123/suspend` is called
- THEN the domain entity's `validateStatusTransition("SUSPENDED", "SUSPENDED")` throws an error
- AND the system returns `409 Conflict` with error code `"INVALID_TRANSITION"` and a descriptive message

#### Scenario: Suspending a non-existent organization

- GIVEN a valid firm tenant context
- AND no organization with id `org-999` exists
- WHEN `POST /api/firm/clients/org-999/suspend` is called
- THEN the system returns `404 Not Found` with error code `"CLIENT_NOT_FOUND"`

#### Scenario: Cross-tenant suspension attempt

- GIVEN a valid firm tenant context with `firmTenant.organizationId = "firm-A"`
- AND an organization with id `org-123` exists but belongs to tenant `"firm-B"`
- WHEN `POST /api/firm/clients/org-123/suspend` is called
- THEN the system returns `403 Forbidden` with error code `"TENANT_SCOPE_VIOLATION"` and a descriptive message

---

### Requirement: Reactivate Organization

The system MUST accept a `POST /api/firm/clients/:id/reactivate` request, validate the target organization exists and belongs to the firm's tenant, enforce the SUSPENDED → ACTIVE status transition, and record an audit event.

#### Scenario: Successful reactivation

- GIVEN a valid firm tenant context
- AND an organization with id `org-123` exists within the firm's tenant and has status `SUSPENDED`
- WHEN `POST /api/firm/clients/org-123/reactivate` is called (no request body)
- THEN the system validates the organization exists and belongs to the firm's tenant scope
- AND calls the domain entity's `.reactivate()` method which invokes `validateStatusTransition("SUSPENDED", "ACTIVE")`
- AND persists the updated entity via `PostgresOrganizationRepository.update()`
- AND produces an audit event with `{ organizationId, tenantId, actorId, fromStatus: "SUSPENDED", toStatus: "ACTIVE", reason: null, timestamp }`
- AND returns `200 OK` with a `ClientDetailResponse` body where status is `"ACTIVE"`

#### Scenario: Reactivating an already-active organization

- GIVEN a valid firm tenant context
- AND an organization with id `org-123` has status `ACTIVE`
- WHEN `POST /api/firm/clients/org-123/reactivate` is called
- THEN the domain entity's `validateStatusTransition("ACTIVE", "ACTIVE")` throws an error
- AND the system returns `409 Conflict` with error code `"INVALID_TRANSITION"` and a descriptive message

#### Scenario: Reactivating a non-existent organization

- GIVEN a valid firm tenant context
- AND no organization with id `org-999` exists
- WHEN `POST /api/firm/clients/org-999/reactivate` is called
- THEN the system returns `404 Not Found` with error code `"CLIENT_NOT_FOUND"`

#### Scenario: Cross-tenant reactivation attempt

- GIVEN a valid firm tenant context with `firmTenant.organizationId = "firm-A"`
- AND an organization with id `org-123` exists but belongs to tenant `"firm-B"`
- WHEN `POST /api/firm/clients/org-123/reactivate` is called
- THEN the system returns `403 Forbidden` with error code `"TENANT_SCOPE_VIOLATION"`

---

### Requirement: Settings Type Formalization

The system MUST narrow the `updateSettings` payload from `Record<string, unknown>` to a typed `OrganizationSettings` interface on the existing `PATCH /api/firm/clients/:id` route, with only known settings keys accepted and validated.

#### Scenario: PATCH with valid typed settings

- GIVEN a valid firm tenant context
- AND an organization with id `org-123` exists within the tenant
- AND the request body contains `{ settings: { timezone: "America/Bogota", defaultCurrency: "COP", fiscalYearEnd: "12-31" } }`
- WHEN `PATCH /api/firm/clients/org-123` is called
- THEN the system applies the settings update via the domain entity's `.updateSettings()`
- AND persists via `PostgresOrganizationRepository.update()`
- AND returns `200 OK` with a `ClientDetailResponse` where settings reflect the updated values

#### Scenario: PATCH with unknown settings keys rejected

- GIVEN a valid firm tenant context
- AND the request body contains `{ settings: { unknownKey: "someValue" } }`
- WHEN `PATCH /api/firm/clients/org-123` is called
- THEN the system returns `400 Bad Request` with error code `"INVALID_SETTINGS"` indicating unknown keys are not allowed

#### Scenario: PATCH without settings body

- GIVEN a valid firm tenant context
- AND the request body contains `{}` (no settings key)
- WHEN `PATCH /api/firm/clients/org-123` is called
- THEN the system returns `400 Bad Request` with error code `"SETTINGS_REQUIRED"`

---

### Requirement: Tenant Isolation

The system MUST enforce that every write operation (create, suspend, reactivate, update settings) is scoped to the authenticated firm's tenant boundary. A firm SHALL only manage organizations that belong to its own tenant scope.

#### Scenario: Create associates org with firm's tenant

- GIVEN a valid firm tenant context with `firmTenant.organizationId = "firm-A"`
- WHEN a new organization is created via `POST /api/firm/clients`
- THEN the created organization is associated with `"firm-A"` as its managing firm
- AND the organization is queryable in `"firm-A"`'s GET `/api/firm/clients` list

#### Scenario: Suspend validates tenant scope before transition

- GIVEN a valid firm tenant context with `firmTenant.organizationId = "firm-A"`
- WHEN `POST /api/firm/clients/:id/suspend` is called
- THEN the use case MUST verify the target organization belongs to `"firm-A"` before attempting the status transition
- AND if the organization does not belong to `"firm-A"`, the transition is rejected with 403

#### Scenario: Reactivate validates tenant scope before transition

- GIVEN a valid firm tenant context with `firmTenant.organizationId = "firm-A"`
- WHEN `POST /api/firm/clients/:id/reactivate` is called
- THEN the use case MUST verify the target organization belongs to `"firm-A"` before attempting the status transition

#### Scenario: Update settings validates tenant scope

- GIVEN a valid firm tenant context with `firmTenant.organizationId = "firm-A"`
- WHEN `PATCH /api/firm/clients/:id` is called
- THEN the use case MUST verify the target organization belongs to `"firm-A"` before applying settings

---

### Requirement: Audit Trail

The system MUST produce an audit event for every status transition (create, suspend, reactivate) containing at minimum: organization ID, tenant ID, actor ID, from-status, to-status, reason (nullable), and timestamp.

#### Scenario: Create produces audit event

- GIVEN a new organization is created with status `ACTIVE`
- WHEN the entity is persisted
- THEN an audit event is produced with `{ organizationId, tenantId, actorId, fromStatus: null, toStatus: "ACTIVE", reason: null, timestamp }`

#### Scenario: Suspend produces audit event with reason

- GIVEN an organization is suspended with reason `"Non-payment"`
- WHEN the entity is persisted
- THEN an audit event is produced with `{ organizationId, tenantId, actorId, fromStatus: "ACTIVE", toStatus: "SUSPENDED", reason: "Non-payment", timestamp }`

#### Scenario: Reactivate produces audit event

- GIVEN an organization is reactivated
- WHEN the entity is persisted
- THEN an audit event is produced with `{ organizationId, tenantId, actorId, fromStatus: "SUSPENDED", toStatus: "ACTIVE", reason: null, timestamp }`

#### Scenario: Settings update does NOT produce audit event

- GIVEN an organization's settings are updated via PATCH
- WHEN the entity is persisted
- THEN no status-transition audit event is produced (settings changes are not status transitions)

---

### Requirement: API Error Response Contract

The system MUST use the existing `ApiFailure` response shape (`{ success: false, error: string, code?: string }`) for all error responses, using established error codes from the proposal's edge-case table.

#### Scenario: All error responses use ApiFailure contract

- GIVEN any error condition from the error code table
- WHEN the API responds with a 4xx or 5xx status
- THEN the response body conforms to `{ success: false, error: "<descriptive message>", code: "<ERROR_CODE>" }`
- AND the HTTP status code matches the error category (400 for validation, 403 for scope/auth, 404 for not found, 409 for conflict, 500 for unexpected)

---

## Error Code Reference

| HTTP Status | Error Code | Trigger |
|-------------|-----------|---------|
| 400 | `INVALID_RUC` | RUC fails format (11 digits) or SUNAT checksum |
| 400 | `INVALID_SLUG` | Slug fails kebab-case validation |
| 400 | `INVALID_NAME` | Name is empty or missing |
| 400 | `INVALID_SETTINGS` | Unknown settings keys in PATCH body |
| 400 | `SETTINGS_REQUIRED` | PATCH body missing `settings` key |
| 403 | `TENANT_REQUIRED` | Missing `firmTenant` context |
| 403 | `TENANT_SCOPE_VIOLATION` | Organization does not belong to firm's tenant |
| 404 | `CLIENT_NOT_FOUND` | Organization ID does not exist |
| 409 | `RUC_ALREADY_EXISTS` | Duplicate RUC within same tenant on create |
| 409 | `SLUG_ALREADY_EXISTS` | Duplicate slug within same tenant on create |
| 409 | `INVALID_TRANSITION` | Status transition not allowed by domain validator |
| 500 | `INTERNAL_ERROR` | Unexpected repository or infrastructure failure |

---

## Data Contracts

### CreateOrganizationInput (Request)

```typescript
interface CreateOrganizationInput {
  name: string;
  ruc: string;
  slug: string;
  settings?: OrganizationSettings;
}
```

**Validation rules:**
- `name`: required, non-empty after trim — enforced by `validateOrganizationBusinessRules`
- `ruc`: required, must match `/^\d{11}$/` and pass SUNAT checksum — enforced by `validateOrganizationBusinessRules`
- `slug`: required, must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` — enforced by `validateOrganizationBusinessRules`
- `settings`: optional; when present, must conform to `OrganizationSettings` type (see below)

### SuspendOrganizationInput (Request)

```typescript
interface SuspendOrganizationInput {
  reason?: string;
}
```

### ReactivateOrganizationInput (Request)

No request body. The endpoint accepts an empty body or no body.

### UpdateSettingsInput (Request — PATCH body formalization)

```typescript
interface UpdateSettingsInput {
  settings: OrganizationSettings;
}
```

### OrganizationSettings

```typescript
interface OrganizationSettings {
  fiscalYearEnd?: string;   // "MM-DD" format
  defaultCurrency?: string;  // ISO 4217, e.g. "PEN", "COP"
  timezone?: string;         // IANA timezone, e.g. "America/Lima"
  features?: string[];       // feature flag strings
}
```

**Constraint:** The index signature `[key: string]: unknown` from the current domain `OrganizationSettings` type SHALL be removed from the API-level settings type used for validation. The domain type itself MAY retain flexibility for internal use. Unknown keys at the API boundary MUST be rejected with `INVALID_SETTINGS`.

### ClientDetailResponse (Reused — no changes)

```typescript
interface ClientDetailResponse {
  id: string;
  name: string;
  ruc: string;
  slug: string;
  status: string;
  healthScore: number | null;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

### AuditEvent (Internal)

```typescript
interface AuditEvent {
  organizationId: string;
  tenantId: string;
  actorId: string;
  fromStatus: string | null;  // null for creation events
  toStatus: string;
  reason: string | null;
  timestamp: string;           // ISO 8601
}
```

---

## Non-Functional Requirements

### Tenant Isolation

- Every use case MUST verify the target organization belongs to the firm tenant's scope BEFORE any domain mutation.
- The tenant scope check SHALL happen at the use case layer, immediately after fetching the organization and before calling domain entity methods.
- For create, the organization is associated with the firm tenant's `organizationId` — the tenant boundary is established at creation time.
- Cross-tenant access MUST result in a `403 Forbidden` with code `TENANT_SCOPE_VIOLATION` — never a `404` (which would leak existence information).

### Audit

- Audit events MUST be produced synchronously within the use case execution (same request-response cycle).
- For this slice, audit persistence SHALL use structured logging (e.g., `console.log` with a structured JSON payload or a dedicated logger). A dedicated `organization_audit_log` database table is a follow-up concern.
- Audit events MUST be produced BEFORE the API response is returned.
- If structured logging fails (e.g., logger unavailable), the use case MUST still complete the primary operation — audit failure is non-blocking.

### Error Handling

- Use case errors MUST propagate through the controller with HTTP-appropriate status codes per the Error Code Reference.
- Domain entity validation errors (thrown by `validateOrganizationBusinessRules` or `validateStatusTransition`) SHALL be caught and mapped to the correct error code.
- Repository errors (database connection failures, constraint violations) SHALL result in `500 Internal Server Error` with code `INTERNAL_ERROR` and MUST NOT leak internal structure in the error message.
- The existing `getErrorMessage()` utility SHALL be used for error message extraction.

### Immutability

- RUC is immutable after creation. The `updateSettings` path MUST NOT accept or process RUC changes.
- Slug is immutable after creation. The `updateSettings` path MUST NOT accept or process slug changes.
- Name mutation is out of scope for this slice — name cannot be changed via any endpoint in this change.

---

## Test Requirements (Strict TDD)

All tests MUST be written BEFORE implementation (Red phase). Test runner is `vitest` at workspace level.

### Use Case Unit Tests

Each use case requires a dedicated test file under `apps/api/src/features/organization-lifecycle/application/__tests__/`:

#### CreateOrganizationUseCase

| Test | Input | Expected |
|------|-------|----------|
| Creates organization with valid data | Valid name, RUC, slug, settings | Returns `ClientDetailResponse` with status `ACTIVE` |
| Rejects invalid RUC checksum | RUC that fails `validateRUCChecksum` | Throws with message containing "RUC checksum" |
| Rejects non-11-digit RUC | `"123"` | Throws with message containing "11 digits" |
| Rejects empty name | `""` | Throws with message containing "name is required" |
| Rejects invalid slug format | `"Bad Slug"` | Throws with message containing "kebab-case" |
| Rejects duplicate RUC | RUC already exists in tenant | Throws with message containing "RUC already exists" |
| Rejects duplicate slug | Slug already exists in tenant | Throws with message containing "slug already exists" |
| Validates RUC uniqueness across tenant | RUC exists in another tenant, not current | Creates successfully (tenant-scoped uniqueness) |

#### SuspendOrganizationUseCase

| Test | Input | Expected |
|------|-------|----------|
| Suspends ACTIVE organization | Active org, reason provided | Returns `ClientDetailResponse` with status `SUSPENDED`, produces audit event |
| Suspends without reason | Active org, no reason | Returns `ClientDetailResponse` with status `SUSPENDED`, audit with `reason: null` |
| Rejects when org not found | Non-existent ID | Throws with "not found" |
| Rejects cross-tenant access | Org belongs to different firm | Throws with "tenant scope" |
| Rejects SUSPENDED → SUSPENDED | Already-suspended org | Throws with "Cannot transition from" |

#### ReactivateOrganizationUseCase

| Test | Input | Expected |
|------|-------|----------|
| Reactivates SUSPENDED organization | Suspended org | Returns `ClientDetailResponse` with status `ACTIVE`, produces audit event |
| Rejects when org not found | Non-existent ID | Throws with "not found" |
| Rejects cross-tenant access | Org belongs to different firm | Throws with "tenant scope" |
| Rejects ACTIVE → ACTIVE | Already-active org | Throws with "Cannot transition from" |

### Route Integration Tests (Optional but Recommended)

Integration tests for Elysia route handlers using in-memory repository mocks:

| Test | Endpoint | Expected Status |
|------|----------|----------------|
| Full create flow | `POST /api/firm/clients` | 201 |
| Create with invalid RUC | `POST /api/firm/clients` | 400 |
| Create with duplicate RUC | `POST /api/firm/clients` | 409 |
| Suspend active org | `POST /api/firm/clients/:id/suspend` | 200 |
| Suspend already-suspended | `POST /api/firm/clients/:id/suspend` | 409 |
| Reactivate suspended org | `POST /api/firm/clients/:id/reactivate` | 200 |
| Reactivate active org | `POST /api/firm/clients/:id/reactivate` | 409 |
| Cross-tenant suspend | `POST /api/firm/clients/:id/suspend` | 403 |
| Missing tenant context (any) | Any POST/PATCH | 403 |

### Existing Test Preservation

- Domain entity tests (validators, status transitions, entity methods) already exist and SHALL NOT be duplicated.
- Existing GET/PATCH route tests SHALL continue to pass without modification.
- The test suite SHALL be run with `vitest run` at workspace level before considering the implementation complete.

---

## Out of Scope

The following capabilities are explicitly out of scope for this change and SHALL NOT be implemented:

- **INACTIVE status endpoint**: The domain validator supports INACTIVE transitions, but no `/deactivate` or `/archive` route is included in this slice.
- **Organization deletion**: No DELETE endpoint. Organizations are never deleted, only transitioned between statuses.
- **Invitation system**: No membership invitation or team/role management endpoints.
- **Batch operations**: No bulk suspend/reactivate. Each operation targets a single organization.
- **Organization transfer**: No endpoint to reassign an organization from one firm to another.
- **Name changes**: Organization name is not mutable via any endpoint in this slice.
- **RUC/Slug changes**: Both fields are immutable after creation.
- **UI implementation**: This is an API-only slice. No frontend changes.
- **Webhook/notification**: No event-driven notification on status change.
- **Optimistic locking**: Concurrent status changes use last-write-wins. Optimistic concurrency control is a future concern.
- **Dedicated audit database table**: Audit events use structured logging for this slice; a persistent audit table is follow-up work.
- **Health score recalculation on status change**: No metrics recalculation on suspend/reactivate.
