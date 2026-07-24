# Technical Design: Monorepo Quality Baseline and Balance-Sheet Consistency

## 1. Design intent

Deliver evidence before remediation. The implementation must make quality failures repeatable and comparable, then characterize the balance-sheet paths before sharing any production mechanics. It must not choose an accounting result, hide existing debt, or absorb unrelated worktree content.

This design deliberately separates quality tooling from fiscal code and keeps every implementation PR at or below 400 changed lines.

## 2. Verified repository evidence

### 2.1 Quality entry points

The root `package.json` currently exposes:

- `typecheck`: `tsc -p tsconfig.check.json`
- `lint:all`: `biome check .`
- `quality:dead-code`: `knip`
- `quality:circular`: `madge --circular --extensions ts,tsx apps/ packages/`
- `quality:core`: `./scripts/dev/quality-core.sh`

The referenced `scripts/dev/quality-core.sh` does not exist in the inspected workspace. This is a verified missing entry point. No conclusion is made that it is the proposal's only broken architecture entry point.

`package.json` declares TypeScript `~7.0.2` and Madge `^8.0.0`. The proposal records a TypeScript API compatibility failure from Madge, but dependency declarations alone do not prove its root cause. Any dependency or configuration change therefore requires a captured command transcript and a minimal reproduction first.

The current signal scopes are materially different:

- `tsconfig.check.json` includes selected API, domain, shared, persistence, and infrastructure paths and excludes tests.
- `biome.json` applies repository-wide includes with documented exclusions.
- `knip.json` defines selected entry points but a broad `apps/**/*` and `packages/**/*` project set.

A baseline comparison must retain each command's own scope; it must not present these checks as equivalent whole-repository coverage.

### 2.2 Balance-sheet candidates and callers

Repository evidence reveals more than two balance-sheet implementations. The apply phase must not guess which two the proposal intended.

| Candidate                      | Confirmed path                                                                                                      | Confirmed direct evidence                                                                                                                 | Reachability evidence from static search                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API function query             | `apps/api/src/features/reports/application/queries/get-balance-sheet.ts`                                            | Aggregates PEN invoice `balanceDue` and bill `totalAmount` by `companyId` and `asOfDate`; returns string totals                           | Called by `apps/api/src/features/reports/routes.ts` and `apps/api/src/features/reports/_internal/default-instance.ts`; the latter is consumed by ledger MVP through `ReportsService` |
| API class query                | `apps/api/src/features/reports/queries/get-balance-sheet.query.ts`                                                  | Near-duplicate of the API function query                                                                                                  | Constructed by `apps/api/src/features/reports/application/services/reporting.service.ts`; no further caller was confirmed by the inspected search                                    |
| Application service method     | `packages/application/src/services/FinancialReportsService.ts` (`generateBalanceSheet`)                             | Loads organization/account balances, classifies PCGE-style accounts, applies absolute values to liability/equity totals and rounds totals | Covered by `packages/application/src/services/__tests__/FinancialReportsService.test.ts`; no application caller outside tests was confirmed by the inspected search                  |
| Extracted application function | `packages/application/src/services/financial-reports/balance-sheet.generator.ts` (`generateBalanceSheetReport`)     | Mechanics match the inspected service method                                                                                              | Exported from the local `financial-reports/index.ts`; no direct caller was confirmed by the inspected search                                                                         |
| Standalone static generator    | `packages/application/src/services/financial-reports.balance-sheet.generator.ts` (`BalanceSheetGenerator.generate`) | Uses a different account classifier, current/non-current split, sign handling, and no explicit two-decimal total rounding                 | No direct caller was confirmed by the inspected search                                                                                                                               |

The confirmed divergences are between candidate implementations, but runtime ownership and the exact intended pair remain unresolved. In particular, the API report has a different input/output contract from the application-layer PCGE report and must not be consolidated with it merely because both are called a balance sheet.

`apps/api/MAP.md` confirms the `apps/api/src/features/reports/` feature boundary and purpose. No human or CODEOWNERS owner for the application-layer candidates was established from the inspected evidence; accounting authority remains an explicit external approval, not an inferred code owner.

## 3. Architecture decisions

### D1. Use an evidence manifest, not a pass/fail baseline count

Introduce a small quality runner/comparator that records one result per command:

```text
QualityRun
  run identity (commit/tree identity, command, tool version, timestamp)
  repository context
  exit classification: pass | findings | tool-failure | missing-entry-point
  normalized finding identities
  raw-output artifact reference
```

