# Ecosystem Capability Matrix — Drenyra ↔ drenyra-ai

> **Last updated:** 2026-09-01.
>
> Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents; no float is ever used for money; version numbers are JSON integers, never floats.

This matrix tracks which capabilities of the Drenyra monorepo are extracted into the standalone [`arkelythex/drenyra-ai`](https://github.com/arkelythex/drenyra-ai) runtime, and the migration status of each. Rule: **once Drenyra consumes a released version of a capability, the internal implementation is removed or becomes an adapter — never a second authority.**

## Matrix

| Capability | Current source (Drenyra) | Future source | Status |
| --- | --- | --- | --- |
| Mission protocol (types, states, commands, events, errors, versioning, idempotency) | `packages/mission-protocol` compatibility adapter | `drenyra-ai/missions` | **Extracted — migrated in this slice.** The package root re-exports the complete canonical mission contract from vendored `drenyra-ai` v0.4.1; compatibility source modules re-export their existing surfaces from the same entry point, with no local protocol logic |
| Mission state machine (transitions, guards, recovery paths) | `packages/mission-domain` (uses protocol) | `drenyra-ai/missions/transitions` | **Extracted — fully migrated.** All six `mission-domain` source modules are adapter shims re-exporting `drenyra-ai/missions` / `drenyra-ai/receipts` (status, transitions, contracts, events, errors, receipt). The legacy divergent command types and the local 13-code taxonomy (domain-only `FORBIDDEN`, HARNESS_TIMEOUT→500) were **retired**; consumers aligned to the canonical 30-code set (`apps/web` label map keeps `FORBIDDEN` as a plain string for older API responses) |
| Mission receipts (Ed25519, canonical vectors, trusted verification) | `packages/mission-domain/src/mission-receipt.ts` | `drenyra-ai/receipts` | **Extracted** — `mission-receipt.ts` is an adapter shim re-exporting `drenyra-ai/receipts` (the original source of the port); `EvidenceItem` stays local to avoid duplicate export |
| Receipt schemas + conformance vectors | `contracts/receipt-schema/v1` | `drenyra-ai/contracts/receipt-schema` (verbatim copy) | Migrating — canonical source of truth now published with drenyra-ai |
| Ledger chain validation | `docs/audits/schemas` (schemas only) | `drenyra-ai/ledger` | Extracted (runtime side); Drenyra has no TS chain validator to retire |
| Candidate identity + materiality + review lenses | `packages/drenyra-orchestrator` (partial) + `packages/domain/src/feos` | `drenyra-ai/candidates` + `drenyra-ai/review` | **Extracted** — `drenyra-orchestrator/review-lenses.ts` + `work-routing.ts` shim to `drenyra-ai/review` (22/22 tests through the shims). The orphaned FEOS `candidate-review.ts` (draft/frozen/… lifecycle, zero external consumers) was **retired**; the canonical candidate model lives in `drenyra-ai/candidates` (contract lifecycle, BigInt materiality) |
| Recovery contracts | `apps/api/src/features/missions/mission-recovery.hook.ts` (SQL-coupled) | `drenyra-ai/recovery` | Migrating — drenyra-ai has the portable policy; API hook stays until it consumes the runtime |
| MissionRuntime (in-process) | `apps/api/src/features/missions/mission-runtime.ts` (SQL-coupled) | `drenyra-ai/missions/runtime` | Migrating — drenyra-ai runtime is transport-agnostic; API adapter stays |
| Accounting UI | `apps/web` | Drenyra | **Canonical** — stays |
| Tenant persistence | `apps/api` + `packages/persistence` | Drenyra | **Canonical** — stays |
| Gates (approval R2/R3, receipt, mission-state) | none (in drenyra-ai) | `drenyra-ai/gates` | Extracted — new capability lives in drenyra-ai |

## Scope of the current migration slice

This slice migrates **only** `packages/mission-protocol` from a local implementation to a compatibility adapter. It does not remove `apps/cli`, `packages/ai`, the fiscal packages, `packages/pi`, or `data-engine`; their current repository roles and any future migration decisions remain separate work.

Authority migration and physical repository reduction are different milestones:

- **Authority migration** is complete for a capability when Drenyra delegates to the released `drenyra-ai` contract and retains at most a compatibility adapter.
- **Physical repository reduction** removes packages or applications only after their remaining responsibilities and consumers have been evaluated. That broader reduction is **pending** and is not implied by an **Extracted** row.

## Orchestrator boundary audit

The following `packages/drenyra-orchestrator` modules were compared with the
vendored `drenyra-ai` candidates, gates, review, receipts, and recovery APIs:

| Module | Decision | Reason |
| --- | --- | --- |
| `classifier/classifier.ts` | **Keep locally** | Classifies changed paths/content, SUNAT/SIRE/IGV/RUC patterns, self-modification, and ambiguity; this is Command Center delivery policy, not accounting materiality. |
| `classifier/fiscal-gate.ts` | **Keep locally** | Binds R2 authorization to a Git tree hash and intentionally blocks R3 in the local pre-commit workflow; this differs from `drenyra-ai/gates` lifecycle approval semantics. |
| `runtime/risk.ts` | **Keep locally** | Composes diff statistics, classifier provenance, receipt state, and local authorization into delivery-facing types. |
| `runtime/verification.ts` | **Keep locally** | Represents staged verification and candidate projection state; it is not a replacement for signed `drenyra-ai/receipts`. |
| `review-lenses.ts`, `work-routing.ts` | **Adapter** | These modules already re-export canonical review workload and lens selection from `drenyra-ai/review`. |

No safe replacement was found for the first four modules. Removing them or
redirecting them to `drenyra-ai` would lose Git-diff policy, fail-closed
behavior, provenance, or tree-hash binding. They remain candidates for a
future contract-level redesign, not for mechanical extraction.

## Migration rules

1. A capability is marked **Extracted** when Drenyra consumes the released drenyra-ai artifact and its internal copy is removed or shimmed.
2. **Migrating** means the canonical implementation exists in drenyra-ai, but the Drenyra copy has not been retired yet (scheduled, per-capability, in small PRs — never a bulk move).
3. Retiring a copy requires: dependents' tests green, typecheck green, and the release tag consumed by the shim/dependency.
4. The adapter shim pattern: keep the workspace package name, re-export from `drenyra-ai/<module>`, delete the local implementation. One authority, zero import churn.

## Consumption

- `packages/mission-protocol`, `packages/mission-domain`, `packages/drenyra-orchestrator`, and `packages/pi` all declare `drenyra-ai` through a single unified vendored artifact: `file:../../vendored/drenyra-ai-0.4.1.tgz`. The repo previously vendored two different snapshots (0.2.0 and 0.4.1) side by side; the diff was verified additive/comment-only for every subpath the three non-`pi` consumers import (`missions`, `receipts`, `review`), so all four were unified on 0.4.1 and the 0.2.0 tarball was removed.
- Other packages may consume a different vendored release for capabilities outside this bounded slice; those migrations are tracked independently.
- Upgrading a consumed version is a normal dependency bump with a migration note (see `RELEASING.md` in drenyra-ai and the ecosystem integration rules).
