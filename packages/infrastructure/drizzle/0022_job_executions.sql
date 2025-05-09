-- W2-06B — Job Executions Table
--
-- PostgreSQL-backed Job Uniqueness Registry. Source of truth for whether
-- a logical job should execute. BullMQ becomes an optimization layer.
--
-- Per-policy uniqueness:
--   ACTIVE_ONLY:  blocks while PENDING/ENQUEUED/RUNNING
--   PERMANENT:    blocks after COMPLETED/FAILED_TERMINAL too (only SUPERSEDED frees)
--   PERMANENT_BY_INPUT: same as PERMANENT; input_hash in logical_key distinguishes
--   WINDOWED:     identity includes execution_window
--   REPLACEABLE:  creation supersedes previous generation
--
-- Related:
--   packages/persistence/src/schema/job-executions.schema.ts
--   docs/adr/W2-06A-job-uniqueness-inventory.md
--

-- Enums
CREATE TYPE "public"."job_uniqueness_policy" AS ENUM(
  'PERMANENT',
  'PERMANENT_BY_INPUT',
  'ACTIVE_ONLY',
  'WINDOWED',
  'REPLACEABLE'
);
--> statement-breakpoint

CREATE TYPE "public"."job_execution_status" AS ENUM(
  'PENDING',
  'ENQUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'SUPERSEDED'
);
--> statement-breakpoint

CREATE TYPE "public"."job_failure_class" AS ENUM(
  'RETRYABLE',
  'TERMINAL'
);
--> statement-breakpoint

-- Main table
CREATE TABLE IF NOT EXISTS "job_executions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant scope (part of physical identity, prevents cross-tenant collision)
  "organization_id" UUID NOT NULL,
  "company_id" UUID,

  -- Identity
  "queue_name" VARCHAR(100) NOT NULL,
  "job_type" VARCHAR(100) NOT NULL,
  "logical_key" VARCHAR(512) NOT NULL,
  "execution_window" VARCHAR(100),
  "uniqueness_policy" "job_uniqueness_policy" NOT NULL,
  "generation" INTEGER NOT NULL DEFAULT 1,

  -- State
  "status" "job_execution_status" NOT NULL DEFAULT 'PENDING',
  "failure_class" "job_failure_class",
  "failure_code" VARCHAR(100),
  "attempt_count" INTEGER NOT NULL DEFAULT 0,

  -- Ownership & fencing
  "execution_token" UUID,
  "lease_started_at" TIMESTAMPTZ,
  "lease_expires_at" TIMESTAMPTZ,

  -- Integration
  "bullmq_job_id" VARCHAR(255),
  "outbox_event_id" UUID,

  -- Supersession (REPLACEABLE)
  "superseded_by_id" UUID REFERENCES "job_executions"("id"),
  "cancel_requested_at" TIMESTAMPTZ,

  -- Timing
  "enqueued_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "failed_at" TIMESTAMPTZ,
  "cancelled_at" TIMESTAMPTZ,

  -- Payload fingerprint
  "input_hash" VARCHAR(64) NOT NULL,

  -- Result
  "result_metadata" JSONB,

  -- Lifecycle
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

-- ─── CHECK constraints ──────────────────────────────────────────────────────