A normalized finding identity consists of tool, rule/diagnostic code when available, repository-relative path, and normalized message. Location is retained as evidence but is not the sole identity because harmless line movement must not silently create or erase debt. The comparator reports:

- matching baseline debt;
- removed debt;
- new finding;
- changed finding;
- command/tool/scope drift;
- tool failure.

Only `new finding`, `changed finding`, command/tool/scope drift, and tool failure are actionable for regression gating. Existing findings stay visible. Updating the accepted manifest is a separate explicit operation and must not occur during ordinary comparison.

Raw output remains available for audit. Counts are summaries, never the acceptance contract.

### D2. Probe before repairing a quality command

For every selected command, capture twice from the root without source changes:

1. exact command and working directory;
2. relevant tool versions;
3. exit code and raw stdout/stderr;
4. stable or unstable aspects between runs;
5. observed failure separately from hypotheses.

The missing `quality:core` target may be restored only after identifying its intended contract from repository history/documentation or replaced with an explicitly named command whose scope is documented. Madge dependency/configuration changes are blocked until a minimal reproduction proves the incompatibility. Knip remains non-blocking unless classification evidence makes it reliable.

### D3. Select the fiscal target by reachability evidence

Before writing characterization tests, create a caller map for all candidates in Section 2.2 using imports, exports, dependency injection/container registration, route composition, package exports, and runtime composition roots. Worktree copies under `worktrees/**` are not callers and are excluded.

The target pair is selected only when evidence establishes:

- two distinct production implementations of the same fiscal contract;
- at least one affected caller contract for each, or an explicit decision that one is dead code;
- the precise semantic differences;
- the package boundary responsible for each path.

If this gate cannot identify exactly two implementations matching the proposal, stop the fiscal slice and amend the proposal/spec instead of broadening scope.

### D4. Characterize callers before internals

Strict TDD begins at caller-observable boundaries:

1. add a failing test that demonstrates a currently unrecorded caller behavior or divergence;
2. run only that test and record the expected red reason;
3. add the smallest fixture/harness needed to observe existing behavior, without changing expected fiscal output;
4. make the characterization pass against the unchanged implementation;
5. only after both callers are covered may a production seam be introduced.

Fixtures include only dimensions actually supported by the selected callers: company/organization, RUC, period or as-of date, account/document states, empty state, sign/rounding edge, and the evidenced divergence. Every fiscal fixture uses a distinct RUC/company scope. Tests compare complete observable output except nondeterministic metadata such as `generatedAt`, which is controlled by an injected/fake clock or asserted separately.

Characterization does not declare observed behavior correct. Divergent expectations are labeled with implementation/caller identity and `authority: unresolved`.

### D5. Share assembly mechanics through an explicit policy seam

The smallest permitted seam is a package-local pure assembler used only by the selected pair. It receives already-scoped input and an explicit caller policy; it does not query storage, resolve RUC/company scope, or reinterpret periods.

Conceptual contract:

```text
assembleBalanceSheet(scopedInput, callerPolicy) -> existing caller result

callerPolicy:
  classify account/document contribution
  classify current versus non-current when applicable
  normalize signs
  round totals
  determine balanced status
  map to the caller's existing output shape
```

The concrete TypeScript types must use runtime const values plus derived types, flat interfaces, `unknown` rather than `any`, and existing money primitives where the selected path already uses them. The seam must remain internal to the owning package/feature and must not alter package exports unless caller evidence requires an existing export to be preserved.

Only mechanics proven equivalent are moved into the assembler: stable iteration, bucket accumulation, and result assembly are candidates. Classification, sign normalization, rounding, period interpretation, and output mapping remain explicit policies until accounting authority proves equivalence. The seam must not convert the API invoice/payable report into the application PCGE account report.

### D6. Accounting authority is a hard gate

No test expectation representing a fiscal result may be changed to make implementations agree unless the change records:

- the approving accounting authority;
- the approved canonical rule and effective scope;
- characterization evidence for every caller;
- the resulting compliance evidence.

Without that record, consolidation must preserve both outputs. If a shared seam cannot do so simply, retain the duplicate and document the blocked consolidation; duplication is safer than unauthorized fiscal change.

## 4. Data flow

### Quality flow

```text
root command -> isolated process capture -> raw result
             -> tool-specific parser -> normalized findings
             -> compare with immutable accepted manifest
             -> baseline debt + regressions + tool failures
```

