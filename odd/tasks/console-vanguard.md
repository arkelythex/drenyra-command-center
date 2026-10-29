# Drenyra Console — rename, legacy cleanup and cloud-native architecture

Branch: `refactor/console-rename` → `chore/legacy-cleanup` → `feat/console-tanstack-start`
Delivery: one PR per work unit, rebase merge (repo requires linear history), tests + docs in the same commit.
Runner: `bun` (turbo monorepo), `bunx vitest`, `bunx tsc`.

## Specs

**S1 — Product name is Drenyra Console.** The repository is `arkelythex/drenyra-console` and every product-level
string reads "Drenyra Console". No product string may read "Drenyra Desktop", "Command Center" or "Drenyra Pi".

**S2 — Internal product identifiers follow the product name.** Module paths, Elysia route names, HTTP error codes
and the web shell mode that exist *for the console surface* use `console`. Renaming is limited to identifiers whose
meaning is the product; responsive identifiers keep their meaning:
`desktop-nav.tsx`, `desktop-header.tsx`, `InvoicesBoard` responsive tests and `mobile/desktop` viewport prose MUST
NOT be renamed. A `desktop` token that means "viewport wider than md" is never a product reference.

**S3 — Legacy with no live consumer is deleted, not archived in-tree.** Deletion candidates, each verified to have no
inbound reference before removal: `labs/mastra-poc/`, `ops/`, `.agent/skills/`, `services/engram/`,
`engines/rust-core/`, `DRENYRA_CODEX_APP_INTERFACE_AUDIT.md` (references `apps/web/src/features/drenyra-desktop/`,
which has zero tracked files), and the `openspec/changes/*` rows in `apps/web/MAP.md` (SDD is superseded by ODD).
`openspec/` is untracked and must be removed from the working tree.

**S4 — Migrations are immutable.** `packages/infrastructure/drizzle/**` including the `_journal.json` tag
`0006_drenyra_command_center` and `scripts/gate/wave2-gate.sh:67` are never renamed or edited. Renaming an applied
migration breaks history.

**S5 — No broken links, no stale generated docs.** `bun run docs:agent-index` regenerates `llms.txt`,
`llms-full.txt` and `.codebase/index.yml`; `bun run docs:check-links` reports zero failures for repository files.
`.ci/typecheck-baseline.json` keys that name renamed paths are updated so the ratchet keeps working.

**S6 — Behaviour is unchanged by the rename.** API route prefixes, payload shapes, response codes and persisted
formats are identical before and after. The console rename is a naming change, not a contract change.

**S7 — Architecture target for `drenyra-console` (feature B).** TanStack Start 1.0 (stable 2026-10-13) on top of the
existing Vite 8 / React 19.3 / TanStack Router 1.103 / TanStack Query 5.90 / Tailwind 4 stack. Layering follows
Clean/Hexagonal boundaries already present in `packages/{domain,application,infrastructure,persistence}`. Components
follow atomic design. Server-side work lives in typed server functions (BFF), never duplicated in the client.

**S8 — Git and GitHub practice.** Conventional Commits, no AI attribution, one work unit per commit, tests and docs
with the behaviour they describe, rebase merge, branch deleted after merge, and a PR body that states the risk line
and the pre-existing failures it does not fix.

## Tasks

| ID  | Specs      | Route | Status | Commit / evidence |
| --- | ---------- | ----- | ------ | ----------------- |
| T1  | S1         | inline | done   | GitHub repo renamed to `arkelythex/drenyra-console`; local dir + 5 worktrees repaired |
| T2  | S1, S2, S6 | inline | pending | product strings, product identifiers, diagram + branding asset paths |
| T3  | S3         | inline | pending | legacy deletion with inbound-reference proof |
| T4  | S5         | inline | pending | regenerated agent index, links check, typecheck baseline keys |
| T5  | S7         | delegated | pending | TanStack Start migration + BFF (feature B document) |
| T6  | S8         | inline | pending | PR bodies, rebase merges, branch cleanup |

