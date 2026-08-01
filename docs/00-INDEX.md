# Drenyra Documentation Index

    **Arquitectura:** Drenyra Financial Engineering OS (FEOS) — 8 planos
**Programa:** [CAP-FEOS-00 — Drenyra Financial Engineering Operating System](./01-foundation/feos-program.md)

---

## Navegación rápida

| Sección | Contenido | Para quién |
|---------|-----------|------------|
| `01-foundation` | [01 — Foundation](./01-foundation/README.md) | Esta sección contiene la documentación canónica que define qué es Drenyra, cómo se construye, cómo se clasifica su docum |
| `01-tutorials` | [Tutorials](./01-tutorials/README.md) | These tutorials guide you through Drenyya step by step. They assume nothing — each command is explained, each screen is  |
| `10-development` | [10 — Development](./10-development/README.md) | | Guía                                              | Descripción                             | |
| `11-adr` | [11 — Architecture Decision Records](./11-adr/README.md) | Un Architecture Decision Record documenta una decisión que: |
| `12-security` | [12 — Security](./12-security/README.md) | Drenyra maneja datos financieros sensibles, credenciales SUNAT y transacciones fiscales. La seguridad no es una capa sep |
| `13-operations` | [13 — Operations](./13-operations/README.md) | | Documento                                         | Descripción                            | |
| `14-design` | [14 — Design](./14-design/README.md) | | Documento                                                         | Descripción                                        |
| `audits` | [Drenyra Audit Ledgers](./audits/README.md) | Append-only, cryptographically chained record of Drenyra engineering changes and |
| `products` | [Redirect — Product Docs](./products/README.md) | These documents have moved to the `01-foundation/` section (see the redirect table below): |

---

## Estructura del programa FEOS

Las secciones de documentación se alinean con los 8 planos FEOS más secciones canónicas:

- **`01-foundation/`** — Sección canónica: 01 — Foundation
- **`01-tutorials/`** — Sección canónica: Tutorials
- **`10-development/`** — Sección canónica: 10 — Development
- **`11-adr/`** — Sección canónica: 11 — Architecture Decision Records
- **`12-security/`** — Sección canónica: 12 — Security
- **`13-operations/`** — Sección canónica: 13 — Operations
- **`14-design/`** — Sección canónica: 14 — Design
- **`audits/`** — Sección canónica: Drenyra Audit Ledgers
- **`products/`** — Sección canónica: Redirect — Product Docs

---

## Documentos por sección

### 01 — Foundation

> `docs/01-foundation/`

Esta sección contiene la documentación canónica que define qué es Drenyra, cómo se construye, cómo se clasifica su docum

| Documento | Descripción |
|-----------|-------------|
| [canonical-stack](./01-foundation/canonical-stack.md) | Drenyra no se construye con un solo lenguaje ni con microservicios desde el día uno. |
| [capability-map](./01-foundation/capability-map.md) | Cada capability es un nodo en el roadmap. Solo recibe un SDD cuando está cerca de ejecución. |
| [drenyra-ai-aos](./01-foundation/drenyra-ai-aos.md) | **Drenyra-AI es el sistema operativo verificable para agentes contables. Coordina personas e IA, aplica políticas contab |
| [drenyra-engram](./01-foundation/drenyra-engram.md) | **Drenyra-Engram es la memoria institucional y contable verificable de una empresa. Conserva conocimiento operativo: qué |
| [drenyra-pi-harness](./01-foundation/drenyra-pi-harness.md) | **Drenyra-Pi es el harness Pi-native que convierte Pi en un operador contable disciplinado y verificable.** |
| [feos-program](./01-foundation/feos-program.md) | CAP-FEOS-00 es el programa paraguas que define Drenyra como el **Financial Engineering Operating System de Latinoamérica |
| [product-philosophy](./01-foundation/product-philosophy.md) | Drenyra no debe limitarse a ser "un software contable con IA". Esa categoría ya está siendo ocupada por Digits, QuickBoo |
| [program-taxonomy](./01-foundation/program-taxonomy.md) | Drenyra no es un proyecto que se especifique completo antes de construir. Es un programa de plataforma que evoluciona po |
| [sdd-audit](./01-foundation/sdd-audit.md) | | Métrica               | Cantidad | |
| [strategic-positioning](./01-foundation/strategic-positioning.md) | Drenyra es el **sistema operativo financiero verificable** para empresas, contadores y gobiernos de Latinoamérica: una p |

