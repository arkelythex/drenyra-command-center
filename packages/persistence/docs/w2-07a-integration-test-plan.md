# W2-07A — Integration Test Plan & Cross-Layer Scenario Matrix

**Última actualización:** 2026-07-13  
**Depende de:** W2-06 (A+B+C+D) integrado en `main`  
**Siguiente:** W2-07B — Fixtures y harness transversal

---

## 1. Objetivo

Demostrar que las cuatro defensas de Wave 2 operan juntas sin interferencias ni lagunas:

```
Idempotency (W2-02/03)
→ Natural Uniqueness (W2-04)
→ Consumer Inbox (W2-05)
→ Job Registry/Outbox (W2-06)
```

Cada escenario verifica **exactamente un efecto** bajo duplicación, concurrencia, crash y redelivery.

---

## 2. Cross-Layer Scenario Matrix

| #   | Escenario                       | Entry point                  | Idempotency    | Natural Uniq                         | Inbox          | Job Registry              | Job Outbox           | Redis/BullMQ   | Failure mode                                   | Esperado                                                             | Filas persisten                                                       | Filas ausentes                                    | Tenant isolation       | Failpoint                                        |
| --- | ------------------------------- | ---------------------------- | -------------- | ------------------------------------ | -------------- | ------------------------- | -------------------- | -------------- | ---------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------- | ---------------------- | ------------------------------------------------ |
| 1   | Comando duplicado               | HTTP POST `/invoices`        | Misma key      | —                                    | —              | —                         | —                    | —              | 2 requests concurrentes                        | 1 invoice, 1 idempotency COMPLETED                                   | 1 invoices, 1 idempotency_records COMPLETED                           | 0 invoices duplicados, 0 idempotency en conflicto | Misma compañía         | Ninguno                                          |
| 2   | Keys distintas, misma intención | HTTP POST `/invoices`        | Keys distintas | Mismo (company, vendor, bill_number) | —              | —                         | —                    | —              | 2 requests con distinta key pero mismo invoice | 1 invoice (unique gana), 1 idempotency FAILED o IN_PROGRESS resuelto | 1 invoices, 1+ idempotency_records (uno COMPLETED, otro resoluciones) | 0 invoices duplicados                             | Misma compañía         | Ninguno                                          |
| 3   | Comando → outbox → consumer     | HTTP POST → commit → event   | Key única      | —                                    | consume-once   | —                         | —                    | NATS/event bus | 2 deliveries concurrentes del evento           | 1 inbox COMPLETED, 1 handler ejecutado                               | 1 inbox_messages COMPLETED                                            | 0 inbox duplicados                                | Misma compañía         | Ninguno                                          |
| 4   | Consumer crea job               | Handler registra job         | —              | —                                    | consume-once   | createOrResolve           | INSERT outbox        | NATS + BullMQ  | Redelivery del mensaje                         | 1 job EXECUTION PENDING, 1 outbox                                    | 1 job_executions PENDING, 1 job_outbox PENDING                        | 0 job duplicados                                  | Misma compañía         | Ninguno                                          |
| 5   | Crash del relay                 | OutboxRelay.runCycle         | —              | —                                    | —              | UPDATE ENQUEUED           | PUBLISHED            | BullMQ         | crash en `outbox.after-queue-add`              | 1 ENQUEUED, 1 PUBLISHED, 1 BullMQ job lógico                         | 1 job_executions ENQUEUED, 1 job_outbox PUBLISHED                     | 0 job duplicados, 0 FAILED                        | Misma compañía         | `outbox.after-queue-add` → crash                 |
| 6   | Redis reset                     | Post-reset reconciliation    | —              | —                                    | —              | PERMANENT survive         | PUBLISHED restaurado | Redis FLUSHALL | Redis perdido                                  | PERMANENT sigue COMPLETED, outbox republicado                        | 1 job_executions COMPLETED, 1 job_outbox PUBLISHED (re-publicado)     | 0 second effect                                   | Misma compañía         | Ninguno (dataset directo)                        |
| 7   | Ambigüedad externa              | Handler timeout              | —              | —                                    | —              | RUNNING→UNKNOWN→COMPLETED | —                    | —              | Timeout post-HTTP                              | UNKNOWN→COMPLETED, recovery NO toca                                  | 1 job_executions COMPLETED (o FAILED según resolución)                | 0 UNKNOWN persistente, 0 recovery no dueño        | Misma compañía         | `runner.before-complete` → callback expira token |
| 8   | Aislamiento transversal         | Múltiples compañías          | Keys iguales   | Mismos valores                       | Mismos msg IDs | Mismos logical_key        | Mismos outbox        | —              | Same IDs across tenants                        | Cada compañía: 1 fila propia, 0 filas ajenas                         | N filas, N=compañías                                                  | 0 filas con company_id incorrecto                 | ✓ Verificado explícito | Ninguno                                          |
| 9a  | Rollback HTTP                   | HTTP POST crash              | Key insertada  | —                                    | —              | —                         | —                    | —              | Crash post-idempotency, pre-aggregate          | Rollback completo, idempotency revertida                             | 0 invoices, 0 idempotency_records                                     | 0 orphan rows                                     | Misma compañía         | Crash post-INSERT                                |
| 9b  | Rollback inbox                  | Consume crash                | —              | —                                    | IN_PROGRESS    | —                         | —                    | —              | Crash post-acquire, pre-complete               | Inbox revertido, next delivery ve PENDING                            | 0 inbox_messages COMPLETED                                            | 0 COMPLETED sin handler                           | Misma compañía         | Crash pre-complete                               |
| 9c  | Rollback job                    | Job creation crash           | —              | —                                    | —              | —                         | —                    | BullMQ         | Crash post-job insert, pre-outbox              | Rollback: 0 job_executions, 0 job_outbox                             | 0 job_executions, 0 job_outbox                                        | 0 orphan executions                               | Misma compañía         | Crash post-INSERT job, pre-INSERT outbox         |
| 9d  | Rollback execution              | DB effect + completion crash | —              | —                                    | —              | RUNNING                   | —                    | —              | Crash post DB effect, pre complete()           | DB effect revertido, execution RUNNING (lease expira)                | DB effect revertido, execution FAILED RETRYABLE tras recovery         | 0 COMPLETED sin efecto, 0 efecto sin registro     | Misma compañía         | Crash post-handler, pre-complete                 |

