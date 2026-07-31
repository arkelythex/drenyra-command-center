-- M4.2 Durable Missions — receipt security metadata
--
-- Additive and idempotent: existing receipt payload hashes remain unchanged.

ALTER TABLE "mission_receipts"
  ADD COLUMN IF NOT EXISTS "receipt_type" varchar(30);
--> statement-breakpoint

ALTER TABLE "mission_receipts"
  ADD COLUMN IF NOT EXISTS "signature" text;
--> statement-breakpoint

ALTER TABLE "mission_receipts"
  ADD COLUMN IF NOT EXISTS "signature_algorithm" varchar(20) DEFAULT 'Ed25519';
--> statement-breakpoint

ALTER TABLE "mission_receipts"
  ADD COLUMN IF NOT EXISTS "signing_key_id" varchar(255);
--> statement-breakpoint

ALTER TABLE "mission_receipts"
  ADD COLUMN IF NOT EXISTS "issued_at" timestamp with time zone;
--> statement-breakpoint

ALTER TABLE "mission_receipts"
  ADD COLUMN IF NOT EXISTS "protocol_version" varchar(20);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "mission_receipts_signing_key_idx"
  ON "mission_receipts" ("signing_key_id");
