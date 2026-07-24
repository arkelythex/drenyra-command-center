# Implementation Tasks: Monorepo Quality Baseline and Balance-Sheet Consistency

## Review Workload Forecast

| Field                   | Value                                                           |
| ----------------------- | --------------------------------------------------------------- |
| Estimated changed lines | 150–350 per PR; approximately 1,000–1,400 total across five PRs |
| 400-line budget risk    | High                                                            |
| Chained PRs recommended | Yes                                                             |
| Suggested split         | PR 1A → PR 1B → PR 2A → PR 2B → PR 3                            |
| Delivery strategy       | auto-chain                                                      |
| Chain strategy          | pending                                                         |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Global execution gates

- [x] Freeze `git status --porcelain=v2 --untracked-files=all`, intended exact paths, and hashes of every pre-existing untracked file outside the active allowlist before each PR; repeat after every mutating command and before staging. Stop immediately if an outside path changes, is staged, or is adopted. <!-- sdd-owner: implementation -->
- [x] Use only Bun-compatible commands (`bun run`, `bunx` only when required by an existing script); never invoke `npm` or `npx`. <!-- sdd-owner: implementation -->
- [x] Keep each PR at or below 400 changed lines; stop at 350 forecasted lines and split by the boundaries below rather than compressing review evidence. <!-- sdd-owner: implementation -->
- [x] Do not edit database schemas/migrations, SUNAT/SIRE implementation, UI/E2E files, generated artifacts, unrelated dependencies, unrelated diagnostics, `worktrees/**`, or any file outside the active exact allowlist. <!-- sdd-owner: implementation -->
- [x] Do not change a fiscal expectation, public API, persistence schema, fiscal scope, money primitive, rounding rule, audit behavior, or compliance policy without the specified evidence and authority gate. <!-- sdd-owner: implementation -->

## PR 1A — Quality probes and command contract

**Allowlist:** `package.json` (script wiring only), `scripts/quality/quality-baseline.ts`, `scripts/quality/__tests__/quality-baseline.test.ts`, `reports/quality/README.md`; one configuration/lockfile path only if a probe proves necessity.

- [x] Capture repository/tree identity, relevant tool versions, and two root-level runs each of `bun run typecheck`, `bun run lint:all`, `bun run quality:dead-code`, `bun run quality:circular`, and `bun run quality:core`, preserving raw stdout/stderr, exit code, working directory, and observed failure separately from hypotheses. <!-- sdd-owner: implementation -->
- [x] RED: add focused tests for process-result classification, including success/findings, missing entry point, and tool crash; run only the focused test and record the expected red reason before implementation. <!-- sdd-owner: implementation -->
- [x] GREEN: implement only command capture/classification and the minimum script wiring needed to expose the documented contract; never enable formatter/fixer modes or rewrite source files. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE: run the focused tests twice and all five quality commands twice through Bun; verify repeatability, explicit failure classification, raw-output retention, and no outside-path/hash changes. <!-- sdd-owner: implementation -->
- [x] REFACTOR: keep the runner small and deterministic, document command context and limitations in `reports/quality/README.md`, and stop if the forecast approaches 350 lines. <!-- sdd-owner: implementation -->

**Finish evidence:** focused test transcript, ten command results, tool-version/context record, classification output, and clean allowlist/hash comparison. **Rollback:** revert only PR 1A files; no accepted baseline may be used to suppress findings.

## PR 1B — Baseline comparator and honest dead-code status

**Allowlist:** `scripts/quality/quality-baseline.ts`, `scripts/quality/__tests__/quality-baseline.test.ts`, `reports/quality/monorepo-quality-baseline.json`, `reports/quality/README.md`, and only a proven configuration path.

- [ ] RED: add comparator tests proving matching debt remains visible, a representative new finding is actionable, changed command/tool/scope is drift, parser failure is not pass, and noisy Knip results are non-blocking but not clean; run focused tests and capture red evidence. <!-- sdd-owner: implementation -->
- [ ] GREEN: implement normalized finding identities, immutable accepted-manifest comparison, explicit baseline-update separation, and classifications for baseline debt, removed debt, new/changed finding, drift, and tool failure. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: capture the accepted manifest from unchanged inputs, inject a temporary sandbox-only representative regression, prove it is reported, remove the temporary mutation, then run comparator tests and documented commands twice. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: document Knip's evidenced gate status and update policy; verify ordinary comparison never rewrites `reports/quality/monorepo-quality-baseline.json`. <!-- sdd-owner: implementation -->

**Finish evidence:** comparator test transcript, accepted manifest with run identity/context, regression-detection transcript, two-run command evidence, and path/hash/line-count proof. **Rollback:** revert comparator, manifest, and documentation together; retain PR 1A classification if possible.

## PR 2A — Reachability gate and first caller characterization

**Allowlist:** exact caller/implementation/test files selected only after the reachability gate, plus one evidence note under `reports/quality/` or this change directory. No production file may be changed in this PR.

