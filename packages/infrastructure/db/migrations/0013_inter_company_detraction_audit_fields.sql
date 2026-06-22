-- Migration 0013: Persist detraction profile/rule for inter-company auditability
-- Created: 2026-02-20

ALTER TABLE "inter_company_transactions"
  ADD COLUMN IF NOT EXISTS "detraction_profile" varchar(30);

ALTER TABLE "inter_company_transactions"
  ADD COLUMN IF NOT EXISTS "detraction_rule_code" varchar(80);

-- Backfill legacy rows that already had detraction amount but lacked profile/rule context.
UPDATE "inter_company_transactions"
SET
  "detraction_profile" = COALESCE("detraction_profile", 'SERVICES'),
  "detraction_rule_code" = COALESCE("detraction_rule_code", 'DETRACCION_SPOT')
WHERE "detraction_amount" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "inter_company_transactions_group_profile_idx"
  ON "inter_company_transactions" ("economic_group_id", "detraction_profile");

