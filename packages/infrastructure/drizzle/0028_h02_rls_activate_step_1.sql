-- ================================================================
-- H02 Wave 6.2 — RLS Activation Step 1
-- Migration: 0028_h02_rls_activate_step_1
--
-- Activates RESTRICTIVE RLS on:
--   - sire_submissions (company-scoped)
--   - fiscal_evidence_nodes (organization-scoped, FORCE RLS)
--   - fiscal_evidence_edges (organization-scoped)
--
-- These are the highest-risk tables (SIRE submissions + evidence graph).
-- Activate first, monitor for 24h, then proceed to Step 2.
--
-- ⚠️  Prerequisites:
--   1. Wave 6.1 shadow migration applied
--   2. Application already sets app.current_organization_id
--      and app.current_company_id via SET LOCAL in every request
--   3. tenant_violation_log shows zero violations for 48h
-- ================================================================

BEGIN;

-- ============================================================
-- Step 1a: sire_submissions
-- ============================================================
-- Company-scoped. Uses company_id (UUID column).

-- Remove shadow PERMISSIVE policy
DROP POLICY IF EXISTS tenant_isolation_shadow_sire_submissions ON sire_submissions;

-- Remove shadow trigger (no longer needed in active mode)
DROP TRIGGER IF EXISTS trg_sire_submissions_shadow ON sire_submissions;

-- Create RESTRICTIVE policy — only rows matching current company
CREATE POLICY tenant_isolation_sire_submissions ON sire_submissions
  AS RESTRICTIVE
  FOR ALL
  USING (company_id::text = arkalythix_security.current_company_id())
  WITH CHECK (company_id::text = arkalythix_security.current_company_id());

-- ============================================================
-- Step 1b: fiscal_evidence_nodes
-- ============================================================
-- Organization-scoped. Uses organization_id (varchar column).
-- FORCE RLS ensures table owners (app_admin) cannot bypass.

-- Remove shadow PERMISSIVE policy
DROP POLICY IF EXISTS tenant_isolation_shadow_evidence_nodes ON fiscal_evidence_nodes;

-- Remove shadow trigger
DROP TRIGGER IF EXISTS trg_evidence_nodes_shadow ON fiscal_evidence_nodes;

-- ACTIVATE: RESTRICTIVE policy matching organization_id
CREATE POLICY tenant_isolation_evidence_nodes ON fiscal_evidence_nodes
  AS RESTRICTIVE
  FOR ALL
  USING (organization_id = arkalythix_security.current_organization_id())
  WITH CHECK (organization_id = arkalythix_security.current_organization_id());

-- FAIL-CLOSED: if no organization context is set, return 0 rows
CREATE POLICY tenant_isolation_evidence_nodes_fail_closed ON fiscal_evidence_nodes
  AS RESTRICTIVE
  FOR ALL
  USING (arkalythix_security.current_organization_id() IS NOT NULL);

-- FORCE RLS — owners cannot bypass
ALTER TABLE fiscal_evidence_nodes FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Step 1c: fiscal_evidence_edges
-- ============================================================
-- Organization-scoped. Uses organization_id (varchar column).

-- Remove shadow PERMISSIVE policy
DROP POLICY IF EXISTS tenant_isolation_shadow_evidence_edges ON fiscal_evidence_edges;

-- Remove shadow trigger
DROP TRIGGER IF EXISTS trg_evidence_edges_shadow ON fiscal_evidence_edges;

-- ACTIVATE: RESTRICTIVE policy matching organization_id
CREATE POLICY tenant_isolation_evidence_edges ON fiscal_evidence_edges
  AS RESTRICTIVE
  FOR ALL
  USING (organization_id = arkalythix_security.current_organization_id())
  WITH CHECK (organization_id = arkalythix_security.current_organization_id());

-- FAIL-CLOSED
CREATE POLICY tenant_isolation_evidence_edges_fail_closed ON fiscal_evidence_edges
  AS RESTRICTIVE
  FOR ALL
  USING (arkalythix_security.current_organization_id() IS NOT NULL);

-- ============================================================
-- Rollback (Step 1)
-- ============================================================
--
-- To rollback Step 1 activation:
--
-- BEGIN;
--   DROP POLICY IF EXISTS tenant_isolation_sire_submissions ON sire_submissions;
--   DROP POLICY IF EXISTS tenant_isolation_evidence_nodes ON fiscal_evidence_nodes;
--   DROP POLICY IF EXISTS tenant_isolation_evidence_nodes_fail_closed ON fiscal_evidence_nodes;
--   DROP POLICY IF EXISTS tenant_isolation_evidence_edges ON fiscal_evidence_edges;
--   DROP POLICY IF EXISTS tenant_isolation_evidence_edges_fail_closed ON fiscal_evidence_edges;
--
--   ALTER TABLE fiscal_evidence_nodes NO FORCE ROW LEVEL SECURITY;
--
--   -- Re-create shadow policies (copy from 0027 migration)
--   CREATE POLICY tenant_isolation_shadow_sire_submissions ON sire_submissions
--     AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
--   CREATE POLICY tenant_isolation_shadow_evidence_nodes ON fiscal_evidence_nodes
--     AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
--   CREATE POLICY tenant_isolation_shadow_evidence_edges ON fiscal_evidence_edges
--     AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
-- COMMIT;

COMMIT;
