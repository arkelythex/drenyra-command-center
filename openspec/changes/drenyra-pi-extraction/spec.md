# Spec: Drenyra Pi — Standalone Harness Extraction

**Estado:** Working Draft · **Fecha:** 2026-07-07  
**Change:** `drenyra-pi-extraction`  
**Basado en:** [Proposal](./proposal.md)

---

## 1. Fase 1: `drenyra-pi` Standalone

### 1.1 Estructura del repo

```
drenyra-pi/
├── package.json          # name: @drenyra/pi
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts          # Public API barrel
│   ├── mastra/
│   │   ├── index.ts
│   │   ├── session-manager.ts   # AgentSession management
│   │   ├── approval-gate.ts     # ApprovalGateEngine
│   │   ├── approval-store.ts    # ApprovalStore
│   │   ├── domain-agent.ts      # DomainAgent
│   │   ├── event-bus.ts         # AgentEventBus
│   │   ├── intent-detector.ts   # IntentDetector
│   │   ├── latin-orchestrator.ts# LatinModernoOrchestrator
│   │   ├── orchestrator.ts      # DrenyraOrchestrator
│   │   ├── result-merger.ts     # ResultMerger
│   │   ├── supervisor.ts        # Supervisor
│   │   ├── task-decomposer.ts   # TaskDecomposer
│   │   ├── agents/              # Compliance agents
│   │   ├── workflows/           # Compliance workflows
│   │   ├── memory/              # Fiscal memory
│   │   └── tools/               # Compliance tools
│   ├── types/
│   │   ├── index.ts
│   │   ├── agent-context.ts
│   │   ├── agent-core.ts        # AgentDefinition<Task,TOutput,TConfig>
│   │   ├── agent-tool.ts
│   │   ├── approval-gate.ts
│   │   ├── erp-types.ts         # AgentSession, AgentId, LatinAgentId
│   │   └── worker-task.ts
│   ├── harness-core/
│   │   ├── index.ts
│   │   ├── approval.ts          # ApprovalWorkflow
│   │   ├── delegation.ts        # DelegationGraph
│   │   ├── evidence.ts          # EvidenceStore
│   │   └── types.ts
│   ├── swarm-core/
│   │   ├── orchestrator.ts
│   │   ├── router.ts
│   │   ├── types.ts
│   │   └── worker-pool.ts
│   ├── plugin/
│   │   ├── interface.ts         # AgenticOSPlugin, PluginRegistry
│   │   ├── registry.ts
│   │   └── types.ts
│   ├── legacy/
│   │   ├── index.ts
│   │   ├── agent-registry.ts
│   │   ├── control-plane-facade.ts
│   │   └── queue-manager.ts
│   ├── mnevori/
│   │   ├── index.ts
│   │   ├── mnevori.ts
│   │   ├── mnevori.resume.ts
│   │   ├── mnevori.regulation.ts
│   │   └── types.ts
│   ├── phase/
│   │   ├── index.ts
│   │   ├── fiscal-phase-orchestrator.ts
│   │   ├── fiscal-phase-graph.ts
│   │   ├── fiscal-phase-store.ts
│   │   ├── phase-gate-engine.ts
│   │   ├── fiscal-gates.ts
│   │   ├── confidence-gates.ts
│   │   ├── batch-orchestrator.ts
│   │   ├── transaction-integration.ts
│   │   ├── types.ts
│   │   └── phase-agents/
│   ├── strategies/              # Se mantienen temporalmente
│   │   ├── index.ts
│   │   ├── anomaly-engine.ts
│   │   ├── sire-filing.strategy.ts
│   │   ├── detracciones.strategy.ts
│   │   ├── igv-mismatch.strategy.ts
│   │   └── ...
│   └── agents/
│       ├── index.ts
│       ├── drenyra-subagents.ts
│       ├── registry.ts
│       └── types.ts
├── __tests__/
└── README.md
```

### 1.2 API pública (`src/index.ts`)

