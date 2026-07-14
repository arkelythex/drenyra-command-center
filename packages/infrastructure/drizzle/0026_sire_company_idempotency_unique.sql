-- PR-3A-2: Scope SIRE idempotency by company (ADR-009)
--
-- Changes UNIQUE(idempotency_key) to UNIQUE(company_id, idempotency_key)
-- so different tenants can reuse the same idempotency key without collision.
--
-- Forward:
--   1. Drop the global unique constraint on idempotency_key
--   2. Add a scoped unique constraint on (company_id, idempotency_key)
--
-- Rollback:
--   1. Drop the scoped unique constraint
--   2. Re-add the global unique constraint on idempotency_key
--   ⚠️ Rollback may fail if cross-company duplicate keys exist.
--     Ensure no duplicates before rolling back.
--
-- Related:
--   packages/persistence/src/schema/sire.schema.ts
--   docs/adr/ADR-009-canonical-idempotency-contract.md
--

--> statement-breakpoint

-- Drop the old global unique constraint
ALTER TABLE "sire_submissions" DROP CONSTRAINT IF EXISTS "sire_submissions_idempotency_key_unique";

--> statement-breakpoint

-- Add scoped unique on (company_id, idempotency_key)
-- Per ADR-009: UNIQUE(organization_id, company_id, operation, idempotency_key)
-- Here simplified to UNIQUE(company_id, idempotency_key) since operation is implicit.
ALTER TABLE "sire_submissions" ADD CONSTRAINT "sire_company_idempotency_unique"
  UNIQUE ("company_id", "idempotency_key");
