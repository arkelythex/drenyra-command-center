# ARKELYTHEX Engineering Rules

ARKELYTHEX builds Drenyra, the Infraestructura Nacional de Inteligencia Fiscal. Treat fiscal correctness, tenant isolation, and auditability as product safety requirements.

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

- Canonical user-facing project path: `~/Documents/PROYECTOS/arkelythex/drenyra`.
- Canonical worktree root: `~/Documents/PROYECTOS/arkelythex/worktrees/drenyra/<task-name>`.
- Treat older `/home/dreamcoder08/somnyx/...` paths as compatibility/symlink targets, not as the path to open in tools.

## Repo shape

- Fastest navigation source: start at root `CODEX-MAP.md`, then use `.codebase/index.yml` for machine-readable app/package metadata.
- Regenerate navigation docs with `bun run codebase:index`; verify with `bun run codebase:index:check`.
- Runtime/package manager: Bun 1.3.11.

### Apps (canonical locations)

| App | Path | Stack |
|-----|------|-------|
| API | `apps/api/` | Bun + ElysiaJS |
| Web app | `apps/web/` | React 19 + TanStack Router |
| Landing | `apps/landing/` | Next.js |
| Data Engine | `apps/data-engine/` | Python + FastAPI + Polars |
| CLI | `apps/drenyra-cli/` | Go |

Each app has a `MAP.md` (e.g. `apps/web/MAP.md`) with its architecture, routes, features, fast-search recipes, and common tasks mapped to exact file paths. Start there before exploring inside an app — saves tokens.

### Packages

- Shared packages live under `packages/*`.
- `packages/domain` must stay framework-free.
- `packages/application` depends on domain.
- Adapters belong in persistence/infrastructure/ai packages.
- `packages/core` was removed; its contents (product-surfaces types/registry) moved to `packages/domain/src/types/`.

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
- Preferred worktree root: `~/Documents/PROYECTOS/arkelythex/worktrees/drenyra/<task-name>`; avoid repo-local `.worktrees/` unless explicitly requested.
- Before editing in a worktree, verify `git status`, current branch, and worktree path; never mix unrelated phases in the same branch/worktree.
- Start by inspecting the existing implementation before changing code.
- Reuse existing patterns, scripts, schemas, and tests.
- Keep changes scoped to the requested behavior.
- If touching multiple packages, mention downstream impacts.
- Add or update tests for changed behavior.
- Update docs when public behavior, setup, contracts, or fiscal assumptions change.

### Delivery strategies for large changes

When a change exceeds 400 lines, choose one of these and document it in the PR body:

| Strategy | When | How |
|----------|------|-----|
| **ask-on-risk** | Estimate is uncertain | Ask first: "This will be ~600 lines. Split into two PRs?" |
| **auto-chain** | Clearly divisible phases | PR1: schema + migration. PR2: API + tests. PR3: frontend + docs. |
| **single-pr** | Low risk, reviewer has context | Single PR up to 600 lines if the reviewer knows the area. |
| **exception-ok** | Mechanical refactor (rename, move) | Single PR documenting it's mechanical and reviewable by diff. |

## Delegation Triggers for AI Agents

When working with AI agents in this repo, these triggers determine when to delegate to specialized sub-agents:

| Trigger | When to delegate | To whom |
|---------|-----------------|---------|
| **4-file rule** | Change touches 4+ files | `explore` to map, then `build` |
| **Multi-file write** | Writing 3+ new files or modifying 5+ existing | Sub-agent with full context |
| **PR pre-review** | Change generates +200 line PR | `reviewer` or `code-reviewer` |
| **Incident** | Fiscal bug, security issue, or data loss | `security-reviewer` + `judge` |
| **SUNAT/fiscal change** | Any change to fiscal/SUNAT logic | `sunat-compliance` skill + `tester` |
| **Architecture decision** | Decision with significant tradeoffs | `architect` + ADR |
| **Long session** | 20+ tool calls in current session | Compress + handoff to fresh agent |

> These triggers are advisory. Subdirectory `AGENTS.md` files may add stricter local rules.

## Documentation standards (2026 best practices)

ARKELYTHEX documentation follows the **Gentleman Philosophy** — cognitive load reduction, warm teaching, progressive disclosure.

- **Diátaxis framework**: structure docs by user intent, not feature list — tutorials (learning), how-to guides (tasks), reference (facts), explanation (understanding). Keep quadrants separate; cross-link don't embed.
- **Cognitive load patterns**: every doc must follow at least 3 of 6 patterns — lead with answer, progressive disclosure, chunking, signposting, recognition over recall, review empathy.
- **Docs-as-Code**: update docs in the SAME PR as code changes. Atomic commits include docs. Treat stale docs as a bug.
- **CI for docs**: `markdownlint` for formatting, `lychee` for link checking — fail on broken internal links.
- **AI agent-consumable docs**: 50% of doc traffic is now AI agents. Write clear section headers, direct answers, structured data. AI agents read your docs — treat them as users.
- **Date freshness**: every doc has a `**Última actualización**` / `**Last updated**` line at the top. Update it when content changes. If content is inherently time-bound, note the period explicitly.
- **MAP.md first**: before exploring inside any app, read its `apps/<app>/MAP.md` — saves tokens, gives architecture at a glance.
- **Print-ready**: critical docs are compiled via `bun run docs:packages` to role-based HTML packages in `docs/print/` with A4 CSS for PDF export.
- **Warm teaching**: explain the WHY behind the WHAT. Use examples. Admit tradeoffs. Mention fiscal/security risks FIRST.

> Reference: [Gentleman Philosophy Guide](./docs/meta/gentleman-philosophy.md) · [Documentation Standards 2026](./docs/meta/documentation-standards-2026.md)

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

- Proyecto: **`arkelythex`** (no `arkonyx` / `ARKONYX`).
- Config: `~/Documents/PROYECTOS/arkelythex/.engram/config.json`; `drenyra/.engram` → `../.engram`.
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
