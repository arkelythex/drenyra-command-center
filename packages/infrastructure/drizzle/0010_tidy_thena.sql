CREATE TABLE "percepciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bill_id" uuid NOT NULL,
	"agent_ruc" varchar(11) NOT NULL,
	"percepcion_type" varchar(20) NOT NULL,
	"total_amount_cents" integer NOT NULL,
	"percepcion_amount_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"declaration_period" varchar(7) NOT NULL,
	"sunat_due_date" date NOT NULL,
	"pdt_reference" varchar(50),
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"declared_at" timestamp,
	"paid_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE INDEX "percepciones_company_status_idx" ON "percepciones" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "percepciones_company_period_idx" ON "percepciones" USING btree ("company_id","declaration_period");--> statement-breakpoint
CREATE INDEX "percepciones_bill_idx" ON "percepciones" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "percepciones_due_date_idx" ON "percepciones" USING btree ("sunat_due_date");