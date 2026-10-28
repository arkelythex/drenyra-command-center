# Legacy naming cleanup — Command Center / Pi → Desktop / Shell

Objective: remove the retired product names (`Drenyra Command Center`, `Drenyra Pi`) from this repository's documentation, metadata and scripts so the codebase matches the renamed repositories `drenyra-desktop` and `drenyra-shell`.
Branch: `docs/legacy-naming-cleanup` · Delivery: single docs PR · Runner: `bun`

## Specs

- **S1** — `Drenyra Command Center` and every case variant of "command center" used as a product name must not appear in tracked documentation, metadata or scripts. Replacement text: `Drenyra Desktop`.
- **S2** — The retired harness name `Drenyra Pi` / `drenyra-pi` must not appear in tracked documentation. Replacement text: `Drenyra Shell` / `drenyra-shell`.
- **S3** — Repository URLs and package metadata must point at `arkelythex/drenyra-desktop`, never `arkelythex/drenyra-command-center`.
- **S4** — Historical records are excluded from S1/S2: `odd/tasks/**` (past task logs), `CHANGELOG.md`, and git history keep their original wording.
- **S5** — No link may break: every relative link and referenced filename must still resolve after the change.
- **S6** — Structural identifiers are in scope (authorized 2026-10-27, see L10): directory and file names, exported identifiers, the web shell-mode and nav-section literals, npm script names and asset filenames must use `desktop` / `drenyra-desktop` / `drenyra-shell`. **Excluded:** database migration files and their journal tags (`0006_drenyra_command_center`) — renaming an applied migration breaks migration history.

## Tasks

| ID | Scope | Specs | Route | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| T1 | Package metadata URLs point at `drenyra-desktop` | S3 | inline | done | 16 files; see L5 |
| T2 | Documentation prose uses Desktop / Shell names | S1,S2,S4,S5 | inline | done | 41 files / 180 replacements + grammar pass; see L5 |
| T3a | Rename `docs/01-foundation/drenyra-pi-harness.md` → `drenyra-shell-harness.md` | S2,S6 | inline | done | 98848ccd |
| T3b | Rename diagram and branding asset filenames to `drenyra-desktop.*` | S6 | inline | done | cf65c69c |
| T3c | Rename `e2e/drenyra-command-center/` and the `test:e2e:*` script | S6 | inline | done | 4b06a1e8 |
| T3d | Rename API/persistence modules and exported identifiers | S6 | inline | done | 556c9ea7 |
| T3e | Rename the web shell-mode and nav-section literal `command-center` | S6 | inline | done | 70ccb5de |
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
- **L10** — User authorization (2026-10-27, verbatim): "yes te autorizo todo and cotinue" — authorizes the deferred structural rename (S6 rewritten, T3 reopened as T3a–T3e). Database migrations stay untouched on purpose.

- **L11** — T3a–T3e executed. Renames: `drenyra-shell-harness.md`; `drenyra-desktop.architecture.*` + `drenyra-desktop-flow-banner.*`; `e2e/drenyra-desktop/` + `test:e2e:desktop`; `fiscal/desktop/`, `desktop*.routes.ts`, `desktop.shared.ts`, `drenyra-desktop-http.ts`, `drenyra-desktop.schema.ts`; identifiers `CommandCenter`→`Desktop`, `commandCenter`→`desktop`, `COMMAND_CENTER`→`DESKTOP`; web literal `"command-center"`→`"desktop"`. HTTP prefix moved `/api/fiscal-command-center` → `/api/fiscal-desktop` (no client in this repository consumed the old prefix; API tests updated). Migrations and journal tags untouched.
- **L12** — Evidence. `git grep -i "command.center"` over tracked files, excluding `odd/tasks/**`, `CHANGELOG.md`, `packages/infrastructure/drizzle/**` and `scripts/gate/wave2-gate.sh` → 0 hits. API suite `src/features/drenyra src/features/fiscal/desktop src/features/drenyra-harness src/features/security`: 28/32 files, 131/136 tests — identical to the pre-change baseline. Web typecheck vs `.ci/typecheck-baseline.json`: 0 regressions. Web agentic-shell + nav-path tests: 7/7 pass. `docs:check-links`: 0 repo-file failures. `docs:check-freshness`: same 3 pre-existing undated files under `docs/reports/`. `ci:forbidden-terms`: 40 pre-existing violations, none in a touched file. `odd:guard` fails on the pre-existing untracked `openspec/` directory (unrelated, not deleted). `typecheck:ratchet` is unusable here because `tsc --pretty` output does not match its parser; buckets were compared manually with `--pretty false`.
- **L13** — Removed 19 dead `forbidden-terms-exceptions.json` keys that pointed at the already-deleted `apps/web/src/features/drenyra-command-center/**` files.
