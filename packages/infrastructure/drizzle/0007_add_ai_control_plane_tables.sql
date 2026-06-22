CREATE TABLE "access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36),
	"user_email" varchar(255),
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"result" varchar(20) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"details" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_agents" (
	"agent_id" text PRIMARY KEY NOT NULL,
	"purpose" text,
	"tenant_id" text,
	"organization_id" text,
	"company_id" text,
	"ruc" text,
	"capabilities" text[],
	"allowed_tools" text[],
	"approval_class" varchar(30) NOT NULL,
	"supported_surfaces" text[],
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"risk_tier" varchar(2) NOT NULL,
	"input_schema" jsonb,
	"output_schema" jsonb,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"fiscal_impact" boolean DEFAULT false NOT NULL,
	"approval_level" varchar(20) DEFAULT 'auto',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_tools_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ai_trace_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"trace_id" text NOT NULL,
	"agent_id" text,
	"decision" varchar(20) NOT NULL,
	"policy_result" jsonb,
	"tenant_scope" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "drenyra_agent_runs" (
	"id" varchar(96) PRIMARY KEY NOT NULL,
	"case_id" varchar(96) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(128),
	"period" varchar(16) NOT NULL,
	"country_code" varchar(2) DEFAULT 'PE' NOT NULL,
	"agent_type" varchar(48) NOT NULL,
	"status" varchar(20) NOT NULL,
	"started_by" varchar(128) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"output" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drenyra_approval_requests" (
	"id" varchar(96) PRIMARY KEY NOT NULL,
	"case_id" varchar(96) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(128),
	"period" varchar(16) NOT NULL,
	"country_code" varchar(2) DEFAULT 'PE' NOT NULL,
	"status" varchar(20) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"autonomy_level" varchar(40) NOT NULL,
	"requested_by" varchar(128) NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"decided_by" varchar(128),
	"decided_at" timestamp,
	"decision_reason" text,
	"diff" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drenyra_audit_events" (
	"id" varchar(96) PRIMARY KEY NOT NULL,
	"case_id" varchar(96),
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(128),
	"period" varchar(16) NOT NULL,
	"country_code" varchar(2) DEFAULT 'PE' NOT NULL,
	"event_type" varchar(48) NOT NULL,
	"actor_id" varchar(128) NOT NULL,
	"message" text NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drenyra_evidence_items" (
	"id" varchar(96) PRIMARY KEY NOT NULL,
	"case_id" varchar(96) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(128),
	"period" varchar(16) NOT NULL,
	"country_code" varchar(2) DEFAULT 'PE' NOT NULL,
	"type" varchar(40) NOT NULL,
	"title" varchar(180) NOT NULL,
	"summary" text NOT NULL,
	"source" varchar(128) NOT NULL,
	"source_ref" varchar(256),
	"content_hash" varchar(128) NOT NULL,
	"added_by" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drenyra_fiscal_cases" (
	"id" varchar(96) PRIMARY KEY NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(128),
	"period" varchar(16) NOT NULL,
	"country_code" varchar(2) DEFAULT 'PE' NOT NULL,
	"type" varchar(48) NOT NULL,
	"status" varchar(32) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"risk_level" varchar(16) NOT NULL,
	"risk_score" integer NOT NULL,
	"autonomy_level" varchar(40) NOT NULL,
	"created_by" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failed_login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"reason" varchar(50) NOT NULL,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" integer PRIMARY KEY NOT NULL,
	"ruc" varchar(11) NOT NULL,
	"business_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_mcp_audit_events" (
	"id" varchar(96) PRIMARY KEY NOT NULL,
	"operation" varchar(24) NOT NULL,
	"outcome" varchar(24) NOT NULL,
	"tool_name" varchar(128) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(128) NOT NULL,
	"period" varchar(7) NOT NULL,
	"country_code" varchar(2) DEFAULT 'PE' NOT NULL,
	"actor_id" varchar(128) NOT NULL,
	"redaction_status" varchar(24) NOT NULL,
	"reason" varchar(64) NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_guard_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(36),
	"action" varchar(100) NOT NULL,
	"prompt" text,
	"allowed" boolean NOT NULL,
	"reason" text,
	"blocked_keyword" varchar(50),
	"requires_admin_override" boolean DEFAULT false NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "fee_from_scope_idx";--> statement-breakpoint
DROP INDEX "fen_scope_node_idx";--> statement-breakpoint
DROP INDEX "frc_aggregate_scope_idx";--> statement-breakpoint
DROP INDEX "fte_aggregate_scope_idx";--> statement-breakpoint
ALTER TABLE "fiscal_evidence_edges" ADD COLUMN "period" varchar(7) NOT NULL;--> statement-breakpoint
ALTER TABLE "fiscal_evidence_nodes" ADD COLUMN "period" varchar(7) NOT NULL;--> statement-breakpoint
ALTER TABLE "fiscal_replay_checkpoints" ADD COLUMN "period" varchar(7) NOT NULL;--> statement-breakpoint
ALTER TABLE "fiscal_truth_events" ADD COLUMN "period" varchar(7) NOT NULL;--> statement-breakpoint
ALTER TABLE "drenyra_agent_runs" ADD CONSTRAINT "drenyra_agent_runs_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."drenyra_fiscal_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drenyra_approval_requests" ADD CONSTRAINT "drenyra_approval_requests_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."drenyra_fiscal_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drenyra_audit_events" ADD CONSTRAINT "drenyra_audit_events_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."drenyra_fiscal_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drenyra_evidence_items" ADD CONSTRAINT "drenyra_evidence_items_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."drenyra_fiscal_cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_access_logs_user" ON "access_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_access_logs_action" ON "access_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_access_logs_timestamp" ON "access_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "ai_agents_scope_idx" ON "ai_agents" USING btree ("tenant_id","organization_id","company_id","ruc");--> statement-breakpoint
CREATE INDEX "ai_agents_capabilities_idx" ON "ai_agents" USING btree ("capabilities");--> statement-breakpoint
CREATE INDEX "ai_agents_active_idx" ON "ai_agents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "ai_tools_risk_tier_idx" ON "ai_tools" USING btree ("risk_tier");--> statement-breakpoint
CREATE INDEX "ai_tools_name_idx" ON "ai_tools" USING btree ("name");--> statement-breakpoint
CREATE INDEX "ai_trace_evidence_trace_id_idx" ON "ai_trace_evidence" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "ai_trace_evidence_tenant_scope_idx" ON "ai_trace_evidence" USING btree ("tenant_scope");--> statement-breakpoint
CREATE INDEX "ai_trace_evidence_created_at_idx" ON "ai_trace_evidence" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "drenyra_agent_runs_case_idx" ON "drenyra_agent_runs" USING btree ("case_id","company_id","company_ruc");--> statement-breakpoint
CREATE INDEX "drenyra_approvals_case_idx" ON "drenyra_approval_requests" USING btree ("case_id","company_id","company_ruc");--> statement-breakpoint
CREATE INDEX "drenyra_approvals_status_idx" ON "drenyra_approval_requests" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "drenyra_audit_events_case_idx" ON "drenyra_audit_events" USING btree ("case_id","company_id","company_ruc");--> statement-breakpoint
CREATE INDEX "drenyra_audit_events_type_idx" ON "drenyra_audit_events" USING btree ("company_id","event_type");--> statement-breakpoint
CREATE INDEX "drenyra_evidence_case_idx" ON "drenyra_evidence_items" USING btree ("case_id","company_id","company_ruc");--> statement-breakpoint
CREATE INDEX "drenyra_cases_scope_period_idx" ON "drenyra_fiscal_cases" USING btree ("company_id","company_ruc","period");--> statement-breakpoint
CREATE INDEX "drenyra_cases_status_idx" ON "drenyra_fiscal_cases" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "idx_failed_login_email" ON "failed_login_attempts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_failed_login_ip" ON "failed_login_attempts" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "pmcp_audit_scope_idx" ON "platform_mcp_audit_events" USING btree ("company_id","company_ruc","period");--> statement-breakpoint
CREATE INDEX "pmcp_audit_tool_outcome_idx" ON "platform_mcp_audit_events" USING btree ("tool_name","outcome");--> statement-breakpoint
CREATE INDEX "idx_prompt_guard_user" ON "prompt_guard_audit" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_guard_allowed" ON "prompt_guard_audit" USING btree ("allowed");--> statement-breakpoint
CREATE INDEX "fee_from_scope_idx" ON "fiscal_evidence_edges" USING btree ("from_node_id","company_id","company_ruc","period");--> statement-breakpoint
CREATE INDEX "fen_scope_node_idx" ON "fiscal_evidence_nodes" USING btree ("node_id","company_id","company_ruc","period");--> statement-breakpoint
CREATE INDEX "frc_aggregate_scope_idx" ON "fiscal_replay_checkpoints" USING btree ("aggregate_id","company_id","company_ruc","period");--> statement-breakpoint
CREATE INDEX "fte_aggregate_scope_idx" ON "fiscal_truth_events" USING btree ("aggregate_id","company_id","company_ruc","period");