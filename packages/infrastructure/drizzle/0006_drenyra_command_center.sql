CREATE TABLE IF NOT EXISTS "drenyra_fiscal_cases" (
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
CREATE TABLE IF NOT EXISTS "drenyra_evidence_items" (
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
CREATE TABLE IF NOT EXISTS "drenyra_agent_runs" (
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
CREATE TABLE IF NOT EXISTS "drenyra_approval_requests" (
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
CREATE TABLE IF NOT EXISTS "drenyra_audit_events" (
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
DO $$ BEGIN
	ALTER TABLE "drenyra_evidence_items" ADD CONSTRAINT "drenyra_evidence_items_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "drenyra_fiscal_cases"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "drenyra_agent_runs" ADD CONSTRAINT "drenyra_agent_runs_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "drenyra_fiscal_cases"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "drenyra_approval_requests" ADD CONSTRAINT "drenyra_approval_requests_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "drenyra_fiscal_cases"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "drenyra_audit_events" ADD CONSTRAINT "drenyra_audit_events_case_id_drenyra_fiscal_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "drenyra_fiscal_cases"("id");
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_cases_scope_period_idx" ON "drenyra_fiscal_cases" USING btree ("company_id","company_ruc","period");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_cases_status_idx" ON "drenyra_fiscal_cases" USING btree ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_evidence_case_idx" ON "drenyra_evidence_items" USING btree ("case_id","company_id","company_ruc");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_agent_runs_case_idx" ON "drenyra_agent_runs" USING btree ("case_id","company_id","company_ruc");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_approvals_case_idx" ON "drenyra_approval_requests" USING btree ("case_id","company_id","company_ruc");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_approvals_status_idx" ON "drenyra_approval_requests" USING btree ("company_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_audit_events_case_idx" ON "drenyra_audit_events" USING btree ("case_id","company_id","company_ruc");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drenyra_audit_events_type_idx" ON "drenyra_audit_events" USING btree ("company_id","event_type");
