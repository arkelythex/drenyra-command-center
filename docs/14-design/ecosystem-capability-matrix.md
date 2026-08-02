# Ecosystem Capability Matrix — Drenyra ↔ drenyra-ai

> **Last updated:** 2026-08-02.
>
> Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents; no float is ever used for money; version numbers are JSON integers, never floats.

This matrix tracks which capabilities of the Drenyra monorepo are extracted into the standalone [`arkelythex/drenyra-ai`](https://github.com/arkelythex/drenyra-ai) runtime, and the migration status of each. Rule: **once Drenyra consumes a released version of a capability, the internal implementation is removed or becomes an adapter — never a second authority.**

## Matrix

| Capability | Current source (Drenyra) | Future source | Status |
| --- | --- | --- | --- |
| Mission protocol (types, states, commands, events, errors, versioning, idempotency) | `packages/mission-protocol/src/*` | `drenyra-ai/missions` | **Extracted** — `mission-protocol` is now an adapter shim re-exporting `drenyra-ai/missions` (release tarball `v0.0.1-prealpha.1`) |
| Mission state machine (transitions, guards, recovery paths) | `packages/mission-domain` (uses protocol) | `drenyra-ai/missions/transitions` | Migrating — domain keeps its local adapters; protocol-derived logic resolves via the shim |
| Mission receipts (Ed25519, canonical vectors, trusted verification) | `packages/mission-domain/src/mission-receipt.ts` | `drenyra-ai/receipts` | Migrating — implemented in drenyra-ai; Drenyra copy pending retirement |
| Receipt schemas + conformance vectors | `contracts/receipt-schema/v1` | `drenyra-ai/contracts/receipt-schema` (verbatim copy) | Migrating — canonical source of truth now published with drenyra-ai |
| Ledger chain validation | `docs/audits/schemas` (schemas only) | `drenyra-ai/ledger` | Extracted (runtime side); Drenyra has no TS chain validator to retire |
| Candidate identity + materiality + review lenses | `packages/drenyra-orchestrator` (partial) + `packages/domain/src/feos` | `drenyra-ai/candidates` + `drenyra-ai/review` | Migrating — implemented in drenyra-ai; orchestrator lenses pending retirement |
| Recovery contracts | `apps/api/src/features/missions/mission-recovery.hook.ts` (SQL-coupled) | `drenyra-ai/recovery` | Migrating — drenyra-ai has the portable policy; API hook stays until it consumes the runtime |
| MissionRuntime (in-process) | `apps/api/src/features/missions/mission-runtime.ts` (SQL-coupled) | `drenyra-ai/missions/runtime` | Migrating — drenyra-ai runtime is transport-agnostic; API adapter stays |
| Accounting UI | `apps/web` | Drenyra | **Canonical** — stays |
| Tenant persistence | `apps/api` + `packages/persistence` | Drenyra | **Canonical** — stays |
| Gates (approval R2/R3, receipt, mission-state) | none (in drenyra-ai) | `drenyra-ai/gates` | Extracted — new capability lives in drenyra-ai |

## Migration rules

1. A capability is marked **Extracted** when Drenyra consumes the released drenyra-ai artifact and its internal copy is removed or shimmed.
2. **Migrating** means the canonical implementation exists in drenyra-ai, but the Drenyra copy has not been retired yet (scheduled, per-capability, in small PRs — never a bulk move).
3. Retiring a copy requires: dependents' tests green, typecheck green, and the release tag consumed by the shim/dependency.
4. The adapter shim pattern: keep the workspace package name, re-export from `drenyra-ai/<module>`, delete the local implementation. One authority, zero import churn.

## Consumption

- `packages/mission-protocol` depends on `drenyra-ai` via the **GitHub Release tarball** (`https://github.com/arkelythex/drenyra-ai/releases/download/v0.0.1-prealpha.1/drenyra-ai-0.0.1-prealpha.1.tgz`). The tarball contains the built `dist/` and passes `verify-packed-install`.
- Upgrading the consumed version is a normal dependency bump with a migration note (see `RELEASING.md` in drenyra-ai and the ecosystem integration rules).
