# DRENYRA Engineering Rules

DRENYRA builds Drenyra, the verifiable financial operating system for businesses, accountants, and governments across Latin America. Treat fiscal correctness, tenant isolation, and auditability as product safety requirements. Product direction lives in [`docs/products/drenyra-product-philosophy.md`](docs/products/drenyra-product-philosophy.md).

## Non-negotiables

- Do not break fiscal correctness, accounting invariants, SUNAT flows, or audit trails.
- Do not bypass organization/company/RUC scoping in APIs, queries, jobs, seeds, exports, or tests.
- Do not introduce secrets, real credentials, production tokens, or sensitive customer data.
- Do not use `any`; use precise types, `unknown`, or justified generics.
- Do not use floats or raw numbers for money; use the project `Money` model/value object.
- Do not change public contracts, database schemas, or fiscal behavior without tests and docs.
- Do not perform broad rewrites unless there is an explicit migration plan.
- Prefer small, verifiable, reversible changes.

## Canonical paths

- Canonical user-facing project path: `~/Documents/PROYECTOS/Drenyra`.
- Canonical worktree root: `~/Documents/PROYECTOS/Drenyra/worktrees/<task-name>`.
- Treat older `/home/dreamcoder08/somnyx/...` paths as compatibility/symlink targets, not as the path to open in tools.

## Repo shape

- Fastest navigation source: start at root `CODEX-MAP.md`, then use `.codebase/index.yml` for machine-readable app/package metadata.
- Regenerate navigation docs with `bun run codebase:index`; verify with `bun run codebase:index:check`.
- Runtime/package manager: Bun 1.3.11.

### Apps (canonical locations)

| App         | Path                | Stack                      |
| ----------- | ------------------- | -------------------------- |
| API         | `apps/api/`         | Bun + ElysiaJS             |
| Web app     | `apps/web/`         | React 19 + TanStack Router |
| Landing     | `apps/landing/`     | Next.js                    |
| Data Engine | `apps/data-engine/` | Python + FastAPI + Polars  |
| CLI         | `apps/cli/`         | Go                         |

Each app has a `MAP.md` (e.g. `apps/web/MAP.md`) with its architecture, routes, features, fast-search recipes, and common tasks mapped to exact file paths. Start there before exploring inside an app — saves tokens.

### Packages

- Shared packages live under `packages/*`.
- `packages/domain` must stay framework-free.
- `packages/application` depends on domain.
- Adapters belong in persistence/infrastructure/ai packages.
- `packages/core` was removed; its contents (product-surfaces types/registry) moved to `packages/domain/src/types/`.

## Product philosophy guardrails

Drenyra is the **verifiable financial operating system for businesses, accountants, and governments** — a Financial Engineering Environment that applies software engineering rigor (Git-like versioning, CI/CD, specialized agents, specs, receipts) to accounting. Web, CLI, agents, and docs must follow the canonical [Drenyra product philosophy](docs/products/drenyra-product-philosophy.md).

- Treat fiscal correctness, tenant/RUC scope, auditability, reversibility, and human approval as visible product guarantees.
- Every material workflow starts with a spec (FSD — Fiscal Specification-Driven Execution).
- Every action generates an immutable receipt (RED — Receipt-Driven Execution).
- Use the Ledger-as-Git model: commits = atomic accounting changes, diffs = explained differences, PRs = accounting review packages.
- Apply CI/CD to accounting: static checks → accounting tests → fiscal tests → risk tests → gated deployment.
- Risk-based human-in-the-loop: R0 (read, high autonomy) → R3 (irreversible, explicit dual approval).
- Never ship vague AI polish without tests, docs, evidence, and reviewable acceptance criteria.

## Architecture and domain rules

- Use vertical slice + CQRS for feature work.
- Keep fiscal/domain logic deterministic and covered by tests.
- Validate all API inputs with schemas at service boundaries.
- Preserve end-to-end type safety.
- For Peruvian tax flows, preserve SUNAT, UBL 2.1, IGV, retenciones, detracciones, SIRE, RUC checksum, document series, and CDR/audit requirements.
- Prefer branded IDs or domain value objects for identifiers and money-sensitive data.

## Working style

- Default Git workflow: create a dedicated branch for every change; keep `main` clean and updated.
- Use an isolated Git worktree for medium/large work, parallel phases, or any fiscal/SUNAT/DB/AI-control/CI change. Small one-file/documentation fixes may use a normal branch in the main checkout.
- Preferred worktree root: `~/Documents/PROYECTOS/Drenyra/worktrees/<task-name>`; avoid repo-local `.worktrees/` unless explicitly requested.
- Before editing in a worktree, verify `git status`, current branch, and worktree path; never mix unrelated phases in the same branch/worktree.
- Start by inspecting the existing implementation before changing code.
- Reuse existing patterns, scripts, schemas, and tests.
- Keep changes scoped to the requested behavior.
- If touching multiple packages, mention downstream impacts.
- Add or update tests for changed behavior.
- Update docs when public behavior, setup, contracts, or fiscal assumptions change.

