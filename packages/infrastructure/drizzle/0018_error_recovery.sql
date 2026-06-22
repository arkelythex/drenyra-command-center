-- Error Recovery & Retry Engine
--
-- Adds persistent circuit breaker states and a Dead Letter Queue for
-- failed agent items.
--
-- Replaces the in-memory CircuitBreaker in:
--   packages/ai/src/agents/orchestrator/workflow-v2/steps.ts
--
-- Related:
--   packages/persistence/src/schema/error-recovery.schema.ts
--   packages/infrastructure/src/services/error-recovery/error-recovery.repository.ts
--

-- Circuit Breaker States
CREATE TABLE IF NOT EXISTS "circuit_breaker_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "agent_name" text NOT NULL,
  "state" text NOT NULL,
  "failure_count" integer NOT NULL DEFAULT 0,
  "success_count" integer NOT NULL DEFAULT 0,
  "last_failure_at" timestamp with time zone,
  "last_success_at" timestamp with time zone,
  "opened_at" timestamp with time zone,
  "threshold" integer NOT NULL DEFAULT 5,
  "timeout_ms" integer NOT NULL DEFAULT 60000,
  "scope" text NOT NULL,
  "company_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Check constraints for circuit_breaker_states
ALTER TABLE "circuit_breaker_states" ADD CONSTRAINT "circuit_breaker_states_state_check"
  CHECK (state IN ('CLOSED', 'OPEN', 'HALF_OPEN'));
--> statement-breakpoint
ALTER TABLE "circuit_breaker_states" ADD CONSTRAINT "circuit_breaker_states_scope_check"
  CHECK (scope IN ('agent', 'provider'));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_circuit_agent_scope"
  ON "circuit_breaker_states" ("agent_name", "scope");
--> statement-breakpoint

-- Failed Agent Items (Dead Letter Queue)
CREATE TABLE IF NOT EXISTS "failed_agent_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "run_id" text NOT NULL,
  "agent_name" text NOT NULL,
  "error_type" text NOT NULL,
  "error_message" text NOT NULL,
  "error_details" jsonb,
  "workflow_state" text,
  "retry_count" integer NOT NULL DEFAULT 0,
  "max_retries" integer NOT NULL DEFAULT 3,
  "last_retry_at" timestamp with time zone,
  "next_retry_at" timestamp with time zone,
  "status" text NOT NULL,
  "company_id" uuid,
  "batch_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Check constraints for failed_agent_items
ALTER TABLE "failed_agent_items" ADD CONSTRAINT "failed_agent_items_error_type_check"
  CHECK (error_type IN ('TRANSIENT', 'PERMANENT', 'UNKNOWN'));
--> statement-breakpoint
ALTER TABLE "failed_agent_items" ADD CONSTRAINT "failed_agent_items_status_check"
  CHECK (status IN ('pending', 'retrying', 'resolved', 'dead'));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_status_next_retry"
  ON "failed_agent_items" ("status", "next_retry_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_agent_name"
  ON "failed_agent_items" ("agent_name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_run_id"
  ON "failed_agent_items" ("run_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_company_id"
  ON "failed_agent_items" ("company_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dlq_created_at"
  ON "failed_agent_items" ("created_at");
