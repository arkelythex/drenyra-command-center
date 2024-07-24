-- ================================================================
-- H02 Wave 6.2 — RLS Activation Step 3
-- Migration: 0030_h02_rls_activate_step_3
--
-- Activates RESTRICTIVE RLS on:
--   - agent_run_states (company-scoped)
--   - agent_run_events (company-scoped)
--
-- These are lower-risk tables (agent execution state, append-only
-- event log for AI workflow runs). Activate last after proving
-- Steps 1 and 2 are stable.
--
-- ⚠️  Prerequisites:
--   1. Steps 1 and 2 activated successfully (48h+ with no issues)
--   2. AI Swarm / workers reliably set tenant context before queries
--   3. Zero cross-tenant violations across all previously activated tables
-- ================================================================

BEGIN;

-- ============================================================
-- Step 3a: agent_run_states
-- ============================================================
-- Company-scoped. Uses company_id (UUID column).
-- No organization_id column — pure company-level isolation.

-- Remove shadow PERMISSIVE policy
DROP POLICY IF EXISTS tenant_isolation_shadow_agent_run_states ON agent_run_states;

-- Remove shadow trigger
DROP TRIGGER IF EXISTS trg_agent_run_states_shadow ON agent_run_states;

-- ACTIVATE: RESTRICTIVE policy matching company_id
CREATE POLICY tenant_isolation_agent_run_states ON agent_run_states
  AS RESTRICTIVE
  FOR ALL
  USING (company_id::text = arkalythix_security.current_company_id())
  WITH CHECK (company_id::text = arkalythix_security.current_company_id());

-- ============================================================
-- Step 3b: agent_run_events
-- ============================================================
-- Company-scoped. Uses company_id (UUID column).
-- Append-only event log for agent runs.

-- Remove shadow PERMISSIVE policy
DROP POLICY IF EXISTS tenant_isolation_shadow_agent_run_events ON agent_run_events;

-- Remove shadow trigger
DROP TRIGGER IF EXISTS trg_agent_run_events_shadow ON agent_run_events;

-- ACTIVATE: RESTRICTIVE policy matching company_id
CREATE POLICY tenant_isolation_agent_run_events ON agent_run_events
  AS RESTRICTIVE
  FOR ALL
  USING (company_id::text = arkalythix_security.current_company_id())
  WITH CHECK (company_id::text = arkalythix_security.current_company_id());

-- ============================================================
-- Post-activation: verify all 7 tables are RESTRICTIVE
-- ============================================================

-- Quick sanity check (does not block commit if any are missing):
DO $$
DECLARE
  restrictive_count integer;
BEGIN
  SELECT count(*) INTO restrictive_count
  FROM pg_catalog.pg_policy pol
  JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
  WHERE c.relname IN (
    'sire_submissions', 'fiscal_evidence_nodes', 'fiscal_evidence_edges',
    'fiscal_truth_events', 'documents', 'agent_run_states', 'agent_run_events'
  )
  AND pol.polpermissive = false;

  IF restrictive_count >= 7 THEN
    RAISE NOTICE '✅ All % target tables have RESTRICTIVE RLS policies', restrictive_count;
  ELSE
    RAISE WARNING '⚠️  Only %/7 tables have RESTRICTIVE policies. Check previous steps.', restrictive_count;
  END IF;
END $$;

-- ============================================================
-- Rollback (Step 3)
-- ============================================================
--
-- BEGIN;
--   DROP POLICY IF EXISTS tenant_isolation_agent_run_states ON agent_run_states;
--   DROP POLICY IF EXISTS tenant_isolation_agent_run_events ON agent_run_events;
--
--   CREATE POLICY tenant_isolation_shadow_agent_run_states ON agent_run_states
--     AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
--   CREATE POLICY tenant_isolation_shadow_agent_run_events ON agent_run_events
--     AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
-- COMMIT;

COMMIT;
