# OpenSpec Proposal — Accountant Operating System

**Last updated:** 2026-07-12  
**Change ID:** `drenyra-accountant-operating-system`  
**Phase:** proposal  
**Delivery constraint:** auto-forecast, 400-line review budget, strict TDD  
**Delivery mode:** advisory-only; no fiscal mutation

## Purpose

Deliver one bounded, accountant-readable decision workflow: **Monthly Close Blocker Review**. For exactly one server-resolved organization, company, RUC, and `YYYY-MM` fiscal period, it presents at most one deterministic monthly-close blocker with traceable evidence, explainable confidence, a review decision, and an audit record.

This first slice proves the fiscal-control model before broader accountant-agent capabilities. It is not a chatbot, autonomous agent, or close-execution workflow.

## Current-state gap

Drenyra has validated fiscal scope, monthly-close checklist/gate models, agent-control contracts, approval guards, trace evidence, and append-only audit patterns. It does not yet bind them into one accountant-facing, period-scoped advisory decision. Their scope shapes differ: the close repository exposes company and period while trace/control contracts carry tenant/company/RUC without mandatory period.

Without a typed server-side boundary, a client surface could join records from mismatched scope or represent approval as authorization to execute fiscal work.

## Scope

### Included

- A server-scoped vertical slice for one selected fiscal period.
- A typed application command/query boundary that derives and validates `FiscalScope` from the authenticated actor and authorized company context.
- Deterministic retrieval and prioritization of at most one monthly-close blocker from scoped checklist/gate state; no LLM computes, ranks, or validates the blocker.
- An advisory recommendation projection containing complete fiscal scope, source/evidence references, redaction status, explainable confidence signals, lifecycle state, correction reference, and audit lineage.
- Accountant review actions: request approval or reject with a reason, subject to server authorization and required evidence/confidence checks.
- A narrowly scoped existing monthly-close API and web projection/extension only if the contract and tests remain within the 400-line budget.
- Strict TDD evidence for each policy branch: RED test, minimal GREEN implementation, and refactor only after passing tests.

### Non-goals

- Fiscal execution of any kind: no period lock, journal posting, invoice mutation, close-state mutation, SUNAT/OSE/SIRE submission, export, or external accounting integration.
- Automatic approval, approval-triggered jobs, or deterministic apply handoff.
- Natural-language intent classification, free-form chat, LLM-generated confidence, or generalized agent workflow infrastructure.
- Multi-period, cross-company, cross-RUC, or portfolio aggregation.
- Replacing existing scope, trace, approval, or monthly-close infrastructure.

## Exact safety invariants

1. **Server-derived scope only.** The client may identify an intended company/period selection, but the server must resolve organization, company, and RUC from authenticated membership and authorized company records. Client-supplied organization ID, RUC, or tenant identifiers must never be trusted as authorization or persisted as authoritative scope.
2. **Exact scope match.** Every read and projected evidence reference must match one resolved organization, company, RUC, and `YYYY-MM` period. Missing, ambiguous, or mismatched scope fails closed without returning an actionable recommendation.
3. **Advisory isolation.** The slice has no dependency path to a fiscal mutation command, period-lock operation, journal posting, SUNAT/OSE/SIRE submission, export, or execution queue.
4. **Approval is non-executing.** Approval records only a human review decision. It must not set `authoritativeMutationAllowed`, invoke an apply handoff, enqueue work, change fiscal records, or imply fiscal execution authorization.
5. **Evidence before actionability.** A recommendation cannot be actionable unless its scoped source/evidence references exist, retain redaction state, and are sufficient to explain the blocker. Missing or inaccessible evidence yields a blocked/non-actionable outcome.
6. **Deterministic confidence.** Confidence consists only of named, reproducible signals (for example evidence completeness, data currency, and unresolved-conflict status). Insufficient confidence produces `request-more-context` or blocked; it never expands permissions or execution authority.
7. **Audit completeness.** Creation, approval request, and rejection record actor, timestamp, reason code where applicable, resolved fiscal scope, prior/current lifecycle state, evidence references, and correction/reversal reference in the audit lineage.
8. **Correction preserves evidence.** A correction instruction or linked checklist resolution is non-mutating in this slice and cannot replace the original blocker or source evidence.
9. **Least privilege.** Only authenticated actors with verified membership and the required monthly-close review permission may view or review a recommendation. Unauthorized access is denied without scope leakage.

## Affected seams to verify in analysis

