CREATE TABLE "fiscal_memories" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"company_id" text NOT NULL,
	"ruc" text NOT NULL,
	"period" text NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"evidence_refs" jsonb NOT NULL,
	"tags" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"approved_by" text,
	"source_agent_id" text,
	"related_memory_ids" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_memory_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"memory_id" text NOT NULL,
	"revision_number" integer NOT NULL,
	"changed_by" text NOT NULL,
	"change_reason" text NOT NULL,
	"previous_value" jsonb NOT NULL,
	"next_value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_ai_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"custom_system_indicator" text,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fiscal_memory_revisions" ADD CONSTRAINT "fiscal_memory_revisions_memory_id_fiscal_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."fiscal_memories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fiscal_memories_company_period_idx" ON "fiscal_memories" USING btree ("company_id","period");--> statement-breakpoint
CREATE INDEX "fiscal_memories_company_category_idx" ON "fiscal_memories" USING btree ("company_id","category");--> statement-breakpoint
CREATE INDEX "fiscal_memories_company_severity_idx" ON "fiscal_memories" USING btree ("company_id","severity");--> statement-breakpoint
CREATE INDEX "fiscal_memories_ruc_period_idx" ON "fiscal_memories" USING btree ("ruc","period");--> statement-breakpoint
CREATE INDEX "fiscal_memories_status_idx" ON "fiscal_memories" USING btree ("status");--> statement-breakpoint
CREATE INDEX "fiscal_memories_scope_idx" ON "fiscal_memories" USING btree ("tenant_id","company_id","ruc");--> statement-breakpoint
CREATE UNIQUE INDEX "fiscal_memory_revisions_memory_revision_idx" ON "fiscal_memory_revisions" USING btree ("memory_id","revision_number");--> statement-breakpoint
CREATE INDEX "fiscal_memory_revisions_memory_idx" ON "fiscal_memory_revisions" USING btree ("memory_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_ai_settings_user_id_idx" ON "user_ai_settings" USING btree ("user_id");