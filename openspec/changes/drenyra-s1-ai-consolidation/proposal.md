# S1: AI/Agent Ecosystem Consolidation

**Fecha:** 2026-07-04
**Autor:** el Gentleman
**Inspiración:** OpenAI Codex App — arquitectura de harness unificado, threading, skills system

---

## Problema

Actualmente hay **5 packages AI/Agent con responsabilidades solapadas** que crean confusión de boundaries, duplicación de implementación, y mayor costo de mantenimiento:

| Package                            | Rol clave                                                     | Solapamiento                                                                   |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `@drenyra/ai`                   | AI facade, agents, gateway, memory, governance, control plane | Memory ↔ platform-core; Gateway ↔ platform-core; Agents ↔ drenyra-orchestrator |
| `@drenyra/platform-core`        | AI gateway, swarm, memory, plugin system, config              | Gateway ↔ ai; Memory ↔ ai/agent-memory; Swarm ↔ drenyra-orchestrator/legacy    |
| `@drenyra/harness`              | Delegation graph, depth limits, approval gates                | Governance ↔ ai/governance                                                     |
| `@drenyra/agent-memory`         | In-memory + SQLite agent memory stores                        | Memory ↔ ai/memory + platform-core/memory                                      |
| `@drenyra/drenyra-orchestrator` | Mastra-based fiscal orchestration                             | Agents ↔ ai/agents; Legacy swarm ↔ platform-core/swarm                         |

**Evidencia concreta:**

- **3 implementaciones de memoria**: `ai/src/memory/` + `platform-core/src/memory/` + `agent-memory/`
- **2 AI gateways**: `ai/src/gateway/` + `platform-core/src/ai-gateway/`
- **2 sistemas de agentes**: `ai/src/agents/` + `drenyra-orchestrator/src/mastra/agents/`
- **2 sistemas de swarm/orquestación**: `platform-core/src/swarm/` + `drenyra-orchestrator/src/legacy/`

## Solución Propuesta

Consolidar los 5 packages en **3 packages cohesivos** con boundaries claros:

```
ANTES:
  @drenyra/ai          ← AI facade, gateway, memory, agents, governance
  @drenyra/platform-core  ← Gateway, swarm, memory, plugin, config
  @drenyra/harness     ← Delegation, approval gates
  @drenyra/agent-memory   ← Memory stores
  @drenyra/drenyra-orchestrator ← Mastra orchestration

DESPUÉS:
  @drenyra/ai          ← SOLO: AI gateway + model registry + tool bridge + provider adapters
                            (lo que la AI SDK necesita para hablar con modelos)

  @drenyra/agents      ← NUEVO: Agent runtime + Mastra orchestration + delegation + harness
                            (lo que orquesta agentes: run loop, skills, threads, approvals)
                            Absorbe: harness + drenyra-orchestrator (Mastra) + platform-core/swarm

  @drenyra/memory      ← NUEVO: Unified memory subsystem
                            (lo que persiste: thread state, agent memory, session context)
                            Absorbe: agent-memory + ai/memory + platform-core/memory
```

### Mapa de migración

```
┌─────────────────────────────────────────────────────────────┐
│                    @drenyra/ai (nuevo)                    │
│                                                             │
│  AI Gateway        Model Registry       Tool Bridge         │
│  Provider Adapters  (OpenAI, Gemini,    OpenRouter)         │
│                                                             │
│  ═══ from: @drenyra/ai (gateway/, provider.ts,           │
│            model-registry, tool-bridge, openrouter)         │
│                                                             │
│  ─── NOT moved: agents/, memory/, governance/, swarm/       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   @drenyra/agents (nuevo)                 │
│                                                             │
│  Agent Runtime    Mastra Orchestrator   Delegation Graph    │
│  Approval Gates   Workflow Engine       Legacy Swarm Facade  │
│  Judgment Day     Consensus Engine      Control Plane       │
│                                                             │
│  ═══ from: @drenyra/drenyra-orchestrator (Mastra)        │
│  ═══ from: @drenyra/harness (delegation, gates)          │
│  ═══ from: @drenyra/platform-core (swarm/)               │
│  ═══ from: @drenyra/ai (agents/, governance/, control-plane)│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   @drenyra/memory (nuevo)                 │
│                                                             │
│  AgentMemoryStore  SessionStore         Engram Client       │
│  SQLite Store      InMemory Store       Context Monitor     │
│                                                             │
│  ═══ from: @drenyra/agent-memory (full)                  │
│  ═══ from: @drenyra/ai (memory/, context-monitor)        │
│  ═══ from: @drenyra/platform-core (memory/)              │
┬─────────────────────────────────────────────────────────────┘
```

## Diseño Inspirado en Codex App

### 1. Thread como primera persona (Codex Thread System)