---

## 3. Fixtures plan

### 3.1 Tenants

```typescript
// tenants.ts
const TENANT_A = { orgId: uuid('org-a'), companyId: uuid('comp-a') }
const TENANT_B = { orgId: uuid('org-b'), companyId: uuid('comp-b') }
```

### 3.2 Fiscal operations

```typescript
// fiscal-operations.ts
const INVOICE_A = {
  companyId: TENANT_A.companyId,
  vendorId: uuid('vendor-1'),
  billNumber: 'F001-00001234',
  amount: 1180.0,
  taxId: '20100000001',
}
```

### 3.3 Messages

```typescript
// messages.ts
const EVENT_MSG = {
  id: uuid('msg-001'),
  type: 'invoice.created',
  payload: { invoiceId: 'inv-001' },
}
```

### 3.4 Jobs

```typescript
// jobs.ts
const SUNAT_JOB = {
  queueName: 'sunat-submission',
  jobType: 'submit',
  logicalKey: `company:${TENANT_A.companyId}:invoice:inv-001`,
  uniquenessPolicy: 'PERMANENT',
}
```

---

## 4. Helpers plan

### 4.1 Wave2TestContext

```typescript
// wave2-test-context.ts
class Wave2TestContext {
  db: PostgresJsDatabase
  tenantA: TenantScope
  tenantB: TenantScope
  idempotencyRepo: IdempotencyRepository
  inboxRepo: InboxRepository
  jobRepo: PostgresJobExecutionRepository
  harness: DeterministicFailureHarness
  // ... factories
}
```

### 4.2 CrossLayerAssertions

```typescript
// cross-layer-assertions.ts
// Verifica estado exacto en cada tabla consultando directamente SQL
async function assertExactlyOneInvoice(db, companyId, billNumber)
async function assertIdempotencyRecord(db, key, expectedStatus)
async function assertInboxRecord(db, msgId, expectedStatus)
async function assertJobExecution(db, logicalKey, expectedStatus)
async function assertJobOutbox(db, executionId, expectedStatus)
async function assertNoOrphanRows(db, executionId) // rollback verification
```

### 4.3 TransactionBarriers

```typescript
// transaction-barriers.ts
// AsyncBarrier wrappers para cada failpoint
const crashAfterIdempotencyInsert = () => harness.inject(...)
const crashAfterInboxAcquire = () => harness.inject(...)
```

