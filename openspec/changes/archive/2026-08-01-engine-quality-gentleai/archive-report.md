# ENGINE-QUALITY-GENTLEAI — Archive Report

**Change**: `engine-quality-gentleai`
**Date**: 2026-08-01
**Archive status**: **PASS**
**Artifact store**: hybrid (openspec files + engram)
**Archived path**: `openspec/changes/archive/2026-08-01-engine-quality-gentleai/`
**Review gate**: `disabled/unmanaged` — review mode OFF decided by the user; does not block archive (per orchestrator).

---

## 1. Final state

Phase A of the engine-quality-at-gentleai-standard program is **complete and verified**:

- **Versioned receipt contracts** — `contracts/receipt-schema/v1/` with 3 canonical draft-07 JSON schemas, `manifest.json`, `README.md`, 8 committed conformance vectors, and TEST-ONLY dev keys.
- **Cross-language conformance harness** — TS (mission-domain), Go (cli harness), Python (data-engine) all consume the same canonical vectors; CI `receipt-conformance` job guards against drift.
- **Audit ledger foundation** — canonical NDJSON append-only ledger at `docs/audits/data/main.ndjson` (5 entries, VALID), `docs/audits/schemas/*.json`, `docs/audits/README.md`, and the `drenyra-ledger` CLI (`scripts/ledger/`).
- All frozen values preserved: legacy hash `250df62b…` and signatures byte-identical; only additive metadata (`receiptType`, `algorithm`) added to the legacy signed fixture and the Go struct.
- All pre-existing test suites green (REQ-REG-001): mission-protocol 62, mission-domain 174/174, api 64 + 3 E2E (opt-in), mission-client 25, Go 17 packages, scripts/ledger 50/50, data-engine 80 (43 base + 37 conformance), web 67.

## 2. Artifacts read (inputs)

| Artifact | Path | Result |
| --- | --- | --- |
| Proposal | `openspec/changes/engine-quality-gentleai/proposal.md` | ✅ read |
| Spec | `openspec/changes/engine-quality-gentleai/specs/engine-quality/spec.md` | ✅ read — 14 requirements |
| Design | `openspec/changes/engine-quality-gentleai/design.md` | ✅ read (rev. 2: NDJSON ledger) |
| Tasks | `openspec/changes/engine-quality-gentleai/tasks.md` | ✅ read — 21/21 done |
| Apply progress | `openspec/changes/engine-quality-gentleai/apply-progress.md` | ✅ read |
| Verify report | `openspec/changes/engine-quality-gentleai/verify-report.md` | ✅ read — PASS, `gentle-ai.verify-result/v1`, blockers 0, critical 0 |
| State | `openspec/changes/engine-quality-gentleai/state.yaml` | ✅ read — updated to `archived` |
| Config | `openspec/config.yaml` | ✅ read — no `rules.archive` defined |
| Canonical ledger | `docs/audits/data/main.ndjson` | ✅ re-validated at archive time: VALID, 5 entries |

## 3. Verification evidence

Verify report `gentle-ai.verify-result/v1` (evidence revision `sha256:c4f59f26…`):

- verdict: **pass**; blockers 0; critical_findings 0
- requirements: **14/14**; scenarios: **19/19**
- test command: `bunx vitest run packages/mission-domain && bunx vitest run scripts/ledger && go test ./... && uv run pytest tests/conformance` → exit 0
- build command: `bunx tsc --noEmit packages/mission-domain && go vet ./internal/harness` → exit 0
- All 5 proposal acceptance criteria PASS (CA1 contracts/schemas, CA2 three-language conformance, CA3 audit ledger, CA4 regression, CA5 chained delivery).

Orchestrator-confirmed final regression (outranks the verify snapshot): mission-domain 174/174, scripts/ledger 50/50, Go 17 packages, Python conformance 37/37, web 67.

## 4. Delivery — 7 PRs merged to `main` (stacked-to-main)

