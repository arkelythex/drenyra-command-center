# Apply Progress: PR 1A — Quality probes and command contract

## Status consumed

```json
{
  "changeName": "monorepo-quality-baseline-and-balance-consistency",
  "artifactStore": "openspec",
  "dependencies": {
    "apply": "ready",
    "verify": "blocked",
    "sync": "not_applicable",
    "archive": "blocked"
  },
  "applyState": "ready",
  "actionContext": {
    "mode": "repo-local",
    "workspaceRoot": "/home/dreamcoder08/Documents/PROYECTOS/Drenyra",
    "allowedEditRoots": ["/home/dreamcoder08/Documents/PROYECTOS/Drenyra"],
    "warnings": []
  },
  "nextRecommended": "apply"
}
```

- Action-context warning: none. All edits are within the authoritative workspace.
- Delivery boundary: feature-branch chain PR 1A only. No PR 1B/2A/2B/3 work, staging, commits, pushes, PRs, fiscal/reporting code, schemas, SUNAT/SIRE, UI/E2E, generated artifacts, worktrees, dependency changes, or unrelated diagnostics were touched.

## Completed implementation tasks

- Global implementation gates: frozen untracked-work snapshot, Bun-only execution, line budget, exclusion boundary, and fiscal-contract preservation are visibly checked in `tasks.md`.
- PR 1A: probe evidence, RED classification tests, GREEN runner/script wiring, two-run triangulation, and README refactor/documentation are visibly checked in `tasks.md`.

## Files changed

- `package.json` — added `quality:baseline:probe` script only.
- `scripts/quality/quality-baseline.ts` — deterministic process capture and classification.
- `scripts/quality/__tests__/quality-baseline.test.ts` — focused Vitest classification coverage.
- `reports/quality/README.md` — root command context, observed classifications, limitations.
- `openspec/changes/monorepo-quality-baseline-and-balance-consistency/tasks.md` — completed implementation checkboxes only.
- `openspec/changes/monorepo-quality-baseline-and-balance-consistency/apply-progress.md` — this cumulative progress record.

## Command and probe evidence

Captured from repository root to `/tmp/monorepo-quality-baseline-and-balance-consistency-pr1a-probes/`; each first/second raw-output SHA-256 matched for the same command.

| Command                     | Runs | Exit | Classification      | Observation                                                                          |
| --------------------------- | ---: | ---: | ------------------- | ------------------------------------------------------------------------------------ |
| `bun run typecheck`         |    2 |    1 | findings            | Existing TypeScript diagnostics; no count or cause accepted as baseline.             |
| `bun run lint:all`          |    2 |    1 | tool-failure        | Biome nested-root configuration errors under pre-existing `worktrees/**`.            |
| `bun run quality:dead-code` |    2 |    1 | tool-failure        | Knip configuration-loading errors plus unused-file output; not clean or blocking.    |
| `bun run quality:circular`  |    2 |    1 | tool-failure        | Madge/TypeScript runtime `TypeError` involving `ts.Extension.Cjs`; cause unresolved. |
| `bun run quality:core`      |    2 |  127 | missing-entry-point | `./scripts/dev/quality-core.sh` is absent.                                           |

Additional implementation probe:

- `bun run quality:baseline:probe` → exit 1 by design because it preserves the five non-pass results; JSON output retained at `/tmp/monorepo-quality-baseline-and-balance-consistency-pr1a-final-runner.json` classified typecheck as `findings`, lint/Knip/Madge as `tool-failure`, and quality-core as `missing-entry-point`.

## TDD Cycle Evidence

| Task                 | Test file                                            | Layer | Safety Net      | RED                                                                                                                                                              | GREEN                                        | TRIANGULATE                                                                                                                   | REFACTOR                                                                                      |
| -------------------- | ---------------------------------------------------- | ----- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| PR 1A classification | `scripts/quality/__tests__/quality-baseline.test.ts` | Unit  | N/A (new files) | Initial focused run failed before tests loaded due root Vitest/Vite resolver `TypeError`; configuration-error case then failed as expected (received `findings`) | Isolated temporary Vitest config: 4/4 passed | Isolated focused suite run twice: 4/4 each; covers pass, ordinary findings, missing entry point, crash, configuration failure | Runner kept to one capture function and documented contract; final focused suite remained 4/4 |

- Strict TDD note: the repository-default focused Vitest invocation could not load the suite because Vite threw `TypeError: Cannot read properties of undefined (reading 'length')`. An external temporary config under `/tmp` avoided repository config resolution; it ran the same Vitest test file and passed. This is observed test-infrastructure debt, not a claimed clean default Vitest run.
- Total tests written: 4 assertions in 4 scenarios.
- Pure functions created: `classifyProcessResult`.

## Isolation and line budget

- Pre-edit snapshot: `git status --porcelain=v2 --untracked-files=all`; repository identity `94c9cefb1f5169aa5b89539eb3969c873f504503`, tree `e10ab91420d184fab791f6a48e84a6f4a1a69316`, Bun `1.3.14`, Node `v22.18.0`.
- Exact content allowlist: `package.json`, `scripts/quality/quality-baseline.ts`, `scripts/quality/__tests__/quality-baseline.test.ts`, `reports/quality/README.md`; required SDD bookkeeping paths `tasks.md` and `apply-progress.md` were additionally allowlisted solely to satisfy persisted-artifact obligations.
- Hashes for 369,450 pre-existing untracked regular files outside that allowlist were frozen outside the repository at `/tmp/monorepo-quality-baseline-and-balance-consistency-pr1a-untracked-outside.sha256`.
- Final outside-path hash comparison: `outside_hash_changed=0`.
- Forecasted changed lines: 208, below the 350 split threshold and 400-line limit.

