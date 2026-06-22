-- Batch Runs — Multi-Run Session Orchestration
--
-- Adds the batch_runs and batch_run_items tables for processing
-- multiple invoices with controlled concurrency. Batches track
-- aggregate progress (completed/failed/total), while items track
-- individual invoice processing status and link to the agent run.
--
-- Related:
--   packages/ai/src/session/postgres-store.ts (createBatch, etc.)
--   packages/ai/src/agents/orchestrator/batch/batch-orchestrator.ts
--   packages/ai/types/batch.types.ts
--

CREATE TABLE IF NOT EXISTS "batch_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "total" integer NOT NULL DEFAULT 0,
  "completed" integer NOT NULL DEFAULT 0,
  "failed" integer NOT NULL DEFAULT 0,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batch_run_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES batch_runs(id) ON DELETE CASCADE,
  "run_id" text,
  "session_id" text,
  "status" text NOT NULL DEFAULT 'pending',
  "error" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_runs_company" ON "batch_runs" ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_runs_status" ON "batch_runs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_items_batch" ON "batch_run_items" ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_items_status" ON "batch_run_items" ("status");
