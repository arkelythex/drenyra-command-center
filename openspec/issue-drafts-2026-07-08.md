# Issue Drafts — Drenyra Philosophy Docs Chain

## Status

Created and approved.

- #47 — `docs(philosophy): define Drenyra product north star`
- #48 — `docs(verification): add philosophy docs gates`
- #49 — `docs(web): define agentic fiscal command center`
- #50 — `docs(cli): define Gentleman Fiscal Terminal guardrails`

## Search performed

`gh issue list --state all --search ...` found no duplicates before creation.
Issues were created with `documentation` and then labeled `status:approved`.

## Issue 1 — North Star product philosophy

Template: `task.yml`
Title: `docs(philosophy): define Drenyra product north star`
Affected Area: `Documentation`
Estimated Size: `M (150-400 lines, 2-5 files)`

### Task Description

Define Drenyra's product north star as an agentic fiscal intelligence platform,
then link it from contributor and navigation docs so future web, CLI, and agent
work shares the same fiscal-safety contract.

### Acceptance Criteria

- [ ] Canonical product philosophy doc exists.
- [ ] `AGENTS.md` and `CODEX-MAP.md` point to the philosophy.
- [ ] OpenSpec north-star artifacts exist and explain scope, non-goals, and
      review constraints.
- [ ] `bun run docs:verify` passes.
- [ ] No runtime code or fiscal computation changes are included.

### Dependencies

None.

## Issue 2 — PH3 docs verification gates

Template: `task.yml`
Title: `docs(verification): add philosophy docs gates`
Affected Area: `Documentation`
Estimated Size: `M (150-400 lines, 2-5 files)`

### Task Description

Restore and document docs verification for product philosophy alignment by
adding focused internal link checks, product-surface checks, and the missing
Engram project identity guide.

### Acceptance Criteria

- [ ] `bun run docs:verify` passes.
- [ ] Internal links for primary philosophy docs are checked.
- [ ] Product-surface architecture check verifies required product guidance.
- [ ] Engram project identity guidance exists without secrets.
- [ ] PH3 OpenSpec apply/verify evidence is present.

### Dependencies

Depends on Issue 1.

## Issue 3 — PH1 Web command-center philosophy

Template: `task.yml`
Title: `docs(web): define agentic fiscal command center`
Affected Area: `Web App (React)`
Estimated Size: `L (400-800 lines, 5+ files) — may need chained PR`

### Task Description

Define the web app as Drenyra's agentic fiscal command center, with Monthly close
as the first flagship workflow and explicit UX guardrails for evidence,
confidence, approval, audit, and cognitive load.

### Acceptance Criteria

- [ ] `apps/web/MAP.md` documents the command-center model.
- [ ] Monthly close is documented as the first flagship workflow.
- [ ] Agentic accounting UI checklist exists.
- [ ] Frontend review path and cognitive/fiscal-confidence metrics exist.
- [ ] PH1 OpenSpec tasks, verify report, and archive report are complete.
- [ ] No React implementation is included.

### Dependencies

Depends on Issue 2.

## Issue 4 — PH2 CLI Gentleman Fiscal Terminal

Template: `task.yml`
Title: `docs(cli): define Gentleman Fiscal Terminal guardrails`
Affected Area: `CLI (Go)`
Estimated Size: `L (400-800 lines, 5+ files) — may need chained PR`

### Task Description

Define Drenyra CLI as the Gentleman Fiscal Terminal and document command/TUI,
workflow/exec boundaries, CLI safety policy, privacy constraints, review path,
and future P1/S5 implementation guardrails.

### Acceptance Criteria

- [ ] `apps/cli/MAP.md` documents Gentleman Fiscal Terminal identity.
- [ ] Command, TUI, workflow, and exec boundaries are documented.
- [ ] Read-only, mutating, and local-only safety policy is documented.
- [ ] Fiscal scope, evidence, approval, audit, and privacy constraints exist.
- [ ] P1 and S5 tasks include semantic parity, safety, review budget, and Go
      test expectations.
- [ ] PH2 OpenSpec tasks, verify report, and archive report are complete.
- [ ] No Go implementation is included.

### Dependencies

Depends on Issue 3.