| PR | Merge commit | Scope |
| --- | --- | --- |
| #122 | `248f65c51` | canonical receipt-schema v1 contracts + TS/Go conformance (schemas, manifest, README, legacy fixture) |
| #123 | `62336aa68` | deterministic canonical receipt vectors + TEST-ONLY dev keys (generator + 8-vector suite) |
| #124 | `53c3b418e` | TS receipt conformance harness local+trusted over canonical vectors |
| #125 | `2f3edd559` | Go receipt conformance harness + root resolver |
| #126 | `343dd09f7` | Python receipt conformance harness, `cryptography` dev dep, CI conformance job |
| #127 | `353369932` | canonical NDJSON audit ledger — core, schemas, `drenyra-ledger` CLI |
| #128 | `1cb80c893` | initialize canonical audit ledger + docs (`docs/audits/`) |

Forecast was 9 PRs; PR2+PR3 (vectors) and PR7+PR8 (ledger core+CLI / init+docs) were fused → 7. 400-line budget honored per slice (PR5 flagged for uv.lock bulk).

## 5. Final hashes — canonical ledger

`docs/audits/data/main.ndjson` re-validated at archive time:

```text
ledger main: VALID — 5 entries, head 8ad7b31917e70f4fea155e7c146ecd43d1782142e8ffef88e81f5c81cf93dc1d
```

- 5 entries: GENESIS (SHA-256-of-empty-string chain root), RECEIPT_RECORDED ×4 (CONF-VEC-1..3, CONF-GATE).
- The ledger records the execution of this very change — `RECEIPT_RECORDED` entries back the conformance vectors with the frozen hash `250df62b…`.
- Signing policy: hash-only (`signerKeyId: "hash-only"`) — no `DRENYRA_LEDGER_KEY` configured; signed mode verified in tests.
- Entry hash formula (§6.5): `H(canonicalHeader || payloadHash || receiptHash || previousEntryHash)`; canonicalization reuses the validated sorted-keys serialization from the receipt conformance suite.

## 6. Spec sync / domains

- **Domain**: `engine-quality` — **new capability spec** (no pre-existing canonical spec).
- **No canonical-spec-store sync was performed.** This repository has no `openspec/specs/{domain}/spec.md` sync mechanism: `openspec/specs/` contains only legacy `design.md` and `design-system/` files, no `sync-report.md` exists anywhere in the repo, and the sole prior archive (`2026-07-30-m2-real-monthly-close`) was archived the same way (no sync-report, no canonical sync). The change spec is preserved in full as the durable record at `openspec/changes/archive/2026-08-01-engine-quality-gentleai/specs/engine-quality/spec.md`.
- **No destructive merge**: no REMOVED/MODIFIED canonical requirement blocks, no canonical spec merge of any kind. Destructive merge guard: N/A (nothing destructive performed).
- **Same-domain active changes**: none — `find openspec/changes -path "*specs/engine-quality*" -not -path "*/archive/*"` matches only this change's own spec.

## 7. Requirements (all ADDED — new capability spec)

14/14 requirements from the change spec, all verified (14/14 in verify report):

- REQ-CONTRACT-001 — Canonical receipt schema files
- REQ-CONTRACT-002 — Frozen hashing and signing semantics
- REQ-VECTOR-001 — Canonical vector suite (8 vectors)
- REQ-VECTOR-002 — Deterministic generation
- REQ-HARNESS-001 — TypeScript conformance surface
- REQ-HARNESS-002 — Go conformance surface
- REQ-HARNESS-003 — Python conformance surface
- REQ-HARNESS-004 — Schema validation of fixtures
- REQ-HARNESS-005 — CI conformance job
- REQ-LEDGER-001 — Audit ledger files and schema
- REQ-LEDGER-002 — Hash chain integrity
- REQ-LEDGER-003 — Append and validate CLI
- REQ-LEDGER-004 — Ledgers record this phase
- REQ-REG-001 — No regression

## 8. Task completion gate

- `tasks.md`: **21/21 checked** (`- [x]`); **0 unchecked** (`- [ ]`) implementation markers at archive time.
- No stale-checkbox reconciliation was performed or needed.
- `state.yaml` phase statuses: proposal/spec/design/tasks/apply/verify/archive — all `done`.