Parsers never rewrite source files. Formatter/fixer modes are forbidden during baseline capture. A parser failure is a `tool-failure`, not a pass.

### Fiscal flow

```text
existing caller
  -> existing scope/data-source boundary (unchanged)
  -> already-scoped records/accounts
  -> package-local assembler + explicit caller policy
  -> existing output mapper/schema
  -> existing caller contract
```

RUC/company/period acquisition stays outside the seam and unchanged. The output is compared with the pre-seam characterization fixture.

## 5. Intended paths and worktree isolation

The following are the only path families that task planning may authorize. Each PR must narrow this list to exact files before implementation.

### Quality slices

- `package.json` (script wiring only)
- `scripts/quality/quality-baseline.ts` (new; runner/comparator)
- `scripts/quality/__tests__/quality-baseline.test.ts` (new)
- `reports/quality/monorepo-quality-baseline.json` (new accepted evidence manifest)
- `reports/quality/README.md` (new command context, limitations, update policy)
- one proven minimal configuration/dependency file, only if the probe establishes necessity: `knip.json`, `tsconfig.check.json`, `biome.json`, or the lockfile/package manifest

### Fiscal characterization and consolidation slices

Only after D3 selects the exact pair:

- the selected implementation files from Section 2.2;
- their existing direct caller files only when test injection requires a non-behavioral seam;
- co-located `__tests__/` characterization files in the selected package/feature;
- one new package-local internal assembler/policy file beside the selected implementation;
- an evidence note under `reports/quality/` or this OpenSpec change describing unresolved fiscal differences.

### Explicit exclusions

- `worktrees/**`
- all database schema/migration paths
- SUNAT/SIRE implementation paths
- UI and E2E files unless a later spec amendment proves a protected caller cannot be characterized below that boundary
- generated `.js`, `.d.ts`, and source-map artifacts already present beside TypeScript
- every pre-existing tracked modification or untracked path not explicitly allowlisted for the active PR
- unrelated dependency upgrades, formatting, cleanup, and diagnostic fixes

Before each PR, record `git status --porcelain=v2 --untracked-files=all` and content hashes for every pre-existing untracked file outside the allowlist. Store the snapshot outside the repository or in the review evidence system so the act of protecting untracked work does not adopt it. After every mutating command and before staging, compare status and hashes. Any outside-path change stops the slice.

The current design environment did not provide Git status evidence, so no path is labeled as pre-existing untracked here. That status must be captured immediately before apply; absence of an enumeration is not permission to touch those files.

## 6. Exact implementation and validation sequence

### PR 1A — Quality probes and explicit command contract (target: <=250 changed lines)

1. Freeze intended paths and hash excluded untracked files.
2. Record repository/tree identity and tool versions.
3. Run twice, without fix flags: `bun run typecheck`, `bun run lint:all`, `bun run quality:dead-code`, `bun run quality:circular`, and `bun run quality:core`.
4. Save raw outputs outside source paths; classify only observed outcomes.
5. Add tests for process-result classification, including missing entry point and tool crash.
6. Run the new test alone; confirm red for the missing behavior, then implement only classification/command wiring.
7. Repeat the five commands twice and document deterministic versus unresolved results.
8. Verify no outside-path or untracked hash changed.
9. Stop if changed lines approach 350; split documentation/evidence into PR 1B.

Rollback point: revert script wiring and runner files. No baseline manifest is accepted yet, so rollback cannot suppress findings.

### PR 1B — Baseline comparison and honest dead-code status (target: <=350 changed lines)

1. Re-freeze paths/hashes from the predecessor tree.
2. Add comparator tests: matching debt remains visible, a new representative diagnostic blocks, changed command/tool/scope is drift, parser failure is not pass, Knip noise can be non-blocking but not clean.
3. Confirm tests fail before comparator implementation.
4. Implement normalized comparison and explicit baseline-update separation.
5. Capture the accepted manifest from unchanged source inputs; include command context and run identity.
6. Inject a representative regression only in a temporary test fixture/sandbox, prove it is reported, and remove the fixture mutation before final evidence capture.
7. Run comparator tests, then the documented quality commands twice.
8. Confirm the accepted manifest was not automatically rewritten.
9. Verify path/hashes and line count.

Rollback point: revert comparator/manifest/docs together. PR 1A's raw command classification remains usable.

### PR 2A — Fiscal reachability and first caller characterization (target: <=300 changed lines)

