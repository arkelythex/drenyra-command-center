# Feasibility Gate — Fiscal Scope Authority Port

**Last updated:** 2026-07-12  
**Change ID:** `drenyra-accountant-operating-system`  
**Task:** 1 — Hard feasibility and budget gate  
**Mode:** strict TDD precondition; no RED test or application implementation was started  
**Verdict:** **BLOCKED**

## Executive summary

Slice 1 cannot safely begin. The authenticated API composition can prove a Better Auth session actor and a selected company ID, but it cannot prove the complete server-side fiscal authority chain required by `FiscalScopeAuthorityPort`: active membership, organization-to-company ownership, membership/company RUC consistency, or the required `monthly-close:review` permission.

The only current membership resolver available to the API, `apps/api/src/shared/plugins/tenant-auth.ts`, explicitly synthesizes `organizationId` as `companyId`. The persisted `companies` table has no `organizationId` column or foreign key, and `auth_user_companies` has no membership status or per-membership permissions. The existing RBAC policy also does not define `monthly-close:review`. Implementing Slice 1 would therefore require invented authority fields, a header/client substitute, or a new authority foundation. Each is prohibited by this change.

**Implementation is blocked.** Create the narrowly scoped prerequisite change `establish-fiscal-scope-authority-port` for authoritative organization/company/membership/permission mapping and its tests before reopening Slice 1.

## Authority-proof matrix

| Required proof                                 | Result                                                              | Concrete evidence                                                                                                                                                                                                                                                                        | Severity |
| ---------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Authenticated actor                            | Partial                                                             | `resolveSessionContext()` calls Better Auth session resolution with `requireSession: true` when strict mode is selected; `resolveAuthenticatedCaller()` labels successful callers as `SESSION`.                                                                                          | P1       |
| No header fallback                             | Available for a new endpoint, but not at current monthly-close seam | `companyScopeGuard({ allowHeaderFallback: true })` is installed for all legacy monthly-close routes. With fallback, failed resolution returns undefined context and handlers continue. A new isolated strict module could avoid it, but this does not repair the missing authority data. | P0       |
| Active/non-revoked membership                  | Absent                                                              | `auth_user_companies` stores only user, company, role, and default flag. It has no status/revocation/expiry fields. `resolveUserMemberships()` cannot evaluate `isActiveMembership()`.                                                                                                   | P0       |
| Organization-to-company ownership              | Absent                                                              | `companies` in `packages/persistence/src/schema/core.schema.ts` has no `organizationId`; `tenant-auth.ts` sets `organizationId: r.companyId` with a comment that it is simplified.                                                                                                       | P0       |
| Company-to-RUC match                           | Partial, insufficient                                               | `listUserCompanyMemberships()` joins `auth_user_companies` to `companies` and can read RUC/country. It does not produce an organization proof, active membership state, or permission proof.                                                                                             | P0       |
| `monthly-close:review` permission              | Absent                                                              | The domain `Permission` union and `ROLE_PERMISSIONS`, plus API `SecurityOperation` and RBAC policy, do not define `monthly-close:review`. Existing authorization is role-based and not membership-permission-based.                                                                      | P0       |
| Valid calendar period                          | Partial                                                             | `createFiscalScope()` validates only the `YYYY-MM` shape, not calendar month range; `2026-00` and `2026-99` match. A stricter period validator is needed for the stated valid-calendar-period proof.                                                                                     | P1       |
| No client-authoritative organization/RUC/scope | Fails at legacy seam                                                | Existing monthly-close reads accept query/body `companyId`; `/gates/:id` accepts client `overrideById`. The API session can carry active company selection, but no authoritative organization/RUC mapping is injected into monthly-close routes.                                         | P0       |

## Exact authenticated API composition and injection path

```text
apps/api/src/app-core.ts
  -> monthlyCloseModule
  -> createMonthlyCloseModule(defaultRepo)
  -> createMonthlyCloseRoutes(repo)
  -> companyScopeGuard({ allowHeaderFallback: true })
  -> resolveSessionContext(... requireSession: false, allowHeaderFallback: true)
  -> resolveAuthenticatedCaller(...)
  -> Better Auth session identity OR header fallback
```

`MonthlyCloseController` receives only `CloseChecklistRepository`. It has no injected authenticated context, membership resolver, company authority reader, or permission evaluator. Current route handlers receive client `companyId` fields and call controller/repository methods directly.

`tenantAuth()` is not mounted at the monthly-close composition root. Even if it were, it is not an authority source for this task: `resolveUserMemberships()` maps each membership to `organizationId: companyId`, has no active status, and exposes only a role.

## `createFiscalScope()` assessment

