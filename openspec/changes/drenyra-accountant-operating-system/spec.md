# OpenSpec Delta Specification — Monthly Close Blocker Review

**Last updated:** 2026-07-12
**Change ID:** `drenyra-accountant-operating-system`
**Phase:** spec
**Delivery constraint:** auto-forecast, 400-line review budget, strict TDD
**Delivery mode:** advisory-only; no fiscal mutation

## Executive summary

This delta specifies one server-scoped, advisory-only review within the existing monthly-close API module. It produces at most one deterministic blocker for one authorized company and fiscal period, preserves evidence and correction lineage, and records review decisions without performing fiscal work.

The verified current API seam is `apps/api/src/features/monthly-close/routes.ts`, created by `createMonthlyCloseRoutes()` under `/api/v1/close`. Its current success/failure envelope is `ok(data)` / `fail(error, code?)` from `apps/api/src/features/shared/api-response.ts`. No existing monthly-close route is safe for this workflow: every existing read accepts `companyId` from query parameters, and the module uses `companyScopeGuard({ allowHeaderFallback: true })`, which can proceed without `companyContext`. The implementation must add the bounded review boundary inside this module; it must not reinterpret `/dashboard`, `/gates`, or `/checklists` as server-derived review operations.

## Verified seams and constraints

| Severity | Finding                                                                                                                                                                 | Evidence                                                                                                                                         | Required consequence                                                                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Existing monthly-close reads take a client-supplied `companyId`; `getChecklist`, item, gate override, and update calls can operate by bare IDs.                         | `apps/api/src/features/monthly-close/routes.ts`, `controller.ts`, `packages/domain/src/repositories/close-checklist.repository.ts`               | The new review boundary must not delegate to these operations using client authority or bare IDs.                                                                                                                     |
| P0       | `companyScopeGuard({ allowHeaderFallback: true })` may inject an undefined context and continue.                                                                        | `apps/api/src/shared/plugins/company-scope-guard.ts:93-143`                                                                                      | The new review boundary must require an authenticated server context and fail closed when it is unavailable; it cannot use the migration fallback.                                                                    |
| P0       | `createFiscalScope()` derives organization, RUC, and country from a validated company and validates `YYYY-MM`, but it does not itself resolve membership or permission. | `packages/domain/src/scope/types.ts:75-103`                                                                                                      | A server resolver must first verify active membership, matching organization/company/RUC, and required permission, then call `createFiscalScope()`.                                                                   |
| P0       | The close repository scopes list/gate reads by company and period only; ID methods are unscoped.                                                                        | `packages/domain/src/repositories/close-checklist.repository.ts`; `packages/persistence/src/repositories/postgres-close-checklist.repository.ts` | The blocker adapter may use only company-and-period reads after full fiscal scope resolution; no unscoped ID method is permitted.                                                                                     |
| P1       | Control-plane trace scope has tenant/organization/company/RUC but no period. Its trace store updates a whole bundle rather than appending immutable events.             | `packages/ai/src/control-plane/contracts.ts`; `packages/ai/src/control-plane/trace-evidence/types.ts`; `store.ts`                                | The review projection must carry the resolved period separately and retain original evidence/correction references. The current trace store is not sufficient by itself to prove append-only fiscal audit durability. |
| P1       | The approval guard authorizes an approved item for a deterministic handoff.                                                                                             | `packages/ai/src/control-plane/approval-guard.ts`                                                                                                | This slice must not call `evaluateApprovalApplyGuard()` or `buildDeterministicHandoff()`; approval is a review record only.                                                                                           |

## Delta requirements

### Requirement: server-derived fiscal scope

The review boundary SHALL accept only the intended company selection and `YYYY-MM` period as client selection inputs. Organization ID, RUC, tenant identifier, and authoritative company identity SHALL be resolved on the server from authenticated context, active membership, and the validated company record.

The boundary SHALL build the sole authoritative `FiscalScope` through `createFiscalScope()` only after verifying that the authenticated actor has an active membership for the resolved organization and company and holds the permission required for the requested review action. It SHALL not use client-supplied organization, RUC, tenant, actor, reviewer, or override identity as authorization or persisted scope.

The scope resolver SHALL reject missing authentication, missing server company context, inactive/revoked/suspended/expired membership, organization mismatch, company mismatch, RUC mismatch, invalid period, and insufficient permission before querying checklist, gate, evidence, audit, or recommendation data.

#### Scenario: authorized scope is derived on the server

- **GIVEN** an authenticated actor with an active membership for a validated company and review permission
- **WHEN** the actor requests a review for that company and a valid `YYYY-MM` period
- **THEN** the resulting projection contains organization, company, RUC, country, and period derived through `createFiscalScope()`
- **AND THEN** the repository adapter receives only the derived company ID and period
- **AND THEN** no client-supplied organization or RUC is persisted as authoritative scope.

#### Scenario: invalid or foreign scope fails closed without leakage

