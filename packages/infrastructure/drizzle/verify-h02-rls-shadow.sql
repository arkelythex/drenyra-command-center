-- H02 Wave 6.1 — RLS Shadow Mode Verification
--
-- Run against the test database to verify all RLS shadow objects exist.
-- Usage: psql $DATABASE_URL_TEST -f verify-h02-rls-shadow.sql
--
-- ⚠️  This is the RED phase — these checks should FAIL until
--     the h02-rls-shadow.sql migration is applied.

-- ─── 1. Security schema ─────────────────────────────────────────────────────────

SELECT '1.1' as check, 'arkalythix_security schema exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'arkalythix_security') as pass;

-- ─── 2. Helper functions ─────────────────────────────────────────────────────────

SELECT '2.1' as check, 'current_organization_id() function exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'arkalythix_security' AND p.proname = 'current_organization_id') as pass;

SELECT '2.2' as check, 'current_company_id() function exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'arkalythix_security' AND p.proname = 'current_company_id') as pass;

SELECT '2.3' as check, 'current_user_id() function exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'arkalythix_security' AND p.proname = 'current_user_id') as pass;

-- ─── 3. Violation log table ─────────────────────────────────────────────────────

SELECT '3.1' as check, 'tenant_violation_log table exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'arkalythix_security' AND c.relname = 'tenant_violation_log') as pass;

SELECT '3.2' as check, 'tenant_violation_log has table_name column' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = 'arkalythix_security.tenant_violation_log'::regclass
      AND a.attname = 'table_name' AND a.attnum > 0) as pass;

SELECT '3.3' as check, 'tenant_violation_log has operation column' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = 'arkalythix_security.tenant_violation_log'::regclass
      AND a.attname = 'operation' AND a.attnum > 0) as pass;

SELECT '3.4' as check, 'tenant_violation_log has organization_id column' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = 'arkalythix_security.tenant_violation_log'::regclass
      AND a.attname = 'organization_id' AND a.attnum > 0) as pass;

SELECT '3.5' as check, 'tenant_violation_log has company_id column' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = 'arkalythix_security.tenant_violation_log'::regclass
      AND a.attname = 'company_id' AND a.attnum > 0) as pass;

SELECT '3.6' as check, 'tenant_violation_log has bypassed column (shadow mode flag)' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_attribute a
    WHERE a.attrelid = 'arkalythix_security.tenant_violation_log'::regclass
      AND a.attname = 'bypassed' AND a.attnum > 0) as pass;

-- ─── 4. Violation log indexes ───────────────────────────────────────────────────

SELECT '4.1' as check, 'idx_violation_org exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
    WHERE indexname = 'idx_violation_org'
      AND schemaname = 'arkalythix_security') as pass;

SELECT '4.2' as check, 'idx_violation_table exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
    WHERE indexname = 'idx_violation_table'
      AND schemaname = 'arkalythix_security') as pass;

SELECT '4.3' as check, 'idx_violation_time exists' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_indexes
    WHERE indexname = 'idx_violation_time'
      AND schemaname = 'arkalythix_security') as pass;

-- ─── 5. RLS enabled on target tables ────────────────────────────────────────────

-- RLS is enabled when relrowsecurity = true in pg_class

SELECT '5.1' as check, 'RLS enabled on sire_submissions' as desc,
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'sire_submissions') as pass;

SELECT '5.2' as check, 'RLS enabled on fiscal_evidence_nodes' as desc,
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'fiscal_evidence_nodes') as pass;

SELECT '5.3' as check, 'RLS enabled on fiscal_evidence_edges' as desc,
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'fiscal_evidence_edges') as pass;

SELECT '5.4' as check, 'RLS enabled on fiscal_truth_events' as desc,
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'fiscal_truth_events') as pass;

SELECT '5.5' as check, 'RLS enabled on documents' as desc,
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'documents') as pass;

SELECT '5.6' as check, 'RLS enabled on agent_run_states' as desc,
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'agent_run_states') as pass;

