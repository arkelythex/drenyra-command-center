# Propuesta: Drenyra Pi — Harness standalone + CLI Thin + Skills fiscales

**Estado:** Proposal · **Fecha:** 2026-07-07  
**Autor:** el Gentleman  
**Change:** `drenyra-pi-extraction`

---

## Resumen ejecutivo

Extraer `packages/agents` del monorepo Drenyra como un package standalone publicable (`drenyra-pi`), reescribir el CLI Go actual (`apps/cli`) como un CLI thin en TypeScript que se comunique con `drenyra-pi` vía RPC/HTTP, y establecer una arquitectura de skills fiscales modulares comenzando con SIRE filing.

Este es el mismo patrón que gentle-ai/gentle-pi: un CLI delgado que delega toda la lógica a un harness Node.js.

---

## Problema actual

### 1. Harness atrapado en el monorepo

`packages/agents` contiene TODO el runtime de agentes: orquestación Mastra, approval gates, phase gates, session manager, delegación, strategies, legacy compat, mnevori (persistencia de artifacts). Pero está atado al monorepo:

- No se puede publicar a npm
- Consumidores externos no pueden usarlo
- La CI/versión está acoplada al ciclo del monorepo

### 2. CLI Go monolítico

`apps/cli` tiene 150+ archivos Go con:

- Bubble Tea TUI completa
- Delegation graph
- Memory management
- RPC server
- Harness HTTP client
- Lógica fiscal embebida (SUNAT queries, detracciones, config)

Esto es un monolito Go que mezcla UI, lógica de negocios fiscal, y orquestación de agentes.

### 3. Skills fiscales no separables

Las estrategias fiscales (detracciones, IGV mismatch, RUC breach, SIRE filing, etc.) viven en `packages/agents/src/strategies/`. No son instalables ni versionables por separado.

---

## Solución propuesta

### Fase 1: `drenyra-pi` standalone (ahora)

Extraer `packages/agents` a un repo propio:

```
repos/drenyra-pi/
├── package.json        → @drenyra/pi
├── src/
│   ├── mastra/         → orquestación, approval gates, session manager
│   ├── types/          → tipos compartidos (AgentSession, AgentDefinition, etc.)
│   ├── harness-core/   → delegación, approval workflow
│   ├── swarm-core/     → orchestrator, router, worker pool
│   ├── plugin/         → plugin registry
│   ├── legacy/         → compat layer
│   ├── mnevori/        → artifact persistence
│   ├── phase/          → fiscal phase orchestration
│   ├── strategies/     → fiscal strategies (se mueven a skills en Fase 3)
│   ├── agents/         → registry, subagents, delegation data
│   └── index.ts        → public API
├── vitest.config.ts
├── tsconfig.json
└── README.md
```

**Dependencias del monorepo a eliminar:**

- `@drenyra/agents` ya no existe en el monorepo
- Los consumidores (`apps/api`, `apps/web`) importan directo de `@drenyra/pi`
- Los tipos compartidos (`AgentContext`, `AgentSession`, etc.) se publican desde `drenyra-pi`

### Fase 2: CLI thin en TypeScript (post-Fase 1)

Reescribir `apps/cli` de Go a TypeScript:

```
apps/cli/               → Se mantiene el directorio pero se reemplaza el contenido
├── package.json
├── src/
│   ├── index.ts        → Entry point (bin)
│   ├── commands/
│   │   ├── agents.ts   → List/resume/cancel agent sessions
│   │   ├── workflow.ts → Run fiscal workflows
│   │   ├── memory.ts   → Browse/search memory
│   │   ├── config.ts   → Manage config
│   │   └── serve.ts    → RPC server mode
│   ├── client.ts       → HTTP client to drenyra-pi API
│   ├── tui/            → Bubble Tea reemplazado por Ink/React TUI
│   └── types.ts
├── tsconfig.json
└── README.md
```

El CLI thin:

- Se comunica con `drenyra-pi` vía HTTP (REST o RPC)
- NO tiene lógica de negocios fiscal — delega todo
- Puede correr en modo interactive (TUI) o headless (scripts)
- Mismo modelo que `gentle-ai` → `gentle-pi`

### Fase 3: Skills fiscales modulares (post-Fase 2)

Cada skill fiscal es un package npm independiente:

```
packages/skill-sire-filing/
├── package.json   → @drenyra/skill-sire-filing
├── src/
│   ├── index.ts
│   ├── strategies/
│   ├── validators/
│   └── __tests__/
└── README.md
```

Los skills:

- Se publican a npm por separado
- Se instalan via `drenyra pi install @drenyra/skill-sire-filing`
- Se registran en el runtime via plugin system
- Pueden tener versiones independientes

---

## Arquitectura target

```
┌─────────────────────────────────────┐
│  drenyra-pi (Node.js harness)       │
│  - Agent orchestration (Mastra)     │
│  - Approval gates                   │
│  - Phase gates (fiscal)             │
│  - Session management               │
│  - Plugin registry                  │
│  - HTTP API (RPC)                   │
├─────────────────────────────────────┤
│  skills (npm packages)              │
│  - @drenyra/skill-sire-filing       │
│  - @drenyra/skill-detracciones      │
│  - @drenyra/skill-igv-mismatch      │
│  - ...                              │
├─────────────────────────────────────┤
│  clients                            │
│  - drenyra-cli (TS thin, TUI)       │
│  - apps/api (Elysia, REST)          │
│  - apps/web (React, REST)           │
│  - CI automations                   │
└─────────────────────────────────────┘
```

---

## Entregables por fase

### Fase 1: drenyra-pi standalone

- [ ] Repo `drenyra-pi` con `packages/agents` extraído
- [ ] `package.json` con nombre `@drenyra/pi`
- [ ] Publicado a npm (público o GitHub Packages)
- [ ] Monorepo Drenyra actualizado: `apps/api` y `apps/web` apuntan a `@drenyra/pi`
- [ ] CI/CD del nuevo repo
- [ ] Tests pasando en el repo standalone

### Fase 2: CLI thin TypeScript

- [ ] CLI TypeScript funcional con comandos base
- [ ] Reemplaza `apps/cli` en el monorepo (Go → TS)
- [ ] TUI con Ink/React para comandos interactivos
- [ ] Comunicación HTTP con drenyra-pi
- [ ] Tests E2E del pipeline CLI → pi → response

### Fase 3: Skills modulares

- [ ] Skill SIRE filing como package npm
- [ ] Sistema de registro de skills en drenyra-pi
- [ ] Comando `drenyra pi install <skill>`
- [ ] Documentación de API de skills

---

## Riesgos y mitigaciones

| Riesgo                                           | Impacto | Mitigación                                                                      |
| ------------------------------------------------ | ------- | ------------------------------------------------------------------------------- |
| Go CLI tiene features que el TS thin no cubre    | Medio   | Mapear todos los comandos Go antes de la rewrite. Priorizar los más usados.     |
| Extraer agents del monorepo rompe imports        | Alto    | Fase 1 incluye actualización de todos los consumers. Hacer en worktree aislado. |
| Skills modulares requieren diseño de API estable | Medio   | Arrancar con un skill piloto (SIRE) antes de generalizar.                       |
| Pérdida de funcionalidad TUI en Go               | Medio   | El TUI Go es Bubble Tea; el TS thin puede usar Ink que tiene paradigma similar. |

---

## Próximo paso

Si la propuesta está OK, pasamos a **Spec** para definir en detalle:

1. API pública de `drenyra-pi`
2. Contrato HTTP entre CLI y pi
3. Interfaz de skill (plugin API)
4. Plan de migración del monorepo