- [ ] Build a caller map for every candidate in `design.md` using imports/exports, dependency injection, container registration, route composition, package exports, and runtime composition roots; exclude `worktrees/**`. <!-- sdd-owner: implementation -->
- [ ] **BLOCKING REACHABILITY GATE:** evidence exactly two distinct production implementations of the same fiscal contract, at least one affected caller contract for each (or an explicit dead-code decision), precise semantic differences, and owning package boundary. If this cannot be proven, stop the fiscal slice and amend the proposal/spec; do not guess or broaden the pair. <!-- sdd-owner: implementation -->
- [ ] Record the selected pair, caller contracts, supported dimensions, observed differences, and `authority: unresolved`; do not name a canonical output. <!-- sdd-owner: implementation -->
- [ ] RED: add one caller-boundary characterization test with distinct company/RUC scope and controlled time; run it alone and record the harness/assertion red reason without manufacturing a production failure. <!-- sdd-owner: implementation -->
- [ ] GREEN: complete the minimum fixtures/harness against unchanged production code and make the characterization pass; assert complete observable output while isolating only nondeterministic metadata. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE/REFACTOR: run the selected package test script via Bun (`cd packages/application && bun run test -- <test-path>` or `cd apps/api && bun run test:run -- <test-path>`), confirm production files are unchanged, and verify scope/hashes. <!-- sdd-owner: implementation -->

**Finish evidence:** caller map, exact-pair gate decision, red/green transcript, characterization fixture/output record, and zero-production-change proof. **Stop condition:** any ambiguity about the exact pair blocks PR 2B and PR 3.

## PR 2B — Second caller and divergence characterization

**Allowlist:** only the second caller's co-located characterization tests and the evidence note, plus exact selected caller files if test injection is proven necessary.

- [ ] RED: add the second caller contract and an explicit fixture exposing the confirmed divergence before changing production code; run focused tests and capture red evidence. <!-- sdd-owner: implementation -->
- [ ] GREEN: make both characterization paths green without changing production behavior or either observed fiscal expectation. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: add company/RUC/period isolation, empty-state, sign/rounding, account/document-state assertions only where supported by the selected callers; run both focused suites and the selected package suite. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: label every difference with caller/implementation identity and `authority: unresolved`; verify no public export, schema, UI, SUNAT/SIRE path, or unrelated file changed. <!-- sdd-owner: implementation -->

**Finish evidence:** second red/green transcript, complete caller-output comparisons, divergence evidence, focused/package test transcript, and boundary/hash proof. **Stop condition:** any output mismatch unexplained by pre-change evidence blocks consolidation.

## PR 3 — Evidence-preserving internal seam

**Allowlist:** selected implementation files, one package-local assembler/policy file, selected direct callers only when required for a non-behavioral seam, characterization tests, and one evidence note.

- [ ] Confirm PR 2A/2B evidence is green and the exact pair remains valid; if not, stop and return to the reachability/spec gate. <!-- sdd-owner: implementation -->
- [ ] RED: add a regression test proving both selected callers can share only equivalent mechanics while retaining distinct outputs; run it before production edits. <!-- sdd-owner: implementation -->
- [ ] GREEN: introduce one package-local pure assembler accepting already-scoped input and explicit caller policy; use flat interfaces, `unknown` instead of `any`, runtime const values with derived types, and existing money primitives. <!-- sdd-owner: implementation -->
- [ ] GREEN: move only proven-equivalent iteration, accumulation, and result-assembly mechanics; retain classification, sign, rounding, period interpretation, and output mapping in explicit caller policies unless authority proves equivalence. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: switch callers one at a time, running characterization tests after each switch; immediately revert the switch on any output/scope change and never update expectations to match. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: run focused/package unit and integration suites, `bun run typecheck`, `bun run lint:all`, quality commands through the comparator, then `bun run compliance:sire-repro` followed by `bun run compliance:sire-gate`; treat every failure as blocking evidence. <!-- sdd-owner: implementation -->
- [ ] Verify no public API/schema/migration/UI/SUNAT/SIRE implementation changed, no audit or RUC/company/period boundary weakened, the exact staged paths are allowlisted, and changed lines remain within budget. <!-- sdd-owner: implementation -->

**Finish evidence:** red test, seam diff, per-caller green transcripts, package/root/compliance evidence, comparator result with no new/changed findings, boundary review, status/hash snapshot, and line count. **Rollback:** delete unused seam before first switch; otherwise revert the affected adapter or all PR 3 production changes while retaining characterization tests.

## Parent-owned lifecycle actions

- [ ] Start or reuse the bounded implementation review only after apply and validate the receipt against the final reviewed paths; do not create a new review budget at a lifecycle gate. <!-- sdd-owner: parent -->
- [ ] Confirm each chained PR has predecessor/successor boundaries, independent verification evidence, delivery strategy `auto-chain`, and an explicitly selected chain strategy before apply. <!-- sdd-owner: parent -->
- [ ] Run the post-apply SDD verification and stop delivery on any critical mismatch, compliance failure, outside-path mutation, or unresolved reachability/authority gate. <!-- sdd-owner: parent -->
