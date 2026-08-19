# Drenyra Command Center — Codebase Guide

> **Last updated:** 2026-08-19.

## Repository map

Monorepo managed with **Bun 1.3.11** (`bun.lock`, `bunfig.toml`) and **Turborepo** (`turbo.json`). Workspaces: `apps/*` and `packages/*`. Package manager identity: `@drenyra/main`.

| Path | Purpose |
| --- | --- |
| `apps/web/` | Command Center UI — React 19 + TanStack Router (`MAP.md`). |
| `apps/api/` | Fiscal API — Bun + ElysiaJS, vertical slices, CQRS (`MAP.md`). |
| `apps/data-engine/` | SIRE & analytics — Python + FastAPI + Polars (`MAP.md`). |
| `apps/cli/` | Fiscal terminal — Go + Bubbletea (`MAP.md`, `README.md`). |
| `packages/domain/` | Framework-free entities, value objects, fiscal rules. |
| `packages/application/` | Use cases, DTOs, validators, ports. |
| `packages/persistence/` | Drizzle schemas, repositories, tenant-scoped queries. |
| `packages/infrastructure/` | Adapters: DB, S3, SUNAT, AI, XML/UBL, auth, queues. |
| `packages/ai/` | AI facade, model gateway, tool contracts. |
| `packages/agents/` | Agent runtime: Mastra orchestration, delegation, approvals. |
| `packages/pi/` | Pi-side runtime layers and tool orchestration (`approval-gate.ts`). |
| `packages/drenyra-orchestrator/` | Work routing, skills resolution, review lenses, delegation. |
| `packages/mission-domain/`, `packages/mission-protocol/` | Adapter shims over `drenyra-ai` receipts and missions. |
| `packages/shared/`, `packages/security/`, `packages/memory/`, `packages/ui/` | Cross-cutting helpers, security, memory reads, design system. |
| `packages/workspace-*/`, `packages/fiscal-*/` | Workspace and fiscal verticals (control, domain, projections, compliance, approval, query). |
| `engines/` | Rust — critical verification (ledger, hashing, receipts). |
| `services/` | Go — connectors, ingestion, enterprise bridge. |
| `contracts/` | Canonical schemas — OpenAPI, AsyncAPI, Protobuf (receipt-schema v1, data-engine v1). |
| `country-packs/` | Versioned fiscal rules per country — Peru first, then LATAM. |
| `docs/` | Documentation: index (`00-INDEX.md`), architecture, ADRs, fiscal, development, products. |
| `ops/` | Runtime infrastructure, observability. |
| `e2e/`, `tests/` | Product smoke tests (Playwright) and shared test tooling. |
| `scripts/`, `fixtures/`, `vendored/` | Dev scripts, test fixtures, vendored `drenyra-ai` tarball. |

## Layering (who may import whom)

```
web / cli / data-engine        (experience surfaces)
        │
api (Elysia — an input adapter, not the architecture)
        │
application (use cases, ports) ──► domain (framework-free, fiscal rules)
        │                              ▲
persistence / infrastructure / ai     │   adapters at the edges
        │                              │
        └──── drenyra-ai (consumed artifact) ──┘
```

- `packages/domain` is **framework-free** (ADR-005). It holds entities, value objects, and deterministic fiscal rules and must not import React, Elysia, Drizzle, or other packages.
- `packages/application` depends on `domain`.
- Adapters live in `persistence`, `infrastructure`, and `ai` packages; Elysia endpoints hold no domain logic (ADR-001, ADR-004).
- Feature work uses **vertical slices + CQRS** (ADR-004). The architecture is a modular monolith with hexagonal boundaries per domain — no premature microservices.
- The core does not depend on the UI: the UI may go down and rebuild from Core state.

### Ecosystem direction (one-way)

This repo **consumes** `drenyra-ai` and `drenyra-engram`; neither may ever depend on it.

| Repo | How | Constraint |
| --- | --- | --- |
| `drenyra-ai` | released, versioned artifacts — today a vendored tarball (`vendored/drenyra-ai-0.2.0.tgz`), npm registry when published (ADR-013) | never a checkout; no copy-paste of source |
| `drenyra-engram` | memory reads/context through its surfaces | memory never authorizes |

The canonical contract types live in `drenyra-ai` / `drenyra-engram`; this repo imports them and does not fork them ([dependency-direction.md](architecture/dependency-direction.md)).

## Where a change goes

