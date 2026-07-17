# @arkelythex/platform-core

**Última actualización**: 2026-06-20 · [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md)

**Arkelythex Platform runtime** — agentes, AI gateway, memoria, harness y sistema de plugins.

---

## De un vistazo

Platform Core es el runtime de la plataforma Arkelythex: proporciona el kernel para construir agentes, un gateway unificado de LLM, un sistema de memoria, un harness de delegación con gates de aprobación, y un sistema de plugins basado en el principio abierto-cerrado.

Es el "sistema operativo" sobre el que corren los agentes Drenyra.

---

## Arquitectura

La plataforma se compone de cinco módulos independientes:

| Módulo | ¿Qué hace? | ¿Cuándo usarlo? |
|--------|------------|-----------------|
| **Kernel** | Tipos core, máquina de estados de agente, bus de eventos | Siempre — es la base de todo |
| **Swarm** | Orquestación multi-agente con estrategias de agregación | Cuando coordinás múltiples agentes |
| **AI Gateway** | Interfaz unificada de proveedores LLM | Cuando necesitás llamar a un LLM |
| **Memory** | Persistencia de sesiones de agente (in-memory / SQLite) | Cuando un agente necesita recordar |
| **Harness** | Grafo de delegación y workflows de aprobación | Cuando un agente delega tareas a otros |
| **Plugin System** | Registrar entidades, reglas, políticas y gates | Cuando extendés la plataforma |

### Kernel (`src/kernel/`)

Tipos core y primitivas runtime:

- **Agent Types** — `AgentType`, `AgentStatus`, `TaskDefinition`, `TaskResult`
- **Error Hierarchy** — `AgentError`, `TaskError`, `PluginValidationError` con type guards
- **Lifecycle Manager** — Máquina de estados para ciclos de vida de agente con transiciones validadas
- **Event Bus** — Publish/subscribe tipado para comunicación entre agentes

### Swarm (`src/swarm/`)

Orquestación multi-agente:

- **Orchestrator** — Coordina agentes con estrategias de agregación (sequential, parallel, race, consensus, fan-out)
- **Worker Pool** — Ejecución concurrente con control de concurrencia, retries, backpressure
- **Task Router** — Enruta tareas a agentes registrados por capacidad, con round-robin y least-loaded

### AI Gateway (`src/ai-gateway/`)

Interfaz unificada de proveedores LLM:

- **Provider Interface** — `LLMProvider` abstracto para chat completion, streaming y embeddings
- **Model Registry** — Registrar modelos con capacidades, tracking de costos y rate limits
- **Tool Bridge** — `ToolRegistry` para function calling de LLM
- **Gateway** — `AIGateway` core con backends configurables, rate limiting y métricas

### Memory (`src/memory/`)

Persistencia de sesiones de agente:

- **Memory Store** — Vector store in-memory con indexación HNSW y cosine similarity
- **SQLite Store** — Almacenamiento persistente de sesiones vía better-sqlite3
- **Session Store Interface** — Backend de almacenamiento plugueable

### Harness (`src/harness/`)

Workflows de delegación y aprobación:

- **Delegation Graph** — Tracking de rutas de delegación multi-paso
- **Approval Workflow** — Evaluación asíncrona de gates de aprobación
- **Evidence Store** — Recolectar y consultar evidencia de soporte para decisiones

### Plugin System (`src/plugin/`)

Principio abierto-cerrado — extendé la plataforma sin modificar el kernel:

- **Plugin Interface** — Contrato `AgenticOSPlugin` para registro de dominio
- **Plugin Registry** — Registrar, consultar y validar plugins
- **Fiscal Plugin** — Implementación de referencia para compliance fiscal peruano

---

## Quick Start

### Instalación

```bash
npm install @arkelythex/platform-core
pnpm add @arkelythex/platform-core
yarn add @arkelythex/platform-core
```

### Crear un Plugin

```typescript
import type {
  AgenticOSPlugin,
  DomainRegistry,
  AgentRegistry,
  PolicyRegistry,
  ApprovalGateRegistry,
} from '@arkelythex/platform-core'

const myPlugin: AgenticOSPlugin = {
  name: 'my-vertical',
  version: '1.0.0',
  description: 'My custom vertical',

  registerDomain(registry: DomainRegistry) {
    registry.registerEntity('my-entity', { schema: '...' })
    registry.registerRule('my-rule', (input) => typeof input === 'string')
  },

  registerAgents(registry: AgentRegistry) {
    registry.registerAgentType('my-agent', () => new MyAgent())
    registry.registerCapability('my-agent', 'my-capability')
  },

  registerPolicies(registry: PolicyRegistry) {
    registry.registerPolicy('my-policy', {
      description: 'My governance policy',
      evaluate: (context) => ({ allowed: true }),
    })
  },

  registerApprovalGates(registry: ApprovalGateRegistry) {
    registry.registerGate('my-gate', {
      name: 'my-gate',
      description: 'My approval gate',
      evaluate: async (request) => ({
        approved: true,
        timestamp: new Date().toISOString(),
      }),
    })
  },
}
```

