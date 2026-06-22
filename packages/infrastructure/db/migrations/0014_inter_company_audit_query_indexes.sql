-- Migration 0014: Audit query indexes for inter-company detraccion endpoint
-- Created: 2026-02-20

CREATE INDEX IF NOT EXISTS "inter_company_transactions_group_rule_idx"
  ON "inter_company_transactions" ("economic_group_id", "detraction_rule_code");

CREATE INDEX IF NOT EXISTS "inter_company_transactions_group_created_at_idx"
  ON "inter_company_transactions" ("economic_group_id", "created_at");
