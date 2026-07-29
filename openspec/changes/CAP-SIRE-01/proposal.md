# Proposal: CAP-SIRE-01 — SIRE Reconciliation Implementation

## Intent

Implement the minimum viable SIRE reconciliation subsystem across 5 phases (A–E), covering 8 SDD contract requirements frozen in CAP-SIRE-00. This is the **first implementation phase** of the SIRE capability pack — turning audit findings into working code.

## Source

This proposal derives from the **CAP-SIRE-00 contract freeze** at `docs/ux/cap-sire-01-contracts.md` (version 1.0, immutable for this change).

## Scope

### In Scope — REQUIRED portions per SDD

| SDD         | What                                                                                | Phase |
| ----------- | ----------------------------------------------------------------------------------- | ----- |
| SDD-010     | `fiscalPeriodId` in tenant context; period validation; tenant-access-matrix.md stub | A     |
| SDD-014     | Evidence nodes table, append-only, hash chain, `derived_from` links                 | B     |
| SDD-016     | Configurable monetary threshold, per-company config, golden tests                   | C     |
| SDD-006+008 | L0 evidence badges on diff values; reversibility window                             | C     |
| SDD-020     | UNKNOWN state; reconciler; retry payload storage                                    | D     |
| SDD-072     | Persisted workspace state; session recovery                                         | E     |
| SDD-034     | Virtualized diff rows; keyboard nav; loading/empty/error states                     | E     |
| SDD-002     | SIRE vocabulary alignment (labels, navigation)                                      | E     |

### Fixed bugs (pre-work, already done)

- Missing buildExpedienteEvidenceHref import in SireDiffPage.tsx
- Deprecated machine removed, mock data eliminated
- In-memory Maps replaced with DB persistence

### Out of Scope

- Full provenance graph (deferred to CAP-SIRE-02)
- Policy-based materiality engine (deferred to CAP-SIRE-03)
- Fencing tokens / heartbeat (deferred to CAP-SIRE-03)
- L2/L3 approval gates (deferred to CAP-SIRE-04)
- Multi-period dashboard (deferred to CAP-SIRE-04)
- Full grid primitive (deferred to CAP-SIRE-04)
- Route taxonomy migration (deferred to CAP-SIRE-05)

## Approach

Execute 5 sequential phases (A→E). Each phase produces testable, reviewable, deployable increments. Phases B and C can partially overlap.

## Delivery Strategy

**auto-chain**: Each phase is a separate PR.

- PR1 (Phase A): Fiscal context — DB migration + service + route guards
- PR2 (Phase B): Evidence core — schema + services
- PR3 (Phase C): Trust layer — badges, thresholds, golden tests
- PR4 (Phase D): Durability — UNKNOWN state, reconciler
- PR5 (Phase E): UX — workspace, grid, vocabulary

## Risks

| Risk                                             | Likelihood | Mitigation                                  |
| ------------------------------------------------ | ---------- | ------------------------------------------- |
| DB migration conflicts with existing SIRE tables | Medium     | Use existing schema patterns, additive only |
| Evidence hash chain breaks existing diff flow    | Low        | Append-only, never modifies existing data   |
| UNKNOWN reconciler hits SUNAT API rate limits    | Medium     | Configurable retry, exponential backoff     |
