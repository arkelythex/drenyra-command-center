# Drenyra Canonical Stack

**Última actualización:** 2026-07-24
**Content type:** Architecture — Definitive Stack Decision
**Supersedes:** Tech stack discussions pre-2026-07

---

## Tesis central

Drenyra no se construye con un solo lenguaje ni con microservicios desde el día uno.

> **TypeScript para descubrir y construir. Rust para verificar y proteger. Go para conectar y operar. PostgreSQL para preservar la verdad.**

La arquitectura es **monolito modular con hexagonal por dominio**, preparado para extracción progresiva de servicios cuando la escala o la criticidad lo justifiquen.

---

## Stack canónico

| Capa | Tecnología | Rol |
|------|-----------|-----|
| Frontend | TypeScript + React + TanStack Start | Experiencia web, routing, loaders, estado URL |
| Design system | React + Tailwind CSS + Radix | Componentes, tokens, accesibilidad |
| API de producto | TypeScript + Elysia + Bun | BFF, comandos, queries, autorización |
| Domain core | TypeScript puro | Entidades, VO, agregados, eventos, reglas |
| Workflows | Temporal | Procesos largos, retries, pausas humanas |
| Event bus | NATS JetStream | Eventos de dominio, integración, streaming |
| Base de datos | PostgreSQL | Verdad central (ledger, docs, policies, evidencia) |
| Analytics | ClickHouse | Telemetría, históricos, tendencias (futuro) |
| Cache | Redis / Valkey | Sesiones, rate limiting, locks efímeros |
| Objetos/evidencia | S3-compatible | XML, PDF, CDR, receipts, artifacts |
| Search | PostgreSQL FTS → OpenSearch | Búsqueda progresiva |
| Observabilidad | OpenTelemetry + Grafana | Trazas, métricas, logs |

---

## Distribución por lenguaje

### TypeScript — lenguaje principal del producto

**Domina:** Web app, API, dominio inicial, agent runtime, model gateway, CLI inicial, workflows de baja criticidad, automatizaciones, contratos compartidos, SDK.

**Razón:** Velocidad de iteración, un lenguaje frontend/backend, ecosistema IA, schemas, validación, contratación accesible. TypeScript no es el límite de corrección — la corrección viene del modelo de dominio, invariantes, tipos, DB constraints, idempotencia, pruebas, evidencia y revisión.

### Rust — núcleo crítico verificable

**Domina:** Ledger validation engine, canonical hashing, receipt verifier, fiscal rules runtime (WASM), bulk document parser.

**Extracción progresiva** (strangler pattern):

```
TypeScript port → adapter to Rust → compare outputs → shadow traffic → verification → cutover
```

**Candidatos específicos:**

| Engine | Propósito | Prioridad |
|--------|-----------|-----------|
| Canonical hashing | Normalización + hash determinista + receipt signed | Alta |
| Ledger validation | Débitos=créditos, precisión decimal, period locking, invariantes | Alta |
| Receipt verifier | CLI independiente: verificar receipts sin servidor | Media |
| Fiscal rules evaluator | Reglas aprobadas compiladas a WASM | Media |
| Bulk document parser | XML/ZIP masivo, validación criptográfica | Baja |

### Go — infraestructura distribuida e integraciones

**Domina:** Connector gateway (SUNAT, bancos, DIAN, SAT, SII), event relay, ingestion workers, enterprise bridge local.

**Criterio:** Mucho networking e I/O → Go. Criptografía o parsing duro → Rust. Lógica de producto → TypeScript.

---

## Arquitectura: hexagonal + modular monolith

