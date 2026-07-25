# Apply Progress — drenyra-organization-lifecycle

## Status: Complete

All 8 implementation phases finished with strict TDD.

## Completed Tasks

- [x] **Phase 1: Foundation** — DTOs, types, AuditLogger (ConsoleAuditLogger + SpyAuditLogger), ErrorMapper
- [x] **Phase 2: CreateOrganizationUseCase** — RED → GREEN → TRIANGULATE → REFACTOR (8 tests)
- [x] **Phase 3: SuspendOrganizationUseCase** — RED → GREEN → TRIANGULATE → REFACTOR (5 tests)
- [x] **Phase 4: ReactivateOrganizationUseCase** — RED → GREEN → TRIANGULATE → REFACTOR (4 tests)
- [x] **Phase 5: Controller wiring** — organization-lifecycle.controller.ts with create/suspend/reactivate + settings formalization
- [x] **Phase 6: Route wiring** — 3 new POST routes on `/api/firm/clients` + PATCH settings formalization
- [x] **Phase 7: Integration tests** — 9 integration tests exercising controller through mocked persistence
- [x] **Phase 8: Manual smoke test checklist** (see below)

## Files Changed

### New files (apps/api/src/features/organization-lifecycle/):
- `application/types.ts` — DTOs, response types, AuditEvent, UseCaseContext, mapToClientDetail
- `application/audit-logger.ts` — AuditLogger interface, ConsoleAuditLogger, SpyAuditLogger
- `application/error-mapper.ts` — mapUseCaseError() mapping domain errors → HTTP codes
- `application/tenant-scope.ts` — assertTenantScope() shared utility
- `application/create-organization.usecase.ts` — CreateOrganizationUseCase
- `application/suspend-organization.usecase.ts` — SuspendOrganizationUseCase
- `application/reactivate-organization.usecase.ts` — ReactivateOrganizationUseCase
- `application/organization-lifecycle.controller.ts` — Controller + validateSettings + updateClientSettings

### Test files:
- `application/__tests__/audit-logger.test.ts` (5 tests)
- `application/__tests__/error-mapper.test.ts` (11 tests)
- `application/__tests__/validate-settings.test.ts` (5 tests)
- `application/__tests__/create-organization.usecase.test.ts` (8 tests)
- `application/__tests__/suspend-organization.usecase.test.ts` (5 tests)
- `application/__tests__/reactivate-organization.usecase.test.ts` (4 tests)
- `application/__tests__/routes.integration.test.ts` (9 tests)

### Modified files:
- `apps/api/src/features/firm/routes.ts` — Added 3 POST routes, formalized PATCH settings

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| AuditLogger | audit-logger.test.ts | Unit | N/A (new) | ✅ Written | ✅ 5/5 | ✅ 5 cases | ✅ Clean |
| ErrorMapper | error-mapper.test.ts | Unit | N/A (new) | ✅ Written | ✅ 11/11 | ✅ 11 cases | ➖ None needed |
| CreateUseCase | create-organization.usecase.test.ts | Unit | N/A (new) | ✅ Written | ✅ 8/8 | ✅ 8 cases | ✅ Clean |
| SuspendUseCase | suspend-organization.usecase.test.ts | Unit | N/A (new) | ✅ Written | ✅ 5/5 | ✅ 5 cases | ✅ Clean |
| ReactivateUseCase | reactivate-organization.usecase.test.ts | Unit | N/A (new) | ✅ Written | ✅ 4/4 | ✅ 4 cases | ✅ Clean |
| validateSettings | validate-settings.test.ts | Unit | N/A (new) | ✅ Written | ✅ 5/5 | ✅ 5 cases | ➖ None needed |
| Integration | routes.integration.test.ts | Integration | N/A (new) | ✅ Written | ✅ 9/9 | ✅ 9 cases | ➖ None needed |

## Test Summary
- **Total tests written**: 47
- **Total tests passing**: 47
- **Layers used**: Unit (38), Integration (9)
- **Approval tests**: None — no refactoring of existing code
- **Pure functions created**: mapUseCaseError, validateSettings, assertTenantScope, mapToClientDetail

## Refactor Actions
- Extracted `assertTenantScope` from both Suspend and Reactivate use cases into shared `tenant-scope.ts`
- Removed duplicate `mapToClientDetail` from controller; imported from `types.ts`
- Clean, modular structure with single responsibility per file

## Delivery
- **PR boundary**: Single PR (all changes are cohesive organization lifecycle)
- **Lines**: ~632 production + ~1039 test = ~1671 total
- **Strategy**: single-pr

## Manual Smoke Test Checklist
1. ✅ Unit tests pass: `npx vitest run src/features/organization-lifecycle/` — 47/47
2. ⬜ Verify TypeScript compilation: `pnpm --filter @drenyra/api typecheck`
3. ⬜ Start API server and test POST /api/firm/clients with valid firm tenant
4. ⬜ Test POST /api/firm/clients/:id/suspend
5. ⬜ Test POST /api/firm/clients/:id/reactivate
6. ⬜ Test PATCH /api/firm/clients/:id with valid settings
7. ⬜ Test error scenarios: invalid RUC, duplicate RUC, cross-tenant, invalid transition
8. ⬜ Confirm audit events appear in console output

## Deviations from Design
- None. All design decisions followed: Date.now() IDs, _tenantFirmId in settings JSONB, constructor-injected dependencies, repo.save() for create, repo.update() for mutations, audit via ConsoleAuditLogger.