1. Freeze paths/hashes.
2. Complete D3 caller map and select the target pair. Stop for spec amendment if exactly two matching production paths cannot be evidenced.
3. Record current input/output contracts and all observed differences; do not name a canonical result.
4. Add one caller-boundary characterization test with unique company/RUC and controlled time.
5. Run that test and record the intended red reason (missing characterization harness/assertion), not a production failure manufactured by changing code.
6. Complete the fixture against unchanged production code and make it green.
7. Run the selected package test command through its verified Bun script: `cd packages/application && bun run test -- <test-path>` or `cd apps/api && bun run test:run -- <test-path>`, according to the selected caller. These map respectively to the package-declared `vitest run` and `vitest run` scripts; only Bun command execution is permitted.
8. Verify no production file changed and no excluded hash changed.

Rollback point: revert characterization-only files; no production or data rollback.

### PR 2B — Second caller and divergence characterization (target: <=300 changed lines)

1. Repeat the freeze.
2. Add the second caller contract and explicit divergent fixture first.
3. Record red, then make characterization green without changing production behavior or either expected result.
4. Add scope-isolation/empty-state/sign-rounding assertions only where supported by current behavior.
5. Run both focused suites and the package test suite.
6. Record `authority: unresolved` for every difference and verify boundaries/hashes.

Rollback point: revert only PR 2B tests/evidence; PR 2A remains valid.

### PR 3 — Evidence-preserving seam (target: <=350 changed lines)

1. Freeze paths/hashes and verify PR 2A/2B characterization suites are green.
2. Add a failing regression test proving both selected callers can delegate equivalent mechanics while retaining their distinct outputs.
3. Introduce one package-local pure assembler and explicit caller policies.
4. Move only proven-equivalent mechanics; leave unresolved rules in caller policies/adapters.
5. Run focused characterization tests after each caller switches. If either output changes, revert that caller switch immediately; do not update the expectation.
6. Run the selected package unit and integration suites.
7. Run root `bun run typecheck` and `bun run lint:all` through the baseline comparator; require no new/changed findings.
8. Because fiscal execution paths changed, run `bun run compliance:sire-repro` followed by `bun run compliance:sire-gate`. A failure is evidence and blocks delivery.
9. Run architecture/dead-code commands through their documented classifications; no tool failure may be called a pass.
10. Confirm no public export/schema, database migration, UI, SUNAT, or SIRE implementation changed.
11. Verify status/hashes, staged path allowlist, and changed-line count before review.

Rollback point A: before switching the first caller, delete the unused seam. Rollback point B: after one caller switch, revert only that adapter and keep characterization. Rollback point C: if final outputs or compliance differ, revert all PR 3 production changes while retaining PR 2 characterization.

## 7. Test contracts

### Quality runner contract

- Never invokes write/fix modes.
- Preserves raw exit code and output.
- Distinguishes findings from execution failure.
- Refuses comparison when command, tool version, repository scope, or parser version is incompatible with the accepted manifest.
- Never updates the accepted manifest as a side effect of checking.
- Detects a representative new finding.

### Fiscal seam contract

- Accepts only data already scoped by the existing caller.
- Does not fetch global data or infer RUC/company/period.
- Preserves existing money/sign/rounding mechanics per caller.
- Produces each caller's existing output shape.
- Makes unresolved differences explicit in named policies.
- Has no public API, persistence, or migration effect.

## 8. Risks and controls

- **Wrong pair selected:** D3 is a blocking reachability gate; amend the spec instead of guessing.
- **Characterization blesses a defect:** expectations are labeled observed, not canonical; authority remains required.
- **Baseline hides regressions:** immutable comparison plus representative-regression proof; no automatic update.
- **Tool repair based on hypothesis:** probe and minimal reproduction precede dependency/config changes.
- **Shared policy becomes a generic fiscal engine:** package-local seam, selected pair only, no storage or scope logic.
- **Untracked work is adopted:** exact allowlist plus external hashes before every mutating step.
- **Review overload:** stop at 350 forecasted lines and split before the hard 400-line limit.

## 9. Deferred decisions

- The exact two fiscal implementations to consolidate, pending D3 reachability evidence.
- Any canonical classification, sign, rounding, current/non-current, or period rule, pending accounting authority.
- The cause and repair of the Madge crash, pending a minimal reproduction.
- Whether Knip can become blocking, pending evidenced noise classification.
- Human/accounting ownership, because no authoritative owner metadata was established in the inspected artifacts/code.