```typescript
// ─── Agent Runtime ──────────────────────────────────────
export { SessionManager } from './mastra/session-manager'
export type { AgentSession } from './types/erp-types'

export { ApprovalGateEngine } from './mastra/approval-gate'
export { ApprovalStore } from './mastra/approval-store'
export { AgentEventBus } from './mastra/event-bus'
export { IntentDetector } from './mastra/intent-detector'
export { LatinModernoOrchestrator } from './mastra/latin-orchestrator'
export { DrenyraOrchestrator } from './mastra/orchestrator'
export { ResultMerger } from './mastra/result-merger'
export { Supervisor } from './mastra/supervisor'
export { TaskDecomposer } from './mastra/task-decomposer'
export { DomainAgent } from './mastra/domain-agent'

// ─── Agent Types ─────────────────────────────────────────
export type { AgentContext } from './types/agent-context'
export type {
  AgentDefinition,
  AgentCapability,
  AgentPriority,
  Task,
} from './types/agent-core'
export type { AgentTool, AgentToolExecution } from './types/agent-tool'
export type {
  ApprovalDecision,
  ApprovalLevel,
  ApprovalRequest,
  ApprovalState,
  GovernanceBundleResult,
} from './types/approval-gate'
export { APPROVAL_LEVEL_ORDER, isFiscalAction } from './types/approval-gate'
export type {
  AgentId,
  AgentSession,
  DomainAgentConfig,
  LatinModernoAgentId,
  SessionContext,
  SwarmMode,
} from './types/erp-types'
export { LATIN_AGENTS } from './types/erp-types'
export type { LatinAgentId } from './types/latin-agent'
export type {
  AIWorkerTask,
  CreateTaskDTO,
  QueueStatsDTO,
} from './types/worker-task'

// ─── Harness Core ────────────────────────────────────────
export { ApprovalWorkflow, DelegationGraph } from './harness-core'
export type {
  HarnessExecuteResponse,
  HarnessOptions,
  AgentHandler,
} from './harness-core/types'
export { createDrenyraHarness, DrenyraHarness } from './harness/harness'
export { registerDefaultHandlers } from './harness/handlers/defaults'

// ─── Core Types ───────────────────────────────────────────
export type {
  Agent,
  AgentMetrics,
  AgentPort,
  AgentResult,
} from './types/agent-core'
export type { ActionResult } from './types/agent-tool'
export type {
  ApprovalConfig,
  ApprovalCondition,
  DelegationConfig,
  DelegationNode,
} from './harness-core/types'

// ─── Compliance Agents ────────────────────────────────────
export { complianceAssessmentAgent, complianceCheckWorkflow } from './mastra'
export { SessionManager } from './mastra/session-manager'
export { auditLoggerAgent, consentManagerAgent } from './mastra'

// ─── Plugin System ────────────────────────────────────────
export type {
  AgenticOSPlugin,
  AgentRegistry,
  ApprovalGateRegistry,
  PolicyRegistry,
} from './plugin/interface'
export { PluginRegistry } from './plugin/registry'

// ─── Fiscal Strategies ────────────────────────────────────
export {
  classifyDocuments,
  createIgvMismatchStrategy,
  createDuplicateInvoiceStrategy,
  createDetraccionesStrategy,
  createSireFilingStrategy,
  createTaxCalendarStrategy,
  createSupplierIntelligenceStrategy,
  createCashflowPredictorStrategy,
  FiscalAnomalyEngine,
  detectRucBreachAnomalies,
  RUC_BREACH_THRESHOLD_PEN,
} from './strategies'

// ─── Subagents & Registry ─────────────────────────────────
export {
  getAllRegisteredAgents,
  getRegisteredAgent,
  clearRegisteredAgents,
} from './legacy/agent-registry'
export { QueueManager, queueManager } from './legacy/queue-manager'
export {
  normalizeLegacyCapabilityToolsLookup,
  normalizeLegacyPolicyPreviewInput,
} from './legacy/control-plane-facade'
export type { DrenyraSubagentName } from './agents/drenyra-subagents'
export type { UnifiedAgentEntry } from './agents/types'
```

### 1.3 Dependencias externas

```json
{
  "dependencies": {
    "@mastra/core": "^1.4.0",
    "ai": "^6.0.39",
    "zod": "^4.3.5",
    "cuid2": "^3.0.6"
  },
  "peerDependencies": {
    "@openrouter/ai-sdk-provider": "^2.1.1"
  }
}
```

### 1.4 Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "prepublish": "bun run build"
  }
}
```

### 1.5 Plan de migración del monorepo

**Paso 1:** Publicar `@drenyra/pi` a npm (público o GitHub Packages)  
**Paso 2:** En el monorepo, cambiar `packages/agents/package.json`:

```json
{
  "name": "@drenyra/pi",
  "dependencies": {
    "@drenyra/pi": "workspace:*"
  }
}
```

O migrar directamente: eliminar `packages/agents` y que todos los consumers apunten a `@drenyra/pi` versionada.

**Paso 3:** Actualizar consumers:

| Consumer          | Import actual                           | Nuevo import  |
| ----------------- | --------------------------------------- | ------------- |
| `apps/api`        | `@drenyra/agents`                       | `@drenyra/pi` |
| `apps/web`        | `@drenyra/agents`                       | `@drenyra/pi` |
| `packages/domain` | `@drenyra/agents` (DrenyraSubagentName) | `@drenyra/pi` |

**Paso 4:** Limpiar `tsconfig.json`, `vitest.config.ts` del monorepo — remover referencias a `packages/agents`.

---

## 2. Fase 2: CLI Thin TypeScript

### 2.1 Contrato HTTP entre CLI y drenyra-pi

drenyra-pi expone un servidor HTTP embebido:

```
POST /api/session/create      → Crea sesión de agente
GET  /api/session/:id         → Estado de sesión
POST /api/session/:id/pause   → Pausar sesión
POST /api/session/:id/resume  → Reanudar sesión
POST /api/session/:id/cancel  → Cancelar sesión
GET  /api/session/:id/timeline → Timeline de pasos

