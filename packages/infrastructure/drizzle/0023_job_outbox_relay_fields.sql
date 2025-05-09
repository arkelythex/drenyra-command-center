-- W2-06C — Job Outbox Relay Ownership Fields
--
-- Adds ownership and retry support to job_outbox so multiple relay instances
-- can safely claim events without duplicating delivery.
--
-- Related:
--   packages/persistence/src/schema/job-executions.schema.ts
--   packages/infrastructure/src/queues/job-outbox-relay.ts
--

ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING';
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "relay_token" UUID;
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "claimed_at" TIMESTAMPTZ;
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "claim_expires_at" TIMESTAMPTZ;
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "attempt_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "next_attempt_at" TIMESTAMPTZ;
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "last_error" TEXT;
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "available_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE "job_outbox" ADD COLUMN IF NOT EXISTS "discarded_at" TIMESTAMPTZ;
--> statement-breakpoint

-- Index for relay claim: pending events ordered by availability
DROP INDEX IF EXISTS "idx_job_outbox_pending";
CREATE INDEX IF NOT EXISTS "idx_job_outbox_claimable"
  ON "job_outbox" ("available_at", "created_at")
  WHERE "status" = 'PENDING';
--> statement-breakpoint

-- Index for stale relay claims
CREATE INDEX IF NOT EXISTS "idx_job_outbox_stale_claim"
  ON "job_outbox" ("claim_expires_at")
  WHERE "status" = 'CLAIMED';
--> statement-breakpoint
