# Proposal: ENGINE-QUALITY-GENTLEAI — Drenyra quality at gentle-ai standard

## Intent

Bring Drenyra's engineering ecosystem to the structural quality standard demonstrated by its inspiration, Gentleman-Programming/gentle-ai: versioned contracts with conformance fixtures, audit trails with data ledgers, a stabilized harness, and measurable engineering discipline. This is the first slice of a multi-phase program; this change covers the two highest-impact pillars.

## Source

Gap analysis against `Gentleman-Programming/gentle-ai` (verified 2026-07-31):

| Pillar | gentle-ai | Drenyra today |
| --- | --- | --- |
| Versioned contracts + fixtures | `contracts/review-integration/v1\|v2/` — 30+ JSON schemas, conformance fixtures per version | `contracts/` nearly empty: only `data-engine/v1`; receipt-schema, json-schema, protobuf dirs referenced in README but absent |
| Audits with data | `docs/audits/` + `data/*-ledger.json` (change/invariant/deletion ledgers) | `docs/audits/` does not exist |
| Stable harness | Go core + gentle-pi + engram + GGA, independent releases | `@drenyra/pi` v1.0.0-alpha.1, `@drenyra/memory` alpha, monorepo-internal |
| Docs-as-code | docs + audits + playbooks | Strong already (diátaxis, MAP.md, doctrina, 17 workflows) |
| Bench/measurement | `bench/` with versioned results | Absent |

## Scope

### In Scope — Phase A (this change)

1. **Versioned receipt contracts** — `contracts/receipt-schema/v1/` with canonical JSON schemas and conformance fixtures for SignedReceipt (hash + Ed25519 + security metadata from M4.2), shared across TS/Go/Python surfaces. Mirror the gentle-ai `contracts/<contract>/v1/schemas/ + fixtures/` layout.
2. **Conformance test harness** — fixture-driven tests in TS (mission-domain), Go (CLI harness), and Python (data-engine or a small conformance module) that validate the same canonical vectors, proving cross-language receipt integrity (the M4.2 thesis made structural).
3. **Audit ledger foundation** — `docs/audits/` with `data/change-ledger.json`, `data/invariant-ledger.json` following gentle-ai's ledger schema pattern; a small `scripts/audit/` tool to append entries with RED-style receipts (hash + signer).

### Out of Scope (later phases)

- `@drenyra/pi` stabilization to v1.0.0 (Phase B — needs contract with domain first)
- `@drenyra/memory` as fiscal-native engram (Phase B)
- Repository split into drenyra-harness / drenyra-pi / drenyra-memory (Phase C — only after 2+ consumers)
- Bench suite (Phase D — nothing to measure yet)
- Full audit history backfill (ledgers start fresh, forward-only)

## Current-State Gap

- `contracts/receipt-schema/` referenced in `contracts/README.md` but does not exist; signed receipts are only validated by per-surface tests, not by a canonical cross-language vector.
- No `docs/audits/`; engineering decisions and invariants are not recorded as auditable, receipt-backed entries.
- Cross-language conformance is asserted by duplicated expectations, not by shared fixtures (risk of drift — the exact gap M4.2 evaluation warned about).

## Acceptance Criteria

1. `contracts/receipt-schema/v1/schemas/*.json` exist and validate against `SignedReceipt` from `packages/mission-domain` (including `receiptType`, `algorithm`, security metadata added in M4.2 PR1).
2. Conformance fixtures in `contracts/receipt-schema/v1/fixtures/` are consumed by tests in at least two languages (TS + Go, Python optional), all green against the same vectors.
3. `docs/audits/` exists with `data/change-ledger.json` and `data/invariant-ledger.json`; `scripts/audit/` appends receipt-backed entries (hash + signer key id) and validates the ledger hash chain.
4. All existing tests remain green (mission-protocol 62, mission-domain 146, api 64, client 25, CLI Go 17 packages, web 67).
5. Delivery: auto-forecast, 400-line budget — chain PRs if a phase exceeds it.

## Risks

- Cross-language fixture drift: mitigated by shared canonical vectors + CI conformance job.
- Ledger schema invention: mitigated by following gentle-ai's documented ledger schemas rather than designing new ones.
- Scope creep into harness stabilization: explicitly deferred to Phase B in Out of Scope.

## Non-Goals

- Do not move packages out of the monorepo in this change.
- Do not change receipt payload hashing (would break Go fixtures and M4.2 conformance).
- Do not backfill historical audit entries.
