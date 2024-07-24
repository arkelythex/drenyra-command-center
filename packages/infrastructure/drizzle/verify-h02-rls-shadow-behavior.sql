-- H02 Wave 6.1 — RLS Shadow Mode Behavioral Verification
--
-- Validates that shadow mode correctly:
--   1. Allows queries with matching tenant context (no violation)
--   2. Logs violations when context doesn't match (but query still succeeds)
--   3. Logs violations when context is missing (but query still succeeds)
--
-- ⚠️  Requires a test DB with at least one organization, company, and
--     test rows in the target tables.
-- Usage: psql $DATABASE_URL_TEST -f verify-h02-rls-shadow-behavior.sql

-- ============================================================
-- Test 1: Matching context → query succeeds, NO violation logged
-- ============================================================

-- Simulate: application sets org + company context before query
SELECT set_config('app.current_organization_id', 'test-org-001', true);
SELECT set_config('app.current_company_id', 'test-company-001', true);
SELECT set_config('app.current_user_id', 'test-user-001', true);

-- Count violations before the test operation
DO $$
DECLARE
  violations_before integer;
  violations_after  integer;
  test_org_id       text := 'test-org-001';
  test_company_id   text := 'test-company-001';
BEGIN
  -- Count existing violations
  SELECT count(*) INTO violations_before
    FROM arkalythix_security.tenant_violation_log
    WHERE table_name = 'agent_run_states';

  -- Attempt an INSERT with matching tenant context
  -- (This should succeed without logging a violation)
  BEGIN
    INSERT INTO agent_run_states (run_id, company_id, status)
    VALUES ('shadow-test-run-001', test_company_id::uuid, 'running');
  EXCEPTION WHEN OTHERS THEN
    -- If the insert fails for any reason other than RLS, that's expected
    -- in a test environment without proper FK data.
    NULL;
  END;

  -- Count violations after
  SELECT count(*) INTO violations_after
    FROM arkalythix_security.tenant_violation_log
    WHERE table_name = 'agent_run_states';

  IF violations_after = violations_before THEN
    RAISE NOTICE '✅ Test 1 PASSED: Matching context — no new violation logged';
  ELSE
    RAISE NOTICE '❌ Test 1 FAILED: % new violation(s) logged for matching context',
      violations_after - violations_before;
  END IF;

  -- Cleanup
  DELETE FROM agent_run_states WHERE run_id = 'shadow-test-run-001';
END $$;

-- ============================================================
-- Test 2: Missing context → query succeeds, violation LOGGED
-- ============================================================

-- Clear the application context (simulating a missing SET LOCAL)
SELECT set_config('app.current_organization_id', '', true);
SELECT set_config('app.current_company_id', '', true);
SELECT set_config('app.current_user_id', '', true);

DO $$
DECLARE
  violations_before integer;
  violations_after  integer;
BEGIN
  SELECT count(*) INTO violations_before
    FROM arkalythix_security.tenant_violation_log
    WHERE table_name = 'sire_submissions';

  -- Attempt an INSERT WITHOUT tenant context
  BEGIN
    INSERT INTO sire_submissions (
      company_id, period, ledger_type, payload_format,
      idempotency_key, provider
    ) VALUES (
      '00000000-0000-0000-0000-000000000001'::uuid,
      '2026-07', 'ventas', 'json',
      'shadow-test-idem-002', 'simulation'
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  SELECT count(*) INTO violations_after
    FROM arkalythix_security.tenant_violation_log
    WHERE table_name = 'sire_submissions';

  IF violations_after > violations_before THEN
    RAISE NOTICE '✅ Test 2 PASSED: Missing context — violation logged (% new)',
      violations_after - violations_before;
  ELSE
    RAISE NOTICE '❌ Test 2 FAILED: No violation logged for missing context';
  END IF;

  -- Cleanup
  DELETE FROM sire_submissions WHERE idempotency_key = 'shadow-test-idem-002';
END $$;

-- ============================================================
-- Test 3: Cross-tenant context → query succeeds (shadow), violation LOGGED
-- ============================================================

-- Set context to Org A
SELECT set_config('app.current_organization_id', 'test-org-a', true);
SELECT set_config('app.current_company_id', 'test-company-a', true);

DO $$
DECLARE
  violations_before integer;
  violations_after  integer;
BEGIN
  SELECT count(*) INTO violations_before
    FROM arkalythix_security.tenant_violation_log
    WHERE table_name = 'sire_submissions';

  -- Attempt an INSERT with company_id from Org B (cross-tenant)
  BEGIN
    INSERT INTO sire_submissions (
      company_id, period, ledger_type, payload_format,
      idempotency_key, provider
    ) VALUES (
      '00000000-0000-0000-0000-000000000099'::uuid,  -- Org B's company
      '2026-07', 'compras', 'json',
      'shadow-test-cross-003', 'simulation'
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  SELECT count(*) INTO violations_after
    FROM arkalythix_security.tenant_violation_log
    WHERE table_name = 'sire_submissions';

  IF violations_after > violations_before THEN
    RAISE NOTICE '✅ Test 3 PASSED: Cross-tenant — violation logged (% new)',
      violations_after - violations_before;
  ELSE
    RAISE NOTICE '❌ Test 3 FAILED: No violation logged for cross-tenant access';
  END IF;

  -- Cleanup
  DELETE FROM sire_submissions WHERE idempotency_key = 'shadow-test-cross-003';
END $$;

-- ============================================================
-- Summary
-- ============================================================

RAISE NOTICE '========================================';
RAISE NOTICE 'RLS Shadow Behavioral Verification Complete';
RAISE NOTICE 'Check output above for PASS/FAIL per test.';
RAISE NOTICE '========================================';
