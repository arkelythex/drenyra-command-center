-- Agent Run Inputs — Session Resumability Input Persistence
--
-- Adds the agent_run_inputs table for persisting agent run input data
-- to enable session recovery after failures or degradation.
-- Combined with a snapshot fix that includes agent_run_states and
-- agent_run_events (which were missing from previous snapshots).
--
-- Related:
--   schema/agent-run.schema.ts (agentRunInputs table)
--   packages/ai/src/session/postgres-store.ts (saveInput/getInput)
--   packages/ai/src/session/session-recovery.ts (checksum verification)
--

CREATE TABLE IF NOT EXISTS "agent_run_inputs" (
  "run_id" text PRIMARY KEY NOT NULL,
  "input_type" text NOT NULL,
  "input_data" text NOT NULL,
  "checksum" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "agent_run_inputs_run_id_idx" ON "agent_run_inputs" USING btree ("run_id");
--> statement-breakpoint
ALTER TABLE "agent_run_inputs" ADD CONSTRAINT "agent_run_inputs_run_id_agent_run_states_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."agent_run_states"("run_id") ON DELETE cascade ON UPDATE no action;
