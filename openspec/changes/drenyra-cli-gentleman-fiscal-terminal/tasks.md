# Tasks — Drenyra CLI Gentleman Fiscal Terminal

## PR 1 — CLI philosophy and MAP alignment (~250 lines)

- [x] Update `apps/cli/MAP.md` with Gentleman Fiscal Terminal identity.
- [x] Link P1, S5, and parent north star plans.
- [x] Document command/TUI/workflow/exec usage boundaries.

## PR 2 — CLI safety policy (~250 lines)

- [x] Document read-only vs mutating command policy.
- [x] Document required fiscal scope for inspect/mutate commands.
- [x] Document agentic approval and evidence requirements.
- [x] Document local memory/history privacy constraints.

## PR 3 — Implementation roadmap alignment (~300 lines)

- [x] Update P1 tasks to obey this philosophy where needed.
- [x] Update S5 tasks to include semantic parity and safety constraints where needed.
- [x] Add review path for CLI PRs: start at command semantics, then engine, then TUI.

## Verification

- [x] `apps/cli/MAP.md` remains concise and navigable.
- [x] No Go code changes are mixed into the docs/planning slice unless separately approved.
- [x] Future implementation plans include `go test ./...` or the root Bun wrapper if available.

## Review workload forecast

- Chained PRs recommended: Yes if P1/S5 tasks are edited in the same PR.
- 400-line budget risk: Medium.
- Decision needed before apply: No for docs alignment; yes before code implementation.
