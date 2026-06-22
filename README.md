<div align="center">
  <img width="1200" alt="Arkelythex Banner" src="./docs/assets/Interfaz.jpg" />
</div>

# ARKELYTHEX — Inteligencia Fiscal-Operativa para LATAM

> **ARKELYTHEX es la empresa y plataforma. Drenyra es el command center fiscal insignia.**

La documentación de este repo sigue la **Gentleman Philosophy**: lead with the answer, warm teaching, progressive disclosure. Empecemos.

---

## ¿Qué es ARKELYTHEX y por qué debería importarte?

ARKELYTHEX construye la **Infraestructura Nacional de Inteligencia Fiscal** para Perú y LATAM. Traduce el compliance fiscal (SUNAT, SIRE, IGV, retenciones, detracciones) en un sistema operativo para estudios contables y empresas multi-RUC.

**Drenyra** es el command center donde agentes AI preparan, revisan y explican trabajo contable — siempre bajo supervisión humana, evidencia versionada y approval gates.

### Lo que permite

- **Fiscal intelligence evidence-first** — anomalías, trails de origen y explicaciones de riesgo antes de acciones materiales.
- **Visibilidad operativa continua** — cash-flow, close, conciliación y compliance en un solo command center.
- **Trabajo agentico con approval gates** — agentes preparan, revisan y explican; humanos aprueban decisiones fiscales/contables.

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

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/swagger`
- Data Engine: `http://localhost:8000/health`

---

## Stack Tecnológico (2026)

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | React 19 + Vite + TanStack Router | Drenyra SPA command center |
| API | Bun + Elysia + Swagger | Vertical slices, CQRS, Eden Treaty |
| Data Engine | FastAPI + Polars | Procesamiento analítico high-throughput |
| Database | PostgreSQL 16 + Drizzle ORM | ORM type-safe, schema en packages/persistence |
| Auth | Better Auth | Email/password, OAuth, sesiones, RBAC |
| Messaging | NATS JetStream | Eventos async, colas |
| AI | OpenRouter + Gemini + Mastra | Model gateway, agent orchestration |
| CLI | Go + Cobra + Bubbletea | Drenyra CLI para operaciones fiscales TUI |
| Design System | Tailwind 4 + shadcn/ui + Glass & Steel | Tokens DTCG, dark-mode enterprise |
| Testing | Vitest + Playwright | 80/100/0 rule: 80% unit, 100% fiscal paths, 0% flaky E2E |

> Stack detallado: [Stack Tecnológico 2026](./docs/01-architecture/STACK.md) · [Backend Platform Target](./docs/01-architecture/03-backend/backend-platform-target-2026.md)

---

## Ecosystem Architecture

```
arkelythex/
├── apps/                    # 5 aplicaciones
│   ├── api/                 # Bun + Elysia backend (42 features)
│   ├── web/                 # React 19 Drenyra SPA (47 routes)
│   ├── landing/             # Next.js landing page
│   ├── data-engine/         # Python + FastAPI analytics
│   └── drenyra-cli/         # Go CLI (TUI fiscal)
├── packages/                # ~16 paquetes compartidos
│   ├── domain/              # Framework-free, Money, RUC, fiscal rules
│   ├── application/         # Use cases, CQRS, DTOs
│   ├── persistence/         # Drizzle schema, repos, UoW
│   ├── infrastructure/      # Adapters: DB, queues, SUNAT, AI, XML
│   ├── ai/                  # AI facade, model registry, tool bridge
│   ├── ui/                  # Glass & Steel design system
│   └── ...                  # test-utils, rust-core, agent-memory, etc.
├── docs/                    # Documentación Diataxis
│   ├── 00-getting-started/  # Tutoriales
│   ├── 01-architecture/     # Explicación + ADRs (~30)
│   ├── 03-features/         # Feature docs
│   ├── 04-api/              # API reference
│   ├── 05-development/      # How-to guides
│   └── meta/                # Meta-documentación + Gentleman Philosophy
└── CODEX-MAP.md             # Mapa de navegación principal
```

> Cada app tiene su propio `MAP.md` con rutas y recetas de búsqueda. Empezá por ahí.

---

## Documentación: Por dónde empezar

### Rápido (3 minutos)