-- Status must be a valid enum value
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_valid_status"
  CHECK (status IN ('PENDING', 'ENQUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'SUPERSEDED'));
--> statement-breakpoint

-- RUNNING requires token + lease + start
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_running_ownership"
  CHECK (
    status != 'RUNNING'
    OR (execution_token IS NOT NULL AND lease_started_at IS NOT NULL AND lease_expires_at IS NOT NULL)
  );
--> statement-breakpoint

-- Non-active states forbid token (SUPERSEDED also requires no token)
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_non_active_no_token"
  CHECK (
    status IN ('PENDING', 'ENQUEUED', 'RUNNING')
    OR execution_token IS NULL
  );
--> statement-breakpoint

-- COMPLETED requires completed_at
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_completed_has_timestamp"
  CHECK (
    status != 'COMPLETED'
    OR completed_at IS NOT NULL
  );
--> statement-breakpoint

-- FAILED requires class, code, timestamp
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_failed_has_fields"
  CHECK (
    status != 'FAILED'
    OR (failure_class IS NOT NULL AND failure_code IS NOT NULL AND failed_at IS NOT NULL)
  );
--> statement-breakpoint

-- Non-failed states forbid failure fields
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_non_failed_no_failure"
  CHECK (
    status = 'FAILED'
    OR (failure_class IS NULL AND failure_code IS NULL)
  );
--> statement-breakpoint

-- CANCELLED requires cancelled_at
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_cancelled_has_timestamp"
  CHECK (
    status != 'CANCELLED'
    OR cancelled_at IS NOT NULL
  );
--> statement-breakpoint

-- SUPERSEDED requires superseded_by_id
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_superseded_link"
  CHECK (
    status != 'SUPERSEDED'
    OR superseded_by_id IS NOT NULL
  );
--> statement-breakpoint

-- WINDOWED requires execution_window
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_window_required"
  CHECK (
    uniqueness_policy != 'WINDOWED'
    OR execution_window IS NOT NULL
  );
--> statement-breakpoint

-- Non-WINDOWED forbids execution_window
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_non_window_no_window"
  CHECK (
    uniqueness_policy = 'WINDOWED'
    OR execution_window IS NULL
  );
--> statement-breakpoint

-- generation >= 1
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_generation_positive"
  CHECK (generation >= 1);
--> statement-breakpoint

-- attempt_count >= 0
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_attempt_count_non_negative"
  CHECK (attempt_count >= 0);
--> statement-breakpoint

-- lease_end > lease_start (if both set)
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_lease_coherent"
  CHECK (
    lease_expires_at IS NULL
    OR lease_started_at IS NULL
    OR lease_expires_at > lease_started_at
  );
--> statement-breakpoint

-- input_hash required and non-empty
ALTER TABLE "job_executions" ADD CONSTRAINT "ck_job_execution_input_hash_required"
  CHECK (input_hash IS NOT NULL AND input_hash != '');
--> statement-breakpoint

-- ─── Per-policy UNIQUE indexes ─────────────────────────────────────────────

-- ACTIVE_ONLY: blocks only while active (PENDING, ENQUEUED, RUNNING)
-- Once COMPLETED/FAILED/CANCELLED/SUPERSEDED, a new execution is allowed.
CREATE UNIQUE INDEX "uq_job_execution_active_only"
  ON "job_executions" ("queue_name", "job_type", "logical_key", "organization_id", COALESCE("company_id", '00000000-0000-0000-0000-000000000000'))
  WHERE "uniqueness_policy" = 'ACTIVE_ONLY'
    AND "status" IN ('PENDING', 'ENQUEUED', 'RUNNING');
--> statement-breakpoint

-- PERMANENT and PERMANENT_BY_INPUT: identity is locked even after COMPLETED/FAILED.
-- Only SUPERSEDED frees the identity (the old execution is replaced).
CREATE UNIQUE INDEX "uq_job_execution_permanent"
  ON "job_executions" ("queue_name", "job_type", "logical_key", "organization_id", COALESCE("company_id", '00000000-0000-0000-0000-000000000000'))
  WHERE "uniqueness_policy" IN ('PERMANENT', 'PERMANENT_BY_INPUT')
    AND "status" != 'SUPERSEDED';
--> statement-breakpoint

-- WINDOWED: one identity per window.
-- Once per window semantics — COMPLETED/FAILED also block within the window.
CREATE UNIQUE INDEX "uq_job_execution_windowed"
  ON "job_executions" ("queue_name", "job_type", "logical_key", "execution_window", "organization_id", COALESCE("company_id", '00000000-0000-0000-0000-000000000000'))
  WHERE "uniqueness_policy" = 'WINDOWED'
    AND "execution_window" IS NOT NULL;
--> statement-breakpoint

-- REPLACEABLE: uniqueness within active states + non-SUPERSEDED.
-- The generation mechanism handles supersession.
CREATE UNIQUE INDEX "uq_job_execution_replaceable"
  ON "job_executions" ("queue_name", "job_type", "logical_key", "organization_id", COALESCE("company_id", '00000000-0000-0000-0000-000000000000'))
  WHERE "uniqueness_policy" = 'REPLACEABLE'
    AND "status" NOT IN ('SUPERSEDED', 'CANCELLED');
--> statement-breakpoint

-- ─── Operational indexes ───────────────────────────────────────────────────

-- Recovery sweep: find stale PENDING
CREATE INDEX IF NOT EXISTS "idx_job_pending_recovery"
  ON "job_executions" ("created_at")
  WHERE "status" = 'PENDING';
--> statement-breakpoint

-- Lease expiry recovery: find RUNNING with expired lease
CREATE INDEX IF NOT EXISTS "idx_job_stale_running"
  ON "job_executions" ("lease_expires_at")
  WHERE "status" = 'RUNNING';
--> statement-breakpoint

-- Tenant queries
CREATE INDEX IF NOT EXISTS "idx_job_tenant_created"
  ON "job_executions" ("organization_id", "created_at");
--> statement-breakpoint

-- ─── Outbox events table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "job_outbox" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_execution_id" UUID NOT NULL REFERENCES "job_executions"("id"),
  "action" VARCHAR(50) NOT NULL DEFAULT 'ENQUEUE',
  "queue_name" VARCHAR(100) NOT NULL,
  "job_type" VARCHAR(100) NOT NULL,
  "payload" JSONB NOT NULL,
  "published_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_job_outbox_pending"
  ON "job_outbox" ("created_at")
  WHERE "published_at" IS NULL;
--> statement-breakpoint
