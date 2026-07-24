# OpenSpec Design — Accountant Operating System

**Last updated:** 2026-07-12  
**Change ID:** `drenyra-accountant-operating-system`  
**Phase:** design  
**Delivery constraint:** auto-forecast, 400-line review budget, strict TDD  
**Delivery mode:** Slice 1 is read-only and advisory-only; no fiscal mutation

## Decision

Slice 1 SHALL deliver only a **read-only, server-derived Monthly Close Blocker Projection**. It returns zero or one deterministic blocker for one authorized organization, company, RUC, and `YYYY-MM` period. It SHALL not expose approval or rejection actions in this slice.

This deliberately narrows the proposal/spec scope. The authoritative organization/company/RUC membership mapping has not been proven at the monthly-close seam; existing monthly-close reads accept unsafe client scope; the current trace store is an upsert store rather than a proven append-only audit record; and the existing approval guard is execution-adjacent. Shipping a read-only projection proves the safe query boundary without treating review records as fiscal authority.

## Architecture

```text
Authenticated request (intended company selection + period only)
  -> Monthly Close Blocker Projection Route
  -> FiscalScopeAuthorityPort.resolve(actor, intendedCompanyId, period)
       -> authenticated session context
       -> active membership + required read permission
       -> validated company ownership / organization / RUC
       -> createFiscalScope(validated company, period)
  -> ScopedCloseBlockerReader.load(scope.companyId, scope.period)
       -> company-and-period checklist/gate reads only
  -> DeterministicBlockerProjector.select(records)
       -> zero or one blocker, evidence/confidence/correction projection
  -> ApiSuccess<MonthlyCloseBlockerProjection> | ApiFailure
```

The route is a new review-specific read endpoint inside `createMonthlyCloseRoutes()` under `/api/v1/close`. Existing `/dashboard`, `/gates`, and `/checklists` handlers are not reused as the authorization boundary because their client-supplied `companyId` inputs and `allowHeaderFallback: true` path do not meet the invariant.

No dependency from this slice may reference `evaluateApprovalApplyGuard()`, `buildDeterministicHandoff()`, a queue, close update port, period lock, journal writer, export, or SUNAT/OSE/SIRE client.

## Ports and contracts

### `FiscalScopeAuthorityPort` (hard safety boundary)

The application route depends on a port with a contract equivalent to:

```ts
interface FiscalScopeAuthorityPort {
  resolve(input: {
    actorId: ActorId
    intendedCompanyId: CompanyId
    period: string
    requiredPermission: 'monthly-close:review'
  }): Promise<FiscalScopeAuthorityResult>
}
```

Its sole successful result contains a `FiscalScope` constructed through `createFiscalScope()` after it proves all of: authenticated actor, active/non-revoked membership, organization-to-company ownership, company-to-RUC match, required permission, and valid period. It accepts no client organization ID, RUC, tenant ID, reviewer identity, or scope override.

**Hard prerequisite / fail-closed rule:** if an implementation cannot concretely wire this port to an authoritative server-side organization/membership/company source within the 400-line budget, Slice 1 SHALL NOT add the route, an adapter that invents membership fields, header fallback, or a client-authorized substitute. The change must stop before implementation with `FiscalScopeAuthorityPort` unresolved and retain the current behavior. A follow-up must first establish the authoritative mapping and its tests as a separately budgeted slice.

### `ScopedCloseBlockerReader`

```ts
interface ScopedCloseBlockerReader {
  load(input: {
    companyId: CompanyId
    period: FiscalPeriod
  }): Promise<CloseBlockerSource[]>
}
```

The adapter may call only existing repository methods constrained by the derived company ID and period. It must not use bare checklist/gate IDs or issue a read before `FiscalScopeAuthorityPort` succeeds. Organization and RUC are proven at the authority port and carried in the projection; they are not invented in the repository adapter.

### `MonthlyCloseBlockerProjector`

A pure deterministic function transforms scoped source records into `MonthlyCloseBlockerProjection | null`. A non-null projection contains the complete resolved fiscal scope, source record type/ID, source evidence references and redaction states, named confidence signals, non-actionable advisory lifecycle `projected`, and a non-mutating correction instruction/reference. It has no approval affordance and no mutation command.

The initial projection must not claim durable append-only audit lineage. It may show source evidence identifiers only when scoped and eligible. Trace storage is not a dependency for creating a fiscal audit record in Slice 1.

## Deterministic blocker ordering

The projector SHALL filter candidates to unresolved records only, then apply this stable total order:

1. source severity in persisted enum order: `blocked` before `overdue` before `open`;
2. persisted due date ascending, with an absent date sorted after a present date;
3. persisted source record type order: `gate` before `checklist-item`;
4. immutable source record ID ascending as the mandatory final tie-breaker.

The implementation must map actual persisted states to these categories explicitly and reject/skip unknown states rather than guess. It must never use current time, locale, iteration/insertion order, a client rank, randomization, or an LLM. If zero unresolved candidates remain, return a successful projection with `blocker: null`.

## Data flow and safety gates

1. Parse only `intendedCompanyId` and `period` at the request boundary; reject malformed input.
2. Require authenticated server context. Header fallback and absent company context are denials for this endpoint.
3. Resolve the authoritative `FiscalScope` through `FiscalScopeAuthorityPort`; on any ambiguity or failed proof, terminate before all reader/evidence calls.
4. Read candidates only with `scope.companyId` and `scope.period`.
5. Select at most one candidate using the documented total order.
6. Construct the projection from the resolved scope and selected source. Verify required evidence is present, belongs to the scope, and exposes required redaction state.
7. Derive deterministic named confidence signals: `evidenceComplete`, `evidenceRedacted`, `scopeVerified`, and `sourceUnresolved`. Any false signal makes the result non-actionable with `blocked` or `request-more-context`; it never raises authority.
8. Return the projection. Do not persist, transition state, invoke approval logic, or call a mutation-capable port.

