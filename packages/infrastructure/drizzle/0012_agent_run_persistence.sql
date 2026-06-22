-- Agent Run Persistence — Session State & Event Log
--
-- Adds tables for persisting agent swarm runtime state and events
-- to support audit trail, debug, and run recovery.
--
-- Related:
--   schema/agent-run.schema.ts
--   packages/ai/src/session/postgres-store.ts
--

CREATE TABLE "agent_run_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" text NOT NULL,
	"session_id" uuid,
	"workflow_state" text,
	"agent_metrics" jsonb,
	"context" jsonb,
	"status" text DEFAULT 'running' NOT NULL,
	"error" text,
	"company_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "agent_run_states_run_id_idx" ON "agent_run_states" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "agent_run_states_company_status_idx" ON "agent_run_states" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "agent_run_states_company_created_idx" ON "agent_run_states" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_run_states_session_idx" ON "agent_run_states" USING btree ("session_id");--> statement-breakpoint

CREATE TABLE "agent_run_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"company_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "agent_run_events_run_idx" ON "agent_run_events" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "agent_run_events_company_run_idx" ON "agent_run_events" USING btree ("company_id","run_id");--> statement-breakpoint

ALTER TABLE "agent_run_states" ADD CONSTRAINT "agent_run_states_session_id_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE set null;
