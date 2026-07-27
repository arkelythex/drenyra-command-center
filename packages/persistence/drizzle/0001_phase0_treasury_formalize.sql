-- =============================================================================
-- Phase 0: Treasury Core Formalization — Migration
-- =============================================================================
-- Change: drenyra-treasury-core
-- Phase: 0 — Domain + Schema + Migrations
-- Type: Additive only (zero data loss, no destructive operations)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ALTER: bank_accounts — add provider tracking columns
-- ---------------------------------------------------------------------------
ALTER TABLE bank_accounts
  ADD COLUMN IF NOT EXISTS provider_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 2. ALTER: bank_transactions — add source tracking + batch linking
-- ---------------------------------------------------------------------------
ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS reconciliation_batch_id UUID;

-- Unique index for idempotent transaction ingestion
CREATE UNIQUE INDEX IF NOT EXISTS idx_bt_external_id
  ON bank_transactions(bank_account_id, external_id)
  WHERE external_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. ALTER: bank_reconciliations — add batch lifecycle columns
-- ---------------------------------------------------------------------------
ALTER TABLE bank_reconciliations
  ADD COLUMN IF NOT EXISTS batch_reference VARCHAR(50),
  ADD COLUMN IF NOT EXISTS mode VARCHAR(10) DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS matched_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unmatched_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discrepancy_amount DECIMAL(19,4),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS closed_by UUID;

-- ---------------------------------------------------------------------------
-- 4. CREATE: reconciliation_rules — configurable matching rules
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reconciliation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  rule_type VARCHAR(20) NOT NULL,        -- MATCH | EXCLUSION
  conditions JSONB NOT NULL,              -- { amountTolerance, dateTolerance, matchFields[], ... }
  priority INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rr_company_priority
  ON reconciliation_rules(company_id, priority);

-- ---------------------------------------------------------------------------
-- 5. CREATE: bank_providers — external bank provider connections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  bank_account_id UUID NOT NULL,
  provider_code VARCHAR(20) NOT NULL,     -- PROMETEO | MOCK
  api_credentials JSONB,                  -- AES-256-GCM encrypted at rest
  connection_status VARCHAR(20) DEFAULT 'DISCONNECTED', -- DISCONNECTED | CONNECTING | CONNECTED | ERROR
  feature_flags JSONB,                    -- { liveFeed, syncFrequency, syncWindowDays, ... }
  last_sync_at TIMESTAMP,
  sync_error TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bp_account_provider
  ON bank_providers(bank_account_id, provider_code);

-- =============================================================================
-- ROLLBACK (for reference — DO NOT apply in production unless rollback is needed)
-- =============================================================================
/*
-- Reverse order (dependencies first):
DROP INDEX IF EXISTS idx_bp_account_provider;
DROP TABLE IF EXISTS bank_providers;

DROP INDEX IF EXISTS idx_rr_company_priority;
DROP TABLE IF EXISTS reconciliation_rules;

ALTER TABLE bank_reconciliations
  DROP COLUMN IF EXISTS batch_reference,
  DROP COLUMN IF EXISTS mode,
  DROP COLUMN IF EXISTS matched_count,
  DROP COLUMN IF EXISTS unmatched_count,
  DROP COLUMN IF EXISTS discrepancy_amount,
  DROP COLUMN IF EXISTS closed_at,
  DROP COLUMN IF EXISTS closed_by;

DROP INDEX IF EXISTS idx_bt_external_id;

ALTER TABLE bank_transactions
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS external_id,
  DROP COLUMN IF EXISTS reconciliation_batch_id;

ALTER TABLE bank_accounts
  DROP COLUMN IF EXISTS provider_id,
  DROP COLUMN IF EXISTS last_sync_at;
*/
