# Tasks — drenyra-organization-lifecycle

## Review Workload Forecast

- **Decision needed before apply**: No
- **Chained PRs recommended**: No
- **Chain strategy**: N/A
- **400-line budget risk**: Low (estimated ~350 production lines)

---

## Phase 1: Foundation

- [x] Create `types.ts` with DTOs, AuditEvent, AuditLogger interface, UseCaseContext, mapToClientDetail <!-- sdd-owner: implementation -->
- [x] Implement `ConsoleAuditLogger` and `SpyAuditLogger` in `audit-logger.ts` <!-- sdd-owner: implementation -->
- [x] Implement `mapUseCaseError()` in `error-mapper.ts` mapping domain errors → HTTP codes <!-- sdd-owner: implementation -->

## Phase 2: CreateOrganizationUseCase

- [x] RED: Write 8 unit tests for create use case (valid, invalid RUC, invalid slug, RUC uniqueness, slug uniqueness, cross-tenant RUC) <!-- sdd-owner: implementation -->
- [x] GREEN: Implement `CreateOrganizationUseCase` with tenant-scoped uniqueness <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: Verify all 8 test scenarios pass <!-- sdd-owner: implementation -->
- [x] REFACTOR: Extract `assertTenantScope` to shared utility <!-- sdd-owner: implementation -->

## Phase 3: SuspendOrganizationUseCase

- [x] RED: Write 5 unit tests for suspend use case <!-- sdd-owner: implementation -->
- [x] GREEN: Implement `SuspendOrganizationUseCase` <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: Verify all 5 test scenarios pass <!-- sdd-owner: implementation -->
- [x] REFACTOR: Use shared `assertTenantScope` <!-- sdd-owner: implementation -->

## Phase 4: ReactivateOrganizationUseCase

- [x] RED: Write 4 unit tests for reactivate use case <!-- sdd-owner: implementation -->
- [x] GREEN: Implement `ReactivateOrganizationUseCase` <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: Verify all 4 test scenarios pass <!-- sdd-owner: implementation -->
- [x] REFACTOR: Use shared `assertTenantScope` <!-- sdd-owner: implementation -->

## Phase 5: Controller Wiring

- [x] Create `organization-lifecycle.controller.ts` wiring use cases to route handlers <!-- sdd-owner: implementation -->
- [x] Implement `validateSettings()` for settings key validation <!-- sdd-owner: implementation -->
- [x] Implement `updateClientSettings()` for formalized PATCH settings <!-- sdd-owner: implementation -->

## Phase 6: Route Wiring

- [x] Add POST `/api/firm/clients` route for organization creation <!-- sdd-owner: implementation -->
- [x] Add POST `/api/firm/clients/:id/suspend` route <!-- sdd-owner: implementation -->
- [x] Add POST `/api/firm/clients/:id/reactivate` route <!-- sdd-owner: implementation -->
- [x] Formalize PATCH `/api/firm/clients/:id` with settings validation <!-- sdd-owner: implementation -->

## Phase 7: Integration Tests

- [x] Write 9 integration tests exercising controller through mocked persistence <!-- sdd-owner: implementation -->
- [x] Verify all integration tests pass <!-- sdd-owner: implementation -->

## Phase 8: Manual Smoke Test

- [x] Run full org-lifecycle test suite: 47/47 passing <!-- sdd-owner: implementation -->
- [ ] Run TypeScript typecheck <!-- sdd-owner: parent -->
- [ ] Manual API smoke test with running server <!-- sdd-owner: parent -->
- [ ] Stage files and commit <!-- sdd-owner: parent -->
- [ ] Run full project test suite <!-- sdd-owner: parent -->
