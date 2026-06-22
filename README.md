# DRENYRA — Command Center for ARKELYTHEX Fiscal Infrastructure

> **Drenyra es el centro de comando operativo de ARKELYTHEX.** Donde agentes de AI preparan, revisan y explican trabajo contable — siempre bajo supervisión humana, evidencia versionada y approval gates.

La documentación sigue la **Gentleman Philosophy**: lead with the answer, progressive disclosure. Empecemos.

---

## ¿Qué es Drenyra?

Drenyra es la interfaz visible de la Infraestructura Nacional de Inteligencia Fiscal de ARKELYTHEX. Traduce compliance fiscal (SUNAT, SIRE, IGV, retenciones, detracciones) en un **sistema operativo** para estudios contables y empresas multi-RUC.

No es otro dashboard contable. Es un **command center** donde:

- **AI agents** preparan, revisan y explican trabajo contable
- **Humanos** aprueban cada decisión fiscal antes de ejecutarse
- **Evidencia** queda versionada, trazable y auditable de punta a punta
- **Workflows** conectan spreadsheets, PDFs, XML-UBl, SUNAT, y bancos en un solo lugar

### Lo que permite

- **Fiscal intelligence evidence-first** — anomalías, trails de origen y explicaciones de riesgo antes de acciones materiales.
- **Visibilidad operativa continua** — cash-flow, close, conciliación y compliance en tiempo real.
- **Trabajo agentico con approval gates** — agentes preparan, humanos deciden, el sistema deja evidencia.

---

## Componentes

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

## Quickstart

```bash
bun install --frozen-lockfile        # Instalar dependencias
cp .env.example .env                  # Configurar entorno
bun run dev:stack                     # Iniciar servicios
bun run db:push                       # Sincronizar DB
bun run dev:check                     # Verificar todo funciona
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

## Stack Tecnológico (2026)

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
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

## Filosofía

Drenyra está construido sobre la tesis de **evidence-first AI**: los agentes proponen, el sistema valida, el contador aprueba, y Drenyra deja evidencia. No hay decisión fiscal sin supervisión humana, no hay operación sin rastro de auditoría.

Este repo contiene TODO Drenyra — desde la web app hasta el CLI, pasando por la API, la orquestación de agentes, y la infraestructura de persistencia. Extraído del monorepo ARKELYTHEX como proyecto standalone.

> **Built by DreamCoder. From Peru. For Latin America.**
>
> [ARKELYTHEX](https://github.com/arkelythex) · [DreamCoder](https://github.com/Dreamcoder08)
