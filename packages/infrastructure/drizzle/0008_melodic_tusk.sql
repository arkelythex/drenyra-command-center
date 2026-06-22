CREATE TABLE "accounting_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"status" varchar(20) DEFAULT 'abierto' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cpe_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"sunat_status" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"submitted_at" timestamp,
	"accepted_at" timestamp,
	"rejected_at" timestamp,
	"observed_at" timestamp,
	"cancelled_at" timestamp,
	"sunat_ticket" varchar(255),
	"cdr_data" jsonb,
	"hash_value" varchar(128),
	"hash_algorithm" varchar(50) DEFAULT 'SHA-256',
	"error_message" text,
	"error_code" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detractions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"spot_code" varchar(3) NOT NULL,
	"percentage" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"reference" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"currency_from" varchar(3) NOT NULL,
	"currency_to" varchar(3) NOT NULL,
	"buy_rate" integer NOT NULL,
	"sell_rate" integer NOT NULL,
	"sunat_reference" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"period_key" varchar(7) NOT NULL,
	"date" timestamp NOT NULL,
	"gloss" text NOT NULL,
	"status" varchar(20) DEFAULT 'borrador' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entry_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" uuid NOT NULL,
	"account_code" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"debit_cents" integer DEFAULT 0 NOT NULL,
	"credit_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pcge_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" varchar(1) NOT NULL,
	"type" varchar(50) NOT NULL,
	"parent_id" uuid,
	"is_active" varchar(1) DEFAULT 'S' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounting_periods" ADD CONSTRAINT "accounting_periods_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cpe_log" ADD CONSTRAINT "cpe_log_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detractions" ADD CONSTRAINT "detractions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_rates" ADD CONSTRAINT "exchange_rates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pcge_accounts" ADD CONSTRAINT "pcge_accounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounting_periods_company_period_idx" ON "accounting_periods" USING btree ("company_id","year","month");--> statement-breakpoint
CREATE INDEX "accounting_periods_status_idx" ON "accounting_periods" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cpe_log_company_invoice_status_idx" ON "cpe_log" USING btree ("company_id","invoice_id","sunat_status");--> statement-breakpoint
CREATE INDEX "cpe_log_status_idx" ON "cpe_log" USING btree ("sunat_status");--> statement-breakpoint
CREATE INDEX "detractions_company_status_idx" ON "detractions" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "detractions_spot_code_idx" ON "detractions" USING btree ("spot_code");--> statement-breakpoint
CREATE INDEX "exchange_rates_company_currency_idx" ON "exchange_rates" USING btree ("company_id","currency_from","currency_to");--> statement-breakpoint
CREATE INDEX "exchange_rates_date_idx" ON "exchange_rates" USING btree ("date");--> statement-breakpoint
CREATE INDEX "journal_entries_company_period_idx" ON "journal_entries" USING btree ("company_id","period_key");--> statement-breakpoint
CREATE INDEX "journal_entries_entry_number_idx" ON "journal_entries" USING btree ("entry_number");--> statement-breakpoint
CREATE INDEX "journal_entries_status_idx" ON "journal_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "journal_entry_lines_entry_idx" ON "journal_entry_lines" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "journal_entry_lines_account_idx" ON "journal_entry_lines" USING btree ("account_code");--> statement-breakpoint
CREATE INDEX "pcge_company_code_idx" ON "pcge_accounts" USING btree ("company_id","code");--> statement-breakpoint
CREATE INDEX "pcge_parent_idx" ON "pcge_accounts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "pcge_level_idx" ON "pcge_accounts" USING btree ("level");