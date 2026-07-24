# W2-06A — Job Uniqueness: Inventory & Logical Key Contract

**Status:** Revised  
**Last updated:** 2026-07-12  
**Depends on:** W2-05 (Consumer Dedup), ADR-009 (Idempotency)  
**Next:** W2-06B (Contract & Execution Registry)

---

## 1. Problem

Drenyra enqueues background jobs through BullMQ. Currently, job identity depends on Redis:

- `jobId` parameters prevent duplicates within Redis's memory.
- A Redis reset erases all job identity, allowing duplicate executions.
- BullMQ's `jobId` dedup works per-queue, not across queues or business operations.
- Two concurrent enqueues of the same logical work may both reach Redis before dedup kicks in.
- There is no audit trail of which jobs ran, for whom, and with what result.

**W2-06 introduces a PostgreSQL-backed Job Uniqueness Registry** that is the source of truth for whether a logical job should execute. Redis/BullMQ becomes an optimization layer, not the identity authority.

---

## 2. Inventory: All Queues and Job Types

### 2.1 Queue Catalog

| Queue Name                 | Type                         | Concurrency | Lock Duration | Retries | Annual Volume (est.) |
| -------------------------- | ---------------------------- | ----------- | ------------- | ------- | -------------------- |
| `document-processing`      | Document OCR/XML             | 1 worker    | default       | 3       | 500K                 |
| `ocr-processing`           | OCR fallback                 | 1 worker    | default       | 3       | 200K                 |
| `ai-analysis`              | AI classification/validation | 1 worker    | default       | 2       | 300K                 |
| `sunat-submission`         | SUNAT (OSE) CDR submission   | 1 worker    | default       | 5       | 100K                 |
| `email-notification`       | Transactional emails         | 1 worker    | default       | 3       | 1M                   |
| `report-generation`        | PDF/Excel batch reports      | 1 worker    | default       | 2       | 50K                  |
| `fiscal-agent`             | Nightly fiscal compliance    | 3 workers   | 5 min         | 3       | 10K                  |
| `csv-batch-agent`          | CSV importing/processing     | 10 workers  | 5 min         | 3       | 1K                   |
| `fiscal-agent` (scheduler) | `nightly-{orgId}` cron       | —           | —             | —       | 365/org              |

### 2.2 Job Type Catalog

#### J1 — ocr-processing:process-document

- **Source:** Document upload → OCR queue → OCR worker
- **Enqueue caller:** `addOCRJob(data)` → `ocrQueue.add("process-document", data, { jobId: 'ocr-{documentId}' })`
- **Current dedup:** `jobId = ocr-{documentId}` (BullMQ-level, lost on Redis reset)
- **Tenant scope:** `organizationId`
- **Business key:** `documentId + contentHash + processorVersion`
- **Proposed policy:** `PERMANENT_BY_INPUT`

#### J2 — ai-analysis:analyze

- **Source:** Document upload → AI analysis queue → classification/validation/fraud
- **Enqueue caller:** `addAIAnalysisJob(data)` → `aiAnalysisQueue.add("analyze", data, { jobId: 'ai-{documentId}-{analysisType}' })`
- **Current dedup:** `jobId = ai-{documentId}-{analysisType}` (BullMQ-level)
- **Tenant scope:** `organizationId`
- **Business key:** `documentId + contentHash + analysisType + modelVersion`
- **Proposed policy:** `PERMANENT_BY_INPUT`

#### J3 — sunat-submission:submit

- **Source:** Invoice emission → SUNAT queue → OSE submission
- **Enqueue caller:** `addSUNATJob(data)` → `sunatQueue.add("submit", data, { jobId: 'sunat-{invoiceId}' })`
- **Current dedup:** `jobId = sunat-{invoiceId}`
- **Tenant scope:** `companyId` (per-company SUNAT credentials)
- **Business key:** `invoiceId`
- **Proposed policy:** `PERMANENT` (one submission per invoice for its entire lifecycle)