### Delivery strategies for large changes

When a change exceeds 400 lines, choose one of these and document it in the PR body:

| Strategy         | When                               | How                                                              |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------- |
| **ask-on-risk**  | Estimate is uncertain              | Ask first: "This will be ~600 lines. Split into two PRs?"        |
| **auto-chain**   | Clearly divisible phases           | PR1: schema + migration. PR2: API + tests. PR3: frontend + docs. |
| **single-pr**    | Low risk, reviewer has context     | Single PR up to 600 lines if the reviewer knows the area.        |
| **exception-ok** | Mechanical refactor (rename, move) | Single PR documenting it's mechanical and reviewable by diff.    |

## Delegation Triggers for AI Agents

When working with AI agents in this repo, these triggers determine when to delegate to specialized sub-agents:

| Trigger                   | When to delegate                              | To whom                             |
| ------------------------- | --------------------------------------------- | ----------------------------------- |
| **4-file rule**           | Change touches 4+ files                       | `explore` to map, then `build`      |
| **Multi-file write**      | Writing 3+ new files or modifying 5+ existing | Sub-agent with full context         |
| **PR pre-review**         | Change generates +200 line PR                 | `reviewer` or `code-reviewer`       |
| **Incident**              | Fiscal bug, security issue, or data loss      | `security-reviewer` + `judge`       |
| **SUNAT/fiscal change**   | Any change to fiscal/SUNAT logic              | `sunat-compliance` skill + `tester` |
| **Architecture decision** | Decision with significant tradeoffs           | `architect` + ADR                   |
| **Long session**          | 20+ tool calls in current session             | Compress + handoff to fresh agent   |

> These triggers are advisory. Subdirectory `AGENTS.md` files may add stricter local rules.

## Documentation standards (2026 best practices)

DRENYRA documentation follows the **Gentleman Philosophy** — cognitive load reduction, warm teaching, progressive disclosure.

- **Diátaxis framework**: structure docs by user intent, not feature list — tutorials (learning), how-to guides (tasks), reference (facts), explanation (understanding). Keep quadrants separate; cross-link don't embed.
- **Cognitive load patterns**: every doc must follow at least 3 of 6 patterns — lead with answer, progressive disclosure, chunking, signposting, recognition over recall, review empathy.
- **Docs-as-Code**: update docs in the SAME PR as code changes. Atomic commits include docs. Treat stale docs as a bug.
- **CI for docs**: `markdownlint` for formatting, `lychee` for link checking — fail on broken internal links.
- **AI agent-consumable docs**: 50% of doc traffic is now AI agents. Write clear section headers, direct answers, structured data. AI agents read your docs — treat them as users.
- **Date freshness**: every doc has a `**Última actualización**` / `**Last updated**` line at the top. Update it when content changes. If content is inherently time-bound, note the period explicitly.
- **MAP.md first**: before exploring inside any app, read its `apps/<app>/MAP.md` — saves tokens, gives architecture at a glance.
- **Print-ready**: critical docs are compiled via `bun run docs:packages` to role-based HTML packages in `docs/print/` with A4 CSS for PDF export.
- **Warm teaching**: explain the WHY behind the WHAT. Use examples. Admit tradeoffs. Mention fiscal/security risks FIRST.

> Reference: [Drenyra product philosophy](docs/products/drenyra-product-philosophy.md)

## Verification

Run the narrowest relevant checks first, then broader checks before final output when risk justifies it.