## Deviations

- No configuration, lockfile, or dependency change was made: the probes did not establish a repair necessity or root cause.
- The runner's `tool-failure` classification also covers observed configuration failures so those failures cannot be mistaken for ordinary findings or clean quality signals.

## Remaining implementation tasks

- [ ] RED: add comparator tests proving matching debt remains visible, a representative new finding is actionable, changed command/tool/scope is drift, parser failure is not pass, and noisy Knip results are non-blocking but not clean; run focused tests and capture red evidence. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement normalized finding identities, immutable accepted-manifest comparison, explicit baseline-update separation, and classifications for baseline debt, removed debt, new/changed finding, drift, and tool failure. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: capture the accepted manifest from unchanged inputs, inject a temporary sandbox-only representative regression, prove it is reported, remove the temporary mutation, then run comparator tests and documented commands twice. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: document Knip's evidenced gate status and update policy; verify ordinary comparison never rewrites `reports/quality/monorepo-quality-baseline.json`. <!-- sdd-owner: implementation -->
- [ ] Build a caller map for every candidate in `design.md` using imports/exports, dependency injection, container registration, route composition, package exports, and runtime composition roots; exclude `worktrees/**`. <!-- sdd-owner: implementation -->
- [ ] **BLOCKING REACHABILITY GATE:** evidence exactly two distinct production implementations of the same fiscal contract, at least one affected caller contract for each (or an explicit dead-code decision), precise semantic differences, and owning package boundary. If this cannot be proven, stop the fiscal slice and amend the proposal/spec; do not guess or broaden the pair. <!-- sdd-owner: implementation -->
- [ ] Record the selected pair, caller contracts, supported dimensions, observed differences, and `authority: unresolved`; do not name a canonical output. <!-- sdd-owner: implementation -->
- [ ] RED: add one caller-boundary characterization test with distinct company/RUC scope and controlled time; run it alone and record the harness/assertion red reason without manufacturing a production failure. <!-- sdd-owner: implementation -->
- [ ] GREEN: complete the minimum fixtures/harness against unchanged production code and make the characterization pass; assert complete observable output while isolating only nondeterministic metadata. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE/REFACTOR: run the selected package test script via Bun (`cd packages/application && bun run test -- <test-path>` or `cd apps/api && bun run test:run -- <test-path>`), confirm production files are unchanged, and verify scope/hashes. <!-- sdd-owner: implementation -->
- [ ] RED: add the second caller contract and an explicit fixture exposing the confirmed divergence before changing production code; run focused tests and capture red evidence. <!-- sdd-owner: implementation -->
- [ ] GREEN: make both characterization paths green without changing production behavior or either observed fiscal expectation. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add company/RUC/period isolation, empty-state, sign/rounding, account/document-state assertions only where supported by the selected callers; run both focused suites and the selected package suite. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: label every difference with caller/implementation identity and `authority: unresolved`; verify no public export, schema, UI, SUNAT/SIRE path, or unrelated file changed. <!-- sdd-owner: implementation -->
- [ ] Confirm PR 2A/2B evidence is green and the exact pair remains valid; if not, stop and return to the reachability/spec gate. <!-- sdd-owner: implementation -->
- [ ] RED: add a regression test proving both selected callers can share only equivalent mechanics while retaining distinct outputs; run it before production edits. <!-- sdd-owner: implementation -->
- [ ] GREEN: introduce one package-local pure assembler accepting already-scoped input and explicit caller policy; use flat interfaces, `unknown` instead of `any`, runtime const values with derived types, and existing money primitives. <!-- sdd-owner: implementation -->
- [ ] GREEN: move only proven-equivalent iteration, accumulation, and result-assembly mechanics; retain classification, sign, rounding, period interpretation, and output mapping in explicit caller policies unless authority proves equivalence. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: switch callers one at a time, running characterization tests after each switch; immediately revert the switch on any output/scope change and never update expectations to match. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: run focused/package unit and integration suites, `bun run typecheck`, `bun run lint:all`, quality commands through the comparator, then `bun run compliance:sire-repro` followed by `bun run compliance:sire-gate`; treat every failure as blocking evidence. <!-- sdd-owner: implementation -->
- [ ] Verify no public API/schema/migration/UI/SUNAT/SIRE implementation changed, no audit or RUC/company/period boundary weakened, the exact staged paths are allowlisted, and changed lines remain within budget. <!-- sdd-owner: implementation -->

## Deferred lifecycle actions

- [ ] Start or reuse the bounded implementation review only after apply and validate the receipt against the final reviewed paths; do not create a new review budget at a lifecycle gate. <!-- sdd-owner: parent -->
- [ ] Confirm each chained PR has predecessor/successor boundaries, independent verification evidence, delivery strategy `auto-chain`, and an explicitly selected chain strategy before apply. <!-- sdd-owner: parent -->
- [ ] Run the post-apply SDD verification and stop delivery on any critical mismatch, compliance failure, outside-path mutation, or unresolved reachability/authority gate. <!-- sdd-owner: parent -->
