-- H02 Wave 6.2 — RLS Activation Verification
--
-- Run against the test database to verify all RESTRICTIVE RLS policies exist.
-- Usage: psql $DATABASE_URL_TEST -f verify-h02-rls-activation.sql
--
-- ⚠️  This is the RED phase — these checks should FAIL until
--     the activation migration is applied.

-- ─── 1. RESTRICTIVE policies exist (replaced PERMISSIVE shadow) ──────────────────

-- After activation, the shadow PERMISSIVE policies should be DROPPED and
-- replaced with RESTRICTIVE tenant_isolation_{table} policies.

SELECT '1.1' as check, 'RESTRICTIVE policy on sire_submissions' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'sire_submissions'
      AND pol.polname = 'tenant_isolation_sire_submissions'
      AND pol.polpermissive = false) as pass;

SELECT '1.2' as check, 'RESTRICTIVE policy on fiscal_evidence_nodes' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_nodes'
      AND pol.polname = 'tenant_isolation_evidence_nodes'
      AND pol.polpermissive = false) as pass;

SELECT '1.3' as check, 'RESTRICTIVE policy on fiscal_evidence_edges' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_edges'
      AND pol.polname = 'tenant_isolation_evidence_edges'
      AND pol.polpermissive = false) as pass;

SELECT '1.4' as check, 'RESTRICTIVE policy on fiscal_truth_events' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_truth_events'
      AND pol.polname = 'tenant_isolation_fiscal_truth_events'
      AND pol.polpermissive = false) as pass;

SELECT '1.5' as check, 'RESTRICTIVE policy on documents' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'documents'
      AND pol.polname = 'tenant_isolation_documents'
      AND pol.polpermissive = false) as pass;

SELECT '1.6' as check, 'RESTRICTIVE policy on agent_run_states' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'agent_run_states'
      AND pol.polname = 'tenant_isolation_agent_run_states'
      AND pol.polpermissive = false) as pass;

SELECT '1.7' as check, 'RESTRICTIVE policy on agent_run_events' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'agent_run_events'
      AND pol.polname = 'tenant_isolation_agent_run_events'
      AND pol.polpermissive = false) as pass;

-- ─── 2. Shadow PERMISSIVE policies removed ──────────────────────────────────────

-- After activation, the old shadow policies should no longer exist.

SELECT '2.1' as check, 'shadow PERMISSIVE removed from sire_submissions' as desc,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'sire_submissions'
      AND pol.polname = 'tenant_isolation_shadow_sire_submissions') as pass;

SELECT '2.2' as check, 'shadow PERMISSIVE removed from fiscal_evidence_nodes' as desc,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_nodes'
      AND pol.polname = 'tenant_isolation_shadow_evidence_nodes') as pass;

SELECT '2.3' as check, 'shadow PERMISSIVE removed from documents' as desc,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'documents'
      AND pol.polname = 'tenant_isolation_shadow_documents') as pass;

SELECT '2.4' as check, 'shadow PERMISSIVE removed from agent_run_states' as desc,
  NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'agent_run_states'
      AND pol.polname = 'tenant_isolation_shadow_agent_run_states') as pass;

-- ─── 3. Fail-closed policies exist (no context → 0 rows) ─────────────────────────

-- For organization-scoped tables, a second RESTRICTIVE policy ensures
-- that queries without app.current_organization_id return 0 rows.

SELECT '3.1' as check, 'fail-closed policy on fiscal_evidence_nodes' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_nodes'
      AND pol.polname = 'tenant_isolation_evidence_nodes_fail_closed') as pass;

SELECT '3.2' as check, 'fail-closed policy on fiscal_evidence_edges' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_edges'
      AND pol.polname = 'tenant_isolation_evidence_edges_fail_closed') as pass;

SELECT '3.3' as check, 'fail-closed policy on fiscal_truth_events' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_truth_events'
      AND pol.polname = 'tenant_isolation_fiscal_truth_events_fail_closed') as pass;

-- ─── 4. FORCE ROW LEVEL SECURITY on critical tables ─────────────────────────────

-- FORCE RLS ensures table owners cannot bypass RLS
SELECT '4.1' as check, 'FORCE RLS on fiscal_evidence_nodes' as desc,
  (SELECT relforcerowsecurity FROM pg_catalog.pg_class
    WHERE relname = 'fiscal_evidence_nodes') as pass;

SELECT '4.2' as check, 'FORCE RLS on fiscal_truth_events' as desc,
  (SELECT relforcerowsecurity FROM pg_catalog.pg_class
    WHERE relname = 'fiscal_truth_events') as pass;

-- ─── 5. Summary ─────────────────────────────────────────────────────────────────

DO $$
DECLARE
  total_checks integer := 0;
  passed_checks integer := 0;
  r record;
BEGIN
  FOR r IN
    SELECT '1.1' as check_id,
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'sire_submissions' AND pol.polname = 'tenant_isolation_sire_submissions' AND pol.polpermissive = false) as pass
    UNION ALL SELECT '1.2',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'fiscal_evidence_nodes' AND pol.polname = 'tenant_isolation_evidence_nodes' AND pol.polpermissive = false)
    UNION ALL SELECT '1.3',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'fiscal_evidence_edges' AND pol.polname = 'tenant_isolation_evidence_edges' AND pol.polpermissive = false)
    UNION ALL SELECT '1.5',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'documents' AND pol.polname = 'tenant_isolation_documents' AND pol.polpermissive = false)
    UNION ALL SELECT '1.6',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'agent_run_states' AND pol.polname = 'tenant_isolation_agent_run_states' AND pol.polpermissive = false)
    UNION ALL SELECT '1.7',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'agent_run_events' AND pol.polname = 'tenant_isolation_agent_run_events' AND pol.polpermissive = false)
    UNION ALL SELECT '2.1',
      NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'sire_submissions' AND pol.polname = 'tenant_isolation_shadow_sire_submissions')
    UNION ALL SELECT '2.2',
      NOT EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'fiscal_evidence_nodes' AND pol.polname = 'tenant_isolation_shadow_evidence_nodes')
    UNION ALL SELECT '3.1',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'fiscal_evidence_nodes' AND pol.polname = 'tenant_isolation_evidence_nodes_fail_closed')
    UNION ALL SELECT '4.1',
      (SELECT relforcerowsecurity FROM pg_catalog.pg_class WHERE relname = 'fiscal_evidence_nodes')
    UNION ALL SELECT '4.2',
      (SELECT relforcerowsecurity FROM pg_catalog.pg_class WHERE relname = 'fiscal_truth_events')
  LOOP
    total_checks := total_checks + 1;
    IF r.pass THEN
      passed_checks := passed_checks + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUMMARY: %/% checks passed', passed_checks, total_checks;
  IF passed_checks = total_checks THEN
    RAISE NOTICE 'RESULT: PASS — All RLS activation policies verified';
  ELSE
    RAISE NOTICE 'RESULT: FAIL — % check(s) did not pass. Apply activation SQL first.', total_checks - passed_checks;
  END IF;
  RAISE NOTICE '========================================';
END $$;
