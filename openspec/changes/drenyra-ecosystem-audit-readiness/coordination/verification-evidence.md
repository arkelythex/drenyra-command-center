# Verification Evidence — Ecosystem Audit Readiness (U4.5)

The umbrella coordination change `drenyra-ecosystem-audit-readiness` is implemented and verified through its full
strict-TDD arc (U1a–U4.4). This pack records the exact commands, results, criterion/requirement mapping, the
criterion-16 diff inspection, and the archival path for the later `sdd-verify` / `sdd-archive` lifecycle steps.

## Quick path

1. Run the full validator suite (below) — 13 files / 97 tests, exit 0.
2. Run strict TypeScript over every validator + scripts source — zero diagnostics, exit 0.
3. Run the YAML corpus sweep — 49 files, zero errors.
4. Run the readback CLI against the bootstrap ledger — exit 0, capability-scoped.
5. Inspect `git status --porcelain` — only the coordination tree; no product or sibling path.

## Commands and results

|Check|Command|Result|
|---|---|---|
|Focused rollback suite|`bunx vitest run --config openspec/changes/drenyra-ecosystem-audit-readiness/coordination/validator/vitest.config.ts .../validator/rollback-recompute.test.ts`|1 passed, 7 passed, exit 0 (×2 deterministic)|
|Focused readback suite|same config, `.../validator/readback.test.ts`|1 passed, 7 passed, exit 0|
|Full validator suite|same config, `.../validator/`|13 passed, 97 passed (7 U1b + 8 U1c + 8 U2a + 6 U2b + 6 U2c + 7 U3a + 5 U3b + 6 U3c + 7 U3d + 9 U3e + 14 U3f + 7 U4.1/4.2 + 7 U4.3), exit 0 (×3 identical)|
|Strict type check|`bunx tsc --noEmit --ignoreConfig --strict --noUnusedLocals --noUnusedParameters --target es2022 --module esnext --moduleResolution bundler --types node --skipLibCheck` on `coordination/validator/*.ts` + `coordination/scripts/*.ts`|zero diagnostics, exit 0|
|YAML corpus|strict `yaml.parse` with `uniqueKeys: true` over all `coordination/fixtures/*.yaml` + `ledger.yaml`|49 files, 0 errors, no duplicate keys|
|Readback CLI (runtime)|`bun openspec/changes/drenyra-ecosystem-audit-readiness/coordination/scripts/readback.ts`|exit 0 — revision 1, valid, `ecosystem_ready: false`, capability-scoped scope line, per-child derived states, next safe action `Resume H02 review…`|
|RED snapshots (U4)|rollback suite (module absent) and readback suite (module absent) during RED|1 failed / 0 tests, exit 1, `Cannot find module './rollback-recompute.js'` / `'../scripts/readback.js'`|

## Design validation criteria 1–16 → passing fixtures

|Criterion|Covered by|
|---|---|
|1 schema bootstrap / fail-closed|U1a.2, U1b.1, U1b.2, U1c.1, U1c.2|
|2 stale writes, monotonic revisions|U1c.1, U1c.2, U4.3 (readback: event-revision and program_status.revision rejections)|
|3 deterministic identical input|U1b.2, U1c.1, U1c.2, U2a.2, U4.1/U4.3 determinism tests|
|4 H02 review-pending blocks C1 + dependents|U3a.1, U3a.2|
|5 H02 approval insufficient without forecast/gates|U3a.1, U3a.2, U3b.1, U3b.2|
|6 missing dependency evidence blocks|U2a.1, U2a.2|
|7 cycles / C1 bypass / duplicate tenant / alternate authority|U2b.1, U2b.2|
|8 C2/C3 reorder proof|U2c.1, U2c.2|
|9 C5 independent, C6 needs C1+C5|U2a.1, U2a.2|
|10 300/301/301–400 line boundary|U3b.1, U3b.2|
|11 exception scope invalidation, size-gate-only waiver|U3b.1, U3b.2|
|12 bare labels / mutable revisions / contradictory / cross-repo|U3d.1, U3d.2|
|13 C7 atomic seven-proof opening|U3c.1, U3c.2|
|14 research provenance|U3d.1, U3d.2|
|15 rollback history + descendant invalidation|U4.1, U4.2 (`rollback-valid.yaml`, `rollback-unverifiable.yaml`, matrix, history-preserved, determinism)|
|16 diff restricted to coordination artifacts|U4.5 (below)|

## Spec requirement → evidence

|Requirement|Evidence|
|---|---|
|Repository-Local Child Authority|U1a/U1b ownership contract; U2b graph-safety (no duplicate authority); U3d evidence ownership/path containment; U3e no sibling surrogate; criterion-16 diff (below)|
|Executability and Dependency State|U2a resolver (blocked/eligible, missing evidence never not-applicable); U2b/U2c; U4.3 readback derived states|
|H02 Resume-Not-Duplicate|U3a guard; U2b C1 binding; U3e `handoff-resume.yaml`; U3f `import-h02-reference.yaml`|
|Mandatory C1–C6 Closure and Conditional C7|U2a `ecosystem_ready`; U3c c7-gate; U4.3 unsupported-ecosystem-ready rejection + capability-scoped scope line|
|300-Line Forecasting and Chain Requirement|U3b line-policy (300/301/301–400; exceptions)|
|Program-Owner Evidence Ledger|U1a schema; U1b bootstrap ledger; U1c monotonic append-only events; U3d evidence contract|
|Quality-Gate and Evidence Semantics|U3d (typed results, no bare labels); U3a forecast+gates; U3b size-gate-only waiver|
|Exact Ownership and Rollback Rules|U1c owner mismatch; U4.1/U4.2 rollback (history preserved, `ROLLBACK_INVALIDATED_DEPENDENCY`, no sibling compensation)|
|Current-Web Research Provenance|U3d research contract (primary source, unresolved risk)|

## Criterion-16: diff inspection

`git status --porcelain` at U4.5 shows only `?? openspec/changes/drenyra-ecosystem-audit-readiness/` from this
change, plus the pre-existing session entries (`M docker-compose.yml`, `M openspec/config.yaml`,
`?? docs/01-foundation/drenyra-operating-model.md`, `?? openspec/changes/probe.md`) that predate this change and
were never touched by any U1–U4 unit (recorded as pre-existing in every unit's structural-scope check). No path
under `apps/`, `packages/`, `engines/`, `services/`, `contracts/`, or any sibling repository
(`drenyra-ai`, `drenyra-engram`, `drenyra-pi`) appears. All U4 writes landed under
`openspec/changes/drenyra-ecosystem-audit-readiness/coordination/` plus the change's `tasks.md`/`apply-progress.md`
bookkeeping files.

## Archival path (for later sdd-verify / sdd-archive)

- The ledger is the only mutable program state: `coordination/ledger.yaml` at **revision 1** (bootstrap, unchanged
  by U1–U4 — verified by the readback report and the U4.1/U4.3 determinism tests against `readLedger()`).
- Append-only events: `evt-1` (`program-initialized`, revision 1) — every later event appends with monotonic
  revision; rollback/handoff/import/migration event kinds are schema-typed since U1a.
- Bootstrap invariants to preserve through archive: C1 `blocked`/`H02_REVIEW_PENDING`, C7 `not-required`, no
  executable child, `ecosystem_ready: false`, capability-scoped `program_status` — all asserted by the suite.
- `sdd-archive` may use the U4 readback output as its pre-archive status snapshot and this pack as its verification
  evidence; the two parent-owned lifecycle gates (native bounded review of the coordination-tree diff, then
  verify → archive with the final ledger revision) remain open in `tasks.md`.
