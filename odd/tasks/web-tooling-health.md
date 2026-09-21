# Repo tooling health — SIRE check restoration + apps/web typecheck/lint

## Objective
Fix two of the three pre-existing, repo-wide tooling gaps flagged during the
apps-web-fiscal-country-plugin feature (merged to main via PR #218-#222):
restore the CLAUDE.md-mandated SIRE ledger reproducibility check, and fix
apps/web's broken typecheck/lint if it can be done safely without guessing.

## Explicitly NOT in scope
`bun run architecture:check-boundaries` (Gap 2). Investigation found this is
not a missing file but an undocumented, never-implemented convention: 8
scripts referenced by root package.json's `architecture:*` targets don't
exist anywhere in this repo's history (confirmed via `git log --all`), and
writing real package-boundary rules for this codebase requires an
architectural decision, not a mechanical restoration. Flagged for the user
separately; not touched here.

## Why
CLAUDE.md: "Si el código toca facturación o libros, DEBE pasar bun
scripts/sire-ledger-repro-check.ts" — this gate currently cannot run at all
because the script doesn't exist on main. That's a real, fiscal-critical gap
in this repo, independent of any feature work, worth closing on its own.
apps/web typecheck/lint being broken repo-wide blocks CI-quality confidence
for every future apps/web change.

## Constraints
- Cambio fiscal/CI-adjacent → isolated worktree per project CLAUDE.md.
- Do not fabricate a SIRE check — only restore the verified, byte-identical,
  dependency-intact version found on 3 unmerged branches (single origin
  commit `5affb78d4`).
- Do not touch the 5 sibling `compliance:sire-*` scripts also found missing
  (sire-ledger-repro-batch.ts, sire-ledger-gate-evaluate.ts,
  sire-governance-cohort-run.ts, sire-governance-signoff-run.ts,
  p3-sire-signoff-summary.ts) — each needs its own dependency-safety check
  not yet done; out of scope for this task.
- Do not guess a typescript-eslint fix; only apply it if a real compatible
  version can be confirmed (via web search/changelog), otherwise just fix
  `baseUrl` and leave lint's remaining failure documented.

## Tasks
- [x] **A. Restore `scripts/sire-ledger-repro-check.ts`** — cherry-pick
  commit `5affb78d4` (feat(sire): add ledger reproducibility check) onto
  main. Verify both its dependencies exist and match on current main:
  `ComplianceReproducibilityReport` type (`packages/domain/src/fiscal/compliance.types.ts`)
  and `ComplianceService.verifySireReproducibility` (`apps/api/src/services/compliance.service.ts`).
  Confirm it type-checks in isolation. Cannot functionally execute it
  end-to-end (needs a real company/period with SIRE data) — say so, don't
  overclaim.
- [x] **B. Fix apps/web `baseUrl` TS5102** (partial — see finding below) — remove the stale `baseUrl: "."`
  line from `apps/web/tsconfig.check.json` (TS 7's new default already
  resolves `paths` relative to the tsconfig file's own directory, which is
  numerically identical here — confirmed 516 `@/` import sites don't depend
  on a different value). Confirm `typecheck` gets past TS5102.
- [x] **C. Investigate typescript-eslint/TS 7.0.2 compatibility** — check
  if a `@typescript-eslint/*` release newer than the pinned `^8.65.0`
  supports TypeScript 7.0.2 (web search the changelog/compatibility table).
  If yes and it looks safe, bump and verify `lint` runs clean past the crash.
  If no confirmed compatible version exists, leave the pin alone and
  document the remaining lint failure — do not guess.
- [x] **D. Quality gates** — `bun run --cwd apps/web typecheck`, `lint`,
  `test:run`, `bunx biome check` on all changed files. Record real results.

## TDD mode resolution
Same as prior feature: no repo TDD gate found; verify each change with the
existing test/typecheck/lint commands rather than a RED-GREEN ceremony.

## Progress log
- 2026-09-20: Task doc created after investigating all 3 gaps via a
  dedicated research agent. Gap 2 explicitly excluded (see above).
- 2026-09-20: Task A done (commit `7cf9b755`, cherry-picked verbatim from
  origin commit `5affb78d4` on branch `feature/command-center-plugin-host-slice1`,
  clean cherry-pick, no conflicts). Verified: its own test suite
  (`sire-ledger-repro-check.test.ts`, 15 tests, mocked DB) passes against
  current main's `ComplianceService`/domain types; direct execution fails
  cleanly on missing `DATABASE_URL` (expected — no real DB in this
  environment, not a bug). Structural/dependency correctness confirmed;
  full functional run against real SIRE data not possible here.
- 2026-09-20: Task B — removed the stale `baseUrl: "."` line from
  `apps/web/tsconfig.check.json`. **This fixes the TS5102 config crash**
  (typecheck now runs instead of aborting immediately), but surfaces
  **688 real, pre-existing type errors** across `apps/web`, `packages/domain`,
  `packages/shared`, `packages/ui`, etc. — errors that were always there but
  invisible because typecheck couldn't get past the config bug.
  **Stopping here deliberately — this is a much bigger body of work than
  "fix baseUrl" and I will not attempt to fix 688 scattered type errors
  autonomously.** Found a directly relevant, already-existing branch:
  `chore/typecheck-strict-compliance` (535 files, +19,859/-5,060 lines vs.
  main) — clearly a prior, large, still-unmerged attempt at exactly this
  problem. Did not inspect or attempt to merge/reconcile it (too large and
  divergent to safely reason about in this pass) — flagging its existence
  for the user's own review/decision rather than guessing at integration.
  Keeping the `baseUrl` fix (it's a real, correct, isolated improvement:
  typecheck goes from "always crashes on a config bug, zero signal" to
  "runs and reports real, actionable errors").
- 2026-09-20: Task C — web search confirms **no compatible
  `typescript-eslint` release exists for TypeScript 7.0.2**: their published
  peer range only allows TS <6.1.0, and TS 7.0 has no stable programmatic
  API for tools like typescript-estree to embed (the real fix needs TS 7.1,
  expected ~October 2026 — not out yet). A documented workaround exists
  (alias `typescript` to the `@typescript/typescript6` compatibility package
  for tooling, use `@typescript/native-preview` (`tsgo`) separately for fast
  CI typechecking) but that's an invasive, whole-monorepo tooling change —
  out of scope to apply without an explicit decision. `lint` for apps/web
  stays broken; documented, not silently left unexplained.
- 2026-09-20: Task D — `bunx biome check` clean on all 3 changed/restored
  files (tsconfig.check.json, sire-ledger-repro-check.ts + its test).
  `apps/web typecheck` now runs (688 pre-existing errors, see above,
  out of scope). `apps/web lint` still fails (pre-existing, confirmed
  unfixable without an invasive workaround, see Task C). Did not re-run the
  full `apps/web test:run` — no apps/web source file was touched in this
  task (only tsconfig + root-level scripts), so the prior feature's
  established baseline (18 failed/21 failed pre-existing, 525 passing)
  is unaffected by definition.

## Summary for user
Task A: SIRE reproducibility check restored and structurally verified.
Task B: config bug fixed; typecheck runs again but reveals 688 real,
pre-existing errors — deliberately not fixed here, flagging
`chore/typecheck-strict-compliance` as likely-relevant prior work.
Task C: researched, confirmed no clean fix exists upstream for
typescript-eslint/TS 7.0.2; documented the available workaround without
applying it.

## Post-merge CI verification (2026-09-20)
Split into 2 independent stacked PRs (not a chain — these fixes don't
depend on each other): PR#224 (SIRE restore) merged first, PR#225
(baseUrl fix) merged second, both to `main`.

**PR#225 was merged before its CI checks finished** — caught this
immediately after and verified real CI results rather than assuming
success. Findings, compared against `main` at multiple points *before*
this session touched anything (`7c87151d2`, the original tip; `380375f8e`,
after the earlier fiscal-plugin tracker merge):
- `Node — web typecheck`: failing before (`TS5102` baseUrl crash, confirmed
  in CI logs, byte-identical to the local finding) and still failing after
  (688 real errors now visible instead) — same status, different/more
  useful reason, exactly as documented in PR#225's description. Not a
  regression.
- `Fiscal Boundary Check`, `Lint Check`, `Security Audit`: confirmed
  failing on `7c87151d2` (before this entire session) and on `380375f8e`
  (before this branch) — pre-existing, unrelated to anything in this task.
  **New finding**: these two additional broken gates (Fiscal Boundary
  Check, Security Audit) weren't previously flagged in this session — the
  earlier gap list only covered typecheck/lint/architecture-boundaries/SIRE.
  Not investigated further or fixed here — flagging for the user, same as
  Gap 2, rather than expanding scope a third time in one session.
- No new CI failure was introduced by either merged PR.
