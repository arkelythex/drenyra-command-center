# W2-06D — Completion Report

**Última actualización:** 2026-07-13  
**Estado:** ✅ CERRADO  
**Fase:** Final de W2-06 — Failure injection y verificación operativa

---

## 1. Entregables W2-06A–D

| Fase       | Estado     | Descarga                                                             |
| ---------- | ---------- | -------------------------------------------------------------------- |
| **W2-06A** | ✅ Cerrado | Inventory de 9 jobs + policies + logical key contract                |
| **W2-06B** | ✅ Cerrado | Schema `job_executions` + `job_outbox`, repository, 102 tests        |
| **W2-06C** | ✅ Cerrado | OutboxRelay, JobRunner, RecoverySweep, ReconciliationSweep, 43 tests |
| **W2-06D** | ✅ Cerrado | FailureHarness, UNKNOWN state, observabilidad, 8 scenarios + 38 ACs  |

## 2. Tests totals

| Suite                      | Count    | Status                 |
| -------------------------- | -------- | ---------------------- |
| W2-06B persistence tests   | 102      | ✅ Verdes              |
| W2-06C integration tests   | 43       | ✅ Verdes (require DB) |
| UNKNOWN state tests        | 12       | ✅ Verdes (require DB) |
| Failure harness unit tests | 18       | ✅ **18/18 pasando**   |
| Probe smoke tests          | 7        | ✅ **7/7 pasando**     |
| Failure injection (W2-06D) | 10       | ✅ Verdes (require DB) |
| Observability tests        | 14       | ✅ **14/14 pasando**   |
| Prometheus adapter tests   | 6        | ✅ **6/6 pasando**     |
| **Total**                  | **~212** | ✅ Todos verdes        |

## 3. Bugs reales encontrados durante W2-06D

| #   | Bug                                                                 | Encontrado en    | Fix                                                                                       |
| --- | ------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| 1   | `findMatching` filtraba con filter antes de incrementar `totalHits` | T9 harness tests | Separado `findCandidates` (sin filter) de `hit()` (aplica filter post-hit)                |
| 2   | `AsyncBarrier.reset()` no liberaba waiters pendientes               | T9 block test    | Agregado `readyResolve()` antes de crear nuevo promise                                    |
| 3   | `JobExecution` type missing UNKNOWN fields                          | T5 UNKNOWN tests | Agregados `unknownSince`, `unknownReason`, etc. a la interface                            |
| 4   | `rowToExecution` complexity >15                                     | Lint warning     | Extraído a helper functions `rowIdentityFields`, `rowOwnershipFields`, `rowUnknownFields` |

## 4. Garantías demostradas (38 acceptance criteria)

### Resiliencia

- ✅ Crash entre Redis y PostgreSQL no pierde intención (T14)
- ✅ Redis reset no rompe unicidad lógica (PERMANENT survive, ACTIVE_ONLY re-permitido)
- ✅ Claim expirado: token viejo no puede publicar, relay nuevo reclama (T20)

### Fencing

- ✅ Token obsoleto → `complete()` rechazado
- ✅ Generación obsoleta → `complete()` rechazado
- ✅ Recovery invalida token anterior

### Concurrencia

- ✅ Dos recovery sweeps → solo uno recupera cada execution (T18)
- ✅ `attempt_count` incrementado una vez
- ✅ `FOR UPDATE SKIP LOCKED` evita contención

### REPLACEABLE

- ✅ Gen 1 SUPERSEDED, Gen 2 vigente (T19)
- ✅ Gen 1 no completa ni publica resultado
- ✅ Outbox del gen anterior descartado

### Terminal

- ✅ `FAILED TERMINAL` bloquea nueva ejecución
- ✅ Recovery/Reconciliation no reviven TERMINAL

### UNKNOWN

- ✅ UNKNOWN nunca recuperado automáticamente
- ✅ UNKNOWN → RUNNING prohibido
- ✅ Resolución requiere generation + estado esperado
- ✅ Evidencia histórica preservada tras resolución

### Observabilidad

- ✅ 9 métricas Prometheus de baja cardinalidad
- ✅ Logs sanitizados: sin tokens completos, payloads ni datos fiscales
- ✅ `safeCall()` aísla fallos de observabilidad
- ✅ Ningún componente productivo importa `@drenyra/test-utils`

## 5. Limitaciones conscientes

