# SDD-WB-009 — R0–R3 Approval Experience

**Change ID:** `sdd-wb-009`
**Capability:** CAP-WB-09 (R0–R3 Approval Experience)
**Wave:** C (Review Model)
**Created:** 2026-07-27
**Extends:** `drenyra-fiscal-agent-discipline` (draft), `features/approval-hub/`

## Purpose

Implement the R0–R3 approval experience in the Workbench. Each approval level has distinct UX:

- **R0 (Read):** No friction. Explain, compare, summarize, search.
- **R1 (Reversible):** Fast action with undo/discard. Propose classification, create note.
- **R2 (Internal material):** Mandatory preview: what changes, financial impact, affected entities, evidence, policy, rollback method.
- **R3 (External execution):** Step-up auth, separate prepare vs execute, receipt required, official response status.

## Color rule

- 🟢 Green: validated or accepted (never "high AI confidence")
- 🟡 Amber: requires attention
- 🔴 Red: risk, blocker, or failure
- 🔵 Blue: in progress or informational
- ⚪ Gray: unknown, incomplete, or unevaluated

## Scope

### Included

1. **ApprovalGate types** — R0–R3 model with level info (requiresAuth, requiresPreview, requiresEvidence, requiresSecondApproval)
2. **ApprovalGate component** — Compact (list) + full (detail) variants with level-specific UI
3. **ApprovalLevel badge** — Color-coded level indicator (blue/green/amber/red)
4. **Impact preview** — Financial impact section for R2/R3 (EBITDA, assets, tax)
5. **R3 execution section** — Authority, action, documents, materiality, receipt status
6. **Approval actions** — R1/R2 approve/reject, R3 prepare/authorize+execute

### Non-goals

- Actual step-up authentication (hook to auth system)
- Backend approval persistence
- Notification system

## Existing code to evolve

| File                                    | Status    | Evolution               |
| --------------------------------------- | --------- | ----------------------- |
| `features/approval-hub/`                | ✅ exists | Add R0-R3 level field   |
| `types/approval-gate.ts`                | ✅ NEW    | R0-R3 model             |
| `components/workbench/ApprovalGate.tsx` | ✅ NEW    | Full approval component |

## PRs

| PR  | Scope                                   | Files est. | Lines est. |
| --- | --------------------------------------- | ---------- | ---------- |
| PR1 | R0-R3 types + APPROVAL_LEVELS map       | 1          | ~120       |
| PR2 | ApprovalGate component + sub-components | 1          | ~250       |
| PR3 | Approval hub integration                | 2          | ~100       |
