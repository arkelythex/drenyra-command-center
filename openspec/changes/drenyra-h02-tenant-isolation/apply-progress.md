# H02 Wave 2 — Apply Progress

## Status: GREEN (implementation complete, commits staged)

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

### TDD Cycle Evidence

| Phase | Test | Result |
|-------|------|--------|
| RED | Wrote cross-tenant tests with scoped `findById` | Tests compiled but method didn't exist with scope |
| GREEN | Implemented scoped `findById(scope, id)` in all 3 repos | Implementation complete |
| TRIANGULATE | Cross-tenant tests: same-org different-company, different-org, nonexistent, foreign-vs-nonexistent indistinguishable | Tests structured |
| REFACTOR | Removed `_findByIdLegacy` from all 3 repos after caller migration | Clean interfaces |

### Test Commands Run

```bash
# Unit tests — all GREEN (48/48 pass)
npx vitest run \
  src/services/__tests__/detraction.service.test.ts \
  src/services/__tests__/cpe-tracking.service.test.ts \
  src/services/__tests__/accounting-period.service.test.ts
```

Cross-tenant integration tests require `DATABASE_URL_TEST` (PostgreSQL not available in this environment).

### Files Changed (15 files, +286/-27)

**Domain interfaces** (3):
- `packages/domain/src/repositories/detraction.repository.ts`
- `packages/domain/src/repositories/cpe-log.repository.ts`
- `packages/domain/src/repositories/accounting-period.repository.ts`

**Persistence implementations** (3):
- `packages/persistence/src/repositories/postgres-detraction.repository.ts`
- `packages/persistence/src/repositories/postgres-cpe-log.repository.ts`
- `packages/persistence/src/repositories/postgres-accounting-period.repository.ts`

**Application services** (3):
- `packages/application/src/services/detraction.service.ts`
- `packages/application/src/services/cpe-tracking.service.ts`
- `packages/application/src/services/accounting-period.service.ts`

**Unit tests** (3):
- `packages/application/src/services/__tests__/detraction.service.test.ts`
- `packages/application/src/services/__tests__/cpe-tracking.service.test.ts`
- `packages/application/src/services/__tests__/accounting-period.service.test.ts`

**Cross-tenant integration tests** (3 new):
- `packages/persistence/src/repositories/__tests__/h02-detraction-cross-tenant.test.ts`
- `packages/persistence/src/repositories/__tests__/h02-cpe-log-cross-tenant.test.ts`
- `packages/persistence/src/repositories/__tests__/h02-accounting-period-cross-tenant.test.ts`

### Deviations from Design

- None. All three repos follow the exact pattern specified in tasks.md.
- Scope used: `TenantScope` (organizationId + companyId) for all three — correct for company-level entities.

### Blockers

- **Git commit blocked**: Environment security mechanism intercepts `git commit` commands. All changes are staged (`git add` successful) but cannot be committed. 15 files staged, ready for commit with conventional commit messages.
- **Cross-tenant integration tests not run**: Require PostgreSQL (`DATABASE_URL_TEST`). Tests compile and follow the established pattern from `h02-account-cross-tenant.test.ts`.

### Remaining Tasks (unchecked from tasks.md)

- [ ] PR 2.1: DetractionRepository — git commit pending
- [ ] PR 2.2: CpeLogRepository — git commit pending
- [ ] PR 2.3: AccountingPeriodRepository — git commit pending

### Workload / PR Boundary

- Wave 2 is 3 independent single-caller PRs, all implemented in one batch
- Each PR: ~5 files, ~95 lines changed average
- Total: 15 files, 286 insertions, 27 deletions
- All PRs are atomic and can be merged independently
