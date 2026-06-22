CREATE TABLE "vendor_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"payment_term_days" integer DEFAULT 30 NOT NULL,
	"preferred_payment_method" varchar(50) DEFAULT 'TRANSFER' NOT NULL,
	"bank_account" text,
	"purchase_categories" jsonb,
	"vendor_rating" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_id_business_partners_id_fk" FOREIGN KEY ("id") REFERENCES "public"."business_partners"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "vendor_profiles_rating_idx" ON "vendor_profiles" USING btree ("vendor_rating");