`packages/domain/src/scope/types.ts#createFiscalScope()` is appropriate only after authoritative company data exists. It derives organization ID, RUC, and country from the supplied company and validates an 11-character digit-length RUC plus a format-only period. It does not fetch or validate an actor, membership, organization ownership, company/RUC relationship, permission, or calendar-valid month.

The domain contract already describes `AuthenticatedContext`, active membership, and permissions, but no API composition path constructs that contract from authoritative persisted data.

## Budget forecast

A safe Slice 1 implementation cannot meet its budget because the prerequisite authority foundation is absent. The forecast below is deliberately separated so the missing foundation is not hidden in a route implementation.

| Area                                                                                                                  | Forecast changed lines | Basis                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------: | ------------------------------------------------------------------------------------------------------------------------- |
| Authority foundation: organization/company relation, active membership state, and permission representation/migration |                180–260 | Current `companies` and `auth_user_companies` schemas lack required data; migration and schema/export work are necessary. |
| Authoritative membership/company query adapter and strict session-to-context composition                              |                130–170 | Must join session actor, membership, company RUC/country, organization ownership; must reject inactive/ambiguous records. |
| Permission policy (`monthly-close:review`) and authority tests                                                        |                100–140 | Neither domain nor API permission sets contain the permission; denial and cross-scope tests are required.                 |
| Slice 1 authority adapter, read route, projector, and focused API tests                                               |                300–390 | Tasks/design forecast after a usable authority port exists.                                                               |
| **Combined minimum for safe Slice 1**                                                                                 |            **710–960** | Exceeds the 400-line Slice 1 review budget.                                                                               |

Even a route-only estimate would be artificial because it would have to assume missing membership/organization/permission authority. The required follow-up must establish the authority port independently; it should not ship the monthly-close route.

## Narrow API test command (identified, not run)

```bash
bun --cwd apps/api run test:run -- src/features/monthly-close/__tests__/monthly-close-blocker-projection.test.ts
```

No such focused test exists yet. The only current monthly-close test is `apps/api/src/features/monthly-close/__tests__/integration/close-cycle.test.ts`, which is database-gated. Per strict TDD and this blocking gate, no RED test, implementation test, route, adapter, stub, or application code was written or executed.

## Required prerequisite scope

Create `establish-fiscal-scope-authority-port` limited to:

1. Persist and query an authoritative organization-to-company relationship.
2. Persist and query membership active/revoked/suspended/expired state and permission grants (including `monthly-close:review`), or document one authoritative role-to-permission derivation that is scoped to the membership.
3. Construct `AuthenticatedContext` from a verified Better Auth session and those persisted records; reject header fallback for this path.
4. Verify company ID, organization ID, company RUC, and membership RUC consistency before calling `createFiscalScope()`.
5. Add a calendar-valid period validator (month 01–12) and focused tests for each denial path.
6. Expose a testable server-side `FiscalScopeAuthorityPort` injection seam without adding monthly-close projection routes.

## Review findings

- **P0** — `apps/api/src/shared/plugins/tenant-auth.ts:136-141` synthesizes organization identity with `organizationId: r.companyId`; it is explicitly non-canonical and cannot prove organization-company ownership.
- **P0** — `packages/persistence/src/schema/core.schema.ts:94-122` defines `companies` without organization ownership, preventing a database proof of organization-to-company relationship.
- **P0** — `packages/persistence/src/schema/auth.schema.ts:128-156` lacks membership status and permissions, preventing active-membership and membership-scoped permission proof.
- **P0** — `packages/domain/src/scope/types.ts` and `apps/api/src/features/security/rbac-policy.ts` omit `monthly-close:review`; no existing permission evaluator can authorize the required action.
- **P0** — `apps/api/src/features/monthly-close/routes.ts:18` installs `companyScopeGuard({ allowHeaderFallback: true })`; `apps/api/src/shared/plugins/company-scope-guard.ts:128-143` permits missing context under that mode.
- **P1** — `packages/domain/src/scope/types.ts:100-102` validates period syntax only, not calendar month range.
- **P1** — `apps/api/src/features/monthly-close/routes.ts` and `controller.ts` use client-supplied company/actor-adjacent identifiers and expose unscoped-ID operations; they cannot serve as the new authority boundary.

## Residual risks

- The working tree contains unrelated changes; the feasibility artifact and state update must remain isolated from them.
- `listUserCompanyMemberships()` can join a company RUC but is unsuitable as an authority port until organization ownership and active membership semantics exist.
- Reusing `companyScopeGuard` or `tenantAuth` without correcting their data model would create a false proof of fiscal scope and risks cross-tenant/RUC disclosure.