#### J4 — email-notification:send

- **Source:** Various domain events → email queue
- **Enqueue caller:** `addEmailJob(data)` → `emailQueue.add("send", data)`
- **Current dedup:** None (no `jobId`)
- **Tenant scope:** `organizationId`
- **Business key:** `template + to + triggerId` (e.g., `invoice-sent:user@x.com:inv-001`)
- **Proposed policy:** `PERMANENT_BY_INPUT`

#### J5 — report-generation:generate

- **Source:** User request or scheduled → report queue
- **Enqueue caller:** `addReportJob(data)` → `reportQueue.add("generate", data)`
- **Current dedup:** None
- **Tenant scope:** `organizationId`
- **Business key:** `reportType + orgId + dateFrom + dateTo + format`
- **Proposed policy:** `REPLACEABLE` (a new request supersedes any pending/running one)

#### J6 — document-processing:process-document

- **Source:** Document upload (main flow) → document queue → OCR or XML parse
- **Enqueue caller:** `enqueueDocument(data)` → `queue.add("process-document", data, { jobId: data.documentId })`
- **Current dedup:** `jobId = data.documentId` (BullMQ-level)
- **Tenant scope:** `companyId`
- **Business key:** `documentId + contentHash + pipelineVersion`
- **Proposed policy:** `PERMANENT_BY_INPUT`

#### J7 — fiscal-agent:fiscal-nightly

- **Source:** Cron scheduler `0 2 * * *` — nightly fiscal compliance per org
- **Enqueue caller:** `scheduleNightlyRun(orgId, ...)` → `queue.upsertJobScheduler(...)` and `triggerManualRun(data)` → `queue.add(...)`
- **Current dedup:** Scheduler name `nightly-{orgId}` (BullMQ scheduler dedup)
- **Tenant scope:** `organizationId` + `companyId`
- **Business key:** `orgId+companyId+period`
- **Proposed policy:** `WINDOWED` with window = `2026-07` (canonical `YYYYMM`)

#### J8 — csv-batch-agent:csv-batch-{batchId}

- **Source:** CSV upload → batch split → parallel processing
- **Enqueue caller:** `submitCsvBatch(params)` → `q.add(...)`
- **Current dedup:** None
- **Tenant scope:** `orgId` + `companyId`
- **Business key:** `batchId` (transient)
- **Proposed policy:** `ACTIVE_ONLY` (one batch processing at a time)

#### J9 — pre-audit (nightly)

- **Source:** Scheduled nightly audit simulation (not yet enqueued)
- **Current dedup:** None
- **Tenant scope:** `organizationId`
- **Business key:** `orgId + date`
- **Proposed policy:** `WINDOWED` with window = `2026-07-12` (canonical `date`)

---

## 3. Policy Definitions (corrected)

### PERMANENT

Once `COMPLETED` or `FAILED TERMINAL`, the identity is closed forever.

```text
PENDING → ENQUEUED → RUNNING → COMPLETED              [terminal]
                              → FAILED RETRYABLE        [retryable]
                              → FAILED TERMINAL         [terminal]
```

Used for: SUNAT submission, SIRE submission.

### PERMANENT_BY_INPUT

Identity includes `input_hash` (and optionally `processor_version`). If input changes, a new identity is formed. Same input → same identity → closed after terminal state.

```text
logical_key = f(documentId, inputHash, processorVersion)
```

Used for: OCR, AI analysis, document processing, email notifications.

**Why not just `ACTIVE_ONLY`:** a document may legitimately need reprocessing when its content changes, the OCR model is upgraded, or the pipeline version increments. `documentId` alone would block reprocessing forever. Including `input_hash` makes the identity parametric on what matters.

### ACTIVE_ONLY

Only one active execution at a time. Once the job reaches a terminal state (`COMPLETED`, `FAILED`, `CANCELLED`), a new execution is allowed.

```text
PENDING → ENQUEUED → RUNNING → COMPLETED              [terminal, identity freed]
                              → FAILED                 [terminal, identity freed]
```