### 4.4 TableStateReader

```typescript
// table-state-reader.ts
// Queries directas a PostgreSQL para verificación final
const ALL_TABLES = [
  'invoices',
  'idempotency_records',
  'inbox_messages',
  'job_executions',
  'job_outbox',
]
```

---

## 5. Escenarios detallados

### Escenario 1 — Comando duplicado (misma idempotency key)

| Campo                 | Valor                                                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**          | Misma key → exactamente 1 efecto de dominio                                                                                                                                                   |
| **Capas**             | Idempotency (W2-03) + Aggregate (invoices)                                                                                                                                                    |
| **Entry point**       | `IdempotencyApplicationService.execute()`                                                                                                                                                     |
| **Conexiones**        | 2 conexiones PG independientes, mismo payload, mismo `Idempotency-Key`                                                                                                                        |
| **Failpoint**         | Ninguno (concurrencia real)                                                                                                                                                                   |
| **Pasos**             | 1. Tx1: INSERT idempotency PENDING. 2. Tx2: INSERT idempotency PENDING (unique violation → re-read → ALREADY_ACTIVE). 3. Tx1: INSERT invoice + COMPLETE. 4. Tx2: re-read → ALREADY_COMPLETED. |
| **Estado esperado**   | `idempotency_records`: 1 COMPLETED. `invoices`: 1 fila.                                                                                                                                       |
| **Queries finales**   | `SELECT count(*) FROM invoices WHERE company_id = $1 AND bill_number = $2` → 1. `SELECT status FROM idempotency_records WHERE idempotency_key = $1` → COMPLETED.                              |
| **Debe existir**      | 1 invoice, 1 idempotency record COMPLETED                                                                                                                                                     |
| **No debe existir**   | 0 invoices duplicados, 0 idempotency PENDING/IN_PROGRESS                                                                                                                                      |
| **Condición binaria** | `invoices.count = 1 AND idempotency.records = 1 AND idempotency.status = 'COMPLETED'`                                                                                                         |

### Escenario 2 — Keys distintas, misma intención fiscal

| Campo                 | Valor                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**          | Idempotency no oculta conflicto de uniqueness natural                                                                                                                                                                                                                                                   |
| **Capas**             | Idempotency (W2-03) + Natural Uniqueness (W2-04)                                                                                                                                                                                                                                                        |
| **Entry point**       | Dos llamadas HTTP con distinta key pero mismo invoice                                                                                                                                                                                                                                                   |
| **Conexiones**        | 2 conexiones PG independientes                                                                                                                                                                                                                                                                          |
| **Failpoint**         | Ninguno                                                                                                                                                                                                                                                                                                 |
| **Pasos**             | 1. Tx1: INSERT idempotency PENDING (key-A). 2. Tx2: INSERT idempotency PENDING (key-B). 3. Tx1: INSERT invoice → ok. 4. Tx1: COMPLETE idempotency key-A. 5. Tx2: INSERT invoice → unique violation (company_id, vendor_id, bill_number). 6. Tx2: FAIL idempotency key-B con código UNIQUENESS_CONFLICT. |
| **Estado esperado**   | `invoices`: 1 fila. `idempotency_records`: 1 COMPLETED, 1 FAILED.                                                                                                                                                                                                                                       |
| **Queries finales**   | `SELECT count(*) FROM invoices` → 1. `SELECT status FROM idempotency_records WHERE idempotency_key = 'key-A'` → COMPLETED. `SELECT status FROM idempotency_records WHERE idempotency_key = 'key-B'` → FAILED con failure_code.                                                                          |
| **Debe existir**      | 1 invoice, idempotency key-A COMPLETED, key-B FAILED                                                                                                                                                                                                                                                    |
| **No debe existir**   | 0 invoices duplicados, 0 idempotency IN_PROGRESS                                                                                                                                                                                                                                                        |
| **Condición binaria** | `invoices = 1 AND idempotency_A = COMPLETED AND idempotency_B = FAILED`                                                                                                                                                                                                                                 |

### Escenario 3 — Comando → outbox → consumer

