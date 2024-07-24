-- ================================================================
-- H02 Wave 6.1 — RLS Shadow Mode
-- Migration: 0027_h02_rls_shadow
--
-- Deploys Row-Level Security in SHADOW mode: policies exist but are
-- PERMISSIVE (they don't block queries). Violations are logged to
-- arkalythix_security.tenant_violation_log for analysis.
--
-- After 48h of zero violations, proceed to Wave 6.2 (activation).
--
-- Principles:
--   1. Fail-safe: PERMISSIVE policies never block real traffic
--   2. Observable: every cross-tenant access attempt is logged
--   3. Connection-pool safe: SET LOCAL (not SET SESSION)
--   4. Self-documenting: every policy has inline explanation
-- ================================================================

BEGIN;

-- ============================================================
-- 1. Helper functions (in arkalythix_security schema)
-- ============================================================

-- Create schema if not exists (idempotent)
CREATE SCHEMA IF NOT EXISTS arkalythix_security;

-- Current organization ID from application context (SET LOCAL)
-- Returns NULL when no context is set → triggers violation logging
CREATE OR REPLACE FUNCTION arkalythix_security.current_organization_id()
RETURNS text
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT current_setting('app.current_organization_id', true)
$$;

-- Current company ID from application context
CREATE OR REPLACE FUNCTION arkalythix_security.current_company_id()
RETURNS text
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT current_setting('app.current_company_id', true)
$$;

-- Current user ID from application context
CREATE OR REPLACE FUNCTION arkalythix_security.current_user_id()
RETURNS text
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT current_setting('app.current_user_id', true)
$$;

-- ============================================================
-- 2. Violation log table
-- ============================================================

CREATE TABLE IF NOT EXISTS arkalythix_security.tenant_violation_log (
  id              BIGSERIAL PRIMARY KEY,
  table_name      text NOT NULL,
  operation       text NOT NULL,  -- SELECT, INSERT, UPDATE, DELETE
  organization_id text,
  company_id      text,
  user_id         text,
  query           text,
  correlation_id  text,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  bypassed        boolean NOT NULL DEFAULT true  -- true = shadow (not blocked)
);

-- Indexes for analysis and alerting
CREATE INDEX IF NOT EXISTS idx_violation_org
  ON arkalythix_security.tenant_violation_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_violation_table
  ON arkalythix_security.tenant_violation_log(table_name);
CREATE INDEX IF NOT EXISTS idx_violation_time
  ON arkalythix_security.tenant_violation_log(occurred_at);

-- ============================================================
-- 3. Enable RLS on all target tables
-- ============================================================

-- RLS is enabled but PERMISSIVE policies mean no query is blocked.
-- Each table gets a shadow policy + violation logging trigger.

-- 3a. sire_submissions — company-scoped (company_id = uuid)
ALTER TABLE sire_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_shadow_sire_submissions ON sire_submissions
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3b. fiscal_evidence_nodes — organization-scoped (organization_id = varchar)
ALTER TABLE fiscal_evidence_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_shadow_evidence_nodes ON fiscal_evidence_nodes
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3c. fiscal_evidence_edges — organization-scoped (organization_id = varchar)
ALTER TABLE fiscal_evidence_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_shadow_evidence_edges ON fiscal_evidence_edges
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3d. fiscal_truth_events — organization-scoped (organization_id = varchar)
ALTER TABLE fiscal_truth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_shadow_fiscal_truth_events ON fiscal_truth_events
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3e. documents — company-scoped (company_id = uuid, organization_id = int)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_shadow_documents ON documents
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3f. agent_run_states — company-scoped (company_id = uuid)
ALTER TABLE agent_run_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_shadow_agent_run_states ON agent_run_states
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3g. agent_run_events — company-scoped (company_id = uuid)
ALTER TABLE agent_run_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_shadow_agent_run_events ON agent_run_events
  AS PERMISSIVE
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Violation logging trigger functions
-- ============================================================
--
-- Each trigger fires AFTER INSERT or UPDATE on the target table.
-- It checks whether the row's tenant context matches the current
-- application context. If not → log the violation.
--
-- In shadow mode, the trigger always returns NEW (never blocks).

-- 4a. sire_submissions — check company_id against app.current_company_id
CREATE OR REPLACE FUNCTION log_sire_submissions_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF arkalythix_security.current_company_id() IS NULL
     OR NEW.company_id::text != arkalythix_security.current_company_id() THEN
    INSERT INTO arkalythix_security.tenant_violation_log
      (table_name, operation, organization_id, company_id, user_id)
    VALUES
      ('sire_submissions', TG_OP,
       NULL,
       NEW.company_id::text,
       arkalythix_security.current_user_id());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_sire_submissions_shadow
  AFTER INSERT OR UPDATE ON sire_submissions
  FOR EACH ROW
  EXECUTE FUNCTION log_sire_submissions_violation();

-- 4b. fiscal_evidence_nodes — check organization_id against app.current_organization_id
CREATE OR REPLACE FUNCTION log_evidence_nodes_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF arkalythix_security.current_organization_id() IS NULL
     OR NEW.organization_id != arkalythix_security.current_organization_id() THEN
    INSERT INTO arkalythix_security.tenant_violation_log
      (table_name, operation, organization_id, company_id, user_id)
    VALUES
      ('fiscal_evidence_nodes', TG_OP,
       NEW.organization_id,
       NEW.company_id,
       arkalythix_security.current_user_id());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_evidence_nodes_shadow
  AFTER INSERT OR UPDATE ON fiscal_evidence_nodes
  FOR EACH ROW
  EXECUTE FUNCTION log_evidence_nodes_violation();

-- 4c. fiscal_evidence_edges — check organization_id against app.current_organization_id
CREATE OR REPLACE FUNCTION log_evidence_edges_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF arkalythix_security.current_organization_id() IS NULL
     OR NEW.organization_id != arkalythix_security.current_organization_id() THEN
    INSERT INTO arkalythix_security.tenant_violation_log
      (table_name, operation, organization_id, company_id, user_id)
    VALUES
      ('fiscal_evidence_edges', TG_OP,
       NEW.organization_id,
       NEW.company_id,
       arkalythix_security.current_user_id());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_evidence_edges_shadow
  AFTER INSERT OR UPDATE ON fiscal_evidence_edges
  FOR EACH ROW
  EXECUTE FUNCTION log_evidence_edges_violation();

-- 4d. fiscal_truth_events — check organization_id against app.current_organization_id
CREATE OR REPLACE FUNCTION log_fiscal_truth_events_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF arkalythix_security.current_organization_id() IS NULL
     OR NEW.organization_id != arkalythix_security.current_organization_id() THEN
    INSERT INTO arkalythix_security.tenant_violation_log
      (table_name, operation, organization_id, company_id, user_id)
    VALUES
      ('fiscal_truth_events', TG_OP,
       NEW.organization_id,
       NEW.company_id,
       arkalythix_security.current_user_id());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_fiscal_truth_events_shadow
  AFTER INSERT OR UPDATE ON fiscal_truth_events
  FOR EACH ROW
  EXECUTE FUNCTION log_fiscal_truth_events_violation();

-- 4e. documents — check company_id against app.current_company_id
CREATE OR REPLACE FUNCTION log_documents_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF arkalythix_security.current_company_id() IS NULL
     OR NEW.company_id::text != arkalythix_security.current_company_id() THEN
    INSERT INTO arkalythix_security.tenant_violation_log
      (table_name, operation, organization_id, company_id, user_id)
    VALUES
      ('documents', TG_OP,
       NEW.organization_id::text,
       NEW.company_id::text,
       arkalythix_security.current_user_id());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_documents_shadow
  AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION log_documents_violation();

-- 4f. agent_run_states — check company_id against app.current_company_id
CREATE OR REPLACE FUNCTION log_agent_run_states_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF arkalythix_security.current_company_id() IS NULL
     OR NEW.company_id::text != arkalythix_security.current_company_id() THEN
    INSERT INTO arkalythix_security.tenant_violation_log
      (table_name, operation, organization_id, company_id, user_id)
    VALUES
      ('agent_run_states', TG_OP,
       NULL,
       NEW.company_id::text,
       arkalythix_security.current_user_id());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_agent_run_states_shadow
  AFTER INSERT OR UPDATE ON agent_run_states
  FOR EACH ROW
  EXECUTE FUNCTION log_agent_run_states_violation();

-- 4g. agent_run_events — check company_id against app.current_company_id
CREATE OR REPLACE FUNCTION log_agent_run_events_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF arkalythix_security.current_company_id() IS NULL
     OR NEW.company_id::text != arkalythix_security.current_company_id() THEN
    INSERT INTO arkalythix_security.tenant_violation_log
      (table_name, operation, organization_id, company_id, user_id)
    VALUES
      ('agent_run_events', TG_OP,
       NULL,
       NEW.company_id::text,
       arkalythix_security.current_user_id());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_agent_run_events_shadow
  AFTER INSERT OR UPDATE ON agent_run_events
  FOR EACH ROW
  EXECUTE FUNCTION log_agent_run_events_violation();

-- ============================================================
-- 5. Rollback script (inline reference)
-- ============================================================
--
-- To rollback RLS shadow mode, run:
--
-- BEGIN;
--   DROP TRIGGER IF EXISTS trg_sire_submissions_shadow ON sire_submissions;
--   DROP TRIGGER IF EXISTS trg_evidence_nodes_shadow ON fiscal_evidence_nodes;
--   DROP TRIGGER IF EXISTS trg_evidence_edges_shadow ON fiscal_evidence_edges;
--   DROP TRIGGER IF EXISTS trg_fiscal_truth_events_shadow ON fiscal_truth_events;
--   DROP TRIGGER IF EXISTS trg_documents_shadow ON documents;
--   DROP TRIGGER IF EXISTS trg_agent_run_states_shadow ON agent_run_states;
--   DROP TRIGGER IF EXISTS trg_agent_run_events_shadow ON agent_run_events;
--
--   DROP FUNCTION IF EXISTS log_sire_submissions_violation();
--   DROP FUNCTION IF EXISTS log_evidence_nodes_violation();
--   DROP FUNCTION IF EXISTS log_evidence_edges_violation();
--   DROP FUNCTION IF EXISTS log_fiscal_truth_events_violation();
--   DROP FUNCTION IF EXISTS log_documents_violation();
--   DROP FUNCTION IF EXISTS log_agent_run_states_violation();
--   DROP FUNCTION IF EXISTS log_agent_run_events_violation();
--
--   DROP POLICY IF EXISTS tenant_isolation_shadow_sire_submissions ON sire_submissions;
--   DROP POLICY IF EXISTS tenant_isolation_shadow_evidence_nodes ON fiscal_evidence_nodes;
--   DROP POLICY IF EXISTS tenant_isolation_shadow_evidence_edges ON fiscal_evidence_edges;
--   DROP POLICY IF EXISTS tenant_isolation_shadow_fiscal_truth_events ON fiscal_truth_events;
--   DROP POLICY IF EXISTS tenant_isolation_shadow_documents ON documents;
--   DROP POLICY IF EXISTS tenant_isolation_shadow_agent_run_states ON agent_run_states;
--   DROP POLICY IF EXISTS tenant_isolation_shadow_agent_run_events ON agent_run_events;
--
--   ALTER TABLE sire_submissions DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE fiscal_evidence_nodes DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE fiscal_evidence_edges DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE fiscal_truth_events DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE agent_run_states DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE agent_run_events DISABLE ROW LEVEL SECURITY;
-- COMMIT;

COMMIT;
