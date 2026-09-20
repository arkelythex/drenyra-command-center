# Orquestación — roles y fronteras (Mastra, `packages/pi`, `drenyra-pi`)

> [!IMPORTANT]
> **No hay duplicidad: son tres capas con roles distintos.** La confusión viene del nombre — dos componentes se llaman "Drenyra Pi". Este documento fija la frontera entre el framework de orquestación (Mastra), el harness interno del Command Center (`packages/pi`) y el harness pi-native del host externo (`drenyra-pi`).

<!-- -->

> **Part of:** [Architecture](../00-INDEX.md) · **Last updated:** 2026-08-11

## Los tres roles

| Componente | Dónde vive | Rol | Usa |
| --- | --- | --- | --- |
| **Mastra** (`@mastra/core`) | `packages/pi/src/mastra/` (monorepo Drenyra) | **Framework de orquestación de agentes DENTRO del Command Center**: supervisor/worker, agents de compliance, workflows, tools, event bus | `@mastra/core` v1.4+ — activo y mantenido (Kepler Software Inc., 2026) |
| **`packages/pi`** (monorepo) | Repo Drenyra | **Harness SDK del Command Center**: construye agentes fiscales, contiene la capa Mastra, la aprobación con gates del core, las estrategias | Mastra, drenyra-ai (gates) |
| **`drenyra-pi`** (repo) | `arkelythex/drenyra-pi` | **Extensión de Pi cuando Pi ES el host**: persona, `/drenyra:*` commands, chains, skills, runtime — cero dependencias runtime, consume drenyra-ai pinneado | Pi SDK, drenyra-ai (tarball) |

## Por qué no son duplicados

1. **Mastra es un framework, no un orquestador propio.** La orquestación del Command Center (supervisor, task-decomposer, result-merger) está implementada SOBRE Mastra. La web (agosto 2026) confirma que Mastra está **activo y mantenido** y que el patrón **supervisor/worker** es el recomendado para workloads fiscales — es exactamente la arquitectura que este monorepo implementa. Eliminarlo rompería toda la capa de agents/compliance/workflows.

2. **`packages/pi` orquesta DENTRO del backend.** Es el harness que el servidor usa para construir y ejecutar agentes fiscales, con aprobación humana cableada a los gates deterministas de drenyra-ai.

3. **`drenyra-pi` equipa a Pi cuando Pi es el HOST.** No ejecuta la orquestación del Command Center; carga la persona y las capacidades de Drenyra en el runtime de Pi (el agente host externo). Consume el core pinneado, no duplica nada.

## Regla de frontera

- **El Command Center orquesta con `packages/pi` (Mastra por debajo)** — los agentes corren en el backend.
- **Pi como host externo usa `drenyra-pi`** — la extensión que le da las capacidades de Drenyra.
- **Ninguno reimplementa la autoridad fiscal** — ambos consumen drenyra-ai (gates, materialidad, receipts, ledger).

## Referencias

- [ADR-010 — Frontera y autoridad del ecosistema](../11-adr/ADR-010-ecosystem-boundary-authority.md)
- [ADR-013 — Consumir drenyra-ai, eliminar autoridad duplicada](../11-adr/ADR-013-consume-drenyra-ai-remove-duplicate-authority.md)
- [adr-034 — Drenyra Fiscal App Server](../11-adr/adr-034-drenyra-fiscal-app-server.md) (OrchestrationRouter: Mastra transaction layer)

---

**Read next:** [Architecture](../00-INDEX.md) — back to the index
