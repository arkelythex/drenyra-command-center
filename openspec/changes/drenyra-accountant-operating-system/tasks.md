# OpenSpec Tasks — Accountant Operating System

**Last updated:** 2026-07-12  
**Change ID:** `drenyra-accountant-operating-system`  
**Phase:** tasks  
**Delivery constraint:** auto-forecast, 400-line review budget, strict TDD  
**Implementation boundary:** Slice 1 only — read-only, server-derived Monthly Close Blocker Projection

## Executive summary

This plan authorizes no application-code implementation until the first feasibility gate proves that a concrete, authoritative `FiscalScopeAuthorityPort` can resolve authenticated actor, active membership, organization, company, RUC, permission, and period without client authority or header fallback. If that proof cannot be made and measured within the 400-line budget, stop: do not ship a route, adapter, or substitute. Create a separately budgeted prerequisite change for the authority mapping.

Slice 1 returns zero or one deterministic, read-only blocker projection. It excludes web UI, approval/rejection, audit or trace persistence, correction writes, and every fiscal or close mutation path.

## Source boundaries

### Permitted implementation boundary (only after Gate 1 passes)

- `apps/api/src/features/monthly-close/fiscal-scope-authority.ts` — strict authority adapter, if an existing authoritative server source can be wired safely.
- `apps/api/src/features/monthly-close/monthly-close-blocker-projection.ts` — read-only ports, pure ordering/projector, and projection types.
- `apps/api/src/features/monthly-close/routes.ts` — one new strict read endpoint inside `createMonthlyCloseRoutes()`.
- `apps/api/src/features/monthly-close/__tests__/monthly-close-blocker-projection.test.ts` — focused route/authority/projector tests, or the existing colocated monthly-close test location if verified during Gate 1.

### Explicitly prohibited

- `apps/web/**` and all web UI work.
- Approval/rejection endpoints, lifecycle writes, audit events, trace persistence, or correction persistence.
- `packages/ai/src/control-plane/approval-guard.ts`, `evaluateApprovalApplyGuard()`, `buildDeterministicHandoff()`, queues, exports, or execution paths.
- Checklist/gate update ports, period locks, journal writers, SUNAT/OSE/SIRE clients, schema migrations, and client-authorized scope fields.
- Existing legacy `/dashboard`, `/gates`, and `/checklists` routes as the authorization boundary.

## Task 1 — Hard feasibility and budget gate (BLOCKING)

**Objective:** Prove, before any implementation work, whether `FiscalScopeAuthorityPort` can be concretely wired to an existing authoritative server-side source.

1. Inspect the authenticated request/session context, membership source, company source, permission convention, and `createFiscalScope()` contract at:
   - `apps/api/src/features/monthly-close/routes.ts`
   - `apps/api/src/shared/plugins/company-scope-guard.ts`
   - `packages/domain/src/scope/types.ts`
   - the concrete server-side membership/company adapters reached by the existing authenticated API composition root.
2. Identify exact code-level proof that one adapter can verify, in this order, authenticated actor; active/non-revoked membership; organization-to-company ownership; company-to-RUC match; `monthly-close:review` permission; and valid `YYYY-MM` period.
3. Confirm the proposed endpoint receives only `intendedCompanyId` and `period`; it must not accept organization ID, RUC, tenant ID, actor/reviewer identity, or scope override. Confirm it rejects missing strict context and never uses `allowHeaderFallback: true`.
4. Measure the concrete adapter, route wiring, pure projector, and focused test changes from the verified seams. Record a line forecast based on actual target test conventions, not the design estimate.

**Pass condition:** An existing authoritative source and dependency injection path are identified, the adapter can be tested without invented membership data, and the measured total is **<=400 changed lines**.

**Fail condition (mandatory stop):** If any authority proof, safe wiring, test seam, or <=400-line forecast is absent, do not implement Slice 1. Record the failing seam and measured forecast; create a follow-up prerequisite proposal named `establish-fiscal-scope-authority-port` (or equivalent) limited to authoritative mapping and tests. Leave current routes unchanged.

**Evidence:** a feasibility note in the implementation PR/phase receipt naming authoritative source paths, injection path, authority checks, prohibited fallback verification, and measured forecast.

## Task 2 — RED: authority denial and isolation tests (only if Gate 1 passes)

1. Add focused failing tests for the new route/authority boundary using distinct organization/company/RUC fixtures per case.
2. Assert `ApiFailure` with no scope, candidate, evidence, or foreign identifiers in details for: absent authentication, absent strict server context, header fallback attempt, invalid period, inactive/revoked membership, foreign company, organization mismatch, RUC mismatch, and missing `monthly-close:review` permission.
3. Spy on `ScopedCloseBlockerReader` and assert zero calls for every denial.
4. Run the focused test file and retain the failing assertions as RED evidence.

**GREEN:** Add only the concrete `FiscalScopeAuthorityPort` adapter proven by Gate 1. It must construct `FiscalScope` through `createFiscalScope()` after all authority checks succeed and expose no client-derived organization/RUC authority. Rerun the focused suite until green.

