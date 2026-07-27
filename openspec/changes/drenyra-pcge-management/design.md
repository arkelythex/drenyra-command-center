# SDD Design: PCGE Management — API + Auto-Provisioning (Slice 1)

## Metadata

| Field               | Value                                         |
| ------------------- | --------------------------------------------- |
| **Change ID**       | `drenyra-pcge-management`                     |
| **SDD Phase**       | Design                                        |
| **Status**          | Complete                                      |
| **Based on**        | Explore + Proposal + Spec                     |
| **Created**         | 2026-07-25                                    |
| **Scope**           | Slice 1 — 6 API endpoints + seed provisioning |
| **Estimated Lines** | ~1,090                                        |

---

## 1. Design Decisions

### DD-1: No DI Container — Direct Instantiation

**Decision**: Commands instantiate `AccountAdminService` with concrete dependencies directly. No IoC container.

**Rationale**:

- The existing codebase (queries, routes) follows this pattern: import from `@drenyra/persistence`, instantiate repos directly
- Adding a DI container would be over-engineering for a vertical slice with one service and one repo
- `PostgresAccountRepository` has zero constructor args — trivial to instantiate
- Testing uses `vi.mock()` at the module level, consistent with existing test patterns

### DD-2: `isSystem` via Level Heuristic (Not DB Column)

**Decision**: `AccountAdminService.isSystemAccount(account)` checks `account.level ∈ {"1","2","3"}`. No `isSystem` column in DB.

**Rationale**:

- The `PostgresAccountRepository.mapToDomain()` always sets `isSystem: false`
- Even if `isSystem` were persisted, the entity's `update()` guard would still need the service check because the repo strips it
- The seed creates ALL levels 1-3 accounts and NO levels 4-5. User API only allows creating levels 4-5
- This heuristic is mathematically correct: system accounts = seed accounts = levels 1-3; user accounts = API-created = levels 4-5

### DD-3: `update()` Guard in Service, Not Entity

**Decision**: System account mutation restrictions are validated in `AccountAdminService.update()`, NOT in `Account.entity.update()`.

**Rationale**: The entity's `update()` only blocks when `this.props.isSystem === true`, but the repo always sets `isSystem: false`. The service must enforce the restriction BEFORE calling `account.update()`.

### DD-4: `toggleStatus()` Uses Entity's Implementation

**Decision**: `toggleStatus()` delegates directly to `account.toggleStatus()` — no service-level guard needed. `Account.toggleStatus()` performs no validation (it just flips `isActive`), so it never throws. System accounts can also be toggled per spec.

### DD-5: `db` Dependency via Direct Import

**Decision**: The `AccountAdminService` receives a `db: DrizzleClient` dependency. Commands import `db` from `@drenyra/persistence` and pass it to the service.

### DD-6: `organizationIdResolver` via Re-export

**Decision**: Create `apps/api/src/shared/organization-context.ts` that re-exports `resolveOrganizationIdFromCompany` from `@drenyra/persistence`.

---

## 2. Module Design — Detailed Class/Function Specifications

### 2.1 Error Classes (`application/errors.ts`)

```
AccountError (extends Error)
  ├── ValidationError (httpStatus: 422)
  ├── ConflictError   (httpStatus: 409)
  ├── NotFoundError   (httpStatus: 404)
  └── ForbiddenError  (httpStatus: 403)
```

Each carries: `message`, `code`, `httpStatus`, optional `field` and `details`.

### 2.2 Zod Schemas (`application/schemas/account.schema.ts`)

- **`CreateAccountBody`**: `{ code (≥5 digits, numeric), name, type (enum), parentId (UUID) }`
- **`UpdateAccountBody`**: `{ name?, description?, destination?, isActive? }` (all optional)
- **`AccountResponse`**: Full account shape for responses
- **`AccountTreeNode`**: Recursive `AccountResponse & { children: AccountTreeNode[] }`

### 2.3 `AccountAdminService` (`application/services/account-admin.service.ts`)

**Dependencies contract**:

```typescript
interface AccountAdminServiceDeps {
  repo: AccountRepository
  db: DrizzleClient
  organizationIdResolver: (companyId: string) => Promise<number>
}
```

**Static helpers**: `isSystemAccount(account)`, `isSystemLevel(level)`, `levelFromCode(code)`

**Instance methods**: `create(dto, orgId)`, `update(id, orgId, dto)`, `toggle(id, orgId)`, `delete(id, orgId, companyId)`, `getHierarchy(orgId)`, `seedCatalog(companyId)`

#### `create(dto, orgId)` Flow

