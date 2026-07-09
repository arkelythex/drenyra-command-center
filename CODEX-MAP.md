<!-- Edit this file directly. The codebase/index generator has been removed. -->

# CODEX-MAP — DRENYRA Monorepo

> **Delegation triggers**: when working on 4+ files, writing 3+ new files, or hitting +200 line PRs, use specialized sub-agents. See [AGENTS.md](./AGENTS.md#delegation-triggers-for-ai-agents).

## Start here

- Fast navigation source: this file. Machine-readable source: `.codebase/index.yml`.
- Product north star: [`docs/products/drenyra-product-philosophy.md`](docs/products/drenyra-product-philosophy.md).
- Update both with `bun run codebase:index`; verify drift with `bun run codebase:index:check`.
- Canonical path for tools: `/home/dreamcoder08/Documents/PROYECTOS/Drenyra`.
- Before edits: inspect existing implementation, preserve fiscal correctness, tenant/RUC scope, audit trails.

## Where is what — each app has a MAP.md for detailed navigation

| Path | Area | Purpose | Tags | MAP.md |
|---|---|---|---|
| `apps/api` | api | Backend API: Bun + Elysia vertical slices, contracts, fiscal workflows. | backend, fiscal, api, elysia | `apps/api/MAP.md` |
| `apps/web` | web | Agentic fiscal command center for supervised accounting operations. | frontend, drenyra, react | `apps/web/MAP.md` |
| `apps/landing` | landing | Public marketing and product documentation surface. | frontend, marketing, nextjs | `apps/landing/MAP.md` |
| `apps/data-engine` | data-engine | Python analytical microservice for high-throughput financial data processing. | python, analytics, data-engine | `apps/data-engine/MAP.md` |
| `apps/cli` | cli | Gentleman Fiscal Terminal for scriptable fiscal operations, agent orchestration, and TUI. | go, cli, tui, terminal | `apps/cli/MAP.md` |
| `packages/domain` | domain | Framework-free entities, value objects, fiscal rules, Money/RUC primitives. | domain, fiscal, money, ruc | — |
| `packages/shared` | shared | Low-dependency cross-cutting helpers, validation, secure logging, schemas. | shared, validation, security | — |
| `packages/application` | application | Use cases, DTOs, validators, and ports that depend on domain. | application, cqrs, use-cases | — |
| `packages/persistence` | persistence | Drizzle schemas, repositories, query helpers, unit of work. | database, drizzle, tenant-scope | — |
| `packages/infrastructure` | infrastructure | Adapters for DB, queues, SUNAT, AI, XML/UBL, and external services. | infrastructure, sunat, adapters | — |
| `packages/ai` | ai | AI facade, gateway, model registry, SUNAT corpus and tool bridge contracts. | ai, gateway, agents | — |
| `packages/memory` | memory | Unified memory subsystem: agent memory, session storage, context management. | ai, memory | — |
| `packages/agents` | agents | Unified agent runtime: Mastra orchestration, delegation, harness, approvals. | ai, agents, orchestration | — |
| `packages/engram` | engram | Go phase-gate evidence sidecar for fiscal audit trails. | go, engram, evidence | — |
| `packages/test-utils` | test-utils | Shared fixtures, builders, mocks, database and tenant test helpers. | testing, fixtures | — |
| `packages/ui` | ui | Shared Glass & Steel design-system components and tokens. | frontend, ui, design-system | — |
| `packages/rust-core` | rust-core | Rust hot-path fiscal primitives; TypeScript remains source of truth until parity. | rust, fiscal, performance | — |
| `docs/` | docs | Canonical architecture, feature, runbook, business, and team docs. | docs | — |
| `scripts/` | scripts | Bun/TS automation for CI, docs, architecture, security, release, ops. | automation | — |
| `.github/` | github | CODEOWNERS, PR template, workflows, branch protection metadata. | ci, ownership | — |
| `ops/` | ops | Runtime infrastructure, observability, Prometheus/Grafana assets. | ops, observability | — |

## Critical fiscal/security invariants

- SUNAT/UBL/SIRE/IGV behavior must stay deterministic and test-covered.
- Use the project Money value object / dinero.js; never raw floats for fiscal money.
- Preserve organization/company/RUC scoping in APIs, repositories, jobs, seeds, exports, and tests.
- Do not bypass audit trails, fiscal truth evidence, approval gates, or CDR traceability.
- No secrets, production tokens, customer data, or unjustified raw SQL.
- No `any`: use precise types, `unknown`, branded IDs, or justified generics.

## Fast search recipes

```bash
# Root .rgignore/.fdignore skip noisy archives and generated outputs.
rg "Money|dinero|RUC|SIRE|SUNAT|IGV" apps packages docs
rg "organizationId|companyId|ruc" apps/api packages/persistence packages/application
rg "new Elysia|\.get\(|\.post\(" apps/api/src/features
rg "create.*UseCase|Command|Query" packages/application apps/api/src/features
fd 'package.json|pyproject.toml|Cargo.toml' apps packages services
fd 'README.md|AGENTS.md|DESIGN.md' apps packages docs services

# Go CLI specific
rg "func (Init|Update|View|Execute)" apps/cli/internal
rg "screenMenu|screenHelp|screenResult" apps/cli/internal/tui/app
rg "DefaultPalette|Palette" apps/cli/internal/tui
rg "renderSidebar|renderStatusBar|contextPanel" apps/cli/internal/tui/app
rg "fiscal|SUNAT|RUC|detraccion" apps/cli
fd '.go' apps/cli --type f | sort
```

## Do not search first

Default `rg` and `fd` searches use root `.rgignore` and `.fdignore` to skip noisy history/build outputs. Search archived evidence only when the task explicitly asks for history, migration evidence, or cleanup audit: `archive/`, `docs/archive/`, `.trash/`, `test-results/`, `reports/`, `dist/`, `coverage/`, `node_modules/`, `bun.lock`, `*.tsbuildinfo`.

## Common tasks → exact paths

| Task                           | Start path                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Add API feature                | `apps/api/src/features/<feature>/`                                           |
| Add app route                  | `apps/web/src/routes/`                                                       |
| Update domain fiscal logic     | `packages/domain/src/` plus tests                                            |
| Update DB schema/repository    | `packages/persistence/src/schema/`, `packages/persistence/src/repositories/` |
| Update SUNAT/UBL adapters      | `packages/infrastructure/src/sunat/`, `packages/infrastructure/src/xml/`     |
| Update AI gateway/agents       | `packages/ai/src/`, `packages/drenyra-orchestrator/src/`                     |
| Update shared UI               | `packages/ui/src/`, consumers in `apps/web`/`apps/landing`                   |
| Update docs navigation         | `CODEX-MAP.md`, `.codebase/index.yml`, `docs/CODEBASE-GUIDE.md`              |
| Update Go CLI (TUI/Tax/Config) | `apps/cli/` see `MAP.md`                                                     |

## Key commands

```bash
bun run codebase:index
bun run codebase:index:check
bun run typecheck
bun run docs:verify
bun run architecture:check-boundaries
bun run compliance:sire-gate
bun run compliance:sire-repro

# Go CLI
cd apps/cli && go build ./...
cd apps/cli && go test ./...
```
