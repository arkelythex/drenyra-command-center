# packages/ai — deuda de lint destapada al corregir `../logger`

**Última actualización**: 2026-10-02
**Estado ODD**: Working (inventario; cada fila debe eliminarse refactorizando, no ampliarse)

## Contexto
`packages/ai` importaba un `../logger` inexistente (el logger vive en `src/services/logger.ts`): 29 módulos lanzaban `ERR_MODULE_NOT_FOUND` y 12 archivos de test no cargaban. Al corregir las rutas, el hook de lint (Biome) vio por primera vez estos archivos y rechazó 28 violaciones preexistentes. Se suprimieron **con motivo y sin saltarse el hook**, y quedan aquí.

## Resumen por regla
- `noNonNullAssertion`: 10
- `noExcessiveCognitiveComplexity`: 9
- `noExplicitAny`: 7
- `noUnusedVariables`: 1
- `useConst`: 1

## Ubicación

| Archivo | Supresiones |
|---------|-------------|
| `packages/ai/src/agents/adapters/gemini-multi.adapter.ts` | 2 (noExcessiveCognitiveComplexity, noNonNullAssertion) |
| `packages/ai/src/agents/adapters/gemini/adapter.ts` | 2 (noExcessiveCognitiveComplexity, noNonNullAssertion) |
| `packages/ai/src/agents/orchestrator/batch/batch-orchestrator.ts` | 8 (noExcessiveCognitiveComplexity, noExplicitAny) |
| `packages/ai/src/agents/orchestrator/event-bus/bus.ts` | 1 (noNonNullAssertion) |
| `packages/ai/src/agents/orchestrator/event.bus.ts` | 1 (noNonNullAssertion) |
| `packages/ai/src/agents/orchestrator/workflow-v2/orchestrator.ts` | 6 (noExcessiveCognitiveComplexity, noNonNullAssertion, noUnusedVariables) |
| `packages/ai/src/context-monitor/context-pruner.ts` | 1 (useConst) |
| `packages/ai/src/gateway/failover.service.ts` | 1 (noNonNullAssertion) |
| `packages/ai/src/gateway/failover/service.ts` | 1 (noNonNullAssertion) |
| `packages/ai/src/gateway/rate-limiter.ts` | 3 (noNonNullAssertion) |
| `packages/ai/src/gateway/service.ts` | 2 (noExcessiveCognitiveComplexity) |

## Cómo saldarla
Refactor por archivo, test-first, empezando por `gateway/service.ts` y `agents/orchestrator/batch/batch-orchestrator.ts` (la mayor concentración). Quitar la supresión solo cuando la regla pase sin ella.