### Usar el Plugin Registry

```typescript
import { PluginRegistry } from '@arkelythex/platform-core'

const registry = new PluginRegistry()
registry.register(myPlugin)

const plugin = registry.getPlugin('my-vertical')
```

### Swarm Orchestration

```typescript
import { Orchestrator, WorkerPool, TaskRouter } from '@arkelythex/platform-core'

const pool = new WorkerPool({ maxConcurrency: 5 })
const router = new TaskRouter()
const orchestrator = new Orchestrator({
  pool,
  router,
  defaultStrategy: 'sequential',
})

const result = await orchestrator.run(task, context)
```

### AI Gateway

```typescript
import { AIGateway, ModelRegistry, ToolRegistry } from '@arkelythex/platform-core'

const models = new ModelRegistry()
const tools = new ToolRegistry()
const gateway = new AIGateway({ models, tools })

const response = await gateway.complete({
  messages: [{ role: 'user', content: 'Hello!' }],
})
```

---

## Plugin Interface

Todo plugin implementa `AgenticOSPlugin`, que tiene cuatro métodos de registro:

| Método | Registry | Propósito |
|--------|----------|-----------|
| `registerDomain` | `DomainRegistry` | Registrar entidades y reglas de validación |
| `registerAgents` | `AgentRegistry` | Registrar tipos de agente y capacidades |
| `registerPolicies` | `PolicyRegistry` | Registrar políticas de gobernanza |
| `registerApprovalGates` | `ApprovalGateRegistry` | Registrar gates de aprobación para acciones sensibles |

### Ejemplo: Fiscal Plugin

El paquete incluye un `FiscalPlugin` de referencia que demuestra un vertical de compliance fiscal peruano:

```typescript
import { FiscalPlugin } from '@arkelythex/platform-core/plugin/fiscal-plugin'
import { PluginRegistry } from '@arkelythex/platform-core'

const registry = new PluginRegistry()
registry.register(new FiscalPlugin())
```

El plugin fiscal registra:

- **Entidades de dominio**: invoice, credit-note, debit-note, tax-payer, detraction, retention, perception, ledger entries, tax returns, audit trails
- **Tipos de agente**: fiscal-compliance, fiscal-audit, fiscal-financial, fiscal-sunat-filing, fiscal-reporting
- **Políticas**: SUNAT read-only, tax-critical approval, audit trail integrity, fiscal data retention
- **Gates de aprobación**: SUNAT submission gate, audit data access gate

---

## TypeScript Support

Escrito en TypeScript strict mode. Re-exporta todos los tipos públicos desde `@arkelythex/platform-core`:

```typescript
import type {
  AgentType,
  TaskDefinition,
  AgentContext,
  OrchestratorConfig,
  LLMProvider,
  ChatMessage,
  GatewayConfig,
  SessionConfig,
  MemoryRecord,
  DelegationConfig,
  AgenticOSPlugin,
  PolicyDefinition,
  ApprovalGate,
} from '@arkelythex/platform-core'
```

---

## Subpath Exports

| Ruta | Exports |
|------|---------|
| `@arkelythex/platform-core` | Todos los tipos públicos + clases core |
| `@arkelythex/platform-core/kernel` | Tipos de kernel |
| `@arkelythex/platform-core/kernel/errors` | Clases y guards de error |
| `@arkelythex/platform-core/kernel/lifecycle` | Lifecycle manager |
| `@arkelythex/platform-core/kernel/event-bus` | Event bus |
| `@arkelythex/platform-core/swarm` | Tipos de swarm |
| `@arkelythex/platform-core/swarm/orchestrator` | Orchestrator |
| `@arkelythex/platform-core/swarm/worker-pool` | Worker pool |
| `@arkelythex/platform-core/swarm/router` | Task router |
| `@arkelythex/platform-core/ai-gateway` | Tipos de AI gateway |
| `@arkelythex/platform-core/ai-gateway/provider` | Provider interface |
| `@arkelythex/platform-core/ai-gateway/registry` | Model registry |
| `@arkelythex/platform-core/ai-gateway/tool-bridge` | Tool registry |
| `@arkelythex/platform-core/ai-gateway/gateway` | AI gateway core |
| `@arkelythex/platform-core/memory` | Tipos de memoria |
| `@arkelythex/platform-core/harness` | Tipos de harness |
| `@arkelythex/platform-core/plugin` | Plugin interface |

---

## Licencia

MIT — ver [LICENSE](./LICENSE)
