# Exploration — Accountant Fiscal Operating System

**Last updated:** 2026-07-12  
**Change ID:** `drenyra-accountant-operating-system`  
**Phase:** explore  
**Delivery constraint:** auto-forecast, 400-line review budget

## Executive summary

Drenyra already has the safe building blocks for an accountant-facing fiscal operating system: validated fiscal scope, advisory-only agent policy, human approval guarding, scoped trace evidence, append-only audit events, deterministic fiscal pipelines, and a monthly-close workspace. The missing product seam is a single, accountant-readable workflow that binds those building blocks to one explicitly scoped decision.

The recommended first vertical slice is **Monthly Close Blocker Review**: an accountant selects one organization, company, RUC, and fiscal period; the system produces one advisory-only blocker recommendation from deterministic close checks; the accountant can inspect evidence, confidence signals, approval state, audit history, and a defined correction path. The slice may request approval but must not lock a period, submit to SUNAT/SIRE, post a journal entry, or execute any mutation.

This is inspired by controlled-agent discipline—bounded workflow, explicit state, evidence first, human gates, and deterministic handoff—not a reproduction of a coding harness and not a generic conversational assistant.

## Existing foundations

| Foundation                       | Evidence                                                                                                                      | Relevance                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product contract                 | `docs/products/drenyra-product-philosophy.md`                                                                                 | Requires visible fiscal scope, evidence, confidence, approval, reversal, auditability, and fail-closed behavior. It explicitly rejects a generic accounting chatbot.    |
| Accountant workflow direction    | `apps/web/MAP.md`                                                                                                             | Identifies monthly close as the flagship workflow and excludes irreversible period locks, SUNAT submission, and unsupervised accounting mutations from the first slice. |
| Validated fiscal scope           | `packages/domain/src/scope/types.ts`                                                                                          | `createFiscalScope()` derives organization, company, RUC, country, and `YYYY-MM` period from a validated company; membership roles and permissions are defined.         |
| Agent policy boundary            | `packages/ai/src/control-plane/contracts.ts`                                                                                  | Tenant/company/RUC scope, evidence references, risk tiers, approval states, and `authoritativeMutationAllowed: false` are explicit contracts.                           |
| Approval guard                   | `packages/ai/src/control-plane/approval-guard.ts`                                                                             | Pending, rejected, or policy-blocked work cannot reach a deterministic apply handoff.                                                                                   |
| Trace evidence and audit lineage | `packages/ai/src/control-plane/trace-evidence/types.ts` and `packages/ai/src/control-plane/trace-evidence/store.ts`           | Evidence is tenant-scoped, redacted, can carry approval lineage, and supports audit-event append.                                                                       |
| Close-domain model               | `packages/domain/src/repositories/close-checklist.repository.ts`                                                              | Checklists, gates, assignments, evidence IDs, period status, and dashboard types exist for a period-close workflow.                                                     |
| Existing close API surface       | `apps/api/src/features/monthly-close/routes.ts` and `apps/api/src/features/monthly-close/controller.ts`                       | A concrete API seam exists for close checklists and gates.                                                                                                              |
| Agent orchestration              | `packages/ai/src/agents/orchestrator/workflow-v2/orchestrator.ts` and `packages/fiscal-sdd/src/pipelines/invoice-pipeline.ts` | Retry, recovery, and gated orchestration patterns exist, but are invoice-oriented rather than an accountant close-decision workflow.                                    |

## Functional gaps

| Severity | Gap                                                                                                                                                                                                                      | Evidence                                                                                                                                                                                                                                          | Consequence                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P0       | No product-level command envelope combines validated fiscal period scope with an accountant action, evidence bundle, confidence signals, and lifecycle state.                                                            | `packages/domain/src/scope/types.ts` defines scope; `packages/ai/src/control-plane/contracts.ts` defines tenant/company/RUC but not period; `packages/domain/src/repositories/close-checklist.repository.ts` defines close records independently. | A UI can accidentally join independently scoped data or omit the fiscal period from a risky decision.                          |
| P0       | Trace evidence persistence has a tenant/company/RUC scope but no mandatory fiscal period and no explicit reversal/correction reference.                                                                                  | `packages/ai/src/control-plane/trace-evidence/types.ts`                                                                                                                                                                                           | An accountant cannot prove that a recommendation belongs to the selected period or see the correction path before approval.    |
| P1       | Existing approval contracts protect deterministic application but do not model an accountant-facing recommendation lifecycle with blocked, evidence-incomplete, confidence-insufficient, and correction-required states. | `packages/ai/src/control-plane/contracts.ts`, `packages/ai/src/control-plane/approval-guard.ts`                                                                                                                                                   | A surface risks presenting a binary approve/reject control without enough operational context.                                 |
| P1       | Monthly-close repository records company and period but its contract does not include organization ID or RUC.                                                                                                            | `packages/domain/src/repositories/close-checklist.repository.ts`                                                                                                                                                                                  | Direct use as the decision boundary could weaken cross-tenant/RUC proof unless scope is resolved before repository access.     |
| P1       | The current orchestration pipeline is optimized for invoice processing, not deterministic monthly-close blocker assessment and reviewable escalation.                                                                    | `packages/ai/src/agents/orchestrator/workflow-v2/orchestrator.ts`, `packages/fiscal-sdd/src/pipelines/invoice-pipeline.ts`                                                                                                                        | Reusing it wholesale would overextend the first slice and blur the boundary between advisory preparation and fiscal execution. |
| P2       | The previous accountant-interface plan proposes natural-language query, approval, CLI, API, and web work totaling about 1,900 lines.                                                                                     | `openspec/changes/drenyra-accountant-interface/proposal.md`                                                                                                                                                                                       | It exceeds the current 400-line budget and begins with AI classification before a safe constrained workflow is proven.         |

