# SDD-WB-004 — Financial Change Set Model

**Change ID:** `sdd-wb-004`
**Capability:** CAP-WB-04 (Financial Change Set Model)
**Wave:** C (Review Model)
**Created:** 2026-07-27
**Supersedes:** `drenyra-accountant-operating-system` (blocked at feasibility gate)

## Purpose

Create the **Change Set** — the fundamental unit of accounting review. A Change Set groups multiple proposed changes (journal entries, classifications, reconciliations) into an isolated, reviewable, auditable candidate. It replaces the blocked `drenyra-accountant-operating-system` narrow blocker-review with a full Change Set lifecycle.

## Why not "branch" or "worktree"

The UI uses "Change Set" — not branch, worktree, or PR. This is accounting, not software. A Change Set is isolated from production truth until: Proposal → Validation → Review → Approval → Posting → Receipt.

## Current-state gap

- `drenyra-accounting-diff` exists (per-diff comparison) but there's no grouping concept
- No isolation model: changes are either in production or not, with no intermediate state
- No Change Set lifecycle (draft → proposed → in_review → approved → posted)
- Blocked SDD had 6 feasibility findings — these are addressed by the broader Change Set approach

## Scope

### Included

1. **Change Set types** — Status lifecycle (8 states), risk levels, progress tracking
2. **ChangeSetCard component** — Compact (list) + full (detail) variants with status/risk/progress
3. **Change Set store** (Zustand) — CRUD operations, status transitions, mock data
4. **Sidebar Change Set list** — Show active Change Sets in sidebar
5. **Diff integration** — Link existing AccountingDiffView to Change Set context

### Non-goals

- Full evidence inspector (SDD-WB-010)
- R0-R3 approval gates (SDD-WB-009)
- Change Set creation from agent runs (Wave C follow-up)

## Existing code to evolve

| File                                       | Status     | Evolution                   |
| ------------------------------------------ | ---------- | --------------------------- |
| `features/diffs/diffs.types.ts`            | ✅ exists  | Add change-set-id reference |
| `features/diffs/diffs.api.ts`              | ✅ exists  | Add change-set scoping      |
| `features/diffs/AccountingDiffView.tsx`    | ✅ exists  | Add Change Set header       |
| `components/agentic-shell/AgenticSidebar/` | ✅ evolved | Add Change Set list section |

## PRs

| PR  | Scope                                    | Files est. | Lines est. |
| --- | ---------------------------------------- | ---------- | ---------- |
| PR1 | Change Set types + store                 | 2          | ~150       |
| PR2 | ChangeSetCard component (compact + full) | 1          | ~200       |
| PR3 | Sidebar Change Set list                  | 2          | ~80        |
| PR4 | Diff integration                         | 3          | ~120       |
