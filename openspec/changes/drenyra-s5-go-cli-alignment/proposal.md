# S5: Go CLI Pattern Alignment

**Fecha:** 2026-07-04
**Autor:** el Gentleman

---

## Problema

El Go CLI (`apps/drenyra-cli/`) implementa sus propios subsistemas que duplican patrones existentes en los packages TypeScript:

| Go subsystem            | Propósito                                 | Package TS equivalente                                      |
| ----------------------- | ----------------------------------------- | ----------------------------------------------------------- |
| `internal/memory/`      | Hermes-style flat-file memory (MEMORY.md) | `@drenyra/agent-memory` → `@drenyra/memory` (post S1) |
| `internal/memorystore/` | SQLite/FTS5 local DB (drenyra.db)         | `@drenyra/agent-memory` → `@drenyra/memory`           |
| `internal/history/`     | history.jsonl append-log                  | `@drenyra/agent-memory`                                  |
| `internal/delegation/`  | Agent delegation graph (13 agents)        | `@drenyra/harness` → `@drenyra/agents` (post S1)      |
| `internal/workflow/`    | 10 built-in workflows                     | `@drenyra/drenyra-orchestrator` → `@drenyra/agents`   |
| `internal/harness/`     | HTTP client → @drenyra/harness API     | `@drenyra/harness`                                       |
| `internal/brain/`       | HTTP client → Drenyra Brain API           | Apps API                                                    |
| `internal/router/`      | LLM model+provider routing                | `@drenyra/ai` (gateway/provider)                         |

El problema no es la duplicación de implementación (Go ≠ TS), sino la **divergencia de interfaz conceptual**: los patrones de memoria, delegación, y workflow en Go no siguen la misma arquitectura que los packages TS, lo que causa:

1. **Doble mantenimiento mental**: saber dos modelos de memoria/delegación
2. **Inconsistencias de comportamiento**: el CLI puede comportarse distinto a la API
3. **Dificultad de auditoría**: un flujo fiscal puede pasar por Go → TS y viceversa con modelos distintos

## Solución Propuesta

No se trata de reescribir Go en TS (eso sería antitético). Se trata de **alinear los contratos de interfaz** entre Go y TS para que compartan el mismo modelo conceptual.

### Principio rector: API-first alignment

El Go CLI se comunica con el backend TS vía APIs HTTP (harness, brain, fiscal-work APIs). La alineación consiste en:

1. **Documentar los contratos compartidos** entre Go y TS en un archivo de referencia única
2. **Alinear los modelos de memoria** para que Go y TS usen la misma estructura de datos
3. **Sincronizar el grafo de delegación** Go ↔ TS para que los agentes se comporten igual

### Acciones concretas

#### PR 1: Contract Documentation (estimado: ~200 líneas)

- Crear `docs/05-development/go-ts-contracts.md` que documente:
  - Modelo de memoria compartido (estructura de datos, no implementación)
  - Grafo de delegación (qué agente puede delegar a quién)
  - Workflows canónicos (nombres, inputs, outputs)
- Este documento SIRVE como fuente de verdad para ambas implementaciones

#### PR 2: Go Alignment (estimado: ~300 líneas)

- Revisar `internal/delegation/` contra el grafo unificado
- Revisar `internal/memory/` y `internal/memorystore/` contra el modelo de memoria compartido
- Revisar `internal/workflow/` contra los workflows canónicos
- Actualizar solo lo que esté desalineado (no reescribir)

## Diseño Inspirado en Codex App

Codex mantiene un **App Server** como protocolo estable (JSON-RPC) entre clientes (TUI, VS Code extension, Desktop App) y el harness. Cada cliente implementa la UI que necesita, pero todos hablan el mismo protocolo.

Aplicado a Drenyra: Go CLI y TS API son "clientes" separados que deben hablar el mismo "protocolo" conceptual de memoria, delegación y workflows. La diferencia es que nuestro "protocolo" no es JSON-RPC sino **contratos de datos documentados** que ambas implementaciones respetan.

La lesson de Codex es clara: cuando múltiples superficies consumen el mismo backend, el contrato compartido (App Server) es más importante que la implementación individual.