| Campo                 | Valor                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objetivo**          | Evento outbox consumido exactamente 1 vez                                                                                                                                                                                      |
| **Capas**             | Idempotency + Aggregate + Inbox (W2-05)                                                                                                                                                                                        |
| **Entry point**       | Transacción: INSERT invoice + INSERT outbox event → consume-once                                                                                                                                                               |
| **Conexiones**        | 1 tx para escritura, 2 consumers concurrentes                                                                                                                                                                                  |
| **Failpoint**         | Ninguno para escritura; concurrencia real en consume                                                                                                                                                                           |
| **Pasos**             | 1. PG tx: INSERT invoice + INSERT outbox event (sin W2-06, solo dominio→evento). 2. Consumer A: acquire `inbox_messages` → RUNNING. 3. Consumer B: acquire mismo mensaje → ALREADY_RUNNING. 4. Consumer A: handler + COMPLETE. |
| **Estado esperado**   | `invoices`: 1. `inbox_messages`: 1 COMPLETED.                                                                                                                                                                                  |
| **Queries finales**   | `SELECT count(*) FROM inbox_messages WHERE status = 'COMPLETED'` → 1.                                                                                                                                                          |
| **Debe existir**      | 1 invoice, 1 inbox COMPLETED                                                                                                                                                                                                   |
| **No debe existir**   | 0 inbox duplicate COMPLETED, 0 handler ejecutado dos veces                                                                                                                                                                     |
| **Condición binaria** | `inbox_messages.COMPLETED = 1 AND invoices = 1`                                                                                                                                                                                |

### Escenario 4 — Consumer crea job

| Campo                 | Valor                                                                                                                                                                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**          | Handler registra job + outbox; redelivery no duplica                                                                                                                                                                                                              |
| **Capas**             | Inbox (W2-05) + Job Registry (W2-06)                                                                                                                                                                                                                              |
| **Entry point**       | Handler deduplicado llama a `createOrResolve`                                                                                                                                                                                                                     |
| **Conexiones**        | 1 tx para creación, 2 deliveries                                                                                                                                                                                                                                  |
| **Failpoint**         | Ninguno                                                                                                                                                                                                                                                           |
| **Pasos**             | 1. Tx: consumer acquire inbox message → RUNNING. 2. Tx: `createOrResolve` → INSERT job_execution PENDING + job_outbox PENDING. 3. Tx: COMPLETE inbox. 4. Redelivery mismo mensaje: consume → ALREADY_COMPLETED. 5. Verificar: job_executions = 1, job_outbox = 1. |
| **Estado esperado**   | `inbox_messages`: 1 COMPLETED. `job_executions`: 1 PENDING. `job_outbox`: 1 PENDING.                                                                                                                                                                              |
| **Queries finales**   | `SELECT count(*) FROM job_executions WHERE logical_key = $1` → 1. `SELECT count(*) FROM job_outbox` → 1.                                                                                                                                                          |
| **Debe existir**      | 1 job execution, 1 outbox, 1 inbox COMPLETED                                                                                                                                                                                                                      |
| **No debe existir**   | 0 job duplicados, 0 inbox duplicados                                                                                                                                                                                                                              |
| **Condición binaria** | `job_executions = 1 AND job_outbox = 1 AND inbox_messages.COMPLETED = 1`                                                                                                                                                                                          |

### Escenario 5 — Crash del relay

| Campo                 | Valor                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**          | queue.add ok → crash → retry → exactamente 1 ejecución lógica                                                                                                                                                                                                                   |
| **Capas**             | Job Registry + Job Outbox (W2-06) + BullMQ                                                                                                                                                                                                                                      |
| **Entry point**       | OutboxRelay.runCycle()                                                                                                                                                                                                                                                          |
| **Conexiones**        | 2 ciclos de relay (crash + retry)                                                                                                                                                                                                                                               |
| **Failpoint**         | `outbox.after-queue-add` → `SimulatedProcessCrash`                                                                                                                                                                                                                              |
| **Pasos**             | 1. Crear execution PENDING + outbox PENDING. 2. Relay ciclo 1 con crash en `outbox.after-queue-add`. 3. Verificar: execution PENDING, outbox PENDING, BullMQ 1 job. 4. Relay ciclo 2 sin crash. 5. Verificar: execution ENQUEUED, outbox PUBLISHED, BullMQ 1 job (mismo jobId). |
| **Estado esperado**   | `job_executions`: 1 ENQUEUED. `job_outbox`: 1 PUBLISHED. BullMQ: 1 job lógico.                                                                                                                                                                                                  |
| **Queries finales**   | `SELECT status FROM job_executions WHERE id = $1` → ENQUEUED. `SELECT status FROM job_outbox WHERE job_execution_id = $1` → PUBLISHED.                                                                                                                                          |
| **Debe existir**      | 1 execution ENQUEUED, 1 outbox PUBLISHED                                                                                                                                                                                                                                        |
| **No debe existir**   | 0 FAILED, 0 outbox PENDING persistente, 0 BullMQ jobs duplicados                                                                                                                                                                                                                |
| **Condición binaria** | `execution.status = ENQUEUED AND outbox.status = PUBLISHED AND bullmq_jobs = 1`                                                                                                                                                                                                 |

