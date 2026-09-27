# Pre-Proposal Decision Gate — Command Center Plugin Host

## Status

Decision confirmed: `external-authority`. Proposal work may proceed. No source change or deletion is authorized by this decision alone.

## Confirmed decision

`external-authority`: Drenyra Command Center hosts workspace, UI, profiles, bundles, plugin policy, and provider composition; a released external accounting runtime owns canonical missions, ledger, receipts, gates, and related financial state through versioned contracts.

## Why this blocks the proposal

The repository currently contains local financial semantics, AI orchestration, plugin concepts, receipts, gates, and persistence while its documentation assigns several authorities to external runtimes. The requested reset permits deletion, but deleting or retaining overlapping implementations without one authority owner can create divergent ledgers, receipts, approval state, or tenant/RUC scope.

## Decision domain

- `host-owned-authority`: Command Center owns the canonical accounting application authority, including the accounting model/ledger boundary selected by the proposal; Drenyra AI, Engram, Pi, Guardian, and infrastructure integrate as providers around that authority.
- `external-authority`: Command Center owns workspace, UI, profiles, bundles, plugin policy, and provider composition; a released external accounting runtime owns canonical missions, ledger, receipts, gates, and related financial state, exposed through versioned contracts.

## Decision rationale

The external-authority option best matches the ecosystem topology: the Command Center composes Drenyra AI, Drenyra Engram, Drenyra Pi, Guardian, and infrastructure without recreating their authorities. It preserves the user's proposed host/plugin model while making duplicate financial state and split receipt ownership explicit migration blockers.

## Consequence of either decision

The subsequent proposal must define one migration slice, explicit preservation tests/contracts, provider ABI and capability policy, persistence ownership, deletion gates, and a no-duplicate-authority invariant. This decision does not authorize source changes or deletions by itself.