| Recurso | Para qué |
|---------|----------|
| [CODEX-MAP.md](./CODEX-MAP.md) | Mapa del monorepo: apps, packages, search recipes |
| [docs/README.md](./docs/README.md) | Índice maestro por audiencia (dev, contador, producto, ops) |
| [Gentleman Philosophy](./docs/meta/gentleman-philosophy.md) | Cómo escribimos docs (cognitive load, warm teaching) |

### Developer

1. [Getting Started](./docs/00-getting-started/README.md) — setup local
2. [Arquitectura](./docs/01-architecture/README.md) — stack, principios, guards
3. [Guías de desarrollo](./docs/05-development/README.md) — testing, CI, branch strategy
4. [ADRs](./docs/02-adr/README.md) — decisiones técnicas documentadas
5. [API Reference](./docs/04-api/README.md) — endpoints, schemas, ejemplos

### Contador / Auditor

1. [Strategic Positioning](./docs/business/strategic-positioning-2026.md)
2. [Glosario fiscal](./docs/reference/glossary.md)
3. [SUNAT Regulations 2026](./docs/concepts/sunat-regulations-2026.md)
4. [SUNAT Capabilities](./docs/concepts/SUNAT_CAPABILITIES_2026.md)

### Ops / DevOps

1. [Deployment guides](./docs/guides/deployment/)
2. [Runbooks](./docs/06-runbooks/)
3. [Security](./docs/07-security/)

---

## Strategic Context (2026)

| Capability | Qué significa | Por qué importa |
|:-----------|:--------------|:----------------|
| **Fiscal Truth Infrastructure** | Evidence graph, reglas determinísticas, agentes gobernados para trabajo fiscal/contable | Compliance se vuelve un sistema operativo, no un scramble mensual |
| **Drenyra Command Center** | Workspace tipo Codex para empresas, períodos, agentes, evidencia, riesgo y aprobación | Contadores supervisan trabajo fiscal paralelo en vez de perseguir archivos |
| **Continuous Close Intelligence** | Reconciliación, cash-flow, señales SIRE/CPE, colas de riesgo en near real-time | Equipos se mueven hacia zero-day close con aprobación humana auditable |

Links estratégicos:
- [Drenyra Agentic Fiscal Command Center Vision](./docs/products/drenyra-agentic-fiscal-command-center-vision-2026.md)
- [Financial Truth Infrastructure Thesis](./docs/business/financial-truth-infrastructure-thesis-2026.md)
- [ERP & AI Trends 2026](./docs/business/erp-ai-trends-2026.md)

---

## Comandos comunes

```bash
bun run dev:stack              # Iniciar toda la stack
bun run dev:check              # Verificar servicios
bun run typecheck              # TypeScript strict mode
bun run test                   # Tests unitarios + integración
bun run lint                   # ESLint
bun run lint:all               # Lint completo
bun run docs:verify            # Verificar docs freshness
bun run codebase:index         # Regenerar CODEX-MAP.md
bun run codebase:index:check   # Verificar drift
bun run architecture:check-boundaries  # Dependency cruiser
bun run security:audit         # Security audit
```

> Para la pipeline completa de build: [Monorepo Pipeline](./docs/01-architecture/monorepo-pipeline.md)

---

## Non-Negotiables

Esto es un producto fiscal. Estas reglas no se negocian:

- ✅ **Precisión fiscal** — IGV/SUNAT/SIRE/UBL debe ser determinístico y test-cubierto.
- ✅ **Money value object** — nunca `number` o `float` para dinero. Siempre `Money` de `@arkelythex/domain`.
- ✅ **Tenant isolation** — toda operación scoped a RUC/company/organization.
- ✅ **No `any`** — TypeScript strict, `unknown`, branded IDs, generics justificados.
- ✅ **Audit trail** — no bypassear evidencia, approval gates, o CDR traceability.
- ✅ **Sin secretos** — no credentials, tokens, PII, o datos de clientes en el repo.
- ✅ **SDD para cambios críticos** — ciclo completo para SUNAT/DB/tenant/money changes.

> Ver [AGENTS.md](./AGENTS.md) para las reglas de ingeniería completas.

---

## Notas

- `bun run dev` no reemplaza `bun run dev:stack`; asume que la infraestructura base ya existe.
- El despliegue canónico implementado en el repo hoy es Docker y Fly.io para la API.
- Si la documentación escrita difiere de Swagger o de `apps/api/src/app-core.ts`, tomá el código como fuente de verdad.
- La documentación sigue la [Gentleman Philosophy](./docs/meta/gentleman-philosophy.md): cognitive load reduction, warm teaching, progressive disclosure.
