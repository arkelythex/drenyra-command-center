# Tasks — S5 Go CLI Pattern Alignment

## PR 1 — Contract documentation

- [ ] Document shared Go/TypeScript contracts for memory, delegation, workflows,
      fiscal scope, evidence, approvals, audit trails, and reversal semantics.
- [ ] Mark each contract as API-owned, CLI-owned, or shared.
- [ ] Include privacy rules for local memory/history and exported evidence
      references.
- [ ] Keep the document reviewable under the 400-line budget.

## PR 2 — Go alignment

- [ ] Compare `internal/delegation/` against the shared delegation contract.
- [ ] Compare `internal/memory/` and `internal/memorystore/` against the shared
      memory contract without storing secrets or sensitive customer data.
- [ ] Compare `internal/workflow/` against canonical workflow names, inputs,
      outputs, fiscal scope, approval, and audit semantics.
- [ ] Update only confirmed mismatches; do not rewrite Go subsystems for style.

## Verification

- [ ] Run `go test ./...` from `apps/cli` or the root Bun wrapper for Go changes.
- [ ] Add command, contract, or golden tests for changed behavior where stable.
- [ ] Verify web/CLI semantic parity for evidence, approvals, fiscal work items,
      audit trails, and reversals.
