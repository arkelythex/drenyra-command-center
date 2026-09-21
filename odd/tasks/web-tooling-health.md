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
- [ ] **B. Fix apps/web `baseUrl` TS5102** — remove the stale `baseUrl: "."`
  line from `apps/web/tsconfig.check.json` (TS 7's new default already
  resolves `paths` relative to the tsconfig file's own directory, which is
  numerically identical here — confirmed 516 `@/` import sites don't depend
  on a different value). Confirm `typecheck` gets past TS5102.
- [ ] **C. Investigate typescript-eslint/TS 7.0.2 compatibility** — check
  if a `@typescript-eslint/*` release newer than the pinned `^8.65.0`
  supports TypeScript 7.0.2 (web search the changelog/compatibility table).
  If yes and it looks safe, bump and verify `lint` runs clean past the crash.
  If no confirmed compatible version exists, leave the pin alone and
  document the remaining lint failure — do not guess.
- [ ] **D. Quality gates** — `bun run --cwd apps/web typecheck`, `lint`,
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
