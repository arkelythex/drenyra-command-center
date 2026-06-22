ALTER TABLE "sunat_knowledge_chunks" ALTER COLUMN "embedding" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "settings_language" varchar(10) DEFAULT 'es';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "settings_timezone" varchar(50) DEFAULT 'America/Lima';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "settings_currency" varchar(3) DEFAULT 'PEN';--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "settings_auto_close_period" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "settings_show_amounts_in_words" boolean DEFAULT false;