Codex trata cada conversación como un **thread** durable con ciclo de vida: create → resume → fork → archive. En Drenyra, cada interacción fiscal (una revisión SIRE, un análisis de detracción, una conciliación bancaria) debería ser un thread con:

- **Contexto completo**: empresa, RUC, período fiscal, documentos involucrados
- **Historial persistente**: el agente retoma donde dejó
- **Fork para experimentos**: explorar paths alternativos sin riesgo

### 2. Graduated Trust para agentes fiscales (Codex Trust-First)

Codex arranca con permisos de carpeta, no de sistema. En Drenyra:

- **Nivel 0 (observador)**: Solo leer datos fiscales, sin mutar
- **Nivel 1 (asistente)**: Propone asientos, requiere aprobación humana
- **Nivel 2 (autónomo)**: Ejecuta operaciones rutinarias con supervisión posterior
- **Nivel 3 (fiduciario)**: Flujos completos con auditoría

### 3. Self-Verification fiscal (Codex Self-Validation)

Así como Codex verifica que sus cambios funcionan (corre la app, consulta logs), los agentes fiscales deben:

- Verificar que un asiento contable cuadra ANTES de proponerlo
- Validar que un XML UBL 2.1 es estructuralmente correcto
- Confirmar que una detracción respeta el porcentaje correcto

### 4. Skills como protocolo fiscal (Codex Skills)

Skills = instrucciones + scripts + recursos. En Drenyra:

- `sunat-cpe-validation` skill: cómo validar un CPE contra SUNAT
- `detraccion-calculation` skill: fórmula y topes por producto
- `sire-submission` skill: pasos exactos para enviar libros electrónicos

### 5. Automations fiscales (Codex Automations)

- **Morning fiscal pulse**: resumen de vencimientos del día (IGV, detracciones, PLAME)
- **SUNAT compliance check**: cada 6h verificar estado de facturación electrónica
- **Quiet bug cleanup**: detectar discrepancias contables antes del cierre mensual

## Entregables

### PR 1: Boundary Audit & Extraction Plan (estimado: ~300 líneas)

- Mapa de dependencias entre los 5 packages actuales
- Inventario de exports públicos y sus consumidores
- Plan detallado de migración por submódulo

### PR 2: @drenyra/memory — Unified Memory Subsystem (estimado: ~500 líneas)

- Crear package `@drenyra/memory`
- Migrar agent-memory + ai/memory + platform-core/memory
- Unificar interfaces: `AgentMemoryStore`, `SessionStore`, `EngramClient`
- Tests de integración con las 3 implementaciones
- Deprecar packages originales (keep re-exports for migration window)

### PR 3: @drenyra/ai Slim Down (estimado: ~300 líneas)

- Remover agents/, memory/, governance/, control-plane/ de ai
- Mantener solo: gateway/, model-registry, provider, tool-bridge, openrouter
- Actualizar exports de @drenyra/ai

### PR 4: @drenyra/agents — Unified Agent Runtime (estimado: ~500 líneas)

- Crear package `@drenyra/agents`
- Migrar desde drenyra-orchestrator (Mastra agents)
- Migrar desde harness (delegation, approval gates)
- Migrar desde platform-core (swarm)
- Migrar desde ai (agents/, governance/)
- Legacy swarm facade por compatibilidad

### PR 5: Consumer Update & Deprecation (estimado: ~200 líneas)

- Actualizar imports en apps/api, apps/web, apps/drenyra-cli
- Reemplazar imports de packages deprecados por los nuevos
- Remover re-exports legacy después de verificar 0 usos
- Cleanup final de packages huérfanos

## Consumidores Conocidos

| Package                            | Consumidores                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `@drenyra/ai`                   | drenyra-orchestrator, apps/api (features/ai-rag, features/llm-gateway, features/ai-swarm) |
| `@drenyra/platform-core`        | drenyra-harness, agent-memory, apps/api (features/platform)                            |
| `@drenyra/harness`              | apps/drenyra-cli (internal/harness/), apps/api (features/drenyra-harness)              |
| `@drenyra/agent-memory`         | drenyra-harness                                                                        |
| `@drenyra/drenyra-orchestrator` | apps/api (features/governance-audit, features/ai-swarm)                                   |

## Riesgos y Mitigaciones

| Riesgo                                                              | Impacto | Mitigación                                                       |
| ------------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| Circular dependencies entre @drenyra/agents y @drenyra/memory | Alto    | Memory es leaf dependency: agents depende de memory, no al revés |
| Mastra API breaking changes                                         | Alto    | Pin @mastra/core version, test de integración en CI              |
| platform-core publicado como npm público                            | Medio   | Mantener re-exports package por 2 releases                       |
| Go CLI imports rotos                                                | Medio   | Audit trail de imports Go → TS packages                          |
| Consumidores inline (no via package)                                | Medio   | Audit con rg + ts-morph antes de mover                           |
