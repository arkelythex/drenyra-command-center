# Cross-Language Contract Alignment

**Last updated:** 2026-09-01
**Purpose:** Document how the Command Center keeps its TypeScript contracts aligned with the Go services and Rust verification engines it integrates with. The former in-repository Go CLI was retired; operator runtime and harness responsibilities belong to `drenyra-ai` and `drenyra-pi`.

## Contract ownership

TypeScript packages and the published `drenyra-ai` contracts are the source of truth for Command Center-facing data shapes. Go services and Rust engines consume explicit contracts; they do not create a second fiscal authority.

| Concern | Source of truth | Consumers in this repository |
| --- | --- | --- |
| Fiscal/domain types | `packages/domain/` | `apps/api/`, `packages/application/`, `apps/data-engine/` |
| Mission and receipt schemas | `packages/mission-domain/`, `packages/mission-protocol/`, `contracts/` | API adapters, conformance tests, external `drenyra-ai` clients |
| Fiscal verification | `engines/` and `engines/rust-core/` | TypeScript adapters and verification jobs |
| Operational connectors | `services/` | API and background workflows |
| Operator runtime and harness | External `drenyra-ai` and `drenyra-pi` repositories | Command Center integrations only |

## Boundary rules

1. **One authority:** fiscal state transitions, gates, receipts, and ledger decisions come from the published Core contract.
2. **Explicit scope:** every fiscal request carries its organization/company (RUC) and period context where applicable.
3. **Deterministic serialization:** contract fixtures use stable field names, enum values, and canonical hashes.
4. **No local reimplementation:** adapters translate contracts; they do not duplicate Core validation or authority.
5. **Versioned evolution:** additive changes are preferred. Breaking changes require a contract update, migration notes, and conformance coverage.

## Verification workflow

When a cross-language contract changes:

1. Update the canonical schema or TypeScript contract.
2. Update the affected adapter in `apps/api/`, `services/`, or `engines/`.
3. Add or update shared fixtures under `fixtures/` and focused conformance tests.
4. Run the narrowest relevant check, followed by the repository contract and type checks.

Useful commands:

```bash
bun run --filter @drenyra/mission-domain test
bun run typecheck
bun run test
cargo test --manifest-path engines/rust-core/Cargo.toml
bun run docs:verify
```

## Ownership after CLI retirement

The Command Center exposes the web and API product surfaces. The `drenyra-ai` CLI owns runtime/control-plane operations, while `drenyra-pi` owns the operator harness. New CLI, agent-routing, workflow, memory, RPC, or TUI behavior must be implemented in those owning repositories rather than recreated under `apps/` here.
