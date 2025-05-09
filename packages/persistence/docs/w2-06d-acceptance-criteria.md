# W2-06D — Acceptance Criteria Verification

**Última actualización:** 2026-07-13  
**Estado:** Verificado

---

## AC-UNKNOWN

| #   | Criterio                                            | Verificación                                                 | Método                                              |
| --- | --------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| 1   | UNKNOWN nunca se recupera automáticamente           | ✅ RecoverySweep solo busca `RUNNING`; UNKNOWN no aparece    | `job-recovery.ts` WHERE clause                      |
| 2   | UNKNOWN → RUNNING prohibido                         | ✅ `markUnknown` es fencing + acquireLease no acepta UNKNOWN | `postgres-job-execution.repository.ts` acquireLease |
| 3   | UNKNOWN requiere `unknown_since` y `unknown_reason` | ✅ CHECK constraint `ck_job_execution_unknown_has_fields`    | Migration 0024                                      |
| 4   | UNKNOWN prohíbe `execution_token` y lease           | ✅ CHECK constraint `ck_job_execution_unknown_no_ownership`  | Migration 0024                                      |
| 5   | Resolución require `execution_id` + `generation`    | ✅ `resolveUnknown*` validan generación + estado UNKNOWN     | `postgres-job-execution.repository.ts`              |

## AC-FENCING

| #   | Criterio                         | Verificación                                             | Método                                 |
| --- | -------------------------------- | -------------------------------------------------------- | -------------------------------------- |
| 6   | Token obsoleto no completa       | ✅ `complete()` WHERE incluye `execution_token = $token` | `postgres-job-execution.repository.ts` |
| 7   | Generación obsoleta no completa  | ✅ `complete()` WHERE incluye `generation = $gen`        | `postgres-job-execution.repository.ts` |
| 8   | Token obsoleto no hace fail      | ✅ `fail()` WHERE incluye `execution_token = $token`     | `postgres-job-execution.repository.ts` |
| 9   | Generación obsoleta no hace fail | ✅ `fail()` WHERE incluye `generation = $gen`            | `postgres-job-execution.repository.ts` |
| 10  | Recovery invalida token anterior | ✅ Recovery marca `execution_token = NULL`               | `job-recovery.ts` markExpired          |

## AC-CRASH

| #   | Criterio                                           | Verificación                                           | Método                                      |
| --- | -------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| 11  | Crash entre queue.add y PG commit → estado PENDING | ✅ T14 test verifica outbox PENDING, execution PENDING | `job-executions-w2-06d.integration.test.ts` |
| 12  | Retry del relay mismo jobId                        | ✅ `jobId = job-execution:{executionId}` determinista  | `job-outbox-relay.ts`                       |
| 13  | Retry del relay no duplica jobs                    | ✅ T14 test: segundo relay publica mismo jobId         | `job-executions-w2-06d.integration.test.ts` |
| 14  | Crash no se transforma en FAILED                   | ✅ T14 test: estado PENDING preservado                 | `job-executions-w2-06d.integration.test.ts` |

## AC-RECOVERY

| #   | Criterio                                             | Verificación                           | Método                                      |
| --- | ---------------------------------------------------- | -------------------------------------- | ------------------------------------------- |
| 15  | Dos recovery sweeps concurrentes → solo uno recupera | ✅ `FOR UPDATE SKIP LOCKED` en SELECT  | `job-recovery.ts`                           |
| 16  | `attempt_count` incrementado una vez                 | ✅ T18 test verifica attempt_count = 1 | `job-executions-w2-06d.integration.test.ts` |
| 17  | SUPERSEDED/CANCELLED no recuperables                 | ✅ WHERE excluye estos estados         | `job-recovery.ts`                           |
| 18  | REPLACEABLE: solo si generation es current           | ✅ Subquery con MAX(generation)        | `job-recovery.ts`                           |

## AC-REPLACEABLE

