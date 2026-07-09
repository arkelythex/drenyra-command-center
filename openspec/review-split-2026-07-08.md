# Review Split — Drenyra Philosophy Docs Alignment

## Status

Chained PRs created:

- #51 — North Star + PH3 docs verification
- #52 — PH1 Web command-center philosophy
- #53 — PH2 CLI Gentleman Fiscal Terminal

Do not open one large PR from the remaining current working tree.

## Why split

The working tree contains multiple unrelated work units:

- Invoice entity unification/runtime code changes.
- Code quality/tooling changes.
- PH3 product philosophy docs verification.
- PH1 web command-center philosophy docs.
- PH2 CLI Gentleman Fiscal Terminal docs.
- Local/generated artifacts that must stay out of Git.

A single PR would exceed the 400-line review budget and mix runtime risk with
planning/docs work.

## Hygiene corrections already applied

- Added `.gitignore` entries for local Pi Lens state and the local Go CLI binary:
  - `**/.pi-lens/`
  - `/apps/cli/drenyra`
- Restored the tracked Pi Lens cache file so generated cache drift is not part
  of the review.

## Recommended chain strategy

Use `stacked-to-main` for the docs/planning chain because each slice is
independently reviewable and does not require a long-lived integration branch.

```text
main
 └─ PR #51 📍 North Star + PH3 docs verification
     └─ PR #52 PH1 Web command-center philosophy
         └─ PR #53 PH2 CLI Gentleman Fiscal Terminal
```

## PR 1 — North Star product philosophy

Scope:

- `AGENTS.md`
- `CODEX-MAP.md`
- `docs/products/drenyra-product-philosophy.md`
- `openspec/changes/drenyra-north-star-philosophy/`
- Relevant OpenSpec index/config entries for the north-star plan.

Review path:

1. Read `docs/products/drenyra-product-philosophy.md`.
2. Check `AGENTS.md` and `CODEX-MAP.md` guardrails.
3. Confirm the north-star proposal/spec/design/tasks match the product intent.

Verification:

- `bun run docs:verify`
- `git diff --check`

## PR 2 — PH3 docs verification and product-surface gates

Depends on PR 1.

Scope:

- `.gitignore`
- `docs/05-development/engram-project-canonical.md`
- `scripts/docs/check-links.ts`
- `scripts/architecture/check-product-surfaces.ts`
- `openspec/changes/drenyra-philosophy-docs-alignment/`
- Relevant package/config/index entries needed for docs verification.

Review path:

1. Review the focused docs link checker.
2. Review the product-surface guard script.
3. Confirm the Engram project identity doc does not introduce secrets.
4. Confirm PH3 apply/verify/archive evidence.

Verification:

- `bun run docs:verify`
- `git diff --check`
- LSP diagnostics for the new TypeScript scripts.

## PR 3 — PH1 Web command-center philosophy

Depends on PR 2.

Scope:

- `apps/web/MAP.md`
- `openspec/changes/drenyra-web-agentic-accounting-philosophy/`

Review path:

1. Start at the `Product model` section in `apps/web/MAP.md`.
2. Review Monthly close as the first flagship workflow.
3. Review the agentic accounting UI checklist and frontend review path.
4. Confirm PH1 verify/archive evidence.

Verification:

- `bun run docs:verify`
- `git diff --check`

Risk note:

`apps/web/MAP.md` currently exceeds the 400-line budget because of existing
large tables and Markdown formatting churn. Before PR, either isolate formatting
from content or mark this slice with an explicit `size:exception` and keep it
docs-only. Do not mix React implementation.

## PR 4 — PH2 CLI Gentleman Fiscal Terminal

Depends on PR 3.

Scope:

- `apps/cli/MAP.md`
- `openspec/changes/drenyra-cli-gentleman-fiscal-terminal/`
- `openspec/changes/drenyra-p1-fiscal-terminal/tasks.md`
- `openspec/changes/drenyra-s5-go-cli-alignment/tasks.md`

Review path:

1. Start at the `Product model` section in `apps/cli/MAP.md`.
2. Review command/TUI/workflow/exec boundaries.
3. Review CLI safety policy and privacy constraints.
4. Review P1 and S5 task files for future implementation guardrails.
5. Confirm PH2 verify/archive evidence.

Verification:

- `bun run docs:verify`
- `git diff --check`

Risk note:

`apps/cli/MAP.md` is also large because of map formatting. Before PR, isolate
formatting from content or use `size:exception`. No Go code should be included
in this PR. Future Go implementation must run `go test ./...` from `apps/cli`
or the root Bun wrapper.

## Explicitly out of this docs chain

Keep these in separate work units:

- Invoice entity unification and invoice update refactor runtime code.
- P5 code quality tooling implementation.
- Go CLI runtime changes under `apps/cli/src/` or `apps/cli/go.mod`.
- Package-level SIRE/code changes.
- Local generated binaries and Pi Lens caches.
