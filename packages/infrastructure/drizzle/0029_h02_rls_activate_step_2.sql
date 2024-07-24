-- ================================================================
-- H02 Wave 6.2 — RLS Activation Step 2
-- Migration: 0029_h02_rls_activate_step_2
--
-- Activates RESTRICTIVE RLS on:
--   - documents (company-scoped)
--   - fiscal_truth_events (organization-scoped, FORCE RLS)
--
-- These are medium-risk tables. Documents hold sensitive fiscal
-- evidence. Fiscal truth events are the append-only event ledger.
--
-- ⚠️  Prerequisites:
--   1. Step 1 activated successfully (24h+ with no issues)
--   2. Application context is reliably set for all operations
--   3. No violations in tenant_violation_log for Step 1 tables
-- ================================================================

BEGIN;

-- ============================================================
-- Step 2a: documents
-- ============================================================
-- Company-scoped. Uses company_id (UUID column).
-- organization_id (int) remains as transition column.

-- Remove shadow PERMISSIVE policy
DROP POLICY IF EXISTS tenant_isolation_shadow_documents ON documents;

-- Remove shadow trigger
DROP TRIGGER IF EXISTS trg_documents_shadow ON documents;

-- ACTIVATE: RESTRICTIVE policy matching company_id
CREATE POLICY tenant_isolation_documents ON documents
  AS RESTRICTIVE
  FOR ALL
  USING (company_id::text = arkalythix_security.current_company_id())
  WITH CHECK (company_id::text = arkalythix_security.current_company_id());

-- ============================================================
-- Step 2b: fiscal_truth_events
-- ============================================================
-- Organization-scoped. Uses organization_id (varchar column).
-- This is the append-only event ledger — FORCE RLS is critical.

-- Remove shadow PERMISSIVE policy
DROP POLICY IF EXISTS tenant_isolation_shadow_fiscal_truth_events ON fiscal_truth_events;

-- Remove shadow trigger
DROP TRIGGER IF EXISTS trg_fiscal_truth_events_shadow ON fiscal_truth_events;

-- ACTIVATE: RESTRICTIVE policy matching organization_id
CREATE POLICY tenant_isolation_fiscal_truth_events ON fiscal_truth_events
  AS RESTRICTIVE
  FOR ALL
  USING (organization_id = arkalythix_security.current_organization_id())
  WITH CHECK (organization_id = arkalythix_security.current_organization_id());

-- FAIL-CLOSED
CREATE POLICY tenant_isolation_fiscal_truth_events_fail_closed ON fiscal_truth_events
  AS RESTRICTIVE
  FOR ALL
  USING (arkalythix_security.current_organization_id() IS NOT NULL);

-- FORCE RLS — event ledger must never leak
ALTER TABLE fiscal_truth_events FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Rollback (Step 2)
-- ============================================================
--
-- BEGIN;
--   DROP POLICY IF EXISTS tenant_isolation_documents ON documents;
--   DROP POLICY IF EXISTS tenant_isolation_fiscal_truth_events ON fiscal_truth_events;
--   DROP POLICY IF EXISTS tenant_isolation_fiscal_truth_events_fail_closed ON fiscal_truth_events;
--
--   ALTER TABLE fiscal_truth_events NO FORCE ROW LEVEL SECURITY;
--
--   CREATE POLICY tenant_isolation_shadow_documents ON documents
--     AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
--   CREATE POLICY tenant_isolation_shadow_fiscal_truth_events ON fiscal_truth_events
--     AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
-- COMMIT;

COMMIT;
