CREATE TABLE "fiscal_evidence_edges" (
	"edge_id" uuid PRIMARY KEY NOT NULL,
	"from_node_id" uuid NOT NULL,
	"to_node_id" uuid NOT NULL,
	"edge_kind" varchar(64) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(64),
	"country_code" varchar(8) NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_evidence_nodes" (
	"node_id" uuid PRIMARY KEY NOT NULL,
	"node_kind" varchar(64) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(64),
	"country_code" varchar(8) NOT NULL,
	"trace_id" varchar(128) NOT NULL,
	"correlation_id" varchar(128) NOT NULL,
	"causation_id" varchar(128),
	"hash" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_replay_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_id" varchar(128) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(64),
	"country_code" varchar(8) NOT NULL,
	"success" boolean NOT NULL,
	"reproduced_event_id" varchar(128),
	"reproduced_outcome_hash" varchar(256),
	"failure_code" varchar(64),
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_truth_events" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"aggregate_id" varchar(128) NOT NULL,
	"aggregate_type" varchar(64) NOT NULL,
	"event_kind" varchar(64) NOT NULL,
	"company_id" varchar(128) NOT NULL,
	"company_ruc" varchar(11) NOT NULL,
	"organization_id" varchar(64),
	"country_code" varchar(8) NOT NULL,
	"trace_id" varchar(128) NOT NULL,
	"correlation_id" varchar(128) NOT NULL,
	"causation_id" varchar(128),
	"validator_set_version" varchar(64) NOT NULL,
	"policy_version" varchar(64) NOT NULL,
	"evidence_root_node_id" uuid NOT NULL,
	"evidence_bundle_hash" varchar(256) NOT NULL,
	"approval_id" varchar(128),
	"occurred_at" timestamp NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sunat_knowledge_chunks" ALTER COLUMN "embedding" SET DATA TYPE vector(3072);--> statement-breakpoint
CREATE INDEX "fee_from_scope_idx" ON "fiscal_evidence_edges" USING btree ("from_node_id","company_id","company_ruc");--> statement-breakpoint
CREATE INDEX "fen_scope_node_idx" ON "fiscal_evidence_nodes" USING btree ("node_id","company_id","company_ruc");--> statement-breakpoint
CREATE INDEX "frc_aggregate_scope_idx" ON "fiscal_replay_checkpoints" USING btree ("aggregate_id","company_id","company_ruc");--> statement-breakpoint
CREATE INDEX "fte_aggregate_scope_idx" ON "fiscal_truth_events" USING btree ("aggregate_id","company_id","company_ruc");