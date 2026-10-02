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

## Deuda estructural pendiente (1 supresión `biome-ignore` con motivo)

Complejidad cognitiva > 15 (política: funciones < 30 líneas) y `console` en entrypoints. Cada fila es una supresión que debe **eliminarse refactorizando**, no ampliarse.

| Ubicación | Regla |
|-----------|-------|
| `apps/web/src/features/workspace/services/accounting-mission.service.ts:169` | noExcessiveCognitiveComplexity |

- ✅ Saldadas también: `ResultMerger.merge` y `TaskDecomposer.decompose` (extracción de helpers; 110 tests de `mastra` intactos y prueba diferencial vieja-vs-nueva en 12 288 combinaciones de objetivo/dominios).
- ✅ Saldadas: `DelegationGraph.detectCycle` (helpers; equivalencia verificada en 5 000 grafos aleatorios) y `LatinModernoOrchestrator.handleRequest` (`executeStep` extraído; test de caracterización nuevo).
- ✅ **Defecto corregido — el orquestador solo ejecutaba `step-1`:** `TaskDecomposer` marcaba como procesados los pasos con dependencias sin meterlos en ningún grupo paralelo, así que validación, clasificación y compliance nunca corrían. Ahora los grupos son niveles topológicos (cada paso exactamente una vez, tras sus dependencias). Tests nuevos en `task-decomposer.test.ts`.
- ✅ Saldadas: `detectPaymentDelayTrend` y `detectDebtAging` (`supplier-intelligence`): helpers de agrupación/bucketing; +8 tests de frontera (59/60/89/90 días, 20/21/30/31 de retraso) y 4 mutantes de umbral muertos.
- ✅ Saldadas (test-first, snapshots fiscales idénticos antes/después): `AuditoriaAgent.execute` (4 checks + acumulador que conserva el orden de sumas de punto flotante), `CierreAgent.execute` (`closeAccount`) y `DeclaracionAgent.execute` (camino real vs mock). 25 tests de caracterización nuevos.
- ⚠️ **Hallazgo (conservado, no corregido):** en `DeclaracionAgent` con `FiscalDocumentService` las `observaciones` de validación (sin PLE, detracciones sin constancia) se calculan pero se descartan; solo el camino mock las devuelve. Decidir con el equipo fiscal si deben viajar en el reporte.
- ✅ Saldadas (test-first): `classifyDocument` (etapas + 4 constructores de anomalía; matriz 17 documentos × 4 conjuntos de opciones) y `detracciones.execute` (SPOT: `evaluateInvoice` + 3 casos; 18 snapshots y 5 mutantes de umbral muertos: 700, 1 pt, 15 días, 5 días, 50 000).
- ✅ Saldadas (test-first): `sire-filing` (`evaluateRecord`; 14 snapshots, 4 mutantes: 7 días, 30 días, ventana, confianza) y `tax-calendar` (`deadlineAlert` + `missingObligationAnomaly`; 17 snapshots, 3 mutantes de ventana de alerta).
- **Con esto, todas las supresiones de lógica fiscal en estrategias y phase-agents quedan saldadas.** Quedan 7: orquestación de fases (`fiscal-phase-orchestrator`, `fiscal-phase-graph`, `batch-orchestrator`), `console` de entrypoints (`serve.ts` ×2, `plugin/registry.ts`), la mission service de web y la clase estática intencional de `inbox.service.ts`.
- ✅ Saldadas las tres de orquestación de fases (test-first): `validateGraph` (3 chequeos; test de orden de errores validado contra la implementación vieja y la nueva), `BatchOrchestrator.processSingleEntry` (16 escenarios con orquestador/store simulados) y `runPeriodContinuously` (8 escenarios con secuencia de llamadas).
- ⚠️ **Hallazgo (conservado):** `BatchOrchestrator.start()` reinicia `pauseRequested` y `pausedRucs`, por lo que `pause()` invocado antes de `start()` no tiene efecto.
- ✅ Los 3 `console` de entrypoint (`serve.ts` ×2, `plugin/registry.ts`) pasan a `process.stdout.write` (sin añadir dependencia de `@drenyra/shared` a `agent-runtime`); el banner ya no dice «drenyra-pi».
- **Queda 1 supresión:** la complejidad de `accounting-mission.service.ts` (web). La clase estática de `inbox.service.ts` es una decisión de diseño documentada y no figura en este inventario.

## Código fiscal: deuda saldada (6 supresiones eliminadas, test-first)

Refactorizadas con tests de caracterización escritos **antes** y comprobados con mutantes (cada rama relevante tiene un mutante que hace fallar un test):

| Función | Antes | Ahora |
|---------|-------|-------|
| `FiscalFSDRunner.runPhase` | complejidad 24 | `buildContext`, `makeArtifact`, `failedPhaseResult`, `applyGate`; +6 tests |
| `createLLMPhase` (fsd-phases) | 18 | `buildContextBlock`, `buildUserPrompt`, `parseLLMOutput`, `llmFailure`; +11 tests |
| `FiscalComplianceOrchestrator.run` / `resume` | 22 / 23 | un solo `advancePhase` + `findResumePoint` con mensajes parametrizados; +12 tests |
| `extractSubsystems` | 16 | `subsystemsFromTasks` |
| `FiscalClassificationEngineAI.classifyWithLLM` | 19 | `buildUserPrompt`, `parseAiResult`, `mergeAiResult` (+ `Map` de etiquetas); +17 tests |

`fiscal-fsd`: 100 → 129 tests; `application`: 753 → 770. Sin ninguna supresión de complejidad en `fiscal-fsd` ni en el clasificador.

### Hallazgos de comportamiento (preservados, a decidir)
- ✅ **Resuelto — `ESCALATE` ahora escala:** con un gate `BLOCKING` fallido el pipeline devuelve `BLOCKED` (`Gate "G" escalated for human review: …`) en `fiscal-fsd` y en `phase-gatekeeper` (pre-gate: la fase no se ejecuta; post-gate: devuelve el output). Antes terminaba `COMPLETED` en silencio. Tests: `runner.test.ts`, `pipeline.test.ts`.
- ✅ **Resuelto — `resume()` pasa por `ReviewGuard`:** la guarda vive en `advancePhase`, compartida por `run()` y `resume()`; una migración reanudada ya no se salta la guarda de revisión. Verificado con mutante (sin guarda fallan 2 tests).
- ✅ **Configs de vitest rotas** (`},\t},` sin cerrar) en `fiscal-approval`, `fiscal-query-engine`, `phase-gatekeeper`: arregladas; sus suites (20 / 37 / 20) vuelven a ejecutarse.
- ✅ **`GatedPhasePipeline.runPhase` (complejidad 43 → <15):** pre y post-gates comparten `evaluateGates`; sin suprimir, 20 tests intactos.
- `fiscal-summary-service.ts` (application) tiene complejidad 18 y `noStaticOnlyClass`: deuda previa, aún sin tocar.

## Siguiente paso

Refactorizar por archivo, empezando por el código vivo de la API/web (`accounting-mission.service.ts`, rutas SSE de `drenyra`). Parte del runtime (`mastra/`, `swarm-core/`, `plugin/`) se eliminará con la Fase 6 de `docs/14-design/pi-migration-cleanup-plan.md`; no vale la pena refactorizarla antes de que el shadow-run confirme paridad.