1. `levelFromCode(dto.code)` — derive level from digits
2. Guard: `isSystemLevel(level)` → 422 FORBIDDEN_SYSTEM_LEVEL
3. `repo.findById(dto.parentId)` → 422 PARENT_NOT_FOUND if null
4. `repo.codeExists(orgId, dto.code)` → 409 DUPLICATE_CODE if exists
5. `Account.create({ ...props, isSystem: false })` — domain validation
6. `repo.save(account)`

#### `update(id, orgId, dto)` Flow

1. `repo.findById(id)` → 404 if not found or org mismatch
2. System account guard: only `name`, `description`, `destination` allowed → 403 if restricted fields
3. `account.update(filteredDto)` — domain validation
4. `repo.save(updated)`

#### `toggle(id, orgId)` Flow

1. `repo.findById(id)` → 404
2. `account.toggleStatus()` — never throws
3. `repo.save(toggled)`

#### `delete(id, orgId, companyId)` Flow

1. `repo.findById(id)` → 404
2. System account check → 403
3. `repo.hasChildren(id)` → 409 HAS_CHILDREN
4. Journal entry query: `SELECT COUNT(*) FROM journal_entry_lines jel INNER JOIN journal_entries je ON jel.journal_entry_id = je.id WHERE je.company_id = $companyId AND jel.account_code = $accountCode` → 409 HAS_JOURNAL_ENTRIES if count > 0
5. `repo.delete(id)`

#### `getHierarchy(orgId)`

Delegates to `repo.getHierarchy(orgId)`. `isSystem` is derived from level during JSON serialization.

#### `seedCatalog(companyId)`

1. `seedPcgeCatalog(db, companyId)` — idempotent upsert
2. Count total accounts via `repo.count({ organizationId })`
3. Return `{ message, totalAccounts }`

### 2.4 Static Helper: `levelFromCode`

| Code Length | Level | Name             |
| ----------- | ----- | ---------------- |
| ≤ 2         | "1"   | Rubro            |
| 3           | "2"   | Cuenta           |
| 4           | "3"   | Sub-Cuenta       |
| 5           | "4"   | Divisionaria     |
| ≥ 6         | "5"   | Sub-Divisionaria |

### 2.5 Command Layer

Commands are thin wrappers that:

1. Accept DTOs + context (orgId, companyId)
2. Instantiate `AccountAdminService` via `getAccountAdminServiceDeps()` factory
3. Delegate to service methods

**Dependency factory** (`application/shared/dependencies.ts`):

- `getAccountRepository()` — singleton `PostgresAccountRepository`
- `getAccountAdminServiceDeps()` — builds `{ repo, db, organizationIdResolver }`

**Six commands**: `createAccount`, `updateAccount`, `toggleAccount`, `deleteAccount`, `getHierarchy`, `seedCatalog`

---

## 3. Route Handler Integration (`routes.ts`)

Additions to existing `ledgerModule`:

| Method | Path                   | Command                               | Status |
| ------ | ---------------------- | ------------------------------------- | ------ |
| POST   | `/accounts`            | `createAccount(body, orgId)`          | 201    |
| PUT    | `/accounts/:id`        | `updateAccount(id, orgId, body)`      | 200    |
| PATCH  | `/accounts/:id/toggle` | `toggleAccount(id, orgId)`            | 200    |
| DELETE | `/accounts/:id`        | `deleteAccount(id, orgId, companyId)` | 204    |
| GET    | `/accounts/hierarchy`  | `getHierarchy(orgId)`                 | 200    |
| POST   | `/accounts/seed`       | `seedCatalog(companyId)`              | 200    |

**Error handler helper**: `handleAccountError(error, set)` maps `AccountError` subclasses → `fail()` with correct HTTP status.

**Company context**: Every handler checks `companyContext` → 401 if missing. Resolves `orgId` via `resolveOrganizationId(companyContext.companyId)`.

---

## 4. Journal Entry Validation Query

```typescript
const [result] = await this.deps.db
  .select({ value: count() })
  .from(journalEntryLines)
  .innerJoin(
    journalEntries,
    eq(journalEntryLines.journalEntryId, journalEntries.id)
  )
  .where(
    and(
      eq(journalEntries.companyId, companyId),
      eq(journalEntryLines.accountCode, account.code)
    )
  )
```

Uses existing indices: `journal_entries_company_period_idx`, `journal_entry_lines_account_idx`.

---

## 5. Testing Strategy

| Layer               | What                                  | Mock                    | File                            |
| ------------------- | ------------------------------------- | ----------------------- | ------------------------------- |
| Unit: Service       | 21 test cases for AccountAdminService | Mock repo, db, resolver | `account-admin.service.test.ts` |
| Unit: Errors        | 6 test cases for error classes        | None                    | `account-errors.test.ts`        |
| Integration: Routes | 22 test cases for all endpoints       | Real test DB            | `account-admin-routes.test.ts`  |