## Error mapping

The route uses the existing `ApiSuccess<T>` / `ApiFailure` envelope from `apps/api/src/features/shared/api-response.ts`. Exact numeric HTTP statuses and shared code names must reuse verified API conventions during implementation; this design does not introduce unverified public codes.

| Condition                                                               | Transport result                         | Disclosure rule                                                   |
| ----------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| malformed intended company or period                                    | `ApiFailure`                             | no scope/source/evidence details                                  |
| unauthenticated, no strict server context, permission/membership denial | `ApiFailure`                             | indistinguishable denial; no foreign scope leakage                |
| organization/company/RUC proof mismatch or ambiguous authority mapping  | `ApiFailure`                             | no candidate, evidence, audit, or foreign identifier              |
| authority-port integration unavailable                                  | route not shipped                        | fail closed before implementation                                 |
| reader failure                                                          | existing internal failure envelope       | log according to API conventions; do not return scoped internals  |
| no unresolved candidate                                                 | `ApiSuccess({ blocker: null })`          | resolved scope only when caller was authorized                    |
| missing/ineligible evidence or failed confidence                        | `ApiSuccess` with non-actionable blocker | disclose only safe reason category and eligible scoped references |

## Strict-TDD test plan

Tests are required before implementation in RED → minimal GREEN → refactor order:

1. **RED authority:** absent authentication/context, header fallback, invalid period, foreign company, inactive membership, organization/RUC mismatch, and missing permission cause `ApiFailure`; reader is never called. **GREEN:** concrete authoritative `FiscalScopeAuthorityPort` adapter.
2. **RED scoped reader:** only derived company/period reach the reader; no bare-ID repository method is callable. **GREEN:** minimal reader adapter.
3. **RED ordering:** repeat equal-priority fixtures and prove the immutable-ID tie-breaker, exclusion of resolved records, and at-most-one output. **GREEN:** pure projector.
4. **RED evidence/confidence:** missing, unredacted, or mismatched evidence and each failed signal produce non-actionable results. **GREEN:** projection gates.
5. **RED no-mutation:** all success/failure/no-blocker paths prove zero calls to approval guard, handoff, queue, close update, period lock, journal, export, and SUNAT/OSE/SIRE fakes. **GREEN:** remove accidental dependencies.
6. **REFACTOR:** only after all prior tests pass; retain the narrow API suite and relevant typecheck evidence.

Each fixture uses distinct organization/company/RUC data, and assertions prove no cross-RUC data is returned.

## Forecast and implementation stop gate

| File / area                                                                              | Planned change                                                   |    Forecast |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------: |
| `apps/api/src/features/monthly-close/fiscal-scope-authority.ts`                          | concrete authority adapter, only if authoritative mapping exists |      70–100 |
| `apps/api/src/features/monthly-close/monthly-close-blocker-projection.ts`                | ports, pure ordering/projector, safe projection types            |     100–130 |
| `apps/api/src/features/monthly-close/routes.ts`                                          | one strict read route and dependency wiring                      |       35–55 |
| `apps/api/src/features/monthly-close/__tests__/monthly-close-blocker-projection.test.ts` | authority, ordering, evidence, isolation/no-mutation tests       |     120–150 |
| **Total**                                                                                | **Slice 1**                                                      | **325–435** |

The forecast is above the 400-line budget at its upper bound. Before code is written, measure the authoritative adapter and test fixture cost. If the concrete implementation forecast exceeds 400 changed lines, split immediately: first establish and test `FiscalScopeAuthorityPort` in a dedicated prerequisite change; then implement the read-only projection. No UI, approval/rejection action, trace persistence, or audit writer may be pulled into Slice 1 to avoid the split.

## Deferred slices

- **Slice 2:** review actions only after a durable append-only audit writer with explicit failure semantics is selected, tested, and independently budgeted.
- **Slice 3:** web rendering of the read-only projection, using server-returned scope only and language that does not imply execution.
- **Slice 4:** correction workflow only after its non-mutating versus mutation boundary and audit lineage are designed.
- **Excluded until separately designed:** approval execution, period lock, journal posting, checklist/gate mutation, queues, exports, external accounting integrations, SUNAT/OSE/SIRE submission, LLM ranking, chat, and cross-company/period views.

## Non-goals

This design does not modify existing legacy monthly-close routes, redefine their authorization model, make the trace store append-only, add database schema, create audit events, add approvals/rejections, or implement any application code. It does not establish an authoritative membership mapping by assumption.

## Review findings and residual risks

| Severity | Finding                                                                                                        | Consequence                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| P0       | No verified authoritative organization/company/RUC membership mapping is identified at the monthly-close seam. | `FiscalScopeAuthorityPort` is a hard prerequisite; no route may ship without a concrete source. |
| P0       | Existing legacy reads accept client `companyId` and permit header fallback.                                    | They cannot authorize or back the new route.                                                    |
| P1       | Trace evidence store updates bundles and lacks proven append-only durability.                                  | Slice 1 remains read-only and creates no fiscal audit claim.                                    |
| P1       | Approval guard can lead toward deterministic handoff.                                                          | It is prohibited, as are all review actions, in Slice 1.                                        |
| P1       | Upper-bound line forecast exceeds 400.                                                                         | Measure first; split at the authority prerequisite if needed.                                   |

## Next recommended phase

Proceed to **tasks**. The task plan must begin with the authority-port feasibility/line-budget gate and explicitly stop implementation if it cannot be concretely satisfied.
