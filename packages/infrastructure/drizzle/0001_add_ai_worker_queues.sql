CREATE TYPE "public"."reconciliation_shadow_run_status" AS ENUM('SUCCESS', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."worker_task_priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."worker_task_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "ai_worker_queues" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"status" "worker_task_status" DEFAULT 'pending' NOT NULL,
	"priority" "worker_task_priority" DEFAULT 'medium' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"next_retry_at" timestamp,
	"error" text,
	"error_stack" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reconciliation_shadow_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"status" "reconciliation_shadow_run_status" NOT NULL,
	"local_matched_count" integer DEFAULT 0 NOT NULL,
	"go_matched_count" integer DEFAULT 0 NOT NULL,
	"discrepancy_count" integer DEFAULT 0 NOT NULL,
	"tolerance_cents" integer DEFAULT 0 NOT NULL,
	"error_message" varchar(500),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_worker_queues" ADD CONSTRAINT "ai_worker_queues_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_worker_queues" ADD CONSTRAINT "ai_worker_queues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_worker_queue_status_created_idx" ON "ai_worker_queues" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "ai_worker_queue_company_status_idx" ON "ai_worker_queues" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "ai_worker_queue_next_retry_idx" ON "ai_worker_queues" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "reconciliation_shadow_runs_company_idx" ON "reconciliation_shadow_runs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "reconciliation_shadow_runs_company_created_idx" ON "reconciliation_shadow_runs" USING btree ("company_id","created_at");