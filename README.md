# DRENYRA — El sistema operativo contable con IA para LATAM

> Drenyra es el **sistema operativo contable con IA** para contadores, estudios contables y pymes de LATAM: automatiza, valida y organiza obligaciones tributarias, evidencias, flujos SUNAT/SIRE/PLE y revisión profesional — **sin cajas negras**.
>
> **Codex** (motor fiscal determinista) + **Digits** (experiencia de usuario) = AI + compliance + accounting + evidence + LATAM.

---

## ADN: Codex + Digits

| Layer      | Qué es                                                                                                                                           | Stack                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Codex**  | Motor de reglas fiscales deterministas — SUNAT, RUC, IGV, SIRE, CDR, detracciones, PLE. Lógica testable, replayable, 100% cubierta.              | TypeScript strict, Bun + Elysia, PostgreSQL + Drizzle, Go (evidence graph) |
| **Digits** | Experiencia de usuario — web SPA para el día a día + CLI para operaciones avanzadas. Cash-flow, close, conciliación, compliance en una interfaz. | React 19 + Vite + TanStack Router (web), Go + Bubbletea (CLI)              |

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

| Servicio                      | URL                             |
| ----------------------------- | ------------------------------- |
| Web (Digits / Command Center) | `http://localhost:5174`         |
| API (Codex engine)            | `http://localhost:3000`         |
| Swagger                       | `http://localhost:3000/swagger` |
| Data Engine                   | `http://localhost:8000/health`  |

**CLI:**

```bash
cd apps/cli
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
│   ├── drenyra-orchestrator/ → Orquestación con Mastra + Vercel AI SDK
│   ├── drenyra-engram/       → Persistencia de evidencia en Go
│   ├── ai/                   → Gateway de modelos (OpenRouter, Gemini)
│   ├── application/          → Casos de uso (CQRS)
│   ├── domain/               → Modelos de dominio (incluye agent definitions)
│   ├── infrastructure/       → Infraestructura (DB, S3, servicios)
│   ├── persistence/          → Drizzle ORM + PostgreSQL
│   ├── shared/               → Utilidades compartidas
│   └── ui/                   → Design system (Tailwind 4, shadcn/ui)
└── package.json
```

---

## Tech Stack

| Layer         | Tech                                   | Purpose                                                  |
| ------------- | -------------------------------------- | -------------------------------------------------------- |
| Frontend      | React 19 + Vite + TanStack Router      | Drenyra SPA command center                               |
| API           | Bun + Elysia + Swagger                 | Vertical slices, CQRS, Eden Treaty                       |
| Data Engine   | FastAPI + Polars                       | Procesamiento analítico high-throughput                  |
| Database      | PostgreSQL 16 + Drizzle ORM            | ORM type-safe                                            |
| Auth          | Better Auth                            | Email/password, OAuth, sesiones, RBAC                    |
| AI            | OpenRouter + Gemini + Mastra           | Model gateway, agent orchestration                       |
| CLI           | Go + Cobra + Bubbletea                 | Drenyra TUI para operaciones fiscales                    |
| Design System | Tailwind 4 + shadcn/ui + Glass & Steel | Tokens DTCG, dark-mode enterprise                        |
| Testing       | Vitest + Playwright                    | 80/100/0 rule: 80% unit, 100% fiscal paths, 0% flaky E2E |

---

## What Drenyra Does

- **AI + Compliance + Accounting** — Drenyra unifica lo que antes eran 3 herramientas separadas: motor fiscal determinista (Codex), experiencia de usuario contable (Digits), y orquestación de agentes de IA con supervisión humana. Todo en un solo sistema operativo.
- **Deterministic Fiscal Engine** — SUNAT rules (RUC, IGV, SIRE, CDR, detracciones, PLE) translated into testable, replayable logic. Every output with a complete evidence trail: `source → normalized → validated → proposed → approved → promoted`.
- **Agentic Work with Approval Gates** — AI agents draft, prepare, and flag work. Humans approve fiscal and accounting decisions. Every interaction captured in the audit trail. **Sin cajas negras: toda decisión de IA es auditable y reversible.**
- **Multi-RUC, Multi-Tenant** — Built from day one for accounting firms managing multiple clients across LATAM with distinct RUCs, regimes, and obligations.
- **Evidence-First Infrastructure** — No es una app bonita: es una infraestructura contable donde cada operación deja evidencia, cada decisión tiene trazabilidad, y cada flujo SUNAT/SIRE/PLE está automatizado sin perder control profesional.

---

## Philosophy

Drenyra está construido sobre la tesis de **evidence-first AI**: los agentes proponen, el sistema valida, el contador aprueba, y Drenyra deja evidencia. No hay decisión fiscal sin supervisión humana, no hay operación sin rastro de auditoría.

Este repo contiene TODO Drenyra — desde la web app hasta el CLI, pasando por la API, la orquestación de agentes, y la infraestructura de persistencia. Extraído del monorepo DRENYRA como proyecto standalone.

---

## Strategic Positioning

### El problema

Los contadores, estudios contables y pymes de LATAM operan con herramientas desconectadas: un ERP para contabilidad, portales SUNAT separados, hojas de cálculo para seguimiento, y carpetas compartidas para evidencia. La IA promete automatización, pero llega en cajas negras que ningún contador puede auditar.

### La tesis

Drenyra es **el sistema operativo contable con IA** que resuelve esto: no es una app bonita, es una infraestructura contable. La diferencia es fundamental:

| App contable     | Drenyra (infraestructura)                |
| ---------------- | ---------------------------------------- |
| Captura datos    | Orquesta obligaciones tributarias        |
| Muestra reportes | Automatiza flujos SUNAT/SIRE/PLE         |
| IA como feature  | IA gobernada con evidencia y supervisión |
| Single-tenant    | Multi-RUC, multi-régimen, multi-LATAM    |
| Caja negra       | Cada decisión trazable y auditable       |

### El ángulo ganador

**AI + compliance + accounting + evidence + LATAM.** Cinco fuerzas que Drenyra integra en un solo sistema:

1. **AI** — Agentes que proponen, redactan y preparan; humanos que aprueban.
2. **Compliance** — Reglas fiscales deterministas (SUNAT, IGV, SIRE, CDR, PLE).
3. **Accounting** — Contabilidad real, no solo facturación electrónica.
4. **Evidence** — Cada decisión con trail completo: `source → normalized → validated → proposed → approved → promoted`.
5. **LATAM** — Construido desde Perú para la realidad fiscal latinoamericana, no adaptado de un producto US/EU.

### Estrategia de crecimiento

> **No busques financiación primero. Buscá validación que te vuelva financiable.**

El dinero llega cuando Drenyra demuestra que no es solo una app bonita, sino una infraestructura contable con:

- **Clientes reales** resolviendo problemas urgentes
- **Ventaja técnica** demostrable (determinismo + evidencia + agentes gobernados)
- **Potencial LATAM** como mercado direccionable

---

## Project Status

**Status:** Active
**Version:** 1.0

---

## Relationship to DRENYRA

This is the flagship product of the [DRENYRA ecosystem](../drenyra/sdd/ecosystem-readme-sdd/00-README.md). Drenyra es a la contabilidad peruana lo que Codex es al desarrollo de software. Codex + Digits: un motor fiscal determinista con una experiencia humana primero.

> **Built by DreamCoder. From Peru. For Latin America.**
>
> Drenyra es infrastructure-first: buscamos validación que nos vuelva financiables, no financiación que oculte la falta de validación.

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