### Escenario 6 — Redis reset

| Campo                 | Valor                                                                                                                                                                                                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**          | PostgreSQL conserva estado pese a pérdida de Redis                                                                                                                                                                                                                                        |
| **Capas**             | Job Registry (W2-06) + Reconciliation                                                                                                                                                                                                                                                     |
| **Entry point**       | Simular Redis FLUSHALL + reconciliation sweep                                                                                                                                                                                                                                             |
| **Conexiones**        | 1 tx para setup, reconciliation en misma tx                                                                                                                                                                                                                                               |
| **Failpoint**         | Ninguno (dataset directo)                                                                                                                                                                                                                                                                 |
| **Pasos**             | 1. Crear 3 executions: (a) PERMANENT COMPLETED, (b) ACTIVE_ONLY COMPLETED, (c) PENDING con outbox. 2. Simular Redis perdido. 3. Reconciliation cycle: (a) PERMANENT COMPLETED → no cambia. (b) ACTIVE_ONLY COMPLETED → no cambia (post-terminal). (c) PENDING sin outbox → recrea outbox. |
| **Estado esperado**   | (a) PERMANENT COMPLETED inmutable. (b) ACTIVE_ONLY COMPLETED inmutable. (c) PENDING con outbox restaurado.                                                                                                                                                                                |
| **Queries finales**   | `SELECT status FROM job_executions WHERE id = $1` → COMPLETED (para a y b). `SELECT status FROM job_outbox WHERE job_execution_id = $1` → PENDING (para c).                                                                                                                               |
| **Debe existir**      | PERMANENT COMPLETED, ACTIVE_ONLY COMPLETED, outbox republicado                                                                                                                                                                                                                            |
| **No debe existir**   | 0 cambio de estado post-terminal, 0 perdida de outbox                                                                                                                                                                                                                                     |
| **Condición binaria** | `permanent.status = COMPLETED AND active_only.status = COMPLETED AND pending_outbox.status != DISCARDED`                                                                                                                                                                                  |

### Escenario 7 — Ambigüedad externa (UNKNOWN)

| Campo                 | Valor                                                                                                                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objetivo**          | RUNNING → UNKNOWN → NEVER auto-recovery; resolution funciona                                                                                                                                                                                                                     |
| **Capas**             | Job Registry (W2-06) + UNKNOWN (W2-06D)                                                                                                                                                                                                                                          |
| **Entry point**       | JobRunner.run() con handler que timeout                                                                                                                                                                                                                                          |
| **Conexiones**        | 1 tx                                                                                                                                                                                                                                                                             |
| **Failpoint**         | `runner.before-complete` → callback expira token                                                                                                                                                                                                                                 |
| **Pasos**             | 1. Crear execution, enqueue, acquire lease. 2. Handler retorna completed, pero antes de complete() el token expira (vía failpoint). 3. complete() → fencing-rejected. 4. Mark UNKNOWN manualmente. 5. RecoverySweep → NO toca UNKNOWN. 6. resolveUnknownAsCompleted → COMPLETED. |
| **Estado esperado**   | Execution COMPLETED sin auto-recovery intermedio.                                                                                                                                                                                                                                |
| **Queries finales**   | `SELECT status FROM job_executions WHERE id = $1` → COMPLETED.                                                                                                                                                                                                                   |
| **Debe existir**      | 1 execution COMPLETED, 1 historical UNKNOWN evidence                                                                                                                                                                                                                             |
| **No debe existir**   | 0 recovery en UNKNOWN, 0 FAILED por recovery                                                                                                                                                                                                                                     |
| **Condición binaria** | `execution.status = COMPLETED AND execution.unknown_since IS NOT NULL AND execution.resolved_at IS NOT NULL`                                                                                                                                                                     |

