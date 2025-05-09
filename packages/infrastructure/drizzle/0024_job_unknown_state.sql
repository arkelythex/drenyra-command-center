-- W2-06D — UNKNOWN State for External Ambiguity
--
-- Adds UNKNOWN execution status for jobs whose effect on an external system
-- cannot be determined (timeout after HTTP send, ambiguous provider response).
--
-- UNKNOWN is a first-class state with:
--   - Reconciliation-driven resolution (no auto-retry)
--   - Historical preservation of ambiguity evidence
--   - Separate recovery-sweep exemption
--
-- Related:
--   packages/persistence/src/schema/job-executions.schema.ts
--   packages/persistence/src/repositories/postgres-job-execution.repository.ts
--

-- ─── Enum extension ─────────────────────────────────────────────────────────

ALTER TYPE "public"."job_execution_status" ADD VALUE IF NOT EXISTS 'UNKNOWN';
--> statement-breakpoint

-- ─── New columns for UNKNOWN state management ──────────────────────────────

ALTER TABLE "job_executions"
  ADD COLUMN IF NOT EXISTS "unknown_since" TIMESTAMPTZ;
--> statement-breakpoint

ALTER TABLE "job_executions"
  ADD COLUMN IF NOT EXISTS "unknown_reason" VARCHAR(255);
--> statement-breakpoint

ALTER TABLE "job_executions"
  ADD COLUMN IF NOT EXISTS "external_operation_id" VARCHAR(255);
--> statement-breakpoint

ALTER TABLE "job_executions"
  ADD COLUMN IF NOT EXISTS "reconciliation_attempt_count" INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint

ALTER TABLE "job_executions"
  ADD COLUMN IF NOT EXISTS "last_reconciled_at" TIMESTAMPTZ;
--> statement-breakpoint

ALTER TABLE "job_executions"
  ADD COLUMN IF NOT EXISTS "next_reconciliation_at" TIMESTAMPTZ;
--> statement-breakpoint

ALTER TABLE "job_executions"
  ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMPTZ;
--> statement-breakpoint

-- ─── CHECK constraints ────────────────────────────────────────────────────────

-- UNKNOWN requires unknown_since and unknown_reason
ALTER TABLE "job_executions"
  ADD CONSTRAINT "ck_job_execution_unknown_has_fields"
  CHECK (
    status != 'UNKNOWN'
    OR (
      unknown_since IS NOT NULL
      AND unknown_reason IS NOT NULL
      AND unknown_reason != ''
    )
  );
--> statement-breakpoint

-- UNKNOWN forbids execution_token and lease (ownership cleared on entry)
ALTER TABLE "job_executions"
  ADD CONSTRAINT "ck_job_execution_unknown_no_ownership"
  CHECK (
    status != 'UNKNOWN'
    OR (
      execution_token IS NULL
      AND lease_started_at IS NULL
      AND lease_expires_at IS NULL
    )
  );
--> statement-breakpoint

-- Non-UNKNOWN active states forbid UNKNOWN-specific fields.
-- Historical evidence (unknown_since, unknown_reason, external_operation_id)
-- is preserved after resolution — they remain as audit trail.
ALTER TABLE "job_executions"
  ADD CONSTRAINT "ck_job_execution_non_unknown_no_ambiguity"
  CHECK (
    status = 'UNKNOWN'
    OR resolved_at IS NOT NULL
    OR (
      unknown_since IS NULL
      AND unknown_reason IS NULL
      AND external_operation_id IS NULL
    )
  );
--> statement-breakpoint

-- resolved_at requires status UNKNOWN or terminal
ALTER TABLE "job_executions"
  ADD CONSTRAINT "ck_job_execution_resolved_requires_terminal"
  CHECK (
    resolved_at IS NULL
    OR status IN ('UNKNOWN', 'COMPLETED', 'FAILED')
  );
--> statement-breakpoint

-- COMPLETED from UNKNOWN requires completed_at and resolved_at
ALTER TABLE "job_executions"
  ADD CONSTRAINT "ck_job_execution_unknown_completed_has_timestamps"
  CHECK (
    NOT (status = 'COMPLETED' AND resolved_at IS NOT NULL)
    OR completed_at IS NOT NULL
  );
--> statement-breakpoint

-- FAILED from UNKNOWN requires failure fields and resolved_at
ALTER TABLE "job_executions"
  ADD CONSTRAINT "ck_job_execution_unknown_failed_has_fields"
  CHECK (
    NOT (status = 'FAILED' AND resolved_at IS NOT NULL)
    OR (failure_class IS NOT NULL AND failure_code IS NOT NULL AND failed_at IS NOT NULL)
  );
--> statement-breakpoint

-- reconciliation_attempt_count >= 0
ALTER TABLE "job_executions"
  ADD CONSTRAINT "ck_job_execution_reconciliation_attempt_non_negative"
  CHECK (reconciliation_attempt_count >= 0);
--> statement-breakpoint

-- UNKNOWN was already added to the status check constraint.
-- Drop and recreate to include the new value.
ALTER TABLE "job_executions" DROP CONSTRAINT IF EXISTS "ck_job_execution_valid_status";
--> statement-breakpoint

ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_valid_status"
  CHECK (status IN ('PENDING', 'ENQUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'SUPERSEDED', 'UNKNOWN'));
--> statement-breakpoint

-- ─── Index for reconciliation sweep ───────────────────────────────────────────

-- Find UNKNOWN executions that need reconciliation
CREATE INDEX IF NOT EXISTS "idx_job_unknown_reconciliation"
  ON "job_executions" ("next_reconciliation_at")
  WHERE "status" = 'UNKNOWN' AND "resolved_at" IS NULL;
--> statement-breakpoint


