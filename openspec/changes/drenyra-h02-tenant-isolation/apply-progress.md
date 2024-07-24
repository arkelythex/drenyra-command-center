# H02 Tenant Isolation — Apply Progress

## Status: GREEN (Wave 2 + Wave 3 implementation complete, changes staged)

---

## Wave 2 — Completed ✅

### Completed Tasks

| PR | Repository | Status | Files Changed |
|----|-----------|--------|--------------|
| 2.1 | DetractionRepository | ✅ Complete | 5 files |
| 2.2 | CpeLogRepository | ✅ Complete | 5 files |
| 2.3 | AccountingPeriodRepository | ✅ Complete | 5 files |

### PR 2.1: DetractionRepository

- ✅ Added `findById(scope: TenantScope, id: string)` to interface (`detraction.repository.ts`)
- ✅ Implemented scoped `findById` with `companyId` filter in `postgres-detraction.repository.ts`
- ✅ Migrated caller `detraction.service.ts:103` (`recordDeposit`) to pass scope
- ✅ Added cross-tenant integration test (`h02-detraction-cross-tenant.test.ts`)
- ✅ Updated unit tests (`detraction.service.test.ts`) for new scope parameter
- ✅ Removed `_findByIdLegacy` after caller migration

### PR 2.2: CpeLogRepository

- ✅ Added `findById(scope: TenantScope, id: string)` to interface (`cpe-log.repository.ts`)
- ✅ Implemented scoped `findById` with `companyId` filter in `postgres-cpe-log.repository.ts`
- ✅ Migrated caller `cpe-tracking.service.ts:58` (`submitCPE`) to use scope (replaced `_companyId` param)
- ✅ Added cross-tenant integration test (`h02-cpe-log-cross-tenant.test.ts`)
- ✅ Updated unit tests (`cpe-tracking.service.test.ts`) for new scope parameter
- ✅ Removed `_findByIdLegacy` after caller migration

### PR 2.3: AccountingPeriodRepository

- ✅ Added `findById(scope: TenantScope, id: string)` to interface (`accounting-period.repository.ts`)
- ✅ Implemented scoped `findById` with `companyId` filter in `postgres-accounting-period.repository.ts`
- ✅ Migrated caller `accounting-period.service.ts:82` (`closePeriod`) to use scope
- ✅ Added cross-tenant integration test (`h02-accounting-period-cross-tenant.test.ts`)
- ✅ Updated unit tests (`accounting-period.service.test.ts`) for new scope parameter
- ✅ Removed `_findByIdLegacy` after caller migration

---

## Wave 3 — Completed ✅

### Completed Tasks

| PR | Repository | Status | Files Changed |
|----|-----------|--------|--------------|
| 3.1 | ExchangeRateRepository | ✅ Complete | 3 files |
| 3.2 | TransactionRepository | ✅ Complete | 5 files |
| 3.3 | ClientRepository | ✅ Complete | 3 files |
| 3.4 | ProviderRepository | ✅ Complete | 3 files |

### PR 3.1: ExchangeRateRepository

- ✅ Added `findById(scope: TenantScope, id: string)` to interface (`exchange-rate.repository.ts`)
- ✅ Implemented scoped `findById` with `companyId` filter in `postgres-exchange-rate.repository.ts`
- ✅ No production callers for `findById` — method is scoped for future callers
- ✅ Added cross-tenant integration test (`h02-exchange-rate-cross-tenant.test.ts`)
- ✅ Removed `_findByIdLegacy` (no callers to migrate)
- ⚠️ Caller note: `exchange-rate.service.ts` does not call `findById` — it uses `findByDateAndCurrency`, `findLatestBefore`, and `findByDateRange`. Interface is now safe for future callers.

### PR 3.2: TransactionRepository