### Tutorials

> `docs/01-tutorials/`

These tutorials guide you through Drenyya step by step. They assume nothing — each command is explained, each screen is

| Documento | Descripción |
|-----------|-------------|
| [interpret-a-receipt](./01-tutorials/interpret-a-receipt.md) | An Execution Receipt is Drenyya's immutable proof that a financial operation was properly authorized and executed. In th |
| [your-first-review](./01-tutorials/your-first-review.md) | In this tutorial, you will review a Change Set — Drenyra's equivalent of a code review for financial changes. You will i |
| [your-first-workspace](./01-tutorials/your-first-workspace.md) | Welcome to Drenyra. In this tutorial, you will create your first Financial Workspace, explore its structure, and underst |

### 10 — Development

> `docs/10-development/`

| Guía                                              | Descripción                             |

| Documento | Descripción |
|-----------|-------------|
| [conventions](./10-development/conventions.md) | title: Convenciones de desarrollo |
| [drenyra-repo-sync](./10-development/drenyra-repo-sync.md) | During Fase 1 transition, Drenyra retains **read-only mirrors** of Drenyra packages. Historical drift (phase layer, SIRE |
| [engram-guide](./10-development/engram-guide.md) | Drenyra uses the `drenyra` Engram project name for persistent agent memory. Use this page to confirm the canonical proje |
| [engram-project-canonical](./10-development/engram-project-canonical.md) | Drenyra uses the `drenyra` Engram project name for persistent agent memory. Use this page to confirm the canonical proje |
| [getting-started](./10-development/getting-started.md) | title: Getting Started |
| [go-ts-contracts](./10-development/go-ts-contracts.md) | Ambas implementaciones definen el mismo grafo de delegación de agentes. |
| [how-to-add-a-feature](./10-development/how-to-add-a-feature.md) | title: Cómo agregar una feature |
| [how-to-debug](./10-development/how-to-debug.md) | title: Cómo debuggear |
| [how-to-write-a-test](./10-development/how-to-write-a-test.md) | title: Cómo escribir tests |
| [test-patterns](./10-development/test-patterns.md) | title: Test Patterns |

### 11 — Architecture Decision Records

> `docs/11-adr/`

Un Architecture Decision Record documenta una decisión que:

| Documento | Descripción |
|-----------|-------------|
| [2026-07-06-descope-decisions](./11-adr/2026-07-06-descope-decisions.md) | Dos features definidas en el spec original fueron evaluadas durante ejecución y |
| [2026-07-09-clean-architecture-violations](./11-adr/2026-07-09-clean-architecture-violations.md) | The repository interface in domain imports 4 types from the AI package. |
| [ADR-001-bun-elysia-api](./11-adr/ADR-001-bun-elysia-api.md) | Drenyra necesita un backend rápido, con tipo seguro de punta a punta, validación de esquemas integrada, y buen soporte p |
| [ADR-002-drizzle-orm](./11-adr/ADR-002-drizzle-orm.md) | Drenyra necesita un ORM para PostgreSQL que sea type-safe, performante, y que permita consultas complejas fiscales sin s |
| [ADR-003-tanstack-router](./11-adr/ADR-003-tanstack-router.md) | Drenyra Web es una SPA con ~60 rutas, layouts anidados, lazy loading, y autenticación. Necesita un router type-safe, con |
| [ADR-004-vertical-slices-cqrs](./11-adr/ADR-004-vertical-slices-cqrs.md) | La API de Drenyra crece rápido (42+ features). Necesita un patrón que permita escalar el desarrollo en paralelo sin pisa |
| [ADR-005-domain-package-framework-free](./11-adr/ADR-005-domain-package-framework-free.md) | El dominio fiscal (value objects, entidades, reglas de negocio) debe ser portable entre stacks: Bun API, Go CLI, Python  |
| [ADR-006-react-context-zustand](./11-adr/ADR-006-react-context-zustand.md) | La web necesita manejar estado global (auth, sidebar, theme) y estado de feature (fiscal inspector, artifacts, agents).  |
| [ADR-007-go-cli-fiscal-terminal](./11-adr/ADR-007-go-cli-fiscal-terminal.md) | El CLI de Drenyra necesita ser rápido, distribuible como binario único, y con buen soporte para TUI. Las opciones incluy |
| [ADR-008-property-based-testing](./11-adr/ADR-008-property-based-testing.md) | Las reglas fiscales (IGV, detracciones, RUC checksum, operaciones Money) tienen invariantes que deben cumplirse para TOD |
| [ADR-009-canonical-idempotency-contract](./11-adr/ADR-009-canonical-idempotency-contract.md) | Drenyra maneja múltiples mecanismos de idempotencia que evolucionaron orgánicamente y |
| [adr-034-drenyra-fiscal-app-server](./11-adr/adr-034-drenyra-fiscal-app-server.md) | **Note:** ADR-032 = Korveth. ADR-033 = Platform vs Product split (Drenyra). **ADR-034 = DFAS** (Drenyra product harness  |
| [W2-04A-natural-uniqueness-inventory](./11-adr/W2-04A-natural-uniqueness-inventory.md) | Identificar para cada agregado de dominio su **clave natural permanente** y decidir la política de conflicto, asegurando |
| [W2-05A-consumer-dedup-inventory](./11-adr/W2-05A-consumer-dedup-inventory.md) | Definir un inbox pattern transaccional que garantice procesamiento exactamente una vez por mensaje, independientemente d |
| [W2-06A-job-uniqueness-inventory](./11-adr/W2-06A-job-uniqueness-inventory.md) | Drenyra enqueues background jobs through BullMQ. Currently, job identity depends on Redis: |
| [W2-07-scenarios-schema-alignment](./11-adr/W2-07-scenarios-schema-alignment.md) | W2-07 cross-layer scenarios (`scenarios/*.integration.test.ts`) test end-to-end |

### 12 — Security

> `docs/12-security/`

Drenyra maneja datos financieros sensibles, credenciales SUNAT y transacciones fiscales. La seguridad no es una capa sep

| Documento | Descripción |
|-----------|-------------|
| [incident-response-runbook](./12-security/incident-response-runbook.md) | Este runbook define los procedimientos de respuesta a incidentes de seguridad para la plataforma Drenyra. Cada playbook  |
| [incident-response](./12-security/incident-response.md) | Este runbook define los procedimientos de respuesta a incidentes de seguridad para la plataforma Drenyra. Cada playbook  |
| [monitoring-strategy](./12-security/monitoring-strategy.md) | Document the current security monitoring posture and define security-relevant alert triggers for the Drenyra platform. T |
| [nist-csf-baseline](./12-security/nist-csf-baseline.md) | **Disclaimer:** This document is a baseline self-assessment produced by the Drenyra engineering team. It does NOT consti |
| [secret-management](./12-security/secret-management.md) | Document the complete inventory of secrets in the Drenyra stack, their rotation procedures, and the migration strategy t |
| [security-baseline](./12-security/security-baseline.md) | ```text |
| [tenant-access-matrix](./12-security/tenant-access-matrix.md) | Documento de referencia para H02 (Tenant Isolation Hardening). |
| [tenant-guard](./12-security/tenant-guard.md) | Este guardrail impide que aparezcan NUEVOS usos de métodos repository sin scope |
| [threat-model](./12-security/threat-model.md) | This document is a live threat model. It MUST be consulted before any security-relevant architectural change. |

### 13 — Operations

> `docs/13-operations/`

| Documento                                         | Descripción                            |

| Documento | Descripción |
|-----------|-------------|
| [drenyra-repo-sync](./13-operations/drenyra-repo-sync.md) | During Fase 1 transition, Drenyra retains **read-only mirrors** of Drenyra packages. Historical drift (phase layer, SIRE |
| [platform-connection](./13-operations/platform-connection.md) | Cross-repo integration is documented in the **Drenyra platform repo**: |

### 14 — Design

> `docs/14-design/`

| Documento                                                         | Descripción

| Documento | Descripción |
|-----------|-------------|
| [agent-capability-matrix](./14-design/agent-capability-matrix.md) | title: 'Drenyra Agent Capability Matrix 2026' |
| [cap-workbench-00](./14-design/cap-workbench-00.md) | Transform Drenyra from a SaaS dashboard into an **operational workbench** — a persistent, agentic, financial engineering |
| [command-envelope](./14-design/command-envelope.md) | title: 'Drenyra Command Envelope 2026' |
| [design-influences](./14-design/design-influences.md) | Document external design references that inform Drenyra's **Financial Engineering Environment** command center without c |
| [dual-surface-brain](./14-design/dual-surface-brain.md) | Drenyra is API/domain-first. React Web and Go CLI are UX adapters over the same Financial Engineering Environment and Br |
| [fiscal-app-server](./14-design/fiscal-app-server.md) | title: 'Drenyra Fiscal App Server (DFAS) 2026' |
| [fiscal-intelligence-platform](./14-design/fiscal-intelligence-platform.md) | title: 'Fiscal Intelligence Platform Architecture 2026' |
| [fiscal-seams-design](./14-design/fiscal-seams-design.md) | Peru-first, architectured for LATAM scalability. |
| [ledger-boundaries](./14-design/ledger-boundaries.md) | Estas reglas NUNCA deben romperse. Son verificadas en cada operación. |
| [pi-migration-cleanup-plan](./14-design/pi-migration-cleanup-plan.md) | After `ShadowRunner` confirms parity between `LegacyMastraRuntimeAdapter` and |
| [product-topology](./14-design/product-topology.md) | Drenyra is the **verifiable financial operating system for businesses, accountants and governments** — a Financial Engin |
| [red-spec](./14-design/red-spec.md) | RED (Receipt-Driven Execution) es el mecanismo por el cual **cada acción material en Drenyra genera un receipt inmutable |

### Drenyra Audit Ledgers

> `docs/audits/`

Append-only, cryptographically chained record of Drenyra engineering changes and

_Sin documentos adicionales aún._

### Redirect — Product Docs

> `docs/products/`

These documents have moved to the `01-foundation/` section (see the redirect table below):

| Documento | Descripción |
|-----------|-------------|
| [drenyra-positioning](./products/drenyra-positioning.md) | Drenyra es el **sistema operativo financiero verificable** para empresas, contadores y gobiernos de Latinoamérica: una p |
| [drenyra-product-philosophy](./products/drenyra-product-philosophy.md) | Drenyra no debe limitarse a ser "un software contable con IA". Esa categoría ya está siendo ocupada por Digits, QuickBoo |
| [sire-bench](./products/sire-bench.md) | SIRE-bench validates the **code/LLM boundary** in Drenyra: fiscal arithmetic and SIRE processing are deterministic, vers |

---

## Mantenimiento

Este índice se genera automáticamente con:

```bash
bun run docs:index
```

Para verificar enlaces internos:

```bash
bun run docs:check-links
bun run docs:check-links --full
```

Para mantenimiento completo:

```bash
bun run docs:maintain
```
