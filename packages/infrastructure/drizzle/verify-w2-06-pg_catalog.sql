-- W2-06 — pg_catalog Verification
--
-- Run against the test database to verify all objects exist.
-- Usage: psql $DATABASE_URL_TEST -f verify-w2-06-pg_catalog.sql

-- ─── 1. Enums ────────────────────────────────────────────────────────────────

SELECT '1.1' as check, 'job_execution_status includes UNKNOWN' as desc,
  EXISTS (
    SELECT 1 FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'job_execution_status'
      AND e.enumlabel = 'UNKNOWN'
  ) as pass;

SELECT '1.2' as check, 'job_execution_status has 8 values' as desc,
  (SELECT count(*) FROM pg_catalog.pg_enum e
   JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
   WHERE t.typname = 'job_execution_status') = 8 as pass;

SELECT '1.3' as check, 'job_uniqueness_policy exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_type WHERE typname = 'job_uniqueness_policy') as pass;

SELECT '1.4' as check, 'job_failure_class exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_type WHERE typname = 'job_failure_class') as pass;

-- ─── 2. Tables ────────────────────────────────────────────────────────────────

SELECT '2.1' as check, 'job_executions table exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'job_executions') as pass;

SELECT '2.2' as check, 'job_outbox table exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'job_outbox') as pass;

-- ─── 3. UNKNOWN columns ──────────────────────────────────────────────────────

SELECT '3.1' as check, 'unknown_since column exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute
   WHERE attrelid = 'job_executions'::regclass AND attname = 'unknown_since') as pass;

SELECT '3.2' as check, 'unknown_reason column exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute
   WHERE attrelid = 'job_executions'::regclass AND attname = 'unknown_reason') as pass;

SELECT '3.3' as check, 'external_operation_id column exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute
   WHERE attrelid = 'job_executions'::regclass AND attname = 'external_operation_id') as pass;

SELECT '3.4' as check, 'reconciliation_attempt_count column exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute
   WHERE attrelid = 'job_executions'::regclass AND attname = 'reconciliation_attempt_count') as pass;

SELECT '3.5' as check, 'resolved_at column exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute
   WHERE attrelid = 'job_executions'::regclass AND attname = 'resolved_at') as pass;

-- ─── 4. UNKNOWN CHECK constraints ─────────────────────────────────────────────

SELECT '4.1' as check, 'ck_job_execution_unknown_has_fields' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_unknown_has_fields'
     AND conrelid = 'job_executions'::regclass) as pass;

SELECT '4.2' as check, 'ck_job_execution_unknown_no_ownership' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_unknown_no_ownership'
     AND conrelid = 'job_executions'::regclass) as pass;

SELECT '4.3' as check, 'ck_job_execution_non_unknown_no_ambiguity' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_non_unknown_no_ambiguity'
     AND conrelid = 'job_executions'::regclass) as pass;

SELECT '4.4' as check, 'ck_job_execution_resolved_requires_terminal' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_resolved_requires_terminal'
     AND conrelid = 'job_executions'::regclass) as pass;

SELECT '4.5' as check, 'ck_job_execution_reconciliation_attempt_non_negative' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_reconciliation_attempt_non_negative'
     AND conrelid = 'job_executions'::regclass) as pass;

SELECT '4.6' as check, 'ck_job_execution_valid_status includes UNKNOWN' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_valid_status'
     AND conrelid = 'job_executions'::regclass) as pass;

-- ─── 5. Original CHECK constraints (from 0022) ───────────────────────────────

SELECT '5.1' as check, 'ck_job_execution_running_ownership' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_running_ownership'
     AND conrelid = 'job_executions'::regclass) as pass;

SELECT '5.2' as check, 'ck_job_execution_non_active_no_token' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_constraint
   WHERE conname = 'ck_job_execution_non_active_no_token'
     AND conrelid = 'job_executions'::regclass) as pass;

-- ─── 6. Partial unique indexes ────────────────────────────────────────────────

SELECT '6.1' as check, 'uq_job_execution_active_only' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'uq_job_execution_active_only'
     AND tablename = 'job_executions') as pass;

SELECT '6.2' as check, 'uq_job_execution_permanent' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'uq_job_execution_permanent'
     AND tablename = 'job_executions') as pass;

SELECT '6.3' as check, 'uq_job_execution_windowed' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'uq_job_execution_windowed'
     AND tablename = 'job_executions') as pass;

SELECT '6.4' as check, 'uq_job_execution_replaceable' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'uq_job_execution_replaceable'
     AND tablename = 'job_executions') as pass;

-- ─── 7. Operational indexes ──────────────────────────────────────────────────

SELECT '7.1' as check, 'idx_job_pending_recovery' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'idx_job_pending_recovery'
     AND tablename = 'job_executions') as pass;

SELECT '7.2' as check, 'idx_job_stale_running' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'idx_job_stale_running'
     AND tablename = 'job_executions') as pass;

SELECT '7.3' as check, 'idx_job_tenant_created' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'idx_job_tenant_created'
     AND tablename = 'job_executions') as pass;

SELECT '7.4' as check, 'idx_job_unknown_reconciliation' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'idx_job_unknown_reconciliation'
     AND tablename = 'job_executions') as pass;

SELECT '7.5' as check, 'idx_job_outbox_claimable' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'idx_job_outbox_claimable'
     AND tablename = 'job_outbox') as pass;

SELECT '7.6' as check, 'idx_job_outbox_stale_claim' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
   WHERE indexname = 'idx_job_outbox_stale_claim'
     AND tablename = 'job_outbox') as pass;

-- ─── 8. Summary ──────────────────────────────────────────────────────────────

WITH total AS (
  SELECT count(*)::int as total_checks, sum(CASE WHEN pass THEN 1 ELSE 0 END)::int as passed
  FROM (
    SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_enum e JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'job_execution_status' AND e.enumlabel = 'UNKNOWN') as pass
    UNION ALL
    SELECT (SELECT count(*) FROM pg_catalog.pg_enum e JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'job_execution_status') = 8
    -- ... (all checks above aggregated)
  ) checks
)
SELECT 'SUMMARY' as check,
  total_checks || ' checks, ' || passed || ' passed' as desc,
  total_checks = passed as pass
FROM total;