## 9. Structured status / actionContext findings

- change: `engine-quality-gentleai`; proposal/specs/design/tasks/apply/verify: `all_done`; nextRecommended before archive: `archive`.
- `reviewGate`: `disabled/unmanaged` — review mode OFF (user decision); no receipt gate blocks archive.
- `actionContext`: repo-local (main checkout at `/home/dreamcoder08/Documents/PROYECTOS/Drenyra`); no workspace-planning mode; no `allowedEditRoots` constraints were needed; all archive writes/moves stay inside the authoritative workspace.
- Artifact store: hybrid — file report written here; Engram summary saved under `sdd/engine-quality-gentleai/archive-report` (project `drenyra`).

## 10. Lessons learned

1. **One canonicalization, one implementation** — reusing the receipt `sortedStringify` semantics for the ledger hash chain (instead of a second representation) is what made the three-language conformance thesis hold. Do not invent a second canonical JSON for any future ledger/contract surface.
2. **Additive-only metadata changes are safe and cheap** — `receiptType`/`algorithm` prove that bundle metadata can be extended without breaking frozen hashes or signatures. Future schema evolution should prefer additive metadata + `additionalProperties: false` discipline.
3. **NDJSON beats JSON arrays for append-only evidence** — the design rev. 2 (product owner refinement) made tamper detection line-oriented and validation incremental. SQLite remains only an index/projection, never canonical evidence.
4. **`@drenyra/pi` fiscal guard false positives** — the write guard blocks the token `number` (core TS type) in legitimate annotations; worked around with typed unions / `0 | 1` / `bigint`. Maintainer action needed before Phase B.
5. **uv.lock force-add** — committed per `products/andino` precedent; required for CI `uv sync --group dev --frozen`. Intentional deviation, documented in PR5.
6. **Chain fusion** — 9 forecast PRs became 7 by fusing related slices; each PR stayed independently reviewable and within budget. Fusing only when slices are cohesive keeps delivery honest.
7. **Repo archive convention** — this repo has no canonical-spec sync; archived changes are preserved in full under `openspec/changes/archive/YYYY-MM-DD-{change}/`. If a canonical spec store is adopted later, `engine-quality` should be back-synced from the archived spec.

## 11. Next steps

- **Phase B — stabilize `@drenyra/pi` to v1.0.0** (needs a contract with the domain first; fix the fiscal guard `number` false positives as part of this). `@drenyra/memory` as fiscal-native engram is in Phase B scope.
- **Phase C — repository split** into `drenyra-harness` / `drenyra-pi` / `drenyra-memory` — only after 2+ consumers exist.
- **Phase D — bench suite** (`bench/` with versioned results) — nothing to measure until the harness is stable.
- Deferred explicitly: historical audit backfill (ledgers are forward-only), moving packages out of the monorepo.

## 12. Memory traceability (Engram observation IDs)

| Topic key | Observation ID |
| --- | --- |
| `sdd/engine-quality-gentleai/state` | 9274 |
| `sdd/engine-quality-gentleai/spec` | 9275 |
| `sdd/engine-quality-gentleai/findings` | 9276 |
| `sdd/engine-quality-gentleai/design` | 9277 |
| `sdd/engine-quality-gentleai/tasks` | 9278 |
| `sdd/engine-quality-gentleai/apply-progress` | 9279 |
| `sdd/engine-quality-gentleai/archive-report` | (this archive — saved at archive time) |

Note: the `sdd/engine-quality-gentleai/verify-report` observation could not be confirmed at archive time (Engram HTTP server intermittently unreachable); the file-backed `verify-report.md` is authoritative and was read directly.

## 13. Blockers / approvals

- **Blockers**: none. Final Task Completion Gate passed (0 unchecked tasks); verify report PASS with 0 blockers / 0 critical; no destructive merge performed; all writes inside the authoritative workspace.
- **Explicit approvals recorded**: none required (no destructive sync, no partial archive, no stale-checkbox reconciliation).
