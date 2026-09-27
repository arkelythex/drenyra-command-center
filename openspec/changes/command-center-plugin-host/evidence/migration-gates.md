# Slice 0 Migration Freeze and Gates

Effective immediately for `command-center-plugin-host` migration work:

1. **No new local authority writers.** Do not add or broaden writers for missions, ledger, receipts, gates, approvals, provider memory, or fiscal state. New host code may write only mechanically isolated host metadata or disposable projections with authority reference, issuer/version, RUC scope and freshness.
2. **No deletion.** No package, symbol, route, job, table, migration, object, cache, queue, credential, backup/restore path, test, or compatibility adapter may be deleted by Slice 0.
3. **Quarantine by default.** Unknown, conflicting, duplicate, generic-persistence, locally authoritative, or incompletely scoped assets are `quarantine`; evidence of current behavior alone cannot upgrade them to `retain` or authorize deletion.
4. **One external authority.** Canonical mission, ledger, receipt, gate, approval and fiscal-state mutation remains blocked until one released accounting provider is verified for the exact organization/RUC/company/period scope. No semantic fallback or concurrent writer is permitted.
5. **Fiscal invariants remain mandatory.** Exact Money with currency/scale/rounding, validated organization-owned RUC, immutable/provenance-preserving receipts, R2/R3 human approval, deterministic inputs/versions, and fail-closed absence/skew apply to every seam.

## Gate state after Slice 0

| Gate | State | Evidence / exit condition |
| --- | --- | --- |
| Inventory | partial-open | Grouped baseline is auditable; expand every grouped row to symbol/data/consumer level before its migration. |
| Released contract | closed | `release-verification.md` is `unavailable`. |
| Conformance | partial-open | Neutral vectors identified and narrow baselines run; accounting TCK and failure/namespace suites remain. |
| Authority | closed | Local mission/approval/ledger writers remain reachable; no verified provider binding exists. |
| Data / operations / consumers / rollback / observability | closed | Namespace, retention, rehearsal, failure, consumer migration and rollback evidence are incomplete. |
| Deletion approval | closed | Separate parent-owned human approval is absent; Slice 0 authorizes no deletion. |

Any later work unit must update the inventory and gates before changing classification. This freeze does not normalize or modify the unrelated dirty worktree.
