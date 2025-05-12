-- W2-04B — Natural Uniqueness Constraints
--
-- Adds unique constraints on natural keys for fiscal entities and
-- the external_references tracking table.
--
-- Each constraint includes company_id for multi-tenant isolation.
--
-- Migration pattern:
--   1. Data audit → detect existing duplicates (manual, external)
--   2. Backfill → resolve duplicates before applying constraint
--   3. ADD CONSTRAINT → formalize with proper error messaging
--
-- Related:
--   docs/adr/W2-04A-natural-uniqueness-inventory.md
--

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. sire_submissions — one declaration per company + period + ledger_type
-- ═════════════════════════════════════════════════════════════════════════════

-- Data audit (run manually before migration):
-- SELECT company_id, period, ledger_type, submission_kind, COUNT(*)
-- FROM sire_submissions
-- GROUP BY company_id, period, ledger_type, submission_kind
-- HAVING COUNT(*) > 1;

-- Add submission_kind column for rectificatoria support
ALTER TABLE "sire_submissions" ADD COLUMN IF NOT EXISTS "submission_kind" varchar(20) NOT NULL DEFAULT 'original';
--> statement-breakpoint

-- Drop the old idempotency-key-only unique if it exists (it's handled by W2-03's idempotency_records)
-- The natural unique includes submission_kind to allow original + rectificatoria coexistence
ALTER TABLE "sire_submissions" DROP CONSTRAINT IF EXISTS "sire_submissions_idempotency_key_unique";
--> statement-breakpoint

ALTER TABLE "sire_submissions" ADD CONSTRAINT "uq_sire_submissions_period_ledger"
  UNIQUE (company_id, period, ledger_type, submission_kind);
--> statement-breakpoint

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. journal_entries — one entry per company + period + entry_number
-- ═════════════════════════════════════════════════════════════════════════════

-- Data audit:
-- SELECT company_id, period_key, entry_number, COUNT(*)
-- FROM journal_entries
-- GROUP BY company_id, period_key, entry_number
-- HAVING COUNT(*) > 1;

ALTER TABLE "journal_entries" ADD CONSTRAINT "uq_journal_entries_scope_number"
  UNIQUE (company_id, period_key, entry_number);
--> statement-breakpoint

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. invoices — one document per company + series + correlative
-- ═════════════════════════════════════════════════════════════════════════════

-- NOTE: series is expected to encode document type per SUNAT convention
-- (F001=Factura, B001=Boleta, FC01=NotaCrédito, FD01=NotaDébito).
-- If this convention is not enforced, add document_type to the constraint.

-- Data audit:
-- SELECT company_id, series, correlative, COUNT(*)
-- FROM invoices
-- GROUP BY company_id, series, correlative
-- HAVING COUNT(*) > 1;

ALTER TABLE "invoices" ADD CONSTRAINT "uq_invoices_series_correlative"
  UNIQUE (company_id, series, correlative);
--> statement-breakpoint

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. bills — one bill per company + vendor + bill number
-- ═════════════════════════════════════════════════════════════════════════════

-- Data audit:
-- SELECT company_id, vendor_id, bill_number, COUNT(*)
-- FROM bills
-- GROUP BY company_id, vendor_id, bill_number
-- HAVING COUNT(*) > 1;

ALTER TABLE "bills" ADD CONSTRAINT "uq_bills_vendor_number"
  UNIQUE (company_id, vendor_id, bill_number);
--> statement-breakpoint
    
-- ═════════════════════════════════════════════════════════════════════════════
-- 5. business_partners — one tax_id per company (protects bills UNIQUE)
-- ═════════════════════════════════════════════════════════════════════════════
    
-- Data audit:
-- SELECT company_id, tax_id, COUNT(*)
-- FROM business_partners
-- GROUP BY company_id, tax_id
-- HAVING COUNT(*) > 1;
    
ALTER TABLE "business_partners" ADD CONSTRAINT "uq_business_partners_company_tax_id"
  UNIQUE (company_id, tax_id);
--> statement-breakpoint
    
-- ═════════════════════════════════════════════════════════════════════════════
-- 6. pcge_accounts — one account code per company
-- ═════════════════════════════════════════════════════════════════════════════

-- Data audit:
-- SELECT company_id, code, COUNT(*)
-- FROM pcge_accounts
-- GROUP BY company_id, code
-- HAVING COUNT(*) > 1;

ALTER TABLE "pcge_accounts" ADD CONSTRAINT "uq_pcge_accounts_company_code"
  UNIQUE (company_id, code);
--> statement-breakpoint

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. external_references — tracking external entity references
-- ═════════════════════════════════════════════════════════════════════════════

-- New table for cross-system reference deduplication

CREATE TABLE IF NOT EXISTS "external_references" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "source" varchar(50) NOT NULL,
  "external_id" varchar(255) NOT NULL,
  "entity_type" varchar(50) NOT NULL,
  "entity_id" uuid NOT NULL,
  "raw_data" jsonb,
  "imported_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "external_references" ADD CONSTRAINT "uq_external_refs_scope_source_id"
  UNIQUE (company_id, source, external_id);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_external_refs_entity"
  ON "external_references" ("entity_type", "entity_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_external_refs_source"
  ON "external_references" ("source");
--> statement-breakpoint
