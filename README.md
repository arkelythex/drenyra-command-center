# DRENYRA — Command Center for ARKELYTHEX Fiscal Infrastructure

> Drenyra es el centro de comando operativo de ARKELYTHEX. Donde agentes de AI preparan, revisan y explican trabajo contable — siempre bajo supervisión humana, evidencia versionada y approval gates.

**Drenyra is the flagship product and operational command center of the ARKELYTHEX ecosystem.** It translates fiscal compliance (SUNAT, SIRE, IGV, retenciones, detracciones) into a unified operating system for accounting firms and multi-RUC enterprises across Peru and Latin America.

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
| Web (dashboard) | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/swagger` |
| Data Engine | `http://localhost:8000/health` |

**CLI:**

```bash
cd apps/drenyra-cli
go run cmd/drenyra/main.go
```

---

## Architecture

Drenyra is a multi-app monorepo extracted from the ARKELYTHEX monorepo as a standalone project. It follows Clean Architecture with CQRS, vertical slices, and evidence-first AI agent orchestration.

```
arkelythex/drenyra/
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

## What Drenyra Enables

- **Fiscal Intelligence, Evidence-First** — Anomalies, origin trails, and risk explanations surface before any material action is taken. Every decision anchors to versioned evidence.
- **Continuous Operational Visibility** — Cash-flow, close, reconciliation, and compliance status converge in a single command center. No more chasing spreadsheets across period end.
- **Agentic Work with Approval Gates** — AI agents draft, prepare, and flag work for review. Humans approve fiscal and accounting decisions. The audit trail captures every interaction.
- **Multi-RUC, Multi-Tenant** — Built from day one for accounting firms managing multiple clients, each with distinct RUCs, regimes, and compliance obligations.

---

## Philosophy

Drenyra está construido sobre la tesis de **evidence-first AI**: los agentes proponen, el sistema valida, el contador aprueba, y Drenyra deja evidencia. No hay decisión fiscal sin supervisión humana, no hay operación sin rastro de auditoría.

Este repo contiene TODO Drenyra — desde la web app hasta el CLI, pasando por la API, la orquestación de agentes, y la infraestructura de persistencia. Extraído del monorepo ARKELYTHEX como proyecto standalone.

---

## Project Status

**Status:** Active
**Version:** 1.0

---

## Relationship to ARKELYTHEX

This is the flagship product of the [ARKELYTHEX ecosystem](../arkelythex/sdd/ecosystem-readme-sdd/00-README.md). Drenyra is to fiscal operations what Codex is to software development — a structured, inspectable workspace where complex work gets done through human-AI collaboration.

> **Built by DreamCoder. From Peru. For Latin America.**

---

## License

MIT — see [LICENSE](./LICENSE).

---

## SDD

Documentation is maintained in the [SDD Maestro](../arkelythex/sdd/ecosystem-readme-sdd/00-README.md). Edit the SDD first, then propagate.
