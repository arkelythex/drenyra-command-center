# Architecture enforcement pack — make the `architecture:*` gates real

Branch: `chore/architecture-enforcement-pack`
Base: `main` @ `fc9cab98`
Test runner: `bun test` / `bun run <script>`; `bunx vitest run` for `apps/api`
Delivery: single PR, one work unit per commit

## Specs

- **S1 — No phantom gates.** Every `architecture:*` script in the root `package.json` MUST point at a file that exists and exits 0 on a clean tree, or the script MUST be removed. `bun run architecture:check-boundaries` must succeed on `main`.
  - Evidence of the current break: 7 of 10 targets reference files absent from the entire git history (`git log --all` over each path is empty): `audit-tsconfig-check-features.ts`, `check-package-boundaries.ts`, `enforcement-pack.ts`, `check-framework-isolation.ts`, `check-migration-governance.ts`, `score-module-extraction.ts`, `check-baseline-policy.ts`.
  - Live consumers that are broken today: `.github/workflows/release.yml:38` (`bun run architecture:check-boundaries`), `docs/CODEBASE-GUIDE.md:18`, `AGENTS.md:167`, `CLAUDE.md:49`, `CODEX-MAP.md:88`, `docs/10-development/odd-workflow.md:87`, `.github/workflows/README.md:17-21`.

- **S2 — Dependency direction is enforced.** `check-package-boundaries.ts` MUST read every workspace `package.json`, resolve the `@drenyra/*` graph, and fail when a package depends on a package of a higher architectural rank. Ranks are declared in one reviewable place, not inferred.

- **S3 — Framework isolation is enforced.** `check-framework-isolation.ts` MUST fail when a pure-layer package (`domain`, `application`, `shared`, `mission-*`, `workspace-domain`, `workspace-application`, `workspace-contracts`, `fiscal-*` domain packages) imports a delivery or persistence framework (`elysia`, `hono`, `fastify`, `express`, `react`, `react-dom`, `drizzle-orm`, `next`).

- **S4 — Typecheck baselines may only shrink.** `check-baseline-policy.ts` MUST fail when `.ci/typecheck-baseline.json` gains a key for a bucket, and MUST accept removals. `--update` rewrites the file. This is the gate that would have caught the 18 new buckets observed on PR #390.

- **S5 — Migrations are append-only and journal-consistent.** `check-migration-governance.ts` MUST fail when: a `.sql` file has no `_journal.json` entry; a journal `tag` has no `.sql`; a journal `idx` is skipped; or a previously recorded journal entry changed. Existing divergence is recorded in a committed lock file so the gate reports it as tracked debt instead of blocking CI, and new divergence fails.

- **S6 — tsconfig audit reports real signal.** `audit-tsconfig-check-features.ts` MUST list, per `tsconfig.check*.json`, the feature flags in use, whether `baseUrl` is set, and whether `paths` resolve — read-only, exit 0 unless a file is malformed.

- **S7 — Module extraction is measured, not guessed.** `score-module-extraction.ts` MUST print per-package fan-in, fan-out and instability (`fanOut / (fanIn + fanOut)`), sorted, as a report (exit 0).

- **S8 — One aggregator.** `enforcement-pack.ts` MUST run S2, S3, S4, S5 and S6 in sequence and exit non-zero if any fails, so `architecture:check-boundaries` is a single honest command.

- **S9 — No behaviour change outside the gates.** No production source under `apps/` or `packages/` is modified by this feature. Generated `apps/web/src/routeTree.gen.ts` is never committed.

- **S10 — Docs match reality.** `docs/CODEBASE-GUIDE.md`, `AGENTS.md`, `CLAUDE.md`, `CODEX-MAP.md`, `.github/workflows/README.md` describe the gates that now exist; no doc points at a phantom script.

## Known debt this feature surfaces (not fixed here)

- **Migration journal is out of sync with disk.** `packages/infrastructure/drizzle/meta/_journal.json` has 18 entries and the directory has 39 `.sql` files. 23 files are missing from the journal (`0019_idempotency_records` … `0034_mission_receipts_append_only`, plus `0001_add_ai_worker_queues`, `0007_add_ai_control_plane_tables`, and the `h02-rls-*` / `verify-*` helpers); 2 journal tags point at files that no longer exist (`0001_cool_lady_ursula`, `0007_loose_squirrel_girl`); `idx` 17 is missing. Repairing this changes applied-migration semantics and needs an explicit decision — it is recorded, gated and reported, not rewritten.
- 72 vulnerabilities on the default branch (6 critical, 32 high, 29 moderate, 5 low).
- 5 pre-existing API test failures plus the file-level `route-protection-matrix.test.ts`.
- `Coverage Thresholds` self-cancels at its 25-minute timeout on every PR.

## Tasks

| ID | Task | Specs | Route | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| T1 | Shared rule module + `check-package-boundaries.ts` | S1, S2 | inline | done | 542a6d6b |
| T2 | `check-framework-isolation.ts` | S3 | inline | done | 542a6d6b |
| T3 | `check-baseline-policy.ts` | S4 | inline | done | this PR |
| T4 | `check-migration-governance.ts` + lock | S5 | inline | done | this PR |
| T5 | `audit-tsconfig-check-features.ts` | S6 | inline | done | this PR |
| T6 | `score-module-extraction.ts` | S7 | inline | done | this PR |
| T7 | `enforcement-pack.ts` aggregator + `package.json` wiring | S8 | inline | done | this PR |
| T8 | Docs alignment | S10 | inline | done | this PR |

## Log

