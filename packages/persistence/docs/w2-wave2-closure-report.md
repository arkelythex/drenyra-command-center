# Wave 2 — Closure Report

**Última actualización:** 2026-07-13  
**Estado:** Pendiente de gate final (entorno real)  
**Siguiente:** Ejecutar `wave2-gate.sh` en CI

---

## 1. Entregables W2-01 a W2-07

| Fase       | Wave               | Estado       | Descripción                                               |
| ---------- | ------------------ | ------------ | --------------------------------------------------------- |
| **W2-01**  | ADR-009            | ✅ Cerrado   | Contrato canónico de idempotencia                         |
| **W2-02**  | Schema             | ✅ Cerrado   | Tabla `idempotency_records` + migration                   |
| **W2-03**  | Idempotency        | ✅ Cerrado   | Aplication service, fencing, E2E tests                    |
| **W2-04**  | Natural Uniqueness | ✅ Cerrado   | 7 constraints + concurrency tests                         |
| **W2-05**  | Consumer Inbox     | ✅ Cerrado   | Schema, consume-once, fencing tests                       |
| **W2-06A** | Inventory          | ✅ Cerrado   | 9 jobs, logical keys, policies                            |
| **W2-06B** | Registry           | ✅ Cerrado   | `job_executions` + `job_outbox` + repository              |
| **W2-06C** | Relay/Runner       | ✅ Cerrado   | OutboxRelay, JobRunner, Recovery, Reconciliation          |
| **W2-06D** | Failure/Chaos      | ✅ Cerrado   | FailureHarness, UNKNOWN, 8 escenarios, observabilidad     |
| **W2-07A** | Test Plan          | ✅ Cerrado   | Integration test plan & scenario matrix                   |
| **W2-07B** | Fixtures           | ✅ Cerrado   | 4 fixtures, 4 helpers, Wave2TestContext                   |
| **W2-07C** | Scenarios 1-4      | ✅ Cerrado   | Comando duplicado, conflicto fiscal, outbox, consumer-job |
| **W2-07D** | Scenarios 5-9      | ✅ Cerrado   | Crash relay, Redis reset, UNKNOWN, isolation, rollback    |
| **W2-07E** | Gate               | 🔶 Pendiente | Entorno real, migraciones, suite completa, cierre         |

## 2. Migraciones creadas

| Migration | Archivo                            | Contenido                                                                                             |
| --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 0022      | `0022_job_executions.sql`          | `job_executions` + `job_outbox` + enums + 13 CHECK + 4 partial unique indexes + 3 operational indexes |
| 0023      | `0023_job_outbox_relay_fields.sql` | Outbox relay ownership fields + 2 indexes                                                             |
| 0024      | `0024_job_unknown_state.sql`       | UNKNOWN state + 7 columns + 7 CHECK constraints + reconciliation index                                |

## 3. Constraints e invariantes

### Enums (3)

- `job_uniqueness_policy`: PERMANENT, PERMANENT_BY_INPUT, ACTIVE_ONLY, WINDOWED, REPLACEABLE
- `job_execution_status`: PENDING, ENQUEUED, RUNNING, COMPLETED, FAILED, CANCELLED, SUPERSEDED, UNKNOWN
- `job_failure_class`: RETRYABLE, TERMINAL

### Partial Unique Indexes (4)

- `uq_job_execution_active_only`: blocks while active
- `uq_job_execution_permanent`: blocks after terminal (except SUPERSEDED)
- `uq_job_execution_windowed`: one per window
- `uq_job_execution_replaceable`: blocks while not SUPERSEDED/CANCELLED

### CHECK Constraints (20+)

- Running ownership, token cleanup, timestamp requirements
- UNKNOWN: requires unknown_since + reason, forbids token/lease
- Resolution: requires resolved_at, preserves historical evidence

## 4. Test inventory

| Suite           | Archivos                                    | Tests totales | Unit   | DB-dep  | Redis-dep |
| --------------- | ------------------------------------------- | ------------- | ------ | ------- | --------- |
| Failure harness | `failure-harness.test.ts`                   | 18            | 18     | —       | —         |
| Probe smoke     | `job-probe-smoke.test.ts`                   | 7             | 7      | —       | —         |
| Observability   | `job-observability.test.ts`                 | 8             | 8      | —       | —         |
| Prometheus      | `job-metrics.prometheus.test.ts`            | 6             | 6      | —       | —         |
| W2-06B registry | `job-executions.integration.test.ts`        | 102           | —      | 102     | —         |
| W2-06C relay    | `job-executions-w2-06c.integration.test.ts` | 43            | —      | 43      | —         |
| W2-06D failure  | `job-executions-w2-06d.integration.test.ts` | 10            | —      | 10      | —         |
| W2-07 fixtures  | `wave2-smoke.test.ts`                       | 15            | 9      | 6       | —         |
| W2-07 C1-C4     | `01-04.*.test.ts`                           | 6             | —      | 6       | —         |
| W2-07 D2-D6     | `05-09.*.test.ts`                           | 14            | —      | 10      | 4         |
| W2-07 gate      | `wave2-gate.test.ts`                        | 8             | —      | 8       | —         |
| **Total**       | **21 files**                                | **~237**      | **48** | **185** | **4**     |

## 5. Bugs reales encontrados y corregidos