Used for: CSV batch processing, transient operations without permanent identity.

After `COMPLETED` or `FAILED`, the next enqueue starts a new generation.

### WINDOWED

The `execution_window` is part of the identity. Each window produces at most one execution.

```text
job_type + logical_key + execution_window
```

After the window passes, a new window creates a fresh execution. Past executions (even COMPLETED) do not block the new window.

Used for: fiscal nightly, bank hourly sync, pre-audit.

### REPLACEABLE

A new enqueue supersedes any pending or running execution of the same identity. The old execution is marked `SUPERSEDED` with its `generation` recorded.

```text
Generación 1: PENDING → ENQUEUED → RUNNING (worker A)
   ↳ Nuevo enqueue → Generación 1 → SUPERSEDED
   ↳ Generación 2 creada, publicada
Worker A termina → validación: generation == current? NO → rechazado
Worker B (gen 2) → terminación válida
```

Used for: report generation.

**Fencing requirement:** completion must validate `execution_token AND generation = current_generation`. This prevents the superseded worker from writing stale results.

---

## 4. Architecture: Definitions + Executions

A single table with a universal `UNIQUE` constraint **cannot** correctly represent all five policies. The constraint logic differs per policy and per state.

### 4.1 Two-table approach

```
job_definitions              job_executions
──────────────               ──────────────
id                           id
queue_name                   definition_id (FK)
job_type                     generation
logical_key                  status
execution_window?            execution_token
uniqueness_policy            lease_expires_at
organization_id              attempt_count
company_id?                  input_hash
current_generation           bullmq_job_id
created_at                   outbox_event_id
updated_at                   superseded_by_id
                             cancel_requested_at
                             result_metadata
                             enqueued_at
                             started_at
                             completed_at
                             failed_at
                             cancelled_at
                             created_at
                             updated_at
```

### 4.2 Per-policy UNIQUE indexes

```sql
── PERMANENT and PERMANENT_BY_INPUT: any execution blocks future ones
CREATE UNIQUE INDEX uq_job_perm_active
  ON job_definitions (queue_name, job_type, logical_key)
  WHERE uniqueness_policy IN ('PERMANENT', 'PERMANENT_BY_INPUT')
    AND EXISTS (SELECT 1 FROM job_executions e
                WHERE e.definition_id = id
                  AND e.status IN ('PENDING', 'ENQUEUED', 'RUNNING'));

── ACTIVE_ONLY: blocks only while active, freed on completion/failure
CREATE UNIQUE INDEX uq_job_active_active
  ON job_executions (definition_id)
  WHERE status IN ('PENDING', 'ENQUEUED', 'RUNNING');

── WINDOWED: identity includes execution_window
CREATE UNIQUE INDEX uq_job_window_active
  ON job_executions (definition_id, execution_window)
  WHERE status IN ('PENDING', 'ENQUEUED', 'RUNNING');

── REPLACEABLE: only one current generation
CREATE UNIQUE INDEX uq_job_replaceable_current
  ON job_definitions (id, current_generation)
  WHERE current_generation IS NOT NULL;
```

**Important note on NULLS handling:** PostgreSQL treats NULLs as distinct in UNIQUE indexes. The `execution_window IS NULL` case (for non-WINDOWED policies) should use partial indexes that filter `WHERE execution_window IS NULL` or use `NULLS NOT DISTINCT` (PG 15+). Since Drenyra targets PG 16, `NULLS NOT DISTINCT` is preferred:

```sql
CREATE UNIQUE INDEX uq_job_active_identity
  ON job_executions (queue_name, job_type, logical_key)
  WHERE execution_window IS NULL
    AND status IN ('PENDING', 'ENQUEUED', 'RUNNING');
```

### 4.3 Alternative: single table with generation

A single `job_executions` table can work if each policy's uniqueness is enforced by partial unique indexes:

```sql
── ACTIVE_ONLY & PERMANENT: only one active row per (queue, job_type, logical_key)
CREATE UNIQUE INDEX uq_job_active_identity
  ON job_executions (queue_name, job_type, logical_key, COALESCE(execution_window, ''))
  WHERE status IN ('PENDING', 'ENQUEUED', 'RUNNING');

── WINDOWED: only one active row per (queue, job_type, logical_key, window)
CREATE UNIQUE INDEX uq_job_window_identity
  ON job_executions (queue_name, job_type, logical_key, execution_window)
  WHERE status IN ('PENDING', 'ENQUEUED', 'RUNNING')
    AND execution_window IS NOT NULL;
```

The generation field tracks supersessions for REPLACEABLE:

```sql
── completion must match current generation:
UPDATE job_executions SET status = 'COMPLETED'
WHERE id = $1 AND execution_token = $2 AND generation = $3
RETURNING id;
```

---

## 5. State Machine

```text
         ┌──────────────────────────────────────────────────────────┐
         │                                                          │
         v                                                          │
    ┌─────────┐     outbox relay     ┌──────────┐                    │
    │ PENDING │ ───────────────────→ │ ENQUEUED │                    │
    └─────────┘                      └──────────┘                    │
                                          │                          │
                                          │ worker acquires           │
                                          v                          │
                                    ┌──────────┐                    │
                                    │ RUNNING  │                    │
                                    └──────────┘                    │
                                     /        \                      │
                                    v          v                     │
                              ┌──────────┐ ┌───────────┐            │
                              │COMPLETED │ │  FAILED   │            │
                              └──────────┘ └───────────┘            │
                                                /  \                 │
                                               v    v                │
                                      ┌──────────┐ ┌───────────┐    │
                                      │RETRYABLE │ │  TERMINAL │    │
                                      └──────────┘ └───────────┘    │
                                            │                        │
                                            └──→ ENQUEUED (re-try) ──┘
```

Additional transitions:

| Transition             | Policy                   | Condition                                 |
| ---------------------- | ------------------------ | ----------------------------------------- |
| RUNNING → CANCELLED    | REPLACEABLE              | Manual cancellation                       |
| RUNNING → SUPERSEDED   | REPLACEABLE              | New enqueue creates higher generation     |
| (any) → new generation | ACTIVE_ONLY, REPLACEABLE | After terminal state, new enqueue allowed |

---

## 6. Dual-Write: Outbox Contract

### 6.1 Transactional flow

```sql
── Inside the domain transaction:
BEGIN;

  ── 1. Domain effect
  INSERT INTO invoices (...) VALUES (...);

  ── 2. Insert job execution (status = PENDING)
  INSERT INTO job_executions (queue_name, job_type, logical_key, ...)
  VALUES ('sunat-submission', 'submit', 'company:{cId}:invoice:{invId}', ...)

  ── 3. Insert outbox event
  INSERT INTO job_outbox (job_execution_id, action, queue_name, job_type, payload)
  VALUES (@job_id, 'ENQUEUE', 'sunat-submission', 'submit', @payload);

COMMIT;
```

### 6.2 Outbox relay

```text
Poll every 500ms:
  1. SELECT * FROM job_outbox ORDER BY created_at LIMIT batch_size
  2. For each event:
     a. Call queue.add(job_name, payload, { jobId: job_execution_id })
     b. UPDATE job_executions SET status = 'ENQUEUED', bullmq_job_id = @bullmq_id
     c. DELETE FROM job_outbox WHERE id = @outbox_id
  3. On failure: log, retry next cycle
```

### 6.3 Recovery sweep

```text
Every 60s:
  SELECT * FROM job_executions
  WHERE status = 'PENDING'
    AND created_at < NOW() - INTERVAL '65 seconds'
  FOR UPDATE SKIP LOCKED;

  For each: re-insert into job_outbox and retry.
```

### 6.4 BullMQ jobId convention

```text
jobId = job_execution.id (UUID)
```