## Recommended bounded first workflow

### Workflow: Monthly Close Blocker Review

**Input:** authenticated actor plus a server-derived `FiscalScope` for exactly one organization, company, RUC, and `YYYY-MM` period.

1. The accountant opens a monthly-close review for the selected scope.
2. A deterministic close-check adapter reads scoped checklist/gate state and emits at most one prioritized blocker assessment. No LLM is needed to select or calculate the blocker.
3. The system creates an advisory-only recommendation with:
   - full fiscal scope;
   - source/evidence references and redaction status;
   - explained confidence signals (for example: complete evidence, current data, no unresolved conflicts), not a model assertion alone;
   - `proposed`, `validated`, `approved`, or `rejected` approval state;
   - audit events for creation and review;
   - an explicit correction/reversal reference (for this slice, a non-mutating correction instruction or linked checklist resolution).
4. The accountant can review evidence and either request approval or reject with a reason. Missing scope, evidence, confidence threshold, or required permission fails closed.
5. Approval remains a recorded decision only. No period lock, journal posting, SUNAT/SIRE submission, or automatic downstream execution is included.

### Slice boundary

**Include:** a typed command/envelope at the application boundary; deterministic blocker selection; scoped evidence/approval/audit projection; one web review surface or an existing monthly-close surface extension; tests for scope mismatch, missing evidence, insufficient confidence, approval/rejection audit events, and no-mutation behavior.

**Exclude:** natural-language intent classification, free-form chat, multi-period review, cross-company aggregation, automatic approvals, journal posting, close locking, SUNAT/OSE/SIRE submission, external accounting integration, and a generalized agent-workflow platform.

### Expected implementation shape

A single reviewable PR should remain below 400 changed lines. Prefer extending the existing monthly-close feature and control-plane contracts over adding new packages. If the typed command cannot be introduced without crossing the budget, split before UI work: first the deterministic application/API contract and tests, then the web projection.

## Safety invariants for the next phase

- Resolve organization, company, RUC, and period on the server from authenticated membership; do not trust client-supplied RUC or organization values.
- Require evidence references before a recommendation is visible as actionable; fiscal-document evidence must remain redacted.
- Treat confidence as deterministic, explainable signals for this slice. Low confidence means `request-more-context` or blocked, never an automatic execution path.
- Preserve the original blocker and source evidence when a correction is proposed.
- Record actor, timestamp, reason code, approval state, and correction/reversal reference in the audit chain.
- Keep all fiscal mutation paths out of this slice; approval must not imply execution.

## Relationship to existing plans

- `drenyra-accountant-interface` is valuable discovery, but its AI-query/CLI/web breadth is not a safe first delivery under the 400-line constraint.
- `drenyra-fiscal-agent-discipline` provides phase-gate and evidence concepts, but this slice should consume existing control-plane capabilities instead of reopening the generic pipeline program.
- `drenyra-cierre-flow` and the web map establish monthly close as the intended flagship workflow; this change should turn that direction into one proofable accountant decision before expanding.

## Next recommended phase

Proceed to **proposal** with acceptance criteria for the single Monthly Close Blocker Review workflow, explicit server-side scope resolution, advisory-only behavior, evidence/confidence gating, approval/rejection audit events, and a correction reference. The proposal must name the exact existing API/web seam selected after verifying the current monthly-close implementation.

## Residual risks

- Existing repositories and trace contracts use different scope shapes; a proposal must define one adapter boundary rather than duplicating or weakening scope fields.
- The trace store has in-memory and append-only implementations; production persistence and retention behavior must be confirmed before relying on it for fiscal audit evidence.
- The repository is currently dirty with unrelated work. Any future implementation must use an isolated worktree/branch and must not absorb those changes.
- Existing `createPostgresTraceEvidenceStore` uses asynchronous persistence and error logging; the next phase must verify durability semantics before it is considered the authoritative fiscal audit record.