Common commands:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run lint:all
bun run test
bun run docs:verify
bun run architecture:check-boundaries
bun run security:audit
```

Domain/compliance checks when relevant:

```bash
bun run compliance:sire-gate
bun run compliance:sire-repro
```

If a command does not exist or is too broad for the change, inspect `package.json` scripts and choose the closest targeted check. Do not document or run a root command unless it exists in `package.json`.

## Code review gate

Reject changes that introduce:

- Hardcoded secrets or credentials.
- `any` without explicit justification.
- Silent error handling.
- Production `console.log`.
- Missing tenant/company/RUC scoping.
- Money calculations using floats.
- Raw SQL without justification.
- Missing tests for new business logic.
- Public contract changes without docs/tests.
- SUNAT/UBL/IGV behavior changes without compliance-focused tests.

### Review empathy

When reviewing or authoring a PR, design for low cognitive load:

- **Scope explicitly**: say what files you touch AND what you don't.
- **Chained PRs**: when >400 lines, break into reviewable chunks.
- **Review path**: tell the reviewer where to start.
- **Workload forecast**: estimate how long the review should take.
- **Links**: all internal links must work before the PR.

## Engram (memoria persistente)

- Proyecto: **`drenyra`** (no `arkonyx` / `ARKONYX`).
- Config: `~/Documents/PROYECTOS/Drenyra/.engram/config.json`; `Drenyra/.engram` → `../.engram`.
- Guía: [`docs/05-development/engram-project-canonical.md`](docs/05-development/engram-project-canonical.md).

## Agent-specific guidance

- Root `AGENTS.md` is shared guidance for all coding agents.
- Codex-only workflow, SDD, sub-agent, memory, and model-routing rules live in `.codex/AGENTS.md`.
- Subdirectory `AGENTS.md` files may add stricter local rules for their package or app.

## Final response format

Include:

1. Summary
2. Changed files
3. Commands executed
4. Results
5. Remaining risks
6. Suggested next step

---

## Drenyra Orchestrator & Harness

Drenyra now has its own orchestrator and harness system, modeled after the Gentlemen harness (gentle-pi).

### Components

| Component            | Location                         | Description                                                                                            |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Orchestrator package | `packages/drenyra-orchestrator/` | Core types, delegation router, skills resolver, memory contract, review lenses, work routing           |
| Skill registry       | `.atl/skill-registry.md`         | Index of all 18 Drenyra-specific skills                                                                |
| Drenyra skills       | `.agent/skills/*/SKILL.md`       | 18 skills: fiscal compliance, SDD, gatekeeper, 4R review lenses, judgment-day, chained PR, hooks, etc. |

### Orchestrator Capabilities

- **Delegation Router**: Determines inline/simple-delegation/SDD routes based on task profile (file count, session state, incident recovery)
- **Skills Resolver**: Reads `.atl/skill-registry.md`, matches task context against triggers, returns exact SKILL.md paths
- **Memory Contract**: Defines who reads/writes memory (orchestrator-read, subagent-write)
- **Review Lenses**: `review-risk`, `review-resilience`, `review-readability`, `review-reliability`, `judgment-day`
- **Work Routing**: Review workload forecasting, canonical workflows for bugfix/feature/fiscal-change/review/docs
- **Hooks Config**: Pre-commit/pre-push/pre-PR gate configuration with hot path detection

### Test Status

- `packages/drenyra-orchestrator`: 39 tests passing
- `packages/phase-gatekeeper`: 18 tests passing
- `packages/fiscal-sdd`: 97 tests passing
- **Total: 154 tests, all passing**

### Usage

```typescript
import {
  determineRoute,
  forecastReviewWorkload,
  selectReviewLenses,
  matchSkills,
} from '@drenyra/orchestrator'

// Route a task
const route = determineRoute({
  filesToUnderstand: 1,
  filesToWrite: 2 /* ... */,
})

// Forecast review workload
const forecast = forecastReviewWorkload({
  estimatedLines: 600,
  affectedSubsystems: ['fiscal'] /* ... */,
})

// Select review lenses for a PR
const lenses = selectReviewLenses({
  filePaths: ['packages/fiscal/...'],
  changedLines: 450,
  isPrePR: true,
})
```

### Skills Resolution Flow

1. Read `.atl/skill-registry.md` → match against task context
2. Pass matching `SKILL.md` paths to subagents under `## Skills to load before work`
3. Subagents read those exact files before task work
4. Resolution status: `paths-injected` (preferred), `fallback-registry`, `fallback-path`, or `none`

---

## GGA AI Code Review

This project uses **Gentleman Guardian Angel (GGA)** for automated AI code review on every PR and push to `main`.

### Configuration

- Config file: `.gga` (project root)
- Provider: `deepseek:deepseek-chat` (DeepSeek V4 Flash)
- Rules file: `AGENTS.md` (this file — the coding standards above are used as review rules)

### CI Workflow

The workflow is at `.github/workflows/ai-review.yml`:

- Triggers on PRs (opened/synchronize) and pushes to `main`
- Installs GGA from GitHub
- Patches the DeepSeek provider if needed
- Runs `gga run` on changed files
- Posts a summary as a PR check

### Local Usage

```bash
# Stage files and run review
git add <files>
gga run

# Or review all staged changes
gga run --no-cache
```

### Pre-commit Hook

GGA installs a pre-commit hook that reviews code before each commit. To (re)install:

```bash
gga install
```

### Provider

Uses DeepSeek V4 Flash (`deepseek-chat`) via direct API at `api.deepseek.com/v1/chat/completions`.

Requires `DEEPSEEK_API_KEY` environment variable.

### Review Rules

The rules in this `AGENTS.md` file (Non-negotiables, Architecture Rules, Security Rules, Testing Rules, Code Review Gate) are used by GGA as the review checklist. Any violation causes the review to flag the change.

### Verification

To verify GGA is working:

```bash
gga version
gga config
```