## Log

**L1 — user request, verbatim (2026-10-29):**
"perfect te autorizo todo , objetvio estar en la vanguardia elimina todo lo necesario para hacer limpieza , usa buenas practica de git , github + filosofia de gentleman objetivo avanzemos , tener en cuenta que drenyra-console debe tener buena arquitectura puede ser clean arquitecture o hexagonal architecture , principios solid , modularidad , patrones de diseño , diseño atomico , system desing , y muas mas buenas practicas objetivo calidad 10/10"

**L2 — prior scope decision, verbatim (2026-10-29):**
"me referia al flujo antiguo sdd ahora es el nuevo flujo full ODD , es que drenyra-shell es un paquete personalizado de pi agent cli , ademas de integrarlo con Drenyra-engram su memoria perssitente para la contabilidad , ellos van juntos mi idea ahora es hacerlo en la nube native entiendes de forma visual diseño frontend moderno web ui , entiendes ? sin sobre-ingeneria y eliminar redundanica"

Interpretation recorded: SDD is superseded by ODD, so ODD stays and nothing about the ODD workflow is deleted.
`drenyra-shell` (Pi agent CLI package, 39k lines, no HTTP server and no database driver) plus `drenyra-engram`
(persistent accounting memory) are the engine; `drenyra-console` is the visual surface over them.

**L3 — measured baseline (2026-10-29), tracked files only:**
`apps/web` 623 files / 67,543 lines; `apps/api` 1,481 files / 202,435 lines; `apps/data-engine` 21 files / 3,398 lines;
`packages/domain` 52,491; `packages/infrastructure` 45,565; `packages/application` 38,886;
`packages/persistence` 35,504; `packages/ai` 35,385; `packages/agent-runtime` 35,137.
`apps/api` is thin over the packages: 72 feature files import `@drenyra/application`, 187 import `@drenyra/domain`,
and only 51 import `@drenyra/infrastructure` directly. The API is therefore not duplicated business logic; the 51
direct-infrastructure imports are the real architectural leak.

**L4 — deny list established before any rename.** `desktop` appears in 145 files and 829 occurrences, but several are
responsive, not product: `apps/web/src/features/settings/components/settings-shell/desktop-nav.tsx`,
`apps/web/src/features/invoices/components/invoices-board/desktop-header.tsx`, `InvoicesBoard.tsx`,
`InvoicesBoard.test.tsx`, `useInvoicesBoardController.test.ts` ("changes view from desktop/mobile handlers") and
`apps/web/sidebar-responsive-fixes.md` ("CSS aplicaba estilos desktop"). These keep the word `desktop`. Only
product-meaning tokens are renamed.

**L5 — GitHub repo rename executed.** `gh repo rename drenyra-console --yes` → `arkelythex/drenyra-console`.
Local directory moved to `/home/dreamcoder08/Documents/PROYECTOS/drenyra-console`, `origin` reset to the new URL,
and `git worktree repair` re-pointed the five worktrees under `Drenyra/worktrees/` (each `.git` file now targets
`drenyra-console/.git/worktrees/<id>`, verified by running `git status` inside two of them).

**L6 — org cleanup PRs closed before this work.** `Arkelythex#372` and `Elvyra#2` merged. Both had red checks proven
pre-existing and unrelated: `Arkelythex` fails because the GGA installer leaves `providers.sh` missing
(`/usr/local/bin/../share/gga/lib/providers.sh`), filed as `Arkelythex#373`; `Elvyra` fails with 283 pre-existing
biome errors across 125 files, filed as `Elvyra#3`. Also merged earlier: `drenyra-engram#54`, `drenyra-ai#127`,
`drenyra-guardian-angel#6`, `drenyra-skills#13`, `drenyra-shell#97` (all rebase, all checks green where they exist).
