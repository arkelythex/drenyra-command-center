-- W2-05B — Inbox Messages Table
--
-- Transactional inbox pattern for consumer deduplication.
-- Guarantees exactly-once processing per (consumer_name, producer, message_id).
--
-- Related:
--   packages/persistence/src/schema/inbox.schema.ts
--   docs/adr/W2-05A-consumer-dedup-inventory.md
--

-- Enums
CREATE TYPE "public"."inbox_status" AS ENUM(
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);
--> statement-breakpoint

CREATE TYPE "public"."inbox_failure_class" AS ENUM(
  'RETRYABLE',
  'TERMINAL'
);
--> statement-breakpoint

-- Main table
CREATE TABLE IF NOT EXISTS "inbox_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (dedup key)
  "consumer_name" varchar(100) NOT NULL,
  "producer" varchar(100) NOT NULL,
  "message_id" varchar(255) NOT NULL,
  "message_type" varchar(100) NOT NULL,

  -- Request fingerprint
  "payload_hash" varchar(64) NOT NULL,

  -- Tenant scope (authorization context, NOT identity)
  "organization_id" uuid,
  "company_id" uuid,

  -- State machine
  "status" "inbox_status" NOT NULL DEFAULT 'PROCESSING',
  "failure_class" "inbox_failure_class",
  "failure_code" varchar(100),
  "attempt_count" integer NOT NULL DEFAULT 1,

  -- Timing & recovery
  "last_failed_at" timestamp with time zone,
  "next_retry_at" timestamp with time zone,
  "processing_token" uuid,
  "processing_started_at" timestamp with time zone,
  "processing_expires_at" timestamp with time zone,
  "completed_at" timestamp with time zone,

  -- Result
  "result_metadata" jsonb,

  -- Lifecycle
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ─── Check constraints ────────────────────────────────────────────────────────

-- Status must be a valid enum value
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_status_check"
  CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED'));
--> statement-breakpoint

-- FAILED → failure fields required
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_failed_has_fields"
  CHECK (
    status != 'FAILED'
    OR (failure_code IS NOT NULL AND failure_class IS NOT NULL AND last_failed_at IS NOT NULL)
  );
--> statement-breakpoint

-- NOT FAILED → no failure fields
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_not_failed_no_failure"
  CHECK (
    status = 'FAILED'
    OR (failure_code IS NULL AND failure_class IS NULL AND last_failed_at IS NULL)
  );
--> statement-breakpoint

-- COMPLETED → completed_at required
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_completed_has_timestamp"
  CHECK (
    status != 'COMPLETED'
    OR completed_at IS NOT NULL
  );
--> statement-breakpoint

-- NOT COMPLETED → no result metadata
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_not_completed_no_result"
  CHECK (
    status = 'COMPLETED'
    OR result_metadata IS NULL
  );
--> statement-breakpoint

-- PROCESSING requires token and start time
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_processing_has_token"
  CHECK (
    status != 'PROCESSING'
    OR (processing_token IS NOT NULL AND processing_started_at IS NOT NULL)
  );
--> statement-breakpoint

-- NOT PROCESSING → no processing token
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_not_processing_no_token"
  CHECK (
    status = 'PROCESSING'
    OR processing_token IS NULL
  );
--> statement-breakpoint

-- attempt_count >= 1
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_attempt_count_positive"
  CHECK (attempt_count >= 1);
--> statement-breakpoint

-- TERMINAL failures must not have next_retry_at
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_terminal_no_retry"
  CHECK (
    failure_class IS NULL
    OR failure_class != 'TERMINAL'
    OR next_retry_at IS NULL
  );
--> statement-breakpoint

-- ─── Unique constraint ────────────────────────────────────────────────────────

ALTER TABLE "inbox_messages" ADD CONSTRAINT "uq_inbox_messages_consumer_message"
  UNIQUE (consumer_name, producer, message_id);
--> statement-breakpoint

-- ─── Operational indexes ──────────────────────────────────────────────────────

-- Stale PROCESSING recovery
CREATE INDEX IF NOT EXISTS "idx_inbox_stale_processing"
  ON "inbox_messages" ("processing_expires_at")
  WHERE status = 'PROCESSING';
--> statement-breakpoint

-- Retry queue
CREATE INDEX IF NOT EXISTS "idx_inbox_retry_queue"
  ON "inbox_messages" ("next_retry_at")
  WHERE status = 'FAILED' AND failure_class = 'RETRYABLE' AND next_retry_at IS NOT NULL;
--> statement-breakpoint

-- Tenant queries
CREATE INDEX IF NOT EXISTS "idx_inbox_tenant_created"
  ON "inbox_messages" ("company_id", "created_at");
--> statement-breakpoint

-- Consumer history
CREATE INDEX IF NOT EXISTS "idx_inbox_consumer_completed"
  ON "inbox_messages" ("consumer_name", "completed_at")
  WHERE status = 'COMPLETED';
--> statement-breakpoint