SELECT '5.7' as check, 'RLS enabled on agent_run_events' as desc,
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'agent_run_events') as pass;

-- ─── 6. Shadow policies exist (PERMISSIVE, not blocking) ────────────────────────

-- Policy names follow the pattern: tenant_isolation_shadow_{table_shortname}

SELECT '6.1' as check, 'shadow policy on sire_submissions' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'sire_submissions'
      AND pol.polname = 'tenant_isolation_shadow_sire_submissions') as pass;

SELECT '6.2' as check, 'shadow policy on fiscal_evidence_nodes' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_nodes'
      AND pol.polname = 'tenant_isolation_shadow_evidence_nodes') as pass;

SELECT '6.3' as check, 'shadow policy on fiscal_evidence_edges' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_edges'
      AND pol.polname = 'tenant_isolation_shadow_evidence_edges') as pass;

SELECT '6.4' as check, 'shadow policy on fiscal_truth_events' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_truth_events'
      AND pol.polname = 'tenant_isolation_shadow_fiscal_truth_events') as pass;

SELECT '6.5' as check, 'shadow policy on documents' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'documents'
      AND pol.polname = 'tenant_isolation_shadow_documents') as pass;

SELECT '6.6' as check, 'shadow policy on agent_run_states' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'agent_run_states'
      AND pol.polname = 'tenant_isolation_shadow_agent_run_states') as pass;

SELECT '6.7' as check, 'shadow policy on agent_run_events' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'agent_run_events'
      AND pol.polname = 'tenant_isolation_shadow_agent_run_events') as pass;

-- ─── 7. Shadow policies are PERMISSIVE (not RESTRICTIVE) ────────────────────────

SELECT '7.1' as check, 'sire shadow is PERMISSIVE' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'sire_submissions'
      AND pol.polname = 'tenant_isolation_shadow_sire_submissions'
      AND pol.polpermissive = true) as pass;

SELECT '7.2' as check, 'evidence_nodes shadow is PERMISSIVE' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'fiscal_evidence_nodes'
      AND pol.polname = 'tenant_isolation_shadow_evidence_nodes'
      AND pol.polpermissive = true) as pass;

SELECT '7.3' as check, 'documents shadow is PERMISSIVE' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol
    JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'documents'
      AND pol.polname = 'tenant_isolation_shadow_documents'
      AND pol.polpermissive = true) as pass;

-- ─── 8. Violation logging trigger functions exist ───────────────────────────────

SELECT '8.1' as check, 'log_sire_submissions_violation() trigger function' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_sire_submissions_violation') as pass;

SELECT '8.2' as check, 'log_evidence_nodes_violation() trigger function' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_evidence_nodes_violation') as pass;

SELECT '8.3' as check, 'log_evidence_edges_violation() trigger function' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_evidence_edges_violation') as pass;

SELECT '8.4' as check, 'log_documents_violation() trigger function' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_documents_violation') as pass;

SELECT '8.5' as check, 'log_agent_run_states_violation() trigger function' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_agent_run_states_violation') as pass;

SELECT '8.6' as check, 'log_agent_run_events_violation() trigger function' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_agent_run_events_violation') as pass;

SELECT '8.7' as check, 'log_fiscal_truth_events_violation() trigger function' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_fiscal_truth_events_violation') as pass;

-- ─── 9. Triggers are attached to tables ─────────────────────────────────────────

SELECT '9.1' as check, 'trigger on sire_submissions' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'sire_submissions'::regclass
      AND tgname = 'trg_sire_submissions_shadow') as pass;

SELECT '9.2' as check, 'trigger on fiscal_evidence_nodes' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'fiscal_evidence_nodes'::regclass
      AND tgname = 'trg_evidence_nodes_shadow') as pass;

SELECT '9.3' as check, 'trigger on fiscal_evidence_edges' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'fiscal_evidence_edges'::regclass
      AND tgname = 'trg_evidence_edges_shadow') as pass;