| Seam                                                             | Verification required                                                                                                                                     | Risk                                                                           |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/domain/src/scope/types.ts`                             | Confirm `createFiscalScope()` inputs, period validation, company ownership, and permission/membership semantics can produce the sole authoritative scope. | P0: scope adapter could accept client authority or omit RUC.                   |
| `apps/api/src/features/monthly-close/routes.ts`                  | Identify the existing route that can host a server-resolved review query/action without widening public contracts unnecessarily.                          | P0: route may trust request scope or expose unscoped records.                  |
| `apps/api/src/features/monthly-close/controller.ts`              | Confirm controller authentication/context conventions and error mapping for fail-closed scope/evidence/confidence outcomes.                               | P0: controller may convert denied state into an ambiguous response.            |
| `packages/domain/src/repositories/close-checklist.repository.ts` | Verify how checklist/gate data is constrained by company and period, and define the adapter proof for organization/RUC before repository access.          | P0: repository contract lacks organization ID and RUC.                         |
| `packages/ai/src/control-plane/contracts.ts`                     | Confirm advisory state, evidence, risk, and `authoritativeMutationAllowed: false` representations can be reused without a mutation affordance.            | P0: contract could accidentally permit apply semantics.                        |
| `packages/ai/src/control-plane/approval-guard.ts`                | Verify an approval record cannot reach deterministic apply handoff and how to model review-only approval/rejection.                                       | P0: approval semantics may be confused with execution.                         |
| `packages/ai/src/control-plane/trace-evidence/types.ts`          | Verify period and correction-reference gap; choose an adapter/projection rather than weakening typed trace invariants.                                    | P1: trace evidence has no mandatory period.                                    |
| `packages/ai/src/control-plane/trace-evidence/store.ts`          | Verify tenant/RUC scoping, redaction behavior, append-only audit linkage, and persistence/durability constraints.                                         | P1: in-memory/asynchronous storage may not be authoritative audit persistence. |
| `apps/web/src/features/cierre-mensual/`                          | Identify an existing surface that can render the projection without client-side scope construction or approval-as-execution copy.                         | P1: UI may overstate authority.                                                |

## Acceptance outcomes

1. An authenticated accountant can request a Monthly Close Blocker Review for one authorized company and valid `YYYY-MM` period; the server returns only a projection whose organization, company, RUC, and period were derived and verified server-side.
2. The system returns at most one deterministically selected blocker. The response identifies its checklist/gate source, evidence references and redaction status, explicit confidence signals, lifecycle state, and non-mutating correction reference.
3. A mismatched, client-supplied, missing, unauthorized, or ambiguous organization/company/RUC/period produces a fail-closed outcome; no foreign evidence, checklist, audit, or recommendation data is disclosed.
4. Missing evidence or insufficient confidence produces a non-actionable blocked/request-more-context outcome. It cannot be approved for execution or sent to a mutation path.
5. An authorized review action can request approval or reject with a reason, and append-only audit evidence captures actor, timestamp, resolved scope, state transition, reason, evidence, and correction reference.
6. Approval changes only the advisory lifecycle/audit projection. Tests demonstrate that it does not call an apply handoff, enqueue a job, lock a period, post a journal, mutate fiscal records, or submit to SUNAT/OSE/SIRE.
7. Automated tests demonstrate RUC/tenant isolation, exact period scoping, evidence and confidence gates, approval/rejection audit events, deterministic blocker selection, and no-mutation behavior.
8. The implementation stays within 400 changed lines. If the API/application contract and tests exhaust the budget, defer web rendering to a chained follow-up before implementation begins.

## Dependency and implementation risks

- **P0 — Scope-shape mismatch:** monthly-close repositories lack organization/RUC fields while trace/control contracts lack required period. Analysis must select one server adapter that proves the complete scope; duplicating client scope fields is prohibited.
- **P0 — Approval ambiguity:** existing approval guard protects apply flows. Reuse must explicitly preserve `authoritativeMutationAllowed: false` and prevent all apply handoffs.
- **P1 — Audit durability:** trace storage implementations may be in-memory or asynchronously persisted. Do not label them authoritative fiscal audit records until persistence, append-only behavior, and failure semantics are verified.
- **P1 — Budget pressure:** application/API/web/test work may exceed 400 changed lines. Auto-forecast requires a split at the typed contract and tests before UI work rather than a budget exception.
- **P1 — Existing dirty working tree:** implementation must use a dedicated worktree/branch and exclude unrelated changes.
- **P2 — UI interpretation:** labels and affordances must state "advisory review" and must not imply that approval closes the period or executes fiscal work.

## Delivery forecast

**Strategy:** auto-forecast. Begin analysis by measuring the smallest extension point. Keep one implementation PR under 400 changed lines. Split into: (1) server/application contract plus strict-TDD tests; then (2) web projection, only if required and separately budgeted. No schema migration is proposed in this phase.

## Next phase

Proceed to **spec** to verify the named seams, choose the server-side scope adapter and existing route/surface, define typed outcomes and audit payloads, and produce strict-TDD scenarios before any application-code change.