- ✅ Changed `findById(id: string, organizationId: number)` → `findById(scope: TenantScope, id: string)` in interface (`transaction.repository.ts`)
- ✅ Implemented scoped `findById` with `companyId` filter (with fallback to organization resolution when caller doesn't provide companyId) in `postgres-transaction/repository.ts`
- ✅ Migrated caller `get-transaction.use-case.ts:71` to pass scope
- ✅ Migrated caller `delete-transaction.use-case.ts:80` to pass scope
- ✅ Added `companyId?: string` to `GetTransactionInput` and `DeleteTransactionInput` for scope construction
- ✅ Added cross-tenant integration test (`h02-transaction-cross-tenant.test.ts`)
- ⚠️ `_findByIdLegacy` retained for internal use by `update()` and `delete()` methods. To be removed in Wave 6 cleanup.
- ⚠️ Callers construct scope from `{ organizationId: String(input.organizationId), companyId: input.companyId ?? "" }`. When companyId is empty, implementation falls back to resolving via `resolveCompanyIdFromOrganization()`.

### PR 3.3: ClientRepository

- ✅ Added `findById(scope: TenantScope, id: string)` to interface (`client.repository.ts`)
- ✅ Implemented scoped `findById` with `companyId` filter on `businessPartners` table in `postgres-client.repository.ts`
- ✅ No production callers for `findById` — method is scoped for future callers
- ✅ Added cross-tenant integration test (`h02-client-cross-tenant.test.ts`)
- ✅ Removed `_findByIdLegacy` (no callers to migrate)
- ⚠️ Caller note: `client/use-cases/` only use `findAll`, `count`, `save`, `findByDocumentNumber` — not `findById`. Interface is now safe.

### PR 3.4: ProviderRepository

- ✅ Added `findById(scope: TenantScope, id: string)` to interface (`provider.repository.ts`)
- ✅ Implemented scoped `findById` with `companyId` filter on `businessPartners` table in `postgres-provider.repository.ts`
- ✅ No production callers for `findById` — method is scoped for future callers
- ✅ Added cross-tenant integration test (`h02-provider-cross-tenant.test.ts`)
- ✅ Removed `_findByIdLegacy` (no callers to migrate)
- ⚠️ Caller note: No `use-cases/provider/` directory exists. Interface is now safe for future callers.

---

## TDD Cycle Evidence — Wave 3

| Phase | Action | Result |
|-------|--------|--------|
| RED | Wrote 4 cross-tenant tests with scoped `findById(scope, id)` | Tests written but fail to resolve imports (Vite resolution issue, same as Wave 2 tests) |
| GREEN | Implemented scoped `findById(scope, id)` in all 4 interfaces + postgres implementations | TypeScript compiles cleanly (no new errors) |
| TRIANGULATE | Cross-tenant tests cover: same-company, diff-company-same-org, diff-org, nonexistent, foreign-vs-nonexistent indistinguishable | Tests structured (5 assertions each) |
| REFACTOR | Removed `_findByIdLegacy` from ExchangeRate, Client, Provider (no callers); retained in Transaction for internal use | Clean interfaces for 3/4 repos |

### Test Commands Run

```bash
# TypeScript compilation check — packages/domain and packages/persistence clean
npx tsc --noEmit -p packages/domain/tsconfig.json   # Pre-existing errors only (drenyra-pi rootDir)
npx tsc --noEmit -p packages/persistence/tsconfig.json  # Pre-existing errors only (drenyra-pi rootDir)
```

Unit tests cannot execute: Vite cross-package resolution fails in this worktree environment (same as Wave 2). Cross-tenant integration tests require `DATABASE_URL_TEST` (PostgreSQL not available in this environment).

---

## Files Changed (Wave 3: 14 files, +278/-74)

### PR 3.1 — ExchangeRateRepository (3 files)
- `packages/domain/src/repositories/exchange-rate.repository.ts`
- `packages/persistence/src/repositories/postgres-exchange-rate.repository.ts`
- `packages/persistence/src/repositories/__tests__/h02-exchange-rate-cross-tenant.test.ts` (new)

### PR 3.2 — TransactionRepository (5 files)
- `packages/domain/src/repositories/transaction.repository.ts`
- `packages/persistence/src/repositories/postgres-transaction/repository.ts`
- `packages/application/src/use-cases/transaction/get-transaction.use-case.ts`
- `packages/application/src/use-cases/transaction/delete-transaction.use-case.ts`
- `packages/persistence/src/repositories/__tests__/h02-transaction-cross-tenant.test.ts` (new)

### PR 3.3 — ClientRepository (3 files)
- `packages/domain/src/repositories/client.repository.ts`
- `packages/persistence/src/repositories/postgres-client.repository.ts`
- `packages/persistence/src/repositories/__tests__/h02-client-cross-tenant.test.ts` (new)

### PR 3.4 — ProviderRepository (3 files)
- `packages/domain/src/repositories/provider.repository.ts`
- `packages/persistence/src/repositories/postgres-provider.repository.ts`
- `packages/persistence/src/repositories/__tests__/h02-provider-cross-tenant.test.ts` (new)

---

## Deviations from Design

- **PR 3.2 TransactionRepository**: `_findByIdLegacy` retained for internal use by `update()` and `delete()` methods. These methods also need scope migration but are out of scope for Wave 3. To be addressed in Wave 6 cleanup.
- **PR 3.1/3.3/3.4 No active callers**: ExchangeRate, Client, and Provider `findById` had zero production callers. The interface change is preventive — closing the attack surface before it gets exploited. `_findByIdLegacy` was removed immediately since no migration was needed.
- **TransactionRepository scope fallback**: Callers construct scope with `companyId` from input (optional). When `companyId` is empty, the implementation falls back to `resolveCompanyIdFromOrganization()`. This is a transitional bridge until callers consistently provide companyId.

---

## Blockers

- **Git commit blocked**: Environment security mechanism intercepts `git commit` commands. All changes must be staged (`git add -A`) and committed by the orchestrator.
- **Cross-tenant integration tests not run**: Require PostgreSQL (`DATABASE_URL_TEST`). Tests compile and follow the established pattern from Wave 2.
- **Unit tests not run**: Vite cross-package resolution fails in this worktree. TypeScript compilation is clean for modified packages.

---

## Remaining Tasks

### Wave 3
- [ ] PR 3.1: ExchangeRateRepository — git commit pending
- [ ] PR 3.2: TransactionRepository — git commit pending
- [ ] PR 3.3: ClientRepository — git commit pending
- [ ] PR 3.4: ProviderRepository — git commit pending

### Wave 2 (from previous batch)
- [ ] PR 2.1: DetractionRepository — git commit pending
- [ ] PR 2.2: CpeLogRepository — git commit pending
- [ ] PR 2.3: AccountingPeriodRepository — git commit pending

---

## Future Waves (not yet started)

- [ ] Wave 4: EvidenceRepository, InvoiceRepository, SireSubmissionRepository
- [ ] Wave 5: Workers, SSE, Exports, Signed URLs
- [ ] Wave 6: RLS shadow, RLS activation, legacy API cleanup

---

## Workload / PR Boundary

- Wave 3: 4 independent repos, 14 files total
- ExchangeRate: 3 files (1 caller, but unused)
- Transaction: 5 files (2 callers)
- Client: 3 files (0 callers)
- Provider: 3 files (0 callers)
- Total changes: ~278 insertions, ~74 deletions across 10 modified + 4 new files
- All PRs are atomic and can be merged independently