- **GIVEN** a request with absent authentication, unavailable server context, invalid period, inactive membership, foreign company, organization mismatch, or RUC mismatch
- **WHEN** the actor requests a review
- **THEN** the existing `ApiFailure` envelope is returned with no recommendation, evidence, checklist, audit, or foreign scope in `details`
- **AND THEN** no close repository, trace lookup, approval guard, handoff, queue, or mutation dependency is invoked.

### Requirement: deterministic single blocker selection

For a resolved fiscal scope, the blocker adapter SHALL read only checklist and gate records constrained by the derived company ID and period. It SHALL select zero or one blocker without an LLM, clock-dependent ordering, randomization, or client-provided rank.

The implementation SHALL define and test one stable total ordering before coding. The order SHALL use only persisted blocker attributes and a final immutable record-ID tie-breaker. If no unresolved candidate exists, the response SHALL be a successful advisory result with no blocker; it SHALL not synthesize a blocker or treat a completed/waived/passed record as one.

The selected blocker SHALL identify its source record type and ID, the resolved fiscal scope, source evidence references, confidence signals, advisory lifecycle state, and correction reference. It SHALL not expose a source record from another resolved company or period.

#### Scenario: stable candidate selection selects exactly one blocker

- **GIVEN** two or more unresolved scoped gate/checklist candidates with equal primary priority
- **WHEN** the review is requested repeatedly against unchanged data
- **THEN** each result identifies the same one source record according to the documented immutable-ID tie-breaker
- **AND THEN** exactly one blocker is returned.

#### Scenario: no unresolved candidate produces no actionable blocker

- **GIVEN** the resolved company and period contain only passed, completed, or waived gate/checklist records, or no records
- **WHEN** the review is requested
- **THEN** the success envelope contains no blocker
- **AND THEN** no approval state transition, audit decision event, or mutation is created.

### Requirement: evidence and confidence fail closed

A blocker SHALL be actionable only when every required source/evidence reference is available within the resolved scope, carries its redaction state, and meets fiscal-document redaction requirements. An unavailable, inaccessible, unredacted fiscal-document, or scope-mismatched reference SHALL make the blocker non-actionable.

Confidence SHALL be deterministic and explainable from named signals derived from the scoped records and evidence. It SHALL not be a model score. The documented confidence threshold SHALL be evaluated before an approval request is accepted.

When evidence is incomplete or confidence does not meet the threshold, the success projection SHALL expose a non-actionable blocked or request-more-context outcome. It SHALL not expose an approval action, invoke an approval guard or handoff, enqueue work, or mutate close/fiscal state.

#### Scenario: incomplete evidence blocks actionability

- **GIVEN** the deterministically selected blocker lacks a required source/evidence reference or has a fiscal-document reference without redaction
- **WHEN** the review is requested
- **THEN** the result is non-actionable and identifies the missing/ineligible evidence condition without disclosing inaccessible evidence
- **AND THEN** an approval request is rejected without a review transition or fiscal mutation.

#### Scenario: insufficient confidence requests more context

- **GIVEN** evidence is scoped and redacted but one documented deterministic confidence signal fails
- **WHEN** the actor requests review or approval
- **THEN** the result is blocked or request-more-context
- **AND THEN** it does not grant authority, invoke execution, or alter a checklist, gate, period, journal, or SUNAT/SIRE record.

### Requirement: advisory review transitions and audit

The review lifecycle SHALL be limited to advisory transitions: creation/projection, approval request, and rejection. A rejection SHALL require a reason. Each accepted transition SHALL record actor ID, timestamp, prior state, new state, resolved fiscal scope including period, source/evidence references, confidence outcome, and correction reference.

The approval action SHALL record a review decision only. It SHALL preserve `authoritativeMutationAllowed: false` where existing control-plane contracts are used and SHALL not use `requestedAction: "apply-deterministic-command"`, `evaluateApprovalApplyGuard()`, or `buildDeterministicHandoff()`.

The current `TraceEvidenceStore` may be used only after implementation proves its required storage semantics for this use. Its upsert behavior does not satisfy this specification's append-only audit proof by itself; the implementation must select or introduce an append-only audit boundary within the line budget, or defer the review-action endpoint and ship only the read projection.

#### Scenario: authorized approval request records no execution

- **GIVEN** an authorized actor, an actionable scoped blocker, complete evidence, and sufficient confidence
- **WHEN** the actor requests approval
- **THEN** the advisory lifecycle and audit projection record the actor, timestamp, prior/current state, scope, evidence, confidence, and correction reference
- **AND THEN** no apply handoff, queue, period lock, journal posting, checklist/gate update, fiscal record mutation, SUNAT/OSE/SIRE call, or export occurs.

#### Scenario: authorized rejection preserves audit reason

- **GIVEN** an authorized actor reviewing a scoped advisory blocker
- **WHEN** the actor rejects it with a non-empty reason
- **THEN** the lifecycle becomes rejected and the audit record includes that reason and the unchanged scope/evidence/correction lineage
- **AND THEN** no fiscal state changes.

