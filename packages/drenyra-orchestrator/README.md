# Drenyra Orchestrator

> **Última actualización**: 2026-06-20
> **Package**: `@arkelythex/drenyra-orchestrator`

Orquestador multi-agente para Drenyra — el núcleo que coordina agentes de IA fiscal, detecta intenciones, descompone tareas complejas, gestiona aprobaciones y fusiona resultados. Reemplaza `@arkelythex/agent-swarm` (63K líneas) con una implementación limpia basada en **Mastra** + **Vercel AI SDK** + **Engram**.

## Purpose

Drenyra no es un solo agente — es un **enjambre de agentes especializados** que colaboran para resolver problemas fiscales peruanos. Este paquete es el **director de orquesta**: recibe una consulta fiscal (ej. "¿por qué mi RUC está en baja de oficio?"), la descompone en tareas, las distribuye a agentes de dominio (SUNAT, contabilidad, detracciones), recolecta resultados, resuelve conflictos y devuelve una respuesta coherente.

Existe porque el agent-swarm original era inmantenible: 63K líneas sin tipos claros, sin separación de responsabilidades, sin tests. Esta reescritura preserva la API pública pero reemplaza el internals con una arquitectura modular, tipada y testeable.

## Stack

| Tecnología | Uso |
|---|---|
| **Mastra** | Framework de agentes — ciclo de vida, tools, ejecución |
| **Vercel AI SDK** | LLM calls con streaming y structured output |
| **Engram** | Memoria persistente entre sesiones de orquestación |
| **Zod 4** | Schemas de entrada/salida para tools y agentes |
| **Drizzle ORM** | Persistencia de sesiones, tareas y aprobaciones |
| **TypeScript 6** | Tipado estricto — sin `any` |
| **Vitest 4** | Tests unitarios y de integración |

## Architecture

```
┌─────────────────────────────────────────────────┐
│             DrenyraOrchestrator                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Intent   │  │  Task    │  │  Supervisor   │  │
│  │ Detector │─▶│Decomposer│─▶│  (coordinador)│  │
│  └──────────┘  └──────────┘  └───┬───┬───┬───┘  │
│                                   │   │   │       │
│  ┌──────────┐  ┌──────────┐  ┌───▼───▼───▼───┐  │
│  │ Approval │  │  Result  │  │  DomainAgents  │  │
│  │GateEngine│◀─│  Merger  │◀─│ (SUNAT/Detra/  │  │
│  └──────────┘  └──────────┘  │  Conta/... )  │  │
│                               └───────────────┘  │
│  ┌──────────┐  ┌──────────┐                      │
│  │  Event   │  │ Session  │                      │
│  │   Bus    │  │ Manager  │                      │
│  └──────────┘  └──────────┘                      │
│                   │                               │
│         ┌─────────▼─────────┐                     │
│         │    Engram (mem)   │                     │
│         └───────────────────┘                     │
└─────────────────────────────────────────────────┘
```

### Componentes clave

| Componente | Responsabilidad |
|---|---|
| **DrenyraOrchestrator** | Punto de entrada único — orquesta el ciclo completo |
| **IntentDetector** | Clasifica la consulta del usuario y la enruta al agente correcto |
| **TaskDecomposer** | Divide una tarea fiscal compleja en pasos atómicos |
| **DomainAgent** | Agente especializado en un dominio fiscal (SUNAT, IGV, detracciones) |
| **Supervisor** | Coordina la ejecución de múltiples DomainAgents y maneja escalamientos |
| **ResultMerger** | Fusiona resultados de múltiples agentes y resuelve conflictos |
| **ApprovalGateEngine** | Gestiona flujos de aprobación humana para acciones fiscales sensibles |
| **AgentEventBus** | Comunicación event-driven entre agentes |
| **SessionManager** | Persiste contexto de sesión y estado de orquestación |

### Relaciones con otros paquetes

```
@arkelythex/ai ──── provides LLM primitives ──────┐
                                                    ▼
@arkelythex/persistence ── DB access ─────▶ drenyra-orchestrator
@arkelythex/infrastructure ── services ──▶          │
                                                    ▼
                              @arkelythex/domain ── types fiscales
```

## API pública

```typescript
import { createDrenyraOrchestrator } from '@arkelythex/drenyra-orchestrator';

const orchestrator = createDrenyraOrchestrator({ db, ai, engram });
const result = await orchestrator.orchestrate({
  query: '¿Por qué mi RUC 20123456789 está en baja de oficio?',
  companyId: 'cmp_01j...',
});
```

Sub-paths exportables:

| Entrypoint | Contenido |
|---|---|
| `@arkelythex/drenyra-orchestrator` | API completa (orquestador + tipos + estrategias) |
| `@arkelythex/drenyra-orchestrator/agent-types` | Tipos de agente (AgentContext, AgentTool, SwarmTask, etc.) |
| `@arkelythex/drenyra-orchestrator/mastra` | Implementaciones Mastra (orquestador, supervisor, domain agents) |
| `@arkelythex/drenyra-orchestrator/strategies` | Estrategias de detección fiscal (RUC breach, etc.) |
| `@arkelythex/drenyra-orchestrator/erp-types` | Tipos ERP (AgentId, SwarmMode, SessionContext, LatinAgentId) |

## Related

- [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md)
- [Architecture Overview](../../CODEX-MAP.md)
- [Vertical Slice + CQRS](./packages/application/README.md) — cómo se consumen los resultados del orquestador
