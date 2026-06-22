-- Fiscal Audit Ledger — Hash Chain Columns
--
-- Adds cryptographic hash-chaining columns to `fiscal_truth_events` for
-- append-only integrity verification.
--
-- - `prev_hash`: SHA-256 of the previous event in the same scope (or NULL for genesis)
-- - `chain_hash`: SHA-256 of (normalizeJson(payload) + prevHash) — NOT NULL, defaults to '' for pre-migration events
--
-- Migration: 0011 (after 0010_tidy_thena)

ALTER TABLE "fiscal_truth_events"
  ADD COLUMN "prev_hash" varchar(64);

--> statement-breakpoint

ALTER TABLE "fiscal_truth_events"
  ADD COLUMN "chain_hash" varchar(64) NOT NULL DEFAULT '';