```
┌──────────────────────────────────────────────────────────┐
│                    Driving adapters                      │
│ Web (TanStack Start) · API (Elysia) · CLI · Workers       │
├──────────────────────────────────────────────────────────┤
│                    Application layer                     │
│ Commands · Queries · Workflows · Policies · Use cases    │
├──────────────────────────────────────────────────────────┤
│                       Domain core                        │
│ Ledger · Tax · Evidence · Close · Treasury · Identity    │
├──────────────────────────────────────────────────────────┤
│                      Ports                               │
│ Repositories · Authorities · Banking · Storage · Clock   │
├──────────────────────────────────────────────────────────┤
│                    Driven adapters                       │
│ PostgreSQL · SUNAT · S3 · NATS · Redis · AI providers    │
└──────────────────────────────────────────────────────────┘
```

**Cada bounded context tiene su propia hexagonal.** No hay una hexagonal gigante.

```
domains/ledger/
├── domain/       → entities, value-objects, aggregates, services, events
├── application/  → commands, queries, handlers, ports
├── adapters/     → postgres, events, rust-engine
└── contracts/    → schemas, protobuf, openapi
```

---

## Comunicación entre lenguajes

| Ruta | Protocolo | Cuándo |
|------|-----------|--------|
| TS → Rust | WASM | Validación, reglas, hashing, sandbox |
| TS → Rust | gRPC/ConnectRPC | Motores grandes o escala |
| TS → Go | gRPC/ConnectRPC | Comandos entre servicios |
| TS → Go | NATS JetStream | Eventos |
| Go ↔ externo | REST/OpenAPI | APIs públicas |

**Contratos como fuente de verdad:**

```
contracts/
├── openapi/       → APIs públicas
├── asyncapi/      → Eventos
├── protobuf/      → Comunicación interna tipada
├── json-schema/   → Validación
└── receipt-schema/ → Receipts
```

Generación desde schema canónico → TypeScript types · Rust types · Go types · API clients · Validators.

---

## Monorepo canónico

```
drenyra/
├── apps/
│   ├── web/                 # TanStack Start
│   ├── api/                 # Elysia
│   ├── worker/              # TS workers
│   ├── cli/                 # TS CLI (Rust para versión distribuible)
│   └── docs/
├── packages/
│   ├── domain-*/
│   ├── application-*/
│   ├── contracts/
│   ├── db/
│   ├── auth/
│   ├── observability/
│   ├── agent-runtime/
│   └── ui/
├── engines/                 # Rust
│   ├── ledger/
│   ├── canonicalization/
│   ├── fiscal-rules/
│   └── receipt-verifier/
├── services/                # Go
│   ├── connector-gateway/
│   ├── ingestion/
│   └── enterprise-bridge/
├── country-packs/
│   └── peru/
├── contracts/
├── infrastructure/
└── docs/
```

Orquestación multilenguaje: Bun workspaces + Turborepo (TS) + Cargo workspace (Rust) + Go workspace + Taskfile.yml.

---

## Seguridad por capas

```
Identity → Session → Org membership → Company auth → Capability → Resource scope → Period → Risk → Approval
```

Además: RLS como defensa adicional, autorización en capa de aplicación, credenciales en vault, firmas de receipts, logs append-only, step-up auth para R3, tools autorizadas por capability matrix.

---

## Evolución por etapas

| Etapa | Stack | Estado |
|-------|-------|--------|
| **Actual** | TypeScript + React + Elysia + Bun + PostgreSQL + NATS + Temporal + S3 + OTel | ✅ |
| **Próxima** | Rust engines (hashing, ledger validation, receipt verifier) | ◌ |
| **Futura** | Go services (connector gateway, ingestion, enterprise bridge) | ◌ |
| **Escala** | ClickHouse, OpenSearch, extracción a microservicios | ◌ |

**Principio:** No reescribir. Aplicar strangler pattern en cada extracción.

---

## Relación con docs existentes

- [Program Taxonomy](./program-taxonomy.md) — clasificación documental
- [Capability Map](./capability-map.md) — capacidades del programa
- [SDD Audit](./sdd-audit.md) — estado de SDDs existentes
- [Architecture 2026](../01-architecture/fiscal-intelligence-platform-architecture-2026.md) — arquitectura del sistema