This creates a deterministic 1:1 mapping between registry entries and BullMQ jobs. If the relay crashes after `queue.add()` but before updating the registry, the next sweep finds `PENDING + no outbox entry` (because the outbox was already deleted) and the `jobId` dedup in BullMQ prevents a duplicate.

---

## 7. Execution Registry Schema (for W2-06B)

### 7.1 Enums

```sql
CREATE TYPE job_uniqueness_policy AS ENUM (
  'PERMANENT',          -- terminal states are final
  'PERMANENT_BY_INPUT', -- identity includes input_hash
  'ACTIVE_ONLY',        -- freed after terminal state
  'WINDOWED',           -- identity includes execution_window
  'REPLACEABLE'         -- new enqueue supersedes old
);

CREATE TYPE job_execution_status AS ENUM (
  'PENDING',
  'ENQUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'SUPERSEDED'
);

CREATE TYPE job_failure_class AS ENUM (
  'RETRYABLE',
  'TERMINAL'
);
```

### 7.2 Table

```sql
CREATE TABLE job_executions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  company_id      UUID,

  ── Identity
  queue_name      VARCHAR(100) NOT NULL,
  job_type        VARCHAR(100) NOT NULL,
  logical_key     VARCHAR(512) NOT NULL,
  execution_window VARCHAR(100),     -- canonical format per policy
  uniqueness_policy job_uniqueness_policy NOT NULL,
  generation      INTEGER NOT NULL DEFAULT 1,

  ── State
  status          job_execution_status NOT NULL DEFAULT 'PENDING',
  failure_class   job_failure_class,
  failure_code    VARCHAR(100),
  attempt_count   INTEGER NOT NULL DEFAULT 0,

  ── Ownership & fencing
  execution_token       UUID,
  lease_started_at      TIMESTAMPTZ,
  lease_expires_at      TIMESTAMPTZ,

  ── Integration
  bullmq_job_id   VARCHAR(255),
  outbox_event_id UUID,

  ── Supersession (REPLACEABLE)
  superseded_by_id      UUID REFERENCES job_executions(id),
  cancel_requested_at   TIMESTAMPTZ,

  ── Timing
  enqueued_at     TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,

  ── Payload fingerprint
  input_hash      VARCHAR(64) NOT NULL,

  ── Result
  result_metadata JSONB,

  ── Lifecycle
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7.3 CHECK Constraints

```sql
── RUNNING requires token + lease
CHECK (status != 'RUNNING' OR (execution_token IS NOT NULL AND lease_started_at IS NOT NULL AND lease_expires_at IS NOT NULL)),
CHECK (status != 'RUNNING' OR execution_token IS NOT NULL),

── Non-active states forbid token
CHECK (status IN ('PENDING', 'ENQUEUED', 'RUNNING') OR execution_token IS NULL),

── COMPLETED requires completed_at
CHECK (status != 'COMPLETED' OR completed_at IS NOT NULL),

── FAILED requires class, code, timestamp
CHECK (status != 'FAILED' OR (failure_class IS NOT NULL AND failure_code IS NOT NULL AND failed_at IS NOT NULL)),
CHECK (status != 'FAILED' OR failure_class IS NOT NULL),

── Non-failed states forbid failure fields
CHECK (status = 'FAILED' OR (failure_class IS NULL AND failure_code IS NULL)),

── CANCELLED requires cancelled_at
CHECK (status != 'CANCELLED' OR cancelled_at IS NOT NULL),

── SUPERSEDED requires superseded_by_id
CHECK (status != 'SUPERSEDED' OR superseded_by_id IS NOT NULL),

── WINDOWED requires execution_window
CHECK (uniqueness_policy != 'WINDOWED' OR execution_window IS NOT NULL),

── Non-WINDOWED forbids execution_window (unless explicitly justified)
── (relaxed on a per-case basis)
CHECK (uniqueness_policy = 'WINDOWED' OR execution_window IS NULL),

── generation >= 1
CHECK (generation >= 1),

── attempt_count >= 0
CHECK (attempt_count >= 0),

