ALTER TABLE "sunat_knowledge_chunks" ADD COLUMN "embedding" vector(3072);--> statement-breakpoint
ALTER TABLE "sunat_knowledge_chunks" ADD COLUMN "embedding_model" varchar(100);