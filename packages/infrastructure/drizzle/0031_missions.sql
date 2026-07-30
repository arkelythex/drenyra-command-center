-- M1 Durable Monthly Close Mission — Domain Tables
--
-- Creates 4 tables for the mission subsystem:
--   1. accounting_missions — core mission state machine
--   2. mission_idempotency — idempotency key tracking
--   3. mission_events — append-only event log
--   4. mission_receipts — immutable approval/rejection receipts
--
-- Design:
--   - fiscal_period uses YYYY-MM convention (matching existing close_checklists)
--   - progress is integer basis points (0-10000, divide by 100 for display)
--   - Unique constraint on (company_id, fiscal_period, intent)
--   - mission_events has CASCADE delete on mission_id
--   - mission_receipts are immutable (no updated_at)
--   - receipt_hash is unique for content-addressable integrity

-- ─── 1. accounting_missions ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "accounting_missions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL REFERENCES "companies" ("id"),
  "fiscal_period" varchar(7) NOT NULL,              -- YYYY-MM
  "intent" varchar(30) NOT NULL,
  "status" varchar(25) NOT NULL DEFAULT 'DRAFT',
  "version" integer NOT NULL DEFAULT 1,
  "progress" integer NOT NULL DEFAULT 0,             -- basis points (0-10000)
  "input" jsonb,
  "proposal" jsonb,
  "rejection" jsonb,
  "receipt_id" uuid,
  "receipt_hash" text,
  "last_event_sequence" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- One mission per (company, fiscal_period, intent)
CREATE UNIQUE INDEX IF NOT EXISTS "acct_missions_company_period_intent_unq"
  ON "accounting_missions" ("company_id", "fiscal_period", "intent");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "acct_missions_company_status_idx"
  ON "accounting_missions" ("company_id", "status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "acct_missions_status_idx"
  ON "accounting_missions" ("status");
--> statement-breakpoint

-- ─── 2. mission_idempotency ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mission_idempotency" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL REFERENCES "companies" ("id"),
  "command_type" varchar(30) NOT NULL,
  "idempotency_key" varchar(255) NOT NULL,
  "payload_hash" text NOT NULL,
  "mission_id" uuid,
  "execution_status" varchar(20) NOT NULL,           -- EXECUTING, COMPLETED, FAILED
  "response" jsonb,
  "response_status_code" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "mission_idempotency_company_key_unq"
  ON "mission_idempotency" ("company_id", "idempotency_key");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mission_idempotency_expires_at_idx"
  ON "mission_idempotency" ("expires_at");
--> statement-breakpoint

-- ─── 3. mission_events ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mission_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "mission_id" uuid NOT NULL REFERENCES "accounting_missions" ("id") ON DELETE CASCADE,
  "sequence" integer NOT NULL,
  "event_type" varchar(30) NOT NULL,
  "snapshot" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "mission_events_mission_sequence_unq"
  ON "mission_events" ("mission_id", "sequence");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mission_events_mission_sequence_idx"
  ON "mission_events" ("mission_id", "sequence");
--> statement-breakpoint

-- ─── 4. mission_receipts ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "mission_receipts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "mission_id" uuid NOT NULL REFERENCES "accounting_missions" ("id"),
  "company_id" uuid NOT NULL REFERENCES "companies" ("id"),
  "actor_id" varchar(255) NOT NULL,
  "decision" varchar(10) NOT NULL,                   -- APPROVE or REJECT
  "proposal_version" integer NOT NULL,
  "evidence_hash" text NOT NULL,
  "previous_status" varchar(25) NOT NULL,
  "new_status" varchar(25) NOT NULL,
  "payload_hash" text NOT NULL,
  "receipt_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mission_receipts_mission_id_idx"
  ON "mission_receipts" ("mission_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mission_receipts_company_id_idx"
  ON "mission_receipts" ("company_id");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "mission_receipts_hash_unq"
  ON "mission_receipts" ("receipt_hash");
--> statement-breakpoint