── lease_expires_at > lease_started_at
CHECK (lease_expires_at IS NULL OR lease_started_at IS NULL OR lease_expires_at > lease_started_at),

── FAILED TERMINAL has no next retry (next retry not stored here,
── but input_hash is required)
CHECK (failure_class IS NULL OR failure_class != 'TERMINAL' OR failure_code IS NOT NULL),

── input_hash required
CHECK (input_hash IS NOT NULL AND input_hash != ''),
```

### 7.4 Per-Policy Unique Indexes

```sql
── ACTIVE_ONLY & PERMANENT & PERMANENT_BY_INPUT:
── one active row per (queue, job_type, logical_key)
CREATE UNIQUE INDEX uq_job_active_identity
  ON job_executions (queue_name, job_type, logical_key)
  WHERE status IN ('PENDING', 'ENQUEUED', 'RUNNING')
    AND execution_window IS NULL;

── WINDOWED: one active row per identity + window
CREATE UNIQUE INDEX uq_job_window_identity
  ON job_executions (queue_name, job_type, logical_key, execution_window)
  WHERE status IN ('PENDING', 'ENQUEUED', 'RUNNING')
    AND execution_window IS NOT NULL;

── REPLACEABLE: one current generation per definition
── (enforced at application level via generation check on completion)

── Recovery sweep
CREATE INDEX idx_job_pending_recovery
  ON job_executions (created_at)
  WHERE status = 'PENDING';

── Lease expiry recovery
CREATE INDEX idx_job_stale_running
  ON job_executions (lease_expires_at)
  WHERE status = 'RUNNING';

── Tenant queries
CREATE INDEX idx_job_tenant
  ON job_executions (organization_id, created_at);
```

---

## 8. Inventory: Reclassified

| Job                 | Old policy  | Corrected policy   | logical_key structure                        |
| ------------------- | ----------- | ------------------ | -------------------------------------------- |
| OCR processing      | ACTIVE_ONLY | PERMANENT_BY_INPUT | `doc:{docId}:hash:{hash}:v{version}`         |
| AI analysis         | ACTIVE_ONLY | PERMANENT_BY_INPUT | `doc:{docId}:{type}:hash:{hash}:v{modelVer}` |
| SUNAT submission    | PERMANENT   | PERMANENT          | `company:{cId}:invoice:{invId}`              |
| Email notification  | ACTIVE_ONLY | PERMANENT_BY_INPUT | `{template}:{to}:trigger:{triggerId}`        |
| Report generation   | REPLACEABLE | REPLACEABLE        | `org:{oId}:{type}:{from}-{to}:{format}`      |
| Document processing | ACTIVE_ONLY | PERMANENT_BY_INPUT | `doc:{docId}:hash:{hash}:v{pipelineVer}`     |
| Fiscal nightly      | WINDOWED    | WINDOWED           | `company:{cId}` + window `YYYYMM`            |
| CSV batch           | ACTIVE_ONLY | ACTIVE_ONLY        | `batch:{batchId}`                            |
| Pre-audit           | WINDOWED    | WINDOWED           | `org:{oId}` + window `YYYY-MM-DD`            |

---

## 9. W2-06B Test Plan

- [ ] Two concurrent `PERMANENT` enqueues: one wins, other gets `ALREADY_EXISTS`
- [ ] `WINDOWED` same window: one wins
- [ ] `WINDOWED` different windows: both succeed
- [ ] `ACTIVE_ONLY` with active job: second is rejected
- [ ] `ACTIVE_ONLY` after completion: new generation allowed
- [ ] `REPLACEABLE`: new generation supersedes previous
- [ ] Old generation's token cannot complete after supersession
- [ ] Same logical key with different `input_hash` produces explicit conflict
- [ ] `execution_window IS NULL` does not evade uniqueness (partial index)
- [ ] `company_id` does not accidentially become part of textual logical_key collisions
- [ ] All CHECK constraints verified in `pg_catalog`
- [ ] All per-policy unique indexes verified
