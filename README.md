# DRENYRA — Codex + Digits

> Drenyra es el producto flagship de DRENYRA. **Codex** es el motor fiscal determinista. **Digits** es la experiencia de usuario. Juntos forman el sistema de inteligencia fiscal-operativa para Perú y LATAM.

---

## ADN: Codex + Digits

| Layer | Qué es | Stack |
|-------|--------|-------|
| **Codex** | Motor de reglas fiscales deterministas — SUNAT, RUC, IGV, SIRE, CDR, detracciones, PLE. Lógica testable, replayable, 100% cubierta. | TypeScript strict, Bun + Elysia, PostgreSQL + Drizzle, Go (evidence graph) |
| **Digits** | Experiencia de usuario — web SPA para el día a día + CLI para operaciones avanzadas. Cash-flow, close, conciliación, compliance en una interfaz. | React 19 + Vite + TanStack Router (web), Go + Bubbletea (CLI) |

---

## Quickstart

```bash
bun install --frozen-lockfile
cp .env.example .env
bun run dev:stack
bun run db:push
bun run dev:check
```

**Servicios esperados:**

| Servicio | URL |
|----------|-----|
| Web (Digits / Command Center) | `http://localhost:5174` |
| API (Codex engine) | `http://localhost:3000` |
| Swagger | `http://localhost:3000/swagger` |
| Data Engine | `http://localhost:8000/health` |

**CLI:**

```bash
cd apps/drenyra-cli
go run cmd/drenyra/main.go
```

---

## Architecture

Drenyra is a multi-app monorepo extracted from the DRENYRA monorepo as a standalone project. It follows Clean Architecture with CQRS, vertical slices, and evidence-first AI agent orchestration.

```
drenyra/drenyra/
├── apps/
│   ├── web/              → React 19 SPA — fiscal intelligence dashboard
│   ├── api/              → Elysia (Bun) — API orquestadora con agentes AI
│   ├── drenyra-cli/      → Go + Bubbletea — TUI para operaciones fiscales
│   └── data-engine/      → FastAPI + Polars — procesamiento analítico
├── packages/
│   ├── drenyra-core/         → Tipos compartidos y definiciones de agentes
│   ├── drenyra-orchestrator/ → Orquestación con Mastra + Vercel AI SDK
│   ├── drenyra-engram/       → Persistencia de evidencia en Go
│   ├── ai/                   → Gateway de modelos (OpenRouter, Gemini)
│   ├── application/          → Casos de uso (CQRS)
│   ├── domain/               → Modelos de dominio
│   ├── infrastructure/       → Infraestructura (DB, S3, servicios)
│   ├── persistence/          → Drizzle ORM + PostgreSQL
│   ├── shared/               → Utilidades compartidas
│   └── ui/                   → Design system (Tailwind 4, shadcn/ui)
└── package.json
```

---

## Tech Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React 19 + Vite + TanStack Router | Drenyra SPA command center |
| API | Bun + Elysia + Swagger | Vertical slices, CQRS, Eden Treaty |
| Data Engine | FastAPI + Polars | Procesamiento analítico high-throughput |
| Database | PostgreSQL 16 + Drizzle ORM | ORM type-safe |
| Auth | Better Auth | Email/password, OAuth, sesiones, RBAC |
| AI | OpenRouter + Gemini + Mastra | Model gateway, agent orchestration |
| CLI | Go + Cobra + Bubbletea | Drenyra TUI para operaciones fiscales |
| Design System | Tailwind 4 + shadcn/ui + Glass & Steel | Tokens DTCG, dark-mode enterprise |
| Testing | Vitest + Playwright | 80/100/0 rule: 80% unit, 100% fiscal paths, 0% flaky E2E |

---

## What Drenyra Does

- **Codex: Deterministic Fiscal Engine** — SUNAT rules (RUC, IGV, SIRE, CDR, detracciones, PLE) translated into testable, replayable logic. Every output with a complete evidence trail: `source → normalized → validated → proposed → approved → promoted`.
- **Digits: Unified Accounting Experience** — Web SPA (React 19) for daily operations + CLI (Go + Bubbletea) for advanced TUI. Cash-flow, close, reconciliation, and compliance in a single interface.
- **Agentic Work with Approval Gates** — AI agents draft, prepare, and flag work. Humans approve fiscal and accounting decisions. Every interaction captured in the audit trail.
- **Multi-RUC, Multi-Tenant** — Built from day one for accounting firms managing multiple clients with distinct RUCs, regimes, and obligations.

---

## Philosophy

Drenyra está construido sobre la tesis de **evidence-first AI**: los agentes proponen, el sistema valida, el contador aprueba, y Drenyra deja evidencia. No hay decisión fiscal sin supervisión humana, no hay operación sin rastro de auditoría.

Este repo contiene TODO Drenyra — desde la web app hasta el CLI, pasando por la API, la orquestación de agentes, y la infraestructura de persistencia. Extraído del monorepo DRENYRA como proyecto standalone.

---

## Project Status

**Status:** Active
**Version:** 1.0

---

## Relationship to DRENYRA

This is the flagship product of the [DRENYRA ecosystem](../drenyra/sdd/ecosystem-readme-sdd/00-README.md). Drenyra es a la contabilidad peruana lo que Codex es al desarrollo de software. Codex + Digits: un motor fiscal determinista con una experiencia humana primero.

> **Built by DreamCoder. From Peru. For Latin America.**

---

## License

MIT — see [LICENSE](./LICENSE).

---

## Platform integration

This repo is the **canonical fiscal product**. The Drenyra platform shell loads it via Module Federation in production.

- [docs/canon/product-topology.md](./docs/canon/product-topology.md)
- Cross-repo workflow: [Drenyra docs/cross-repo/drenyra-connection.md](https://github.com/drenyra/Drenyra/blob/main/docs/cross-repo/drenyra-connection.md)

---

## SDD

Documentation is maintained in the [SDD Maestro](../drenyra/sdd/ecosystem-readme-sdd/00-README.md). Edit the SDD first, then propagate.