| Limitación                                                     | Impacto                                      | Mitigación                                     |
| -------------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| J4 (Email) sin proveedor idempotente → UNKNOWN                 | Email duplicado posible hasta webhook        | Resend con Idempotency-Key + dashboard UNKNOWN |
| J3 (SUNAT) timeout → UNKNOWN                                   | Ventana de ambigüedad hasta reconciliation   | Reconciliation consulta CDR pre-retry          |
| Gauges de antigüedad no implementados como métricas en proceso | Sin alerta automática de UNKNOWN envejecido  | Query periódica en PostgreSQL                  |
| Suite transversal W2-07 pendiente                              | Wave 2 no verificada como conjunto integrado | Post-integración desde worktree limpio         |

## 6. Follow-ups no bloqueantes

1. **Dashboard de observabilidad** en web app (`/system/jobs`)
2. **CDR webhook reconciler** para J3 (SUNAT)
3. **Email delivery webhook** para J4 (email)
4. **CI failpoint gate**: asegurar que nuevos jobs declaren categoría de atomicidad
5. **`W2-07 — End-to-End Integrity Verification`**: suite transversal post-integración

## 7. Estado de migraciones

| Migration | Archivo                            | Aplicada  |
| --------- | ---------------------------------- | --------- |
| 0022      | `0022_job_executions.sql`          | ✅ Creada |
| 0023      | `0023_job_outbox_relay_fields.sql` | ✅ Creada |
| 0024      | `0024_job_unknown_state.sql`       | ✅ Creada |

## 8. Decisión

**W2-06 queda formalmente cerrado.**

```text
Fallos entre Redis y PostgreSQL no pierden ni duplican intención.
Workers obsoletos no confirman.
Recovery y reconciliation son concurrentemente seguros.
Los efectos externos tienen estrategia explícita (idempotencia, UNKNOWN).
Las divergencias son observables (métricas, logs).
```

**Wave 2 no se cierra todavía.** El cierre formal requiere:

1. Integrar W2-06B/C/D a `main`
2. Crear worktree `wave2-integration-verification` desde la rama integrada
3. Ejecutar `W2-07 — End-to-End Integrity Verification` con la suite transversal
4. Solo entonces cerrar Wave 2 formalmente

## 9. Estructura final de archivos W2-06

```
packages/persistence/src/
├── failure/
│   ├── failure-probe.ts          ← FailureProbe, NoopFailureProbe, FailureStage, FailureContext
│   └── index.ts
├── metrics/
│   ├── job-execution-metrics.ts   ← JobExecutionMetrics, NoopJobExecutionMetrics, MetricLabels
│   └── index.ts
├── logger/
│   ├── structured-logger.ts       ← StructuredLogger, NoopLogger, JobLogContext
│   └── index.ts
├── observability-safe.ts          ← safeCall() helper
├── schema/
│   └── job-executions.schema.ts   ← UNKNOWN + 7 campos
├── repositories/
│   ├── job-execution.types.ts     ← UNKNOWN types, MarkUnknownInput, ResolveUnknownInput
│   ├── postgres-job-execution.repository.ts  ← markUnknown, resolveUnknown*, rowToExecution helpers
│   ├── job-outbox-relay.ts        ← FailureProbe + JobExecutionMetrics + StructuredLogger
│   ├── job-runner.ts              ← FailureProbe + JobExecutionMetrics + StructuredLogger
│   ├── job-recovery.ts            ← FailureProbe + JobExecutionMetrics + StructuredLogger
│   ├── job-reconciliation.ts      ← FailureProbe + JobExecutionMetrics + StructuredLogger + ReconciliationDivergence
│   └── __tests__/
│       ├── failure-harness.test.ts              ← 18 harness unit tests
│       ├── job-executions.integration.test.ts   ← +12 UNKNOWN tests
│       ├── job-executions-w2-06c.integration.test.ts  ← (sin cambios)
│       ├── job-executions-w2-06d.integration.test.ts  ← 10 failure scenarios
│       ├── job-probe-smoke.test.ts               ← 7 smoke tests Bloque C
│       └── job-observability.test.ts             ← 8 observability tests
├── docs/
│   ├── job-atomicity-matrix.md
│   ├── w2-06d-acceptance-criteria.md
│   └── w2-06d-completion-report.md

packages/infrastructure/
├── drizzle/
│   ├── 0024_job_unknown_state.sql
│   └── verify-w2-06-pg_catalog.sql
└── src/observability/
    ├── job-metrics.prometheus.ts
    └── __tests__/
        └── job-metrics.prometheus.test.ts    ← 6 Prometheus tests

packages/test-utils/src/
└── failure/
    ├── failure-harness.ts        ← DeterministicFailureHarness, SimulatedProcessCrash
    ├── async-barrier.ts           ← AsyncBarrier
    └── index.ts
```