### L1 — User request (verbatim)
"perfect te autorizo todo , objetvio estar en la vanguardia elimina todo lo necesario para hacer limpieza , usa buenas practica de git , github + filosofia de gentleman objetivo avanzemos , tener en cuenta que drenyra-console debe tener buena arquitectura puede ser clean arquitecture o hexagonal architecture , principios solid , modularidad , patrones de diseño , diseño atomico , system desing , y muas mas buenas practicas objetivo calidad 10/10"

### L2 — User decision on sequencing (verbatim)
"Deuda primero, después Start (Recomendado)" — close the measurable debt before migrating `apps/web` to TanStack Start.

### L3 — Prior investigation found in the repo
`odd/tasks/web-tooling-health.md` already records the finding: 8 scripts referenced by the root `architecture:*` targets don't exist anywhere in history (`git log --all`), and "writing real package-boundary rules for this codebase requires an architectural decision, not a mechanical restoration". That decision is this feature.

### L4 — Measured package graph (all 29 packages + 2 apps)
`@drenyra/domain` and the `mission-*`, `workspace-domain`, `fiscal-agent-domain`, `fiscal-compliance-pipeline`, `fiscal-fsd`, `phase-gatekeeper`, `security`, `memory`, `ui`, `skill-sire-filing`, `agent-runtime` packages have zero `@drenyra/*` deps. `@drenyra/shared → @drenyra/domain`. `@drenyra/application → domain, shared`. `@drenyra/persistence → application, domain, shared`. `@drenyra/infrastructure → application, domain, persistence, security, shared`. `@drenyra/api → agent-runtime, ai, application, domain, infrastructure, security, shared`. `@drenyra/web → agent-runtime, api, application, domain, mission-domain, shared, ui`. Only `@drenyra/ai`, `@drenyra/api` and `@drenyra/web` depend on `@drenyra/infrastructure`. The graph is already clean, so the gate can pass on `main` without a rewrite.

### L5 — Migration governance defect (measured)
39 `.sql` files vs 18 journal entries; 23 unjournalled, 2 dangling tags, `idx` 17 skipped. Recorded in "Known debt" above.

### L6 — TypeScript 7 removed the programmatic config API

`audit-tsconfig-check-features.ts` was written first against `ts.readConfigFile`/`ts.parseJsonConfigFileContent`. The repo pins **TypeScript 7.0.2**, whose package root exports only `lib/version.cjs`: there is no `ts.sys`, no `readConfigFile`, and the compiler API moved behind `typescript/unstable/*`. Importing `typescript` therefore yields a module with no usable config helpers.

Decision: the audit ships its own JSONC reader and a shallow `extends` resolver instead of depending on an unstable subpath. It only needs option values, not a full program. `strict` is expanded through `STRICT_FAMILY` so a child that sets `strict: true` is not reported as relaxing the family it enables.

### L7 — the tsconfig audit found a real hole and it was fixed, not baselined

`apps/web/tsconfig.check.json` disabled `noUnusedLocals` and `noUnusedParameters` while the root program enforces both. That silently hid six unused declarations. Removing the two overrides surfaced them, and all six were fixed: an unused `isRisk` destructure in `SidePanel.tsx`, a dead `_DEFAULT_COMPANY_ID` constant in `EditInvoiceModal.tsx`, two unused parameters in `packages/domain/src/feos/{approval,workspace}.ts` renamed to `_actor`/`_error`, and a duplicate `FeosError` import in `tool-contract-router.ts`.

After the change `tsc -p apps/web/tsconfig.check.json --noEmit` reports zero TS6133 and the gate passes. Baselining the two relaxed options would have been the cheap move and would have kept the hole open.

### L8 — migration governance: 26 findings, deliberately recorded

`check-migration-governance.ts` reports 26 findings against the current tree: two journal entries point at files that no longer exist (`0001_cool_lady_ursula`, `0007_loose_squirrel_girl`), index 17 is missing from the journal, and 23 `.sql` files are not journaled at all.

None of this is repaired here. Editing an applied migration changes what a deployed database believes it has run, which is high-risk item 1. The gate records the current shape in `.ci/migration-lock.json` and refuses any future rename, removal or reorder, so the drift cannot grow while the repair is decided. Repair needs an explicit decision because it depends on what the production database actually applied.

### L9 — module extraction: 19 deep imports baselined with measured scores

`score-module-extraction.ts` measures how much of each package's real consumption goes through its published `exports` map. Scores: `@drenyra/infrastructure` 0.939, `@drenyra/shared` 0.957, `@drenyra/persistence` 0.985, `@drenyra/domain` 0.996, and 1.000 for the other 17 consumed packages.

The 19 deep imports are baselined, not fixed: each one is a real coupling that needs its surface designed, not a path rewrite. Four packages publish no `exports` map at all (`fiscal-fsd`, `fiscal-compliance-pipeline`, `phase-gatekeeper`, `web`) and are reported as warnings, because a package without a declared surface cannot be measured.

### L10 — `agent-runtime` reranked to adapter

`@drenyra/agent-runtime` declares `hono`, `@mastra/core`, `ai` and `@ai-sdk/openai` and exports `./serve`. It hosts an HTTP server, so it is a rank-3 adapter. Ranking it as a domain package would have reported its own legitimate dependencies as violations; the rerank removed a false positive instead of baselining it.

### L11 — surfaced debt outside this feature's scope

A script-target audit of root `package.json` found **66 scripts whose target file does not exist** in the repository or its git history. `quality:max-lines` is one of them, and `.github/workflows/release.yml:38` runs it inside the release quality gate, so that gate cannot pass either.

This is a separate defect class from the architecture gates: the gates were never written, these scripts lost their implementations. It needs its own ODD task (`script-registry-audit`) and is recorded here rather than fixed inline.
