CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'SENT', 'OVERDUE', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."tax_type" AS ENUM('GRAVADO', 'EXONERADO', 'INAFECTO');--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" varchar(50) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "auth_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"ruc" text DEFAULT '',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"account_name" varchar(200) NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"account_type" varchar(20) NOT NULL,
	"bank_name" varchar(100) NOT NULL,
	"bank_code" varchar(10),
	"branch" varchar(100),
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"current_balance" numeric(19, 4) DEFAULT '0' NOT NULL,
	"available_balance" numeric(19, 4),
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bank_reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"opening_balance" numeric(19, 4) NOT NULL,
	"closing_balance" numeric(19, 4) NOT NULL,
	"statement_balance" numeric(19, 4),
	"status" varchar(20) DEFAULT 'IN_PROGRESS',
	"difference" numeric(19, 4),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"completed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "bank_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"transaction_date" date NOT NULL,
	"description" text NOT NULL,
	"reference" varchar(100),
	"type" varchar(10) NOT NULL,
	"amount" numeric(19, 4) NOT NULL,
	"balance" numeric(19, 4),
	"category" varchar(50),
	"tags" text,
	"is_reconciled" boolean DEFAULT false,
	"reconciled_at" timestamp,
	"reconciled_by" uuid,
	"invoice_id" uuid,
	"bill_id" uuid,
	"payment_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"imported_from" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "bill_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"product_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"bill_number" varchar(50) NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency" "currency" DEFAULT 'PEN' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"subtotal_amount" numeric(12, 2) NOT NULL,
	"igv_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"notes" text,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "economic_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"group_name" varchar(255) NOT NULL,
	"group_code" varchar(50) NOT NULL,
	"subscription_tier" varchar(50) DEFAULT 'PROFESSIONAL',
	"monthly_fee" numeric(10, 2) DEFAULT '350.00',
	"max_companies" integer DEFAULT -1,
	"default_currency" varchar(3) DEFAULT 'PEN',
	"timezone" varchar(50) DEFAULT 'America/Lima',
	"is_active" boolean DEFAULT true,
	"trial_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "economic_groups_group_code_unique" UNIQUE("group_code")
);
--> statement-breakpoint
CREATE TABLE "firm_model_learnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firm_model_id" uuid NOT NULL,
	"transaction_id" uuid,
	"proposed_classification" text NOT NULL,
	"actual_classification" text,
	"was_approved" boolean DEFAULT false,
	"correction_reason" text,
	"confidence" numeric(5, 2),
	"processing_time" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "firm_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"economic_group_id" uuid NOT NULL,
	"model_name" varchar(255) NOT NULL,
	"model_type" varchar(50) NOT NULL,
	"base_model" varchar(100) DEFAULT 'gemini-2.0-flash',
	"temperature" numeric(3, 2) DEFAULT '0.10',
	"training_examples" text NOT NULL,
	"accuracy" numeric(5, 2),
	"last_trained_at" timestamp,
	"custom_rules" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inter_company_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"economic_group_id" uuid NOT NULL,
	"from_company_id" uuid NOT NULL,
	"from_transaction_id" uuid,
	"to_company_id" uuid NOT NULL,
	"to_transaction_id" uuid,
	"concept" varchar(500) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN',
	"tax_type" varchar(50) DEFAULT 'GRAVADO',
	"igv_amount" numeric(12, 2),
	"detraction_amount" numeric(12, 2),
	"detraction_rate" numeric(5, 2),
	"status" varchar(50) DEFAULT 'PENDING',
	"reconciled_at" timestamp,
	"spot_pdf_url" text,
	"spot_reference_number" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"quantity" numeric(19, 4) DEFAULT '0' NOT NULL,
	"min_stock" numeric(19, 4),
	"max_stock" numeric(19, 4),
	"unit_cost" numeric(19, 4),
	"total_value" numeric(19, 4),
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"warehouse_id" uuid,
	"type" varchar(20) NOT NULL,
	"quantity" numeric(19, 4) NOT NULL,
	"unit_cost" numeric(19, 4),
	"total_cost" numeric(19, 4),
	"reference" varchar(100),
	"reference_id" uuid,
	"reference_number" varchar(50),
	"notes" text,
	"reason" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"product_id" uuid,
	"description" varchar(500) NOT NULL,
	"quantity" numeric(12, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"tax_type" "tax_type" DEFAULT 'GRAVADO' NOT NULL,
	"igv_rate" numeric(5, 2) DEFAULT '18.00' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"igv_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"series" varchar(10) NOT NULL,
	"correlative" integer NOT NULL,
	"issue_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp NOT NULL,
	"currency" "currency" DEFAULT 'PEN' NOT NULL,
	"exchange_rate" numeric(10, 4) DEFAULT '1.0000' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"igv_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'DRAFT' NOT NULL,
	"sunat_status" "sunat_status" DEFAULT 'DRAFT',
	"paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"balance_due" numeric(12, 2) NOT NULL,
	"paid_date" timestamp,
	"xml_url" text,
	"cdr_url" text,
	"pdf_url" text,
	"notes" text,
	"tags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partial_payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partial_payment_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"amount" varchar(30) NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partial_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"total_paid" varchar(30) NOT NULL,
	"total_due" varchar(30) NOT NULL,
	"currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"status" varchar(20) DEFAULT 'PARTIAL' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"reference" varchar(255),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"sku" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"unit_price" numeric(12, 2) NOT NULL,
	"cost_price" numeric(12, 2),
	"tax_type" "tax_type" DEFAULT 'GRAVADO' NOT NULL,
	"unit" varchar(20) DEFAULT 'UND' NOT NULL,
	"stock_quantity" numeric(12, 2) DEFAULT '0',
	"min_stock" numeric(12, 2),
	"max_stock" numeric(12, 2),
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(500) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_reconciliation_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_type" varchar(20) NOT NULL,
	"match_score" integer NOT NULL,
	"match_criteria" varchar(50) NOT NULL,
	"is_partial" boolean DEFAULT false,
	"partial_sequence" integer,
	"is_confirmed" boolean DEFAULT false,
	"confirmed_at" timestamp,
	"confirmed_by" uuid,
	"is_rejected" boolean DEFAULT false,
	"rejected_at" timestamp,
	"rejected_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(50),
	"address" text,
	"city" varchar(100),
	"country" varchar(2) DEFAULT 'PE',
	"phone" varchar(20),
	"email" varchar(100),
	"manager" varchar(100),
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "economic_group_id" uuid;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "is_primary" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" varchar(50) DEFAULT 'USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_items" ADD CONSTRAINT "bill_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_vendor_id_business_partners_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."business_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_model_learnings" ADD CONSTRAINT "firm_model_learnings_firm_model_id_firm_models_id_fk" FOREIGN KEY ("firm_model_id") REFERENCES "public"."firm_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "firm_models" ADD CONSTRAINT "firm_models_economic_group_id_economic_groups_id_fk" FOREIGN KEY ("economic_group_id") REFERENCES "public"."economic_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_company_transactions" ADD CONSTRAINT "inter_company_transactions_economic_group_id_economic_groups_id_fk" FOREIGN KEY ("economic_group_id") REFERENCES "public"."economic_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_business_partners_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."business_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bill_item_bill_idx" ON "bill_items" USING btree ("bill_id");--> statement-breakpoint
CREATE INDEX "bill_company_idx" ON "bills" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "bill_vendor_idx" ON "bills" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "invoice_item_invoice_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_company_series_idx" ON "invoices" USING btree ("company_id","series","correlative");--> statement-breakpoint
CREATE INDEX "invoice_customer_idx" ON "invoices" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_company_idx" ON "payments" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "payment_invoice_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "product_company_sku_idx" ON "products" USING btree ("company_id","sku");