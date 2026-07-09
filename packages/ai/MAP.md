<!-- Manual navigation map for Drenyra AI/LLM orchestration layer. -->

# DRENYRA-AI-MAP — AI & Orchestration Layer

**Última actualización**: 2026-07-09 · Filosofía: [Drenyra product philosophy](../../docs/products/drenyra-product-philosophy.md) — Agentic fiscal intelligence, review gates, and evidence chains.

## Si solo tenés tres minutos

1. **Ubicación**: `packages/ai/` — Bun/TypeScript AI facade and orchestration layer.
2. **Arquitectura**: `gateway/` (LLM routing) → `control-plane/` (policy, registry, evidence) → `agents/orchestrator/` (workflow engine).
3. **Comando para desarrollar**: `bun run typecheck --filter @drenyra/ai` — tests: `npx vitest run` dentro de `packages/ai/`.
4. **Lo que más vas a tocar**: `src/gateway/` (nuevos providers, rate limiting, failover) y `src/agents/orchestrator/` (workflows).
5. **Sin tests → sin merge**: core gateway y orchestrator tienen tests obligatorios en `src/**/__tests__/`.

## Architecture

```
User/API
    │
    ▼
┌─────────────────────────────────────────────┐
│            LLMGatewayService                 │
│  (rate limiter → budget → failover → exec)  │
│  src/gateway/gateway.service.ts              │
├─────────────────────────────────────────────┤
    │
    ├── rateLimiter       src/gateway/rate-limiter.ts
    ├── costTracker       src/gateway/cost-tracker.ts
    ├── budgetEnforcer    src/gateway/budget-enforcer.ts
    ├── failoverService   src/gateway/failover.service.ts
    ├── requestExecutor   src/gateway/gateway.request-executor.ts
    └── streamExecutor    src/gateway/gateway.stream-executor.ts
    │
    ▼
┌─────────────────────────────────────────────┐
│           ControlPlane                       │
│  (agent registry, policy engine, evidence)   │
│  src/control-plane/control-plane.ts          │
├─────────────────────────────────────────────┤
    │
    ├── agent-registry    src/control-plane/agent-registry.ts
    ├── tool-registry     src/control-plane/tool-registry.ts
    ├── policy-engine     src/control-plane/policy-engine.ts
    ├── approval-guard    src/control-plane/approval-guard.ts
    ├── trace-evidence    src/control-plane/trace-evidence/
    └── sandbox-adapter   src/control-plane/sandbox-adapter.ts
    │
    ▼
┌─────────────────────────────────────────────┐
│       WorkflowOrchestratorV2                 │
│  (multi-agent invoice processing pipeline)   │
│  src/agents/orchestrator/workflow-v2/        │
├─────────────────────────────────────────────┤
    │
    ├── processInvoice     — full pipeline
    ├── executeAgentsInParallel  — reader+parser+validator
    ├── executeAgentWithRetry    — timeout + retry + circuit breaker
    ├── recoverRun         — session recovery from persisted state
    ├── arbitrateConflicts — conflict resolution via arbitrator agent
    └── healthCheck        — system health status
```

## Key patterns

- **Gateway as facade**: `LLMGatewayService` composes rate limiter, cost tracker, budget enforcer, and failover service. Each component is independently testable.
- **Control Plane as policy layer**: Agent registry, tool registry, policy engine, and approval guard form a governance layer between gateway and orchestrator.
- **Orchestrator workflow pipeline**: `processInvoice` → `executeAgentsInParallel` (reader → parser → validator) → `arbitrateConflicts` → result.
- **Resilience patterns**: timeout + exponential backoff with jitter + circuit breaker + failover chains + session recovery.
- **All types are readonly**: Interfaces in types.ts use `readonly` for immutability.

## Fast search recipes

```bash
# Find all gateway tests
fd 'gateway' packages/ai/src -e test.ts

# Find orchestrator tests
fd 'orchestrator' packages/ai/src -e test.ts

# Find rate limiting logic
rg 'rateLimit' packages/ai/src/gateway/

# Find failover logic
rg 'failover' packages/ai/src/gateway/

# Find circuit breaker
rg 'circuitBreaker' packages/ai/src/agents/orchestrator

# Find agent execution
rg 'executeAgent' packages/ai/src/agents/orchestrator
```

## Common tasks → exact paths

| Task                 | Start path                                                |
| -------------------- | --------------------------------------------------------- |
| Add LLM provider     | `src/gateway/gateway.service.ts` + `src/gateway/types.ts` |
| Modify rate limiting | `src/gateway/rate-limiter.ts`                             |
| Add failover chain   | `src/gateway/failover.service.ts`                         |
| Add workflow step    | `src/agents/orchestrator/workflow-v2/steps.ts`            |
| Add agent type       | `src/agents/types/index.ts`                               |
| Modify fiscal policy | `src/control-plane/fiscal-policy.ts`                      |
| Add tool             | `src/control-plane/tool-registry.ts`                      |
| Orchestrator tests   | `src/agents/orchestrator/__tests__/`                      |
| Gateway tests        | `src/gateway/__tests__/`                                  |

## Dependencies

| Library                | Version   | Purpose                               |
| ---------------------- | --------- | ------------------------------------- |
| `@drenyra/domain`      | workspace | Fiscal types, entities, value objects |
| `@drenyra/persistence` | workspace | Session store, run persistence        |
| `@drenyra/shared`      | workspace | Secure logger, validation helpers     |
| `vitest`               | dev       | Test runner                           |

## Quality gates

- **All gateway and orchestrator modules MUST have tests in `src/**/__tests__/`**
- Tests use `vitest` (not `bun:test`) for compatibility with the rest of the workspace
- New providers MUST include failover configuration
- All public interfaces use `readonly` for immutability
- `as any` is prohibited in gateway and control-plane code
