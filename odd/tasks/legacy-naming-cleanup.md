# Legacy naming cleanup — Command Center / Pi → Desktop / Shell

Objective: remove the retired product names (`Drenyra Command Center`, `Drenyra Pi`) from this repository's documentation, metadata and scripts so the codebase matches the renamed repositories `drenyra-desktop` and `drenyra-shell`.
Branch: `docs/legacy-naming-cleanup` · Delivery: single docs PR · Runner: `bun`

## Specs

- **S1** — `Drenyra Command Center` and every case variant of "command center" used as a product name must not appear in tracked documentation, metadata or scripts. Replacement text: `Drenyra Desktop`.
- **S2** — The retired harness name `Drenyra Pi` / `drenyra-pi` must not appear in tracked documentation. Replacement text: `Drenyra Shell` / `drenyra-shell`.
- **S3** — Repository URLs and package metadata must point at `arkelythex/drenyra-desktop`, never `arkelythex/drenyra-command-center`.
- **S4** — Historical records are excluded from S1/S2: `odd/tasks/**` (past task logs), `CHANGELOG.md`, and git history keep their original wording.
- **S5** — No link may break: every relative link and referenced filename must still resolve after the change.
- **S6** — Out of scope, pending an explicit decision (structural rename): code identifiers and directory names (`apps/api/src/features/fiscal/command-center/`, `apps/api/src/features/drenyra/command-center*.routes.ts`, `e2e/drenyra-command-center/`, `test:e2e:command-center`), diagram filenames (`docs/diagrams/drenyra-command-center.architecture.*`) and `docs/01-foundation/drenyra-pi-harness.md`.

## Tasks

| ID | Scope | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | Package metadata URLs point at `drenyra-desktop` | S3 | inline | done | 16 files; see L5 |
| T2 | Documentation prose uses Desktop / Shell names | S1,S2,S4,S5 | inline | done | 41 files / 180 replacements + grammar pass; see L5 |
| T3 | Structural renames of code directories, diagram files and the Pi harness doc | S6 | inline | pending | blocked on scope decision |
| T4 | Retired product name in API strings, route descriptions and test titles | S1 | inline | done | commit `722d0797`; see L8 |

## Log

- **L1** — User request (2026-10-27, verbatim): "actualiza tambien aqui , https://github.com/arkelythex o la informacion legacy ya que todo se ha actualizado todo debe estar coherente y sincronizado , eliminar legacy"
- **L2** — User follow-up (verbatim): "yes continue" — authorizes starting with this repository after the org profile repo was synced.
- **L3** — Inventory at start: 67 tracked files contain "command center", 43 contain the `drenyra-command-center` slug, 19 contain `drenyra-pi`. Untracked noise (`~/…` bun cache, `.pi-subagents/artifacts/`) inflates raw grep counts and is ignored.
- **L4** — Decision: S6 structural renames stay out of this feature because they change imports, CI scripts and published diagram URLs; they need their own verification pass.
- **L5** — T1 + T2 applied (2026-10-27): repo URLs → `arkelythex/drenyra-desktop` in 16 files; ordered prose replacements over `.md`/`.txt` (excluding `odd/tasks/**`, `CHANGELOG.md`, `docs/diagrams/`) → 41 files / 180 replacements; a grammar pass fixed 7 files where the mechanical substitution produced duplicated or ungrammatical text ("Drenyra AI Drenyra Desktop UI" → "Drenyra AI desktop UI", "is the **Drenyra Desktop**" → "is the **accounting desktop**", etc.). `llms.txt`/`llms-full.txt`/`.codebase/index.yml` regenerated with `bun run docs:agent-index`. Residual audit: "Drenyra Pi" = 0; `drenyra-pi` only as the deferred filename `drenyra-pi-harness.md`.
- **L6** — Remaining "command center" hits (69 tracked lines) live only in code: API error/route strings (`apps/api/src/app-core.ts:186`, `features/drenyra/command-center.shared.ts`, `drenyra-command-center-http.ts`, `drenyra-context.ts`, `drenyra-command-envelope-route-guards.ts`), the chat-history seed title `Command Center Chat` (`apps/api/src/features/drenyra/chat-history.routes.ts:107`), the inbox dashboard comment, and test titles/descriptions. These are user-visible product strings but changing them is a behaviour/contract change that needs its own test pass, so they are tracked as T4 instead of being bundled with the docs rename.
- **L7** — Verification evidence for T1/T2: `bun run docs:check-links` and `bun run docs:check-freshness` both fail on **pre-existing** issues unrelated to this change — every link failure is under `~/.bun/install/cache/**` (the scanner follows the broken `~/` directory in the worktree) and freshness reports 3 undated files under `docs/reports/`. Filtered report: 0 broken links in repository files, so S5 holds.
- **L8** — T4 applied and committed (`722d0797`): 34 files. Renamed operator-visible strings only — API error messages (`Drenyra Desktop requests require company, RUC, fiscal period and user headers`, `Unknown Drenyra Desktop error`), the `/drenyra` route description, the OpenAPI tag `Drenyra Desktop`, the route-protection `surface` label, the seeded chat title `Drenyra Desktop Chat`, `apps/web/metadata.json`, the `llms.txt`/`llms-full.txt` headers produced by `scripts/docs/generate-agent-index.ts`, the architecture diagram titles and the remaining code comments/test titles. Tracked files containing "command center" (excluding `odd/tasks/**` and `CHANGELOG.md`): 0.
- **L9** — Test evidence for T4: `packages/agent-runtime` had no `dist/`, so `@drenyra/agent-runtime` failed to resolve and 13 API test files could not collect; after `bun run build` in that package, `bunx vitest run src/features/drenyra src/features/fiscal/command-center src/features/security` reports 28/32 files and 131/136 tests passing. The 5 remaining failures are pre-existing: verified by stashing the T4 diff and re-running the identical suite (same 4 files, same 5 tests). They are `aes-256.service` (2), `rbac-guard` (2), `drenyra-propose-ledger-entry-envelope` (1) and `route-protection-matrix.test.ts`, which reads the removed `docs/04-api/hardening/route-protection-matrix.md`.