### Escenario 8 — Aislamiento transversal

| Campo                 | Valor                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objetivo**          | Mismos IDs entre compañías no colisionan                                                                                                                                                                                                                                                                                                                                                               |
| **Capas**             | Todas (W2-03/04/05/06)                                                                                                                                                                                                                                                                                                                                                                                 |
| **Entry point**       | Operaciones paralelas en Tenant A y Tenant B                                                                                                                                                                                                                                                                                                                                                           |
| **Conexiones**        | 2 conexiones PG, una por tenant                                                                                                                                                                                                                                                                                                                                                                        |
| **Failpoint**         | Ninguno                                                                                                                                                                                                                                                                                                                                                                                                |
| **Pasos**             | 1. Tenant A: INSERT invoice con bill_number F001-1, idempotency key "key-A1". 2. Tenant B: INSERT invoice con bill_number F001-1, idempotency key "key-B1". 3. Ambas deben ser aceptadas (company_id distinto). 4. Crear job_execution con mismo logical_key en ambos tenants. 5. Verificar: 2 invoices, 2 idempotency records, 2 job executions. 6. Verificar: cada tenant solo ve sus propias filas. |
| **Estado esperado**   | 2 invoices (una por tenant), 2 idempotency records, 2 job executions.                                                                                                                                                                                                                                                                                                                                  |
| **Queries finales**   | `SELECT count(*) FROM invoices WHERE bill_number = 'F001-1'` → 2. `SELECT company_id FROM invoices WHERE bill_number = 'F001-1'` → [comp-a, comp-b].                                                                                                                                                                                                                                                   |
| **Debe existir**      | 2 filas por tabla, company_id correctos                                                                                                                                                                                                                                                                                                                                                                |
| **No debe existir**   | 0 filas con company_id incorrecto, 0 unique violation entre tenants                                                                                                                                                                                                                                                                                                                                    |
| **Condición binaria** | `invoices.count = 2 AND DISTINCT company_id.count = 2 AND no unique violations`                                                                                                                                                                                                                                                                                                                        |

### Escenario 9 — Rollback integral (4 subcasos)

#### 9a — Rollback HTTP (idempotency + aggregate)

| Campo            | Valor                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| **Frontera**     | Idempotency + aggregate comparten tx                                                 |
| **Failpoint**    | Crash post-INSERT idempotency, pre-INSERT invoice                                    |
| **Verificación** | `SELECT count(*) FROM idempotency_records` → 0. `SELECT count(*) FROM invoices` → 0. |
| **Condición**    | Rollback total: 0 filas en ambas tablas.                                             |

#### 9b — Rollback inbox (acquire → complete)

| Campo            | Valor                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Frontera**     | Inbox acquire + handler + complete en misma tx                                                     |
| **Failpoint**    | Crash post-acquire IN_PROGRESS, pre-COMPLETE                                                       |
| **Verificación** | `SELECT count(*) FROM inbox_messages WHERE status = 'COMPLETED'` → 0. El message sigue disponible. |
| **Condición**    | "inbox_messages no COMPLETED, PENDING original preservado".                                        |

#### 9c — Rollback job creation (execution + outbox)

| Campo            | Valor                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| **Frontera**     | job_executions + job_outbox en misma tx (SAVEPOINT)                               |
| **Failpoint**    | Crash post-INSERT job_execution, pre-INSERT job_outbox                            |
| **Verificación** | `SELECT count(*) FROM job_executions` → 0. `SELECT count(*) FROM job_outbox` → 0. |
| **Condición**    | Rollback total: 0 filas en job_executions, 0 en job_outbox.                       |

#### 9d — Rollback job execution (DB effect + completion)

| Campo            | Valor                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontera**     | DB effect + complete() en misma tx (cuando DB_ATOMIC)                                                                                                                                      |
| **Failpoint**    | Crash post-effect, pre-complete                                                                                                                                                            |
| **Verificación** | `SELECT count(*) FROM documents WHERE id = $1 AND status = 'processed'` → 0 (efecto revertido). `SELECT status FROM job_executions WHERE id = $1` → FAILED (lease expiró, recovery marcó). |
| **Condición**    | "DB effect revertido, execution FAILED (no COMPLETED)".                                                                                                                                    |

---

## 6. Fixtures directory structure