POST /api/agents/:id/run      → Ejecutar agente con tarea
GET  /api/agents              → Listar agentes registrados

POST /api/workflow/run        → Ejecutar workflow fiscal (fase)
GET  /api/workflow/:id/status → Estado del workflow

GET  /api/memory/search       → Buscar en memoria
GET  /api/memory/sessions     → Listar sesiones de memoria

POST /api/skills/install      → Instalar skill (npm)
GET  /api/skills              → Listar skills instalados
POST /api/skills/:name/uninstall → Desinstalar skill
```

### 2.2 Estructura del CLI

```typescript
// apps/cli/src/index.ts
import { Command } from 'commander'
import { agentsCommand } from './commands/agents'
import { workflowCommand } from './commands/workflow'
import { configCommand } from './commands/config'
import { piCommand } from './commands/pi' // drenyra pi install/uninstall
import { serveCommand } from './commands/serve' // modo servidor

const program = new Command()
program
  .name('drenyra')
  .description('Drenyra CLI — Terminal companion')
  .version('0.1.0')

program.addCommand(agentsCommand)
program.addCommand(workflowCommand)
program.addCommand(configCommand)
program.addCommand(piCommand)
program.addCommand(serveCommand)

program.parse()
```

### 2.3 Comandos base

```
drenyra agents list                  → Lista sesiones activas
drenyra agents inspect <id>          → Detalle de sesión
drenyra agents pause <id>            → Pausar
drenyra agents resume <id>           → Reanudar

drenyra workflow run <name>          → Ejecuta workflow fiscal
drenyra workflow status [id]         → Estado

drenyra memory search <query>        → Busca en memoria

drenyra pi install <package>         → Instala skill
drenyra pi uninstall <name>          → Desinstala
drenyra pi list                      → Skills instalados

drenyra config get <key>             → Ver config
drenyra config set <key> <value>     → Setear config

drenyra serve                        → Inicia modo servidor (para integraciones)
```

### 2.4 Dependencias del CLI

```json
{
  "dependencies": {
    "commander": "^13.0.0",
    "ink": "^5.0.0",
    "react": "^19.2.7",
    "node-fetch": "^3.3.0"
  }
}
```

---

## 3. Fase 3: Skills Modulares

### 3.1 Interfaz de Skill

```typescript
// @drenyra/pi (plugin/interface.ts)
export interface DrenyraSkill {
  id: string
  name: string
  version: string
  description: string

  // Estrategias fiscales que provee
  strategies?: FiscalStrategy[]

  // Handlers para agentes
  agents?: SkillAgentRegistration[]

  // Comandos CLI personalizados
  commands?: SkillCommand[]

  // Inicialización
  initialize(context: SkillContext): Promise<void>
}

export interface SkillContext {
  sessionManager: SessionManager
  approvalEngine: ApprovalGateEngine
  logger: Logger
  config: Record<string, unknown>
}

export interface FiscalStrategy {
  name: string
  execute(
    input: unknown,
    context: ExecutionContext
  ): Promise<FiscalStrategyResult>
}

export interface SkillCommand {
  name: string
  description: string
  execute(args: string[]): Promise<void>
}
```

### 3.2 Skill SIRE Filing (primer skill)

```json
{
  "name": "@drenyra/skill-sire-filing",
  "version": "0.1.0",
  "dependencies": {
    "@drenyra/pi": "^0.1.0"
  }
}
```

```typescript
// src/index.ts
import type { DrenyraSkill } from '@drenyra/pi'

const skill: DrenyraSkill = {
  id: 'sire-filing',
  name: 'SIRE Filing',
  version: '0.1.0',
  description: 'Electronic books (SIRE) filing for SUNAT compliance',

  strategies: [{ name: 'sire-filing', execute: createSireFilingStrategy() }],

  async initialize(ctx) {
    // Registrar estrategia en el runtime
    ctx.logger.info('SIRE Filing skill initialized')
  },
}

export default skill
```

---

## 4. Criterios de aceptación

### Fase 1

- [ ] `@drenyra/pi` publicado en npm con API pública estable
- [ ] `bun install @drenyra/pi` funciona en un proyecto vacío
- [ ] `apps/api` y `apps/web` importan desde `@drenyra/pi` sin errores
- [ ] Tests de `drenyra-pi` pasan en CI del repo standalone
- [ ] `bun run typecheck` en el monorepo da 0 errores de módulo

### Fase 2

- [ ] `drenyra agents list` muestra sesiones desde drenyra-pi
- [ ] `drenyra workflow run sire-filing` ejecuta y devuelve resultado
- [ ] Modo TUI funcional (Ink)
- [ ] `drenyra serve` inicia servidor RPC

### Fase 3

- [ ] `drenyra pi install @drenyra/skill-sire-filing` funciona
- [ ] Skill SIRE Filing ejecuta detección de anomalías
- [ ] Tests del skill pasan independientemente
