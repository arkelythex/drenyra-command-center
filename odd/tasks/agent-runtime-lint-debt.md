# Deuda de lint en `@drenyra/agent-runtime` (y vecinos)

**Última actualización**: 2026-10-01
**Nivel ODD**: grande (refactor de funciones del runtime de agentes; test-first en cada una).
**Estado ODD**: Working — corregido lo mecánico; la deuda estructural queda inventariada y suprimida con motivo.

## Contexto

Renombrar `packages/pi` → `packages/agent-runtime` tocó 241 archivos y el pre-commit (lint-staged) los revisó por primera vez: lint-staged solo valida lo que se modifica, así que había **deuda latente** que nunca se vio. Se evitó saltarse el hook.

## Resuelto de verdad (comportamiento preservado, 558/558 tests)

- 19 imports/variables sin uso, 2 `isNaN` → `Number.isNaN`, orden de imports y formato.
- 12 aserciones no nulas (`x!`) reemplazadas por guardas explícitas (`agents.service`, `delegation`, `approval-gate`, `domain-agent`, `event-bus`, `batch-orchestrator`, `worker-pool`). En `batch-orchestrator.onPhaseComplete` se conservó el comportamiento previo con un tipo explícito.
- Variable sin uso en `intelligence.service.ts`.

## Deuda estructural pendiente (20 supresiones `biome-ignore` con motivo)

Complejidad cognitiva > 15 (política: funciones < 30 líneas) y `console` en entrypoints. Cada fila es una supresión que debe **eliminarse refactorizando**, no ampliarse.

| Ubicación | Regla |
|-----------|-------|
| `apps/web/src/features/workspace/services/accounting-mission.service.ts:169` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/harness-core/delegation.ts:133` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/mastra/latin-orchestrator.ts:99` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/mastra/result-merger.ts:26` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/mastra/task-decomposer.ts:29` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/phase/batch-orchestrator.ts:245` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/phase/fiscal-phase-graph.ts:181` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/phase/fiscal-phase-orchestrator.ts:549` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/phase/phase-agents/auditoria.agent.ts:48` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/phase/phase-agents/cierre.agent.ts:52` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/phase/phase-agents/declaracion.agent.ts:50` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/plugin/registry.ts:152` | noConsole |
| `packages/agent-runtime/src/serve.ts:335` | noConsole |
| `packages/agent-runtime/src/serve.ts:336` | noConsole |
| `packages/agent-runtime/src/strategies/detracciones.strategy.ts:125` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/strategies/document-classification.strategy.ts:277` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/strategies/sire-filing.strategy.ts:63` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/strategies/supplier-intelligence.strategy.ts:127` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/strategies/supplier-intelligence.strategy.ts:242` | noExcessiveCognitiveComplexity |
| `packages/agent-runtime/src/strategies/tax-calendar.strategy.ts:84` | noExcessiveCognitiveComplexity |

## Deuda adicional en código fiscal (6 supresiones, destapada por el renombre a FSD)

Más prioritaria que el runtime: es lógica de cumplimiento fiscal. Refactorizar **test-first** (extraer pasos de `run`/`resume`/`runPhase` sin cambiar el orden de fases ni de gates).

| Archivo | Regla |
|---------|-------|
| `packages/application/src/fiscal/fiscal-classification-engine-ai.ts` | complejidad cognitiva |
| `packages/fiscal-fsd/src/orchestrator/fiscal-compliance-orchestrator.ts` | complejidad cognitiva |
| `packages/fiscal-fsd/src/orchestrator/fiscal-compliance-orchestrator.ts` | complejidad cognitiva |
| `packages/fiscal-fsd/src/orchestrator/fiscal-compliance-orchestrator.ts` | complejidad cognitiva |
| `packages/fiscal-fsd/src/phases/fsd-phases.ts` | complejidad cognitiva |
| `packages/fiscal-fsd/src/runner.ts` | complejidad cognitiva |

## Siguiente paso

Refactorizar por archivo, empezando por el código vivo de la API/web (`accounting-mission.service.ts`, rutas SSE de `drenyra`). Parte del runtime (`mastra/`, `swarm-core/`, `plugin/`) se eliminará con la Fase 6 de `docs/14-design/pi-migration-cleanup-plan.md`; no vale la pena refactorizarla antes de que el shadow-run confirme paridad.
