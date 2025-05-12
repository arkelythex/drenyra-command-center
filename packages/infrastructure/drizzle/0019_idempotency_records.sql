-- Idempotency Records (ADR-009)
--
-- Generic idempotency table for HTTP commands, message consumers, and jobs.
-- Replaces the in-memory Map in drenyra.routes.ts and provides a canonical
-- persistence layer for all idempotency operations.
--
-- Design decisions:
-- - company_id is NOT NULL: all idempotent operations belong to a company.
-- - Standard UNIQUE (not NULLS NOT DISTINCT): no nullable scope columns.
-- - CHECK constraints enforce symmetric invariants: FAILED records carry
--   only failure fields, COMPLETED records carry only response fields,
--   and non-terminal states carry neither.
-- - response_body is nullable in COMPLETED: 204 No Content and similar
--   status-only responses are valid terminal states.
--
-- Related:
--   packages/persistence/src/schema/idempotency.schema.ts
--   docs/adr/ADR-009-canonical-idempotency-contract.md
--

-- Enums
CREATE TYPE "public"."idempotency_status" AS ENUM(
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);
--> statement-breakpoint

CREATE TYPE "public"."failure_class" AS ENUM(
  'RETRYABLE',
  'TERMINAL'
);
--> statement-breakpoint

-- Main table
CREATE TABLE IF NOT EXISTS "idempotency_records" (
  -- Primary key
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant scope
  "organization_id" uuid NOT NULL,
  "company_id" uuid NOT NULL,
  "operation" varchar(100) NOT NULL,
  "idempotency_key" varchar(255) NOT NULL,

  -- Request fingerprint (SHA-256 hex, 64 chars)
  "request_hash" varchar(64) NOT NULL,

  -- State machine
  "status" "idempotency_status" NOT NULL DEFAULT 'PENDING',
  "failure_code" varchar(100),
  "failure_class" "failure_class",
  "attempt_count" integer NOT NULL DEFAULT 1,

  -- Timing & ownership
  "locked_at" timestamp with time zone,
  "processing_token" uuid,
  "completed_at" timestamp with time zone,
  "failed_at" timestamp with time zone,

  -- Terminal result (COMPLETED only; stores both success and cacheable
  -- business errors like 409/422 for deterministic replay; response_body
  -- nullable for 204 No Content and status-only responses)
  "response_status" integer,
  "response_body" jsonb,
  "response_headers" jsonb,

  -- Lifecycle
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- ─── Check constraints ────────────────────────────────────────────────────────

-- Status must be a valid enum value
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_status_check"
  CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'));
--> statement-breakpoint

-- failure_class must be valid when present
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_failure_class_check"
  CHECK (failure_class IS NULL OR failure_class IN ('RETRYABLE', 'TERMINAL'));
--> statement-breakpoint

-- FAILED → failure_code AND failure_class AND failed_at are all required
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_failed_has_fields"
  CHECK (
    status != 'FAILED'
    OR (failure_code IS NOT NULL AND failure_class IS NOT NULL AND failed_at IS NOT NULL)
  );
--> statement-breakpoint

-- NOT FAILED → no failure fields
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_not_failed_no_failure_fields"
  CHECK (
    status = 'FAILED'
    OR (failure_code IS NULL AND failure_class IS NULL AND failed_at IS NULL)
  );
--> statement-breakpoint

-- COMPLETED → response_status is required (response_body may be null for 204 etc.)
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_completed_has_response"
  CHECK (
    status != 'COMPLETED'
    OR (response_status IS NOT NULL AND completed_at IS NOT NULL)
  );
--> statement-breakpoint

-- NOT COMPLETED → no response or completion fields
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_not_completed_no_response"
  CHECK (
    status = 'COMPLETED'
    OR (
      response_status IS NULL
      AND response_body IS NULL
      AND response_headers IS NULL
      AND completed_at IS NULL
    )
  );
--> statement-breakpoint

-- PENDING locked_at IS NULL; PROCESSING locked_at IS NOT NULL
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_locked_at_by_status"
  CHECK (
    (status = 'PENDING' AND locked_at IS NULL)
    OR (status = 'PROCESSING' AND locked_at IS NOT NULL)
    OR status IN ('COMPLETED', 'FAILED')
  );
--> statement-breakpoint

-- PROCESSING → processing_token IS NOT NULL
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_processing_token_present"
  CHECK (
    status != 'PROCESSING'
    OR processing_token IS NOT NULL
  );
--> statement-breakpoint

-- NOT PROCESSING → processing_token IS NULL
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_processing_token_absent"
  CHECK (
    status = 'PROCESSING'
    OR processing_token IS NULL
  );
--> statement-breakpoint

-- attempt_count must be at least 1
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_attempt_count_positive"
  CHECK (attempt_count >= 1);
--> statement-breakpoint

-- expires_at must be after created_at
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_expires_after_created"
  CHECK (expires_at > created_at);
--> statement-breakpoint

-- response_status must be a valid HTTP status code when present
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_response_status_range"
  CHECK (response_status IS NULL OR (response_status BETWEEN 100 AND 599));
--> statement-breakpoint

-- ─── Unique constraint ────────────────────────────────────────────────────────

-- One idempotency key per tenant scope + operation.
-- Standard UNIQUE is sufficient because all scope columns are NOT NULL.
ALTER TABLE "idempotency_records" ADD CONSTRAINT "uq_idempotency_scope_key"
  UNIQUE (organization_id, company_id, operation, idempotency_key);
--> statement-breakpoint

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- TTL-based cleanup: WHERE expires_at < now()
CREATE INDEX IF NOT EXISTS "idx_idempotency_records_expires_at"
  ON "idempotency_records" ("expires_at");
--> statement-breakpoint

-- Orphan PROCESSING recovery: WHERE status = 'PROCESSING' AND locked_at < now() - interval '30s'
-- Index on locked_at with partial filter is more selective than status-first.
CREATE INDEX IF NOT EXISTS "idx_idempotency_records_orphan_recovery"
  ON "idempotency_records" ("locked_at")
  WHERE status = 'PROCESSING';
--> statement-breakpoint
