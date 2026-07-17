# Drenyra on Mastra — Architecture

## Principios

1. **Mastra es el runtime**, no el dominio.
2. **Vercel AI SDK es el motor de IA**, agnóstico a proveedor.
3. **@arkelythex/domain es intocable** — framework-free, tests, fiscal correctness.
4. **Latin Moderno es la organización** — Supervisor → DomainAgent → SubAgent.
5. **Approval gates son middleware** — no están acoplados al agente.

## Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                     │
│   apps/api (Elysia routes, Drenyra chat, tools API)      │
│   apps/web (React 19, TanStack, UI)                      │
├──────────────────────────────────────────────────────────┤
│                     ORCHESTRATION LAYER                   │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Mastra Workflows (LatinModernoOrchestrator)     │   │
│   │  Supervisor → DomainAgent → SubAgent             │   │
│   └──────────────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Mastra Agents (8 Latin Agents)                  │   │
│   │  cerno, custos, necto, regula,                   │   │
│   │  lumen, fusio, scripta, capsa                    │   │
│   └──────────────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Mastra Tools (Fiscal Tools)                     │   │
│   │  calculateIGV, submitSIRE, validateCPE, etc.     │   │
│   └──────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│                     AI LAYER                              │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Vercel AI SDK (ai)                              │   │
│   │  generateText, streamText, generateObject, tool  │   │
│   │  Providers: OpenAI, Anthropic, Google, OpenRouter │   │
│   └──────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│                     DOMAIN LAYER (INTOCABLE)              │
│   ┌──────────────────────────────────────────────────┐   │
│   │  @arkelythex/domain                              │   │
│   │  Money, RUC, DNI, UBL, IGV, TaxCalculator        │   │
│   └──────────────────────────────────────────────────┘   │
│   ┌──────────────────────────────────────────────────┐   │
│   │  @arkelythex/application                         │   │
│   │  Use cases, DTOs, ports                          │   │
│   └──────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│                     INFRASTRUCTURE LAYER                   │
│   ┌──────────────────────────────────────────────────┐   │
│   │  Drizzle ORM, PostgreSQL, Redis, S3, NATS        │   │
│   │  SUNAT API, OSE, SIRE services                   │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Mapeo: Custom → Mastra

| Concepto Custom | Equivalente Mastra | Diferencia |
|----------------|-------------------|------------|
| `LatinModernoOrchestrator` | `MastraWorkflow` con steps | Mastra maneja DAG, paralelismo, retry |
| `DomainAgent` con `selectBestAgent()` | `Agent` con `tools` | Mastra usa el LLM para routing |
| `SubAgent.spawnSubAgent()` | `Agent.execute()` + `step()` | Mastra tiene agent nesting nativo |
| `ApprovalGateEngine` | `Step` middleware con `before/after` hooks | Desacoplado, testeable |
| `TaskDecomposer` | `Workflow` con branching | Mastra workflow DAG |
| `ResultMerger` | `Workflow` con `resultReducer` | Mastra reduce automático |
| `AgentContext` | `Thread` + `Resource` | Mastra tiene session/thread built-in |
| `Evidence` | `StepResult` + `artifact` | Mastra guarda resultados |
| `MemoryStore` | Mastra `Memory` | Memoria a corto y largo plazo |
| `AI Gateway` | Vercel AI SDK `Provider` registry | Model-agnostic out of the box |
| `Model Registry` | Vercel AI SDK `customProvider` | Custom models + fallbacks |
| `Plugin System` | Mastra `Tool` extension | No necesitás plugin system |
| `Event Bus` | Mastra `Workflow` hooks + `watch` | Event-driven built-in |

## Latin Moderno Hierarchy (Mastra)

### L1 — Supervisor (Mastra Workflow)

```typescript
// Ya no es una clase custom con phases manuales y timing
// Es un Mastra Workflow con steps declarativos
const supervisorWorkflow = new Workflow({
  name: 'supervisor',
  triggerSchema: z.object({
    sessionId: z.string(),
    intent: z.string(),
    tenant: tenantSchema,
  }),
})

supervisorWorkflow
  .step(decomposeIntent)
  .then(executeParallel, { when: 'tasks.length > 0' })
  .then(mergeResults)
  .then(handleEscalations, { when: 'confidence < 0.3' })
```

### L2 — Domain Agents (Mastra Agents con Tools)

```typescript
// Ya no es una clase que recibe SwarmTask y hace routing manual
// Es un Mastra Agent con tools específicas
const custosAgent = new Agent({
  name: 'Custos',
  instructions: `Eres el guardián de compliance fiscal...`,
  tools: {
    calculateIGV,
    validateCPE,
    checkRetention,
    verifyDetraction,
  },
  model: openai('gpt-4o'), // o el que quieras
})
```

### L3 — SubAgents (sub-workflows o agent.execute anidado)

```typescript
// Mastra permite nesting: un step puede ser otro workflow
// o agent.execute() con sub-tasks paralelas
```

## Model Agnosticism (Vercel AI SDK)

```typescript
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// Registry centralizado (reemplaza @arkelythex/ai/model-registry)
export const models = {
  // Producción
  'claude-sonnet-4': anthropic('claude-sonnet-4-20250514'),
  'gpt-4o': openai('gpt-4o'),
  'gemini-2.5-pro': google('gemini-2.5-pro-exp-03-25'),
  
  // Económicos
  'claude-haiku-3.5': anthropic('claude-3-5-haiku-latest'),
  'gpt-4.1-mini': openai('gpt-4.1-mini'),
  
  // Routing inteligente
  'router': openrouter('anthropic/claude-sonnet-4'),
}
```

## Approval Gates (Mastra Middleware)

```typescript
// En vez de ApprovalGateEngine custom con AgentTool y context
// usamos Mastra step middleware
const fiscalGate = stepMiddleware({
  before: async ({ context }) => {
    if (context.action.approvalLevel === 'fiscal_gate') {
      const decision = await checkGovernance(context)
      if (!decision.ok) throw new GovernanceBlockedError(decision)
      if (decision.requiresHuman) {
        return { status: 'awaiting_approval', approvalId: decision.id }
      }
    }
  },
  after: async ({ result, context }) => {
    // Log evidence automático
    await appendEvidence({
      action: context.action,
      result,
      actor: context.agentId,
    })
  },
})
```

## Beneficios Concretos

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Líneas a mantener** | ~63,000 | ~4,200 |
| **Model agnostic** | Custom gateway + registry | AI SDK providers (20+ providers) |
| **Streaming** | Custom implementación | `streamText()` nativo |
| **Tool calling** | Custom `AgentTool` interface | Zod tools automáticas |
| **Retry/fallback** | Custom en `sub-agent.ts` | `maxRetries`, `retryDelay` built-in |
| **Memory** | SQLite custom + session store | Mastra Memory (corto/largo plazo) |
| **Parallelism** | Promise.all manual | Workflow DAG automático |
| **Observabilidad** | console.log + timings manual | Mastra Telemetry + OpenTelemetry |
| **Edge deployment** | Custom | Mastra corre en Edge |
| **Tests** | 0 tests en agent-swarm? | Mastra tiene test helpers |