### Key Unit Test Cases

| #     | Method | Scenario                     | Expected                                 |
| ----- | ------ | ---------------------------- | ---------------------------------------- |
| UT-1  | create | Valid level-4                | Returns Account, repo.save called        |
| UT-2  | create | Level-3 rejected             | ValidationError FORBIDDEN_SYSTEM_LEVEL   |
| UT-3  | create | Parent not found             | ValidationError PARENT_NOT_FOUND         |
| UT-4  | create | Duplicate code               | ConflictError DUPLICATE_CODE             |
| UT-7  | update | User account — name          | Returns updated Account                  |
| UT-9  | update | System account — code change | ForbiddenError SYSTEM_ACCOUNT_RESTRICTED |
| UT-13 | delete | No deps                      | repo.delete called                       |
| UT-14 | delete | System account               | ForbiddenError                           |
| UT-15 | delete | Has children                 | ConflictError HAS_CHILDREN               |
| UT-16 | delete | Journal entries              | ConflictError HAS_JOURNAL_ENTRIES        |

### Key Integration Test Cases

| #     | Endpoint                | Scenario             | Expected Status |
| ----- | ----------------------- | -------------------- | --------------- |
| IT-1  | POST /accounts          | Valid create         | 201             |
| IT-3  | POST /accounts          | Duplicate code       | 409             |
| IT-9  | PUT /accounts/:id       | System — code change | 403             |
| IT-14 | DELETE /accounts/:id    | No deps              | 204             |
| IT-18 | GET /accounts/hierarchy | Tree                 | 200             |
| IT-21 | POST /accounts/seed     | Idempotent           | 200, same count |

---

## 6. File Manifest

### New Files (14 files, ~1,100 lines)

| #     | Path                                                                         | Lines |
| ----- | ---------------------------------------------------------------------------- | ----- |
| 1     | `apps/api/src/shared/organization-context.ts`                                | ~6    |
| 2     | `apps/api/src/features/ledger/application/errors.ts`                         | ~55   |
| 3     | `apps/api/src/features/ledger/application/schemas/account.schema.ts`         | ~85   |
| 4     | `apps/api/src/features/ledger/application/shared/dependencies.ts`            | ~25   |
| 5     | `apps/api/src/features/ledger/application/services/account-admin.service.ts` | ~180  |
| 6-11  | 6 command files                                                              | ~120  |
| 12-14 | 3 test files                                                                 | ~625  |

### Modified Files (3 files, ~140 lines)

| #   | Path                                     | Change                     |
| --- | ---------------------------------------- | -------------------------- |
| 15  | `apps/api/src/features/ledger/routes.ts` | +130 lines (6 endpoints)   |
| 16  | `packages/persistence/src/index.ts`      | +2 lines (export seed)     |
| 17  | `apps/api/src/features/ledger/index.ts`  | +8 lines (export commands) |

### NOT Modified

- `packages/domain/src/entities/Account.ts` — No changes
- `packages/persistence/src/schema/accounting.schema.ts` — No changes
- `packages/persistence/src/repositories/postgres-account.repository.ts` — No changes
- `packages/persistence/src/seed/pcge-catalog.ts` — No changes
- Frontend files — Out of scope

---

## 7. Implementation Batches

### Batch 1: Foundation (No Routes)

1. `organization-context.ts` → create
2. `errors.ts` → create
3. `schemas/account.schema.ts` → create
4. `dependencies.ts` → create
5. `account-admin.service.ts` → create
6. 6 command files → create
7. Unit tests → create and verify

### Batch 2: Routes + Barrel

1. `packages/persistence/src/index.ts` → add export
2. `routes.ts` → add 6 endpoints
3. `index.ts` → add exports

### Batch 3: Integration Tests

1. `account-admin-routes.test.ts` → create and verify

---

## 8. Risk Register

| Risk                                                                  | Impact | Mitigation                                               |
| --------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| Entity.update() doesn't guard system accounts (isSystem=false always) | Medium | Service validates BEFORE entity.update()                 |
| Cross-company parentId injection                                      | Medium | Slice 2 adds parent.organizationId check                 |
| description/destination columns missing from pcge_accounts            | Low    | Fields accepted in body, silently dropped at persistence |
| Route collisions (literal vs param)                                   | None   | Elysia matches literal paths first                       |

---

## 9. Next Phase

→ **`sdd-tasks`**: Break the design into actionable task items grouped by batch, with dependency ordering and acceptance criteria per task.