| #   | Criterio                       | Verificación                               | Método                                      |
| --- | ------------------------------ | ------------------------------------------ | ------------------------------------------- |
| 19  | Gen 1 SUPERSEDED               | ✅ T19 test verifica status = SUPERSEDED   | `job-executions-w2-06d.integration.test.ts` |
| 20  | Gen 2 vigente                  | ✅ T19 test: Gen 2 adquiere y completa     | `job-executions-w2-06d.integration.test.ts` |
| 21  | Gen 1 no completa              | ✅ T19 test: complete() → fencing-rejected | `job-executions-w2-06d.integration.test.ts` |
| 22  | Fencing por token + generación | ✅ replace() asigna nuevo token a gen 2    | `postgres-job-execution.repository.ts`      |

## AC-OBSERVABILITY

| #   | Criterio                                       | Verificación                                    | Método                             |
| --- | ---------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| 23  | Fallo de métricas no altera estado             | ✅ `safeCall()` try/catch en todas las llamadas | `observability-safe.ts`            |
| 24  | Labels Prometheus no contienen IDs             | ✅ Tipo `JobMetricLabels` sin fields de IDs     | `metrics/job-execution-metrics.ts` |
| 25  | Logs no contienen payloads ni tokens completos | ✅ `JobLogContext` sin payload/executionToken   | `logger/structured-logger.ts`      |
| 26  | UNKNOWN incrementa contador                    | ✅ T26 test verifica                            | `job-observability.test.ts`        |
| 27  | recovery usa labels tipadas                    | ✅ T26 test verifica                            | `job-observability.test.ts`        |
| 28  | reconciliation usa repair_type como label      | ✅ T26 + T23 test verifican                     | `job-metrics.prometheus.test.ts`   |

## AC-REDIS

| #   | Criterio                                    | Verificación                                                | Método                                      |
| --- | ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| 29  | Redis reset: COMPLETED survival             | ✅ PERMANENT unique index bloquea                           | `0022_job_executions.sql`                   |
| 30  | ACTIVE_ONLY tras Redis reset                | ✅ ACTIVE_ONLY unique index permite (COMPLETED no en index) | `0022_job_executions.sql`                   |
| 31  | ENQUEUED en PG + Redis perdido → detectable | ✅ T15 test: reconciliation detecta divergencia             | `job-executions-w2-06d.integration.test.ts` |
| 32  | PUBLISHED + PENDING → reparable             | ✅ T15 test: reconciliation downgradea outbox               | `job-executions-w2-06d.integration.test.ts` |

## AC-TERMINAL

| #   | Criterio                                | Verificación                                 | Método                                      |
| --- | --------------------------------------- | -------------------------------------------- | ------------------------------------------- |
| 33  | FAILED TERMINAL bloquea nueva ejecución | ✅ T21 test: createOrResolve → already-final | `job-executions-w2-06d.integration.test.ts` |
| 34  | Recovery no revive TERMINAL             | ✅ Recovery solo busca RUNNING               | `job-recovery.ts`                           |
| 35  | Reconciliation no revive TERMINAL       | ✅ Reconciliation no toca FAILED             | `job-reconciliation.ts`                     |

## AC-BOUNDARIES

| #   | Criterio                                                  | Verificación                                              | Método                                       |
| --- | --------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| 36  | Ningún componente productivo importa test-utils           | ✅ Smoke test: toString() no contiene @drenyra/test-utils | `job-probe-smoke.test.ts`                    |
| 37  | NoopFailureProbe es default en producción                 | ✅ Constructor parameter default                          | `job-outbox-relay.ts`, `job-runner.ts`, etc. |
| 38  | SimulatedProcessCrash no se captura como fallo de negocio | ✅ T14 test: rejects.toThrow(SimulatedProcessCrash)       | `failure-harness.test.ts`                    |

---

**Total: 38 criterios, todos verificados.** ✅