### Requirement: correction reference preserves the original decision basis

Every blocker projection and review transition SHALL contain a non-mutating correction reference. The reference may point to an instruction or a linked checklist resolution, but it SHALL not overwrite, delete, replace, or re-rank the original blocker, source record, or evidence references.

#### Scenario: correction preserves original lineage

- **GIVEN** a blocker with source evidence and a correction reference
- **WHEN** a correction is displayed, requested, or recorded during review
- **THEN** the original blocker source and source/evidence reference set remain available in the resulting projection and audit record
- **AND THEN** no checklist, gate, evidence, close period, journal, or external fiscal record is mutated.

### Requirement: no-mutation proof

The review query and both review actions SHALL be dependency-isolated from fiscal execution. Tests SHALL spy on or fake all mutation-capable ports exposed to the slice and prove zero calls to checklist/gate updates, period lock operations, journal posting, apply handoffs, job enqueueing, exports, and SUNAT/OSE/SIRE submission.

The implementation SHALL not reuse the existing monthly-close `PATCH /checklists`, `PATCH /items`, or `PATCH /gates/:id` handlers for a review transition. The route's response boundary SHALL remain the verified `ApiSuccess<T>` / `ApiFailure` envelope; a domain denial must not be converted to an accidental `500` response.

#### Scenario: every review path proves no mutation

- **GIVEN** valid approval, rejection, evidence-failure, confidence-failure, scope-failure, and no-blocker fixtures
- **WHEN** each query or action is exercised
- **THEN** all mutation-capable port spies have zero calls
- **AND THEN** the response uses `ApiSuccess<T>` only for a valid projection/outcome and `ApiFailure` for denied/invalid requests, without leaking scoped data.

## Strict TDD evidence plan

Implementation SHALL proceed in this order, retaining the RED-to-GREEN commit/test evidence for each step:

1. RED: server scope resolution rejects header fallback, foreign/inactive membership, client RUC/organization authority, and invalid period; GREEN: minimal resolver using validated company plus `createFiscalScope()`.
2. RED: deterministic blocker selection has stable tie behavior, excludes resolved records, and never reads by bare ID; GREEN: scoped adapter with documented total order.
3. RED: missing evidence and failed deterministic confidence block actionability; GREEN: minimal projection gate.
4. RED: approval/rejection append review audit data and preserve correction/evidence lineage; GREEN: non-executing transition boundary.
5. RED: all query/action variants invoke zero mutation ports; GREEN: remove any accidental execution dependency.
6. REFACTOR only after every prior test is GREEN; rerun the narrow monthly-close suite and affected package typecheck.

## Response and outcome boundaries

- **Verified transport envelope:** `ApiSuccess<T>` is `{ success: true, data: T }`; `ApiFailure` is `{ success: false, error, code?, runbook?, field?, details? }` in `apps/api/src/features/shared/api-response.ts`.
- **Verified current module prefix:** `/api/v1/close` in `apps/api/src/features/monthly-close/routes.ts`.
- **New bounded seam:** a review-specific route/action within `createMonthlyCloseRoutes()`; existing client-scoped routes are explicitly excluded from reuse as the review boundary.
- **Success outcomes:** no blocker; one non-actionable blocked/request-more-context blocker; one actionable advisory blocker; recorded advisory approval request; recorded advisory rejection.
- **Failure outcomes:** authentication/scope/permission/period denial; missing or mismatched review target; invalid action input. Failures return `ApiFailure` and disclose no foreign scoped data. Exact HTTP status and error code mapping require design confirmation against API security conventions; this specification does not invent currently absent codes.

## Out of scope

No UI work, schema migration, client-side scope construction, generic agent pipeline, LLM selection/scoring, automatic approval, fiscal execution, period lock, journal posting, close checklist/gate mutation, export, queue, or SUNAT/OSE/SIRE integration is permitted in this change.

## Risks and required design decisions

1. **P0 — Current monthly-close seam is unsafe as-is.** It has client `companyId` inputs and migration fallback. Design must select a strict session/company resolver before implementation.
2. **P0 — Repository is not scope-first.** The first PR may require a bounded adapter/port rather than widening the repository; an unscoped-ID refactor exceeds this slice.
3. **P0 — No proven append-only audit writer at the selected seam.** The trace store is an upsert cache/store and PostgreSQL persistence is fire-and-forget. Do not claim fiscal audit durability without a selected durable append-only boundary.
4. **P1 — Approval guard has execution-adjacent semantics.** It is prohibited from this slice; accidental reuse defeats the advisory-only guarantee.
5. **P1 — 400-line budget.** If strict server scope, adapter, audit boundary, and tests exceed the budget, split after the read-only blocker projection; defer review actions and UI.

## Next recommended phase

Proceed to **design**. Resolve the strict authenticated company/membership adapter, choose a durable append-only audit writer or split to read-only projection, document deterministic blocker ordering, and map exact transport statuses/codes without widening existing client-scoped routes.