| Change | Goes to |
| --- | --- |
| Product UI, inboxes, review/approval screens | `apps/web` (read `apps/web/MAP.md` first) |
| API routes, endpoints, request handling | `apps/api` (vertical slice per feature) |
| Fiscal domain rules, value objects, entities | `packages/domain` |
| Use cases, DTOs, ports | `packages/application` |
| DB access, repositories, tenant queries | `packages/persistence` |
| External adapters (SUNAT, S3, AI, UBL/XML, auth) | `packages/infrastructure`, `packages/ai` |
| Mission/receipt consumption from `drenyra-ai` | `packages/mission-domain`, `packages/mission-protocol` (shims — not re-implementations) |
| Work routing, review lenses, delegation | `packages/drenyra-orchestrator` |
| Country fiscal rules | `country-packs/` |
| Canonical schemas | `contracts/` |
| Rust verification | `engines/` |
| Go connectors | `services/` |
| Documentation | `docs/` (Diátaxis quadrants; docs-as-code — same PR as the code) |

A change that would require editing `drenyra-ai` to satisfy this repo's internals is a contract bug: the contract is public and this repo adapts.

## Money, scope, and safety invariants

Treat fiscal correctness, tenant isolation, and auditability as **product safety requirements** (see `AGENTS.md`).

1. **Money is BigInt cents, never floats.** `packages/domain/src/value-objects/Money.ts` uses the cents pattern (integer smallest unit, immutable value object). Floats or raw numbers for money are rejected; version/sequence numbers are JSON integers, never floats.
2. **RUC/period scope is mandatory.** Every query, job, seed, export, and test is scoped to organization/company (RUC)/period. Bypassing tenant scoping is a non-negotiable violation.
3. **Every material action produces a receipt.** RED (Receipt-Driven Execution): signed, append-only, verifiable offline.
4. **The evidence graph lifecycle is explicit:** `source → normalized → validated → proposed → approved → promoted`. No black boxes.
5. **Material workflows are spec-first (FSD).** Every material workflow starts with a Fiscal Specification; gates, approvals, and receipts follow it.
6. **The Core decides.** The MissionOrchestrator holds no fiscal authority; only `drenyra-ai` accepts transitions (ADR-011). The Command Center never converts a Core rejection into an approval.
7. **No duplicated authority.** Zero local implementations of `validateLedger`, `deriveMateriality`, `signReceipt`, or `verifySignedReceipt` — verified by grep (ADR-013).
8. **No `any` without justification; no silent error handling; no production `console.log`.** Precise types, `unknown`, or justified generics only.

## Testing and verification

Run the narrowest relevant check first, then broader checks when risk justifies it (all commands verified in root `package.json`):

| Command | Scope |
| --- | --- |
| `bun run typecheck` | TypeScript across the check config |
| `bun run lint` / `bun run lint:all` | Biome on core paths / entire repo |
| `bun run test` (or `bun run turbo:test`) | Workspace tests (`--filter '*'`) |
| `bun run test:e2e` | Playwright product smoke tests |
| `bun run docs:verify` | Link checks + product-surface checks (docs-as-code) |
| `bun run architecture:check-boundaries` | Package boundaries, framework isolation, enforcement pack |

Testing conventions:

- Property-based testing for domain/fiscal logic (ADR-008).
- Keep fiscal/domain logic deterministic and covered by tests; validate API inputs with schemas at service boundaries.
- SUNAT/UBL/IGV behavior changes require compliance-focused tests.
- Cross-language: `engines/` (Rust) and `apps/cli` (Go) have their own test entry points (`rust:core:test`, `go:drenyra:test`).

## Conventions

- **Commits:** Conventional Commits; no AI attribution markers.
- **Docs:** docs-as-code (update in the same PR as code), `**Last updated:**` line at top of each doc, Diátaxis structure, markdownlint + link checking via `docs:check-links`.
- **Navigation:** start at root `CODEX-MAP.md`; each app has a `MAP.md` — read it before exploring inside an app.
- **IDs:** prefer branded IDs or domain value objects for identifiers and money-sensitive data.
- **Boundaries:** architecture boundary checks run in CI; direction violations are caught in review (see `AGENTS.md` review gate).

## Read next

- [Documentation Index](00-INDEX.md) — full map of `docs/`.
- [ARCHITECTURE.md](ARCHITECTURE.md) — org-level 5-layer model.
- [architecture/](architecture/) — ecosystem boundaries, dependency direction, trust model, orchestration roles.
- [Getting Started](10-development/getting-started.md) — local setup walkthrough.
- [Canonical Stack](01-foundation/canonical-stack.md) — TypeScript to discover/build, Rust to verify/protect, Go to connect/operate.
- [Product Philosophy](products/drenyra-product-philosophy.md) — product direction and guardrails.