## Task 3 — RED: scoped reads and deterministic projection (only if Gate 1 passes)

1. Add failing pure/projector tests that prove the reader receives only the resolved `scope.companyId` and `scope.period`, and no bare-ID repository method is reachable.
2. Add fixtures proving unresolved candidates are ordered by persisted severity (`blocked`, `overdue`, `open`), due date ascending with absent dates last, source type (`gate`, `checklist-item`), then immutable ID ascending.
3. Add repeated equal-priority assertions that return exactly the same single blocker; add passed/completed/waived/no-record fixtures that return `blocker: null`.
4. Run the focused suite and retain RED evidence.

**GREEN:** Implement the minimal read-only `ScopedCloseBlockerReader` and pure `MonthlyCloseBlockerProjector`. Map actual persisted states explicitly; skip/reject unknown states rather than guessing. Do not read before authority succeeds. Rerun focused tests to green.

## Task 4 — RED: evidence, confidence, and no-mutation proof (only if Gate 1 passes)

1. Add failing tests for missing, scope-mismatched, inaccessible, and unredacted fiscal-document evidence; each must yield only a safe non-actionable `blocked` or `request-more-context` projection.
2. Add failing tests for each deterministic confidence signal: `evidenceComplete`, `evidenceRedacted`, `scopeVerified`, and `sourceUnresolved`. Assert a false signal never raises actionability.
3. For authority denial, no-blocker, actionable projection, blocked projection, and request-more-context projection, inject spies/fakes for approval guard, deterministic handoff, queue, checklist/gate updates, period lock, journal writer, export, and SUNAT/OSE/SIRE clients. Assert zero calls in every case.
4. Run the focused suite and retain RED evidence.

**GREEN:** Implement minimal projection gates and the strict read route. Return the existing `ApiSuccess<T>` / `ApiFailure` envelopes and reuse only verified status/code conventions. Do not add persistence, transitions, or mutation-capable dependencies. Rerun focused tests to green.

## Task 5 — REFACTOR and verification (only if all GREEN steps pass)

1. Refactor only duplicated fixture/setup or pure projector code; preserve port boundaries, fail-closed outcomes, immutable-ID ordering, and zero-mutation assertions.
2. Rerun the focused monthly-close blocker suite.
3. Run the narrowest affected API typecheck/test command verified from package scripts. Run repository-wide checks only if the narrow checks require them.
4. Recalculate changed lines using the implementation diff. If it exceeds 400 lines at any point, revert/defer the excess before review; do not expand scope.

**Exit evidence:** RED/GREEN command output for Tasks 2–4, focused suite green after refactor, typecheck result, changed-line count <=400, and an explicit statement that no prohibited file/path was changed.

## Review Workload Forecast

| Area                               | Estimated changed lines | Review focus                                                                              |
| ---------------------------------- | ----------------------: | ----------------------------------------------------------------------------------------- |
| Authority adapter and wiring       |                   70–95 | authoritative membership/company/RUC proof; no fallback or client authority               |
| Read-only projector and ports      |                  85–110 | scoped-only reader, stable total order, safe evidence/confidence projection               |
| Strict route                       |                   30–45 | input allowlist, API envelope, fail-closed denial                                         |
| Focused tests                      |                 115–140 | RUC isolation, authority denials, deterministic selection, evidence gates, zero mutations |
| **Total after Gate 1 measurement** |             **300–390** | **within 400-line budget only if proven**                                                 |

**Strategy:** `auto-forecast`. The feasibility gate owns the budget decision. A forecast above 400 lines, or an authority seam that requires new membership infrastructure, forces the prerequisite split; it is not a justification to widen this slice.

## Risks and stop conditions

| Severity | Risk / finding                                                                                | Required control                                                                                |
| -------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| P0       | No proven authoritative organization/company/RUC membership source at the monthly-close seam. | Stop at Gate 1 and create the authority prerequisite; do not add a substitute adapter or route. |
| P0       | Legacy monthly-close handlers accept client `companyId` and allow header fallback.            | Do not reuse them as an authorization boundary.                                                 |
| P0       | Unscoped close repository ID methods can leak cross-company data.                             | Use only derived company-and-period reads after authority resolution.                           |
| P1       | Trace storage is upsert/asynchronous rather than proven append-only audit durability.         | Keep Slice 1 read-only; add no trace/audit persistence.                                         |
| P1       | Approval guard is execution-adjacent.                                                         | Do not import or invoke it; no approval/rejection path exists in Slice 1.                       |
| P1       | Measured implementation can exceed the review budget.                                         | Enforce <=400 lines; split before implementation rather than adding UI or actions.              |

## Deferred follow-ups

- Establish `FiscalScopeAuthorityPort` as a separately budgeted prerequisite if Gate 1 fails.
- Add advisory review actions only after a durable append-only audit boundary is designed, proven, and independently budgeted.
- Add web rendering only in a separately budgeted Slice 3 that consumes server-returned scope and does not imply execution.