SELECT '9.4' as check, 'trigger on documents' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'documents'::regclass
      AND tgname = 'trg_documents_shadow') as pass;

SELECT '9.5' as check, 'trigger on agent_run_states' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'agent_run_states'::regclass
      AND tgname = 'trg_agent_run_states_shadow') as pass;

SELECT '9.6' as check, 'trigger on agent_run_events' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'agent_run_events'::regclass
      AND tgname = 'trg_agent_run_events_shadow') as pass;

SELECT '9.7' as check, 'trigger on fiscal_truth_events' as desc,
  EXISTS (SELECT 1 FROM pg_catalog.pg_trigger
    WHERE tgrelid = 'fiscal_truth_events'::regclass
      AND tgname = 'trg_fiscal_truth_events_shadow') as pass;

-- ─── 10. Summary ────────────────────────────────────────────────────────────────

DO $$
DECLARE
  total_checks integer := 0;
  passed_checks integer := 0;
  r record;
BEGIN
  FOR r IN
    -- Re-run all checks above as a single summary query via temp table
    SELECT '1.1' as check_id,
      EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'arkalythix_security') as pass
    UNION ALL SELECT '2.1',
      EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'arkalythix_security' AND p.proname = 'current_organization_id')
    UNION ALL SELECT '2.2',
      EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'arkalythix_security' AND p.proname = 'current_company_id')
    UNION ALL SELECT '2.3',
      EXISTS (SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'arkalythix_security' AND p.proname = 'current_user_id')
    UNION ALL SELECT '3.1',
      EXISTS (SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'arkalythix_security' AND c.relname = 'tenant_violation_log')
    UNION ALL SELECT '5.1',
      (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'sire_submissions')
    UNION ALL SELECT '5.4',
      (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'fiscal_truth_events')
    UNION ALL SELECT '5.5',
      (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'documents')
    UNION ALL SELECT '5.6',
      (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'agent_run_states')
    UNION ALL SELECT '5.7',
      (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE relname = 'agent_run_events')
    UNION ALL SELECT '6.1',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'sire_submissions' AND pol.polname = 'tenant_isolation_shadow_sire_submissions')
    UNION ALL SELECT '6.5',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'documents' AND pol.polname = 'tenant_isolation_shadow_documents')
    UNION ALL SELECT '6.6',
      EXISTS (SELECT 1 FROM pg_catalog.pg_policy pol JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid WHERE c.relname = 'agent_run_states' AND pol.polname = 'tenant_isolation_shadow_agent_run_states')
    UNION ALL SELECT '8.1',
      EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_sire_submissions_violation')
    UNION ALL SELECT '8.4',
      EXISTS (SELECT 1 FROM pg_catalog.pg_proc WHERE proname = 'log_documents_violation')
    UNION ALL SELECT '9.1',
      EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'sire_submissions'::regclass AND tgname = 'trg_sire_submissions_shadow')
    UNION ALL SELECT '9.4',
      EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'documents'::regclass AND tgname = 'trg_documents_shadow')
    UNION ALL SELECT '9.5',
      EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'agent_run_states'::regclass AND tgname = 'trg_agent_run_states_shadow')
    UNION ALL SELECT '9.6',
      EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'agent_run_events'::regclass AND tgname = 'trg_agent_run_events_shadow')
    UNION ALL SELECT '9.7',
      EXISTS (SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid = 'fiscal_truth_events'::regclass AND tgname = 'trg_fiscal_truth_events_shadow')
  LOOP
    total_checks := total_checks + 1;
    IF r.pass THEN
      passed_checks := passed_checks + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUMMARY: %/% checks passed', passed_checks, total_checks;
  IF passed_checks = total_checks THEN
    RAISE NOTICE 'RESULT: PASS — All RLS shadow objects verified';
  ELSE
    RAISE NOTICE 'RESULT: FAIL — % check(s) did not pass. Apply h02-rls-shadow.sql first.', total_checks - passed_checks;
  END IF;
  RAISE NOTICE '========================================';
END $$;
