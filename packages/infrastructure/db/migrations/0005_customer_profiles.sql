CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"credit_limit" numeric(19, 2) DEFAULT 0 NOT NULL,
	"credit_days" integer DEFAULT 30 NOT NULL,
	"customer_segment" varchar(50) DEFAULT 'RETAIL' NOT NULL,
	"payment_behavior_score" integer DEFAULT 100,
	"last_purchase_date" timestamp,
	"total_purchases" numeric(19, 2) DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_id_business_partners_id_fk" FOREIGN KEY ("id") REFERENCES "public"."business_partners"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "customer_profiles_segment_idx" ON "customer_profiles" USING btree ("customer_segment");
--> statement-breakpoint
CREATE INDEX "customer_profiles_payment_score_idx" ON "customer_profiles" USING btree ("payment_behavior_score");