```
packages/persistence/src/repositories/__tests__/wave2/
├── fixtures/
│   ├── tenants.ts              ← TENANT_A, TENANT_B, orgIds, companyIds
│   ├── fiscal-operations.ts    ← INVOICE_A, invoice inputs, bill numbers
│   ├── messages.ts             ← EVENT_MSG, event types, payloads
│   └── jobs.ts                 ← SUNAT_JOB, OCR_JOB, REPORT_JOB, logical keys
├── helpers/
│   ├── wave2-test-context.ts   ← Wave2TestContext class with all repos
│   ├── cross-layer-assertions.ts ← assertExactlyOne*, assertNoOrphan*
│   ├── transaction-barriers.ts ← Failpoint wiring helpers
│   └── table-state-reader.ts   ← SQL query builders for all W2 tables
├── scenarios/
│   ├── duplicate-command.integration.test.ts
│   ├── natural-key-conflict.integration.test.ts
│   ├── outbox-consumer.integration.test.ts
│   ├── consumer-job.integration.test.ts
│   ├── relay-crash.integration.test.ts
│   ├── redis-reset.integration.test.ts
│   ├── external-unknown.integration.test.ts
│   ├── tenant-isolation.integration.test.ts
│   └── integral-rollback.integration.test.ts
└── wave2-gate.integration.test.ts    ← Gate final
```

---

## 7. Gate final de Wave 2 — Checklist automatizable

| #   | Condición                                    | Método de verificación                                                     | Responsable |
| --- | -------------------------------------------- | -------------------------------------------------------------------------- | ----------- |
| G1  | Tests PostgreSQL omitidos ejecutados y pasan | `bun test -- --DATABASE_URL_TEST=$URL`                                     | CI          |
| G2  | 3 fallos preexistentes corregidos o aislados | Issue tracker + `bun test <files>`                                         | Dev         |
| G3  | Migraciones fresh pasan                      | `psql -f 0022.sql ... 0023 ... 0024` en DB vacía                           | CI          |
| G4  | Migraciones upgrade pasan                    | Aplicar sobre base con estado W2-05 previo                                 | CI          |
| G5  | pg_catalog coincide con schemas declarados   | `psql -f verify-w2-06-pg_catalog.sql`                                      | CI          |
| G6  | W2-07 demuestra exactamente 1 efecto         | 9 escenarios ejecutados y pasan                                            | CI          |
| G7  | No imports productivos desde test-utils      | `grep -r "@drenyra/test-utils" packages/*/src --include="*.ts"`            | Static      |
| G8  | No `queue.add()` directo desde dominio       | `grep -r "queue\.add" packages/domain/src`                                 | Static      |
| G9  | No dedup crítica en memoria/Redis            | `grep -rn "new Map\|new Set" packages/domain/src packages/application/src` | Static      |
| G10 | No payloads/tokens completos en logs         | `grep -rn "executionToken\|payload" packages/persistence/src/logger/`      | Static      |

---

## 8. Pre-existing failures

| ID  | Archivo                                                                     | Causa                                                                                                  | Propietario                       | Estado    |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- | --------- |
| F1  | `packages/persistence/src/repositories/postgres-invoice.repository.test.ts` | `export 'client' not found in './client'` — el barrel de persistence no exporta `client` correctamente | Pre-W2-06                         | Pendiente |
| F2  | `packages/persistence/src/repositories/document.repository.test.ts`         | Mismo error `export 'client'`                                                                          | Pre-W2-06                         | Pendiente |
| F3  | `packages/persistence/src/repositories/__tests__/failure-harness.test.ts`   | `import 'client'` entre tests — error de módulo                                                        | Pre-W2-06 (arrastrado por barrel) | Pendiente |

**Evidencia de que no fueron introducidos por W2-06:** los tests existían antes de W2-06 y el error es en la resolución del barrel `./client`, no en ningún archivo de W2-06.

---

## 9. Criterio de aprobación de W2-07A

W2-07A queda aprobado cuando:

- [x] Los 9 escenarios tienen datos y asserts concretos (este documento)
- [x] Todas las fronteras transaccionales están identificadas (columna Failure mode)
- [x] Cada failpoint corresponde a un stage existente (todos usan stages de FailureProbe)
- [ ] No quedan expectativas ambiguas como “debería procesarse correctamente”
- [ ] El gate final puede ejecutarse como checklist automatizable (formato tabla)
- [ ] La estructura está lista para implementar (directorio + archivos especificados)