| #   | Bug                                                                 | Fase           | Fix                                                            |
| --- | ------------------------------------------------------------------- | -------------- | -------------------------------------------------------------- |
| 1   | `findMatching` filtraba con filter antes de incrementar `totalHits` | W2-06D T9      | Separado `findCandidates` de `hit()`                           |
| 2   | `AsyncBarrier.reset()` no liberaba waiters pendientes               | W2-06D T9      | Agregado `readyResolve()` antes de nuevo promise               |
| 3   | `JobExecution` type missing UNKNOWN fields                          | W2-06D T5      | Agregados 7 campos a la interface                              |
| 4   | `rowToExecution` complexity >15                                     | W2-06D T4      | Extraído a helper functions                                    |
| 5   | Worktree stale module resolution                                    | W2-06D general | Identificado como limitación de worktree (no es bug de código) |

## 6. Failure scenarios demostrados

| #   | Escenario                                | Mecanismo                                  | Verificación  |
| --- | ---------------------------------------- | ------------------------------------------ | ------------- |
| 1   | Crash tras queue.add, antes de PG commit | Failpoint `outbox.after-queue-add` → crash | T14           |
| 2   | Redis perdido: ENQUEUED sin job          | Reconciliation detecta                     | T15a          |
| 3   | Redis perdido: PUBLISHED + PENDING       | Reconciliation repara                      | T15b          |
| 4   | Lease expirado antes de complete         | Token fencing                              | T16           |
| 5   | Heartbeat transitorio                    | Un fallo no aborta                         | T17           |
| 6   | Recovery concurrente                     | FOR UPDATE SKIP LOCKED                     | T18           |
| 7   | Replace durante ejecución                | SUPERSEDED + nueva generation              | T19           |
| 8   | Claim expirado                           | Token relay vencido                        | T20           |
| 9   | Terminal + no resurrection               | FAILED TERMINAL                            | T21           |
| 10  | Crash → recovery → retry → 1 efecto      | Transversal                                | T-transversal |

## 7. Garantías operativas

```text
✓ Fallos entre Redis y PostgreSQL no pierden ni duplican intención
✓ Workers obsoletos no confirman (fencing token + generation)
✓ Recovery y reconciliation son concurrentemente seguros (SKIP LOCKED)
✓ Efectos externos tienen estrategia explícita (Idempotency-Key, UNKNOWN)
✓ Divergencias son observables (9 métricas + logs estructurados)
✓ UNKNOWN nunca se recupera automáticamente
✓ DB_ATOMIC vs DB_SPLIT_TRANSACTION documentado para cada job
✓ Tenant isolation preservada en todas las capas (company_id en todos los indexes)
```

## 8. Limitaciones conscientes

| Limitación                                         | Impacto                 | Mitigación                                 |
| -------------------------------------------------- | ----------------------- | ------------------------------------------ |
| J4 (Email) sin proveedor idempotente → UNKNOWN     | Email duplicado posible | Resend Idempotency-Key + dashboard UNKNOWN |
| J3 (SUNAT) timeout → UNKNOWN                       | Ventana de ambigüedad   | Reconciliation consulta CDR pre-retry      |
| Gauges de antigüedad no como métricas en proceso   | Sin alerta automática   | Query periódica PostgreSQL                 |
| 26 tests DB-dependientes no ejecutados en worktree | No son evidencia verde  | Gate script los ejecuta en CI              |
| 3 fallos preexistentes (export 'client')           | Persisten en el branch  | Issue + gate explícito                     |

## 9. Follow-ups no bloqueantes

1. Dashboard de observabilidad en web app (`/system/jobs`)
2. CDR webhook reconciler para J3 (SUNAT)
3. Email delivery webhook para J4 (email)
4. CI failpoint gate para nuevos jobs
5. Gauges de antigüedad por query periódica

## 10. Gate final — Checklist

| #   | Condición                           | Estado | Método                 |
| --- | ----------------------------------- | ------ | ---------------------- |
| G1  | Fresh migrations pass               | 🔶     | `wave2-gate.sh`        |
| G2  | Upgrade migrations pass             | 🔶     | `wave2-gate.sh`        |
| G3  | pg_catalog matches schema           | 🔶     | `wave2-gate.sh`        |
| G4  | All PostgreSQL tests pass (185)     | 🔶     | `wave2-gate.sh`        |
| G5  | All Redis/BullMQ tests pass (4)     | 🔶     | `wave2-gate.sh`        |
| G6  | Cross-layer scenarios 1-9 pass      | 🔶     | `wave2-gate.sh`        |
| G7  | No critical static violations       | ✅     | `wave2-static-gate.sh` |
| G8  | No unresolved regression failures   | 🔶     | CI                     |
| G9  | No leaked handles or residual state | 🔶     | CI                     |

## 11. Decisión

**W2-06 cerrado formalmente.** ✅

**Wave 2 — Pendiente de gate final.** El cierre requiere ejecutar `wave2-gate.sh` en un entorno con PostgreSQL, Redis y BullMQ reales, más la corrección o aislamiento formal de los 3 fallos preexistentes.

```text
Estrategia: 4 defensas → 1 efecto
Idempotency + Natural Uniqueness + Consumer Inbox + Job Registry
```

---

**Para cerrar formalmente:** Ejecutar en CI:

```bash
DATABASE_URL_TEST=postgres://... REDIS_URL=redis://... \
  ./scripts/gate/wave2-gate.sh
```
