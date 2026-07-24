-- H02 Wave 6 — RLS Blueprint (shadow + activation)
--
-- NOT FOR PRODUCTION USE YET. This is the design blueprint.
-- Deployed in Wave 6 after all repository-level scope enforcement is in place.
--
-- Principles:
--   1. Fail closed: no tenant context → 0 rows
--   2. Shadow mode first: log violations, don't block (Wave 6.1)
--   3. Activation gradual por tabla (Wave 6.2)
--   4. SET LOCAL (not SET SESSION) for connection-pool safety
--
-- Schema: arkalythix_security (already exists)

-- ============================================================
-- 1. Helper functions
-- ============================================================

-- Current organization ID from application context (SET LOCAL)
-- Returns NULL when no context is set → fail closed
CREATE OR REPLACE FUNCTION arkalythix_security.current_organization_id()
RETURNS text
LANGUAGE SQL
STABLE
AS $$
  SELECT current_setting('app.current_organization_id', true)
$$;

-- Current company ID from application context
CREATE OR REPLACE FUNCTION arkalythix_security.current_company_id()
RETURNS text
LANGUAGE SQL
STABLE
AS $$
  SELECT current_setting('app.current_company_id', true)
$$;

-- Current user ID from application context
CREATE OR REPLACE FUNCTION arkalythix_security.current_user_id()
RETURNS text
LANGUAGE SQL
STABLE
AS $$
  SELECT current_setting('app.current_user_id', true)
$$;

-- ============================================================
-- 2. Violation logging (shadow mode)
-- ============================================================

CREATE TABLE IF NOT EXISTS arkalythix_security.tenant_violation_log (
  id          BIGSERIAL PRIMARY KEY,
  table_name  text NOT NULL,
  operation   text NOT NULL,  -- SELECT, INSERT, UPDATE, DELETE
  organization_id text,
  company_id      text,
  user_id         text,
  query         text,
  correlation_id text,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  bypassed     boolean NOT NULL DEFAULT true  -- true = shadow (not blocked)
);

-- Index for analysis
CREATE INDEX IF NOT EXISTS idx_violation_org ON arkalythix_security.tenant_violation_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_violation_table ON arkalythix_security.tenant_violation_log(table_name);
CREATE INDEX IF NOT EXISTS idx_violation_time ON arkalythix_security.tenant_violation_log(occurred_at);

-- ============================================================
-- 3. Shadow policy template (applied in Wave 6.1)
-- ============================================================
-- 
-- Each policy PERMISSIVE + logging trigger. Does NOT block queries.
-- Replace PERMISSIVE with RESTRICTIVE in Wave 6.2 activation.

-- Template for organization-scoped tables:
--   ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
--   
--   CREATE POLICY tenant_isolation_shadow_<table_name> ON <table_name>
--     AS PERMISSIVE
--     FOR ALL
--     USING (true)
--     WITH CHECK (true);
--   
--   CREATE OR REPLACE FUNCTION log_<table_name>_violation()
--   RETURNS trigger AS $$
--   BEGIN
--     IF arkalythix_security.current_organization_id() IS NULL
--        OR NEW.organization_id::text != arkalythix_security.current_organization_id() THEN
--       INSERT INTO arkalythix_security.tenant_violation_log
--         (table_name, operation, organization_id, company_id, user_id)
--       VALUES
--         ('<table_name>', TG_OP, NEW.organization_id::text,
--          COALESCE(NEW.company_id::text, NULL),
--          arkalythix_security.current_user_id());
--     END IF;
--     RETURN NEW;
--   END;
--   $$ LANGUAGE plpgsql;

-- ============================================================
-- 4. Active RLS policies (applied in Wave 6.2)
-- ============================================================

-- --- evidence_nodes ---
-- ALTER TABLE evidence_nodes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE evidence_nodes FORCE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY tenant_isolation_evidence_nodes ON evidence_nodes
--   AS RESTRICTIVE
--   FOR ALL
--   USING (organization_id::text = arkalythix_security.current_organization_id());
-- 
-- CREATE POLICY tenant_isolation_evidence_nodes_fail_closed ON evidence_nodes
--   AS RESTRICTIVE
--   FOR ALL
--   USING (arkalythix_security.current_organization_id() IS NOT NULL);

-- --- evidence_edges ---
-- ALTER TABLE evidence_edges ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_evidence_edges ON evidence_edges
--   AS RESTRICTIVE
--   FOR ALL
--   USING (organization_id::text = arkalythix_security.current_organization_id());

-- --- fiscal_truth_events ---
-- ALTER TABLE fiscal_truth_events ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_fiscal_truth_events ON fiscal_truth_events
--   AS RESTRICTIVE
--   FOR ALL
--   USING (organization_id::text = arkalythix_security.current_organization_id());

-- --- sire_submissions ---
-- ALTER TABLE sire_submissions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_sire_submissions ON sire_submissions
--   AS RESTRICTIVE
--   FOR ALL
--   USING (company_id::text = arkalythix_security.current_company_id());

-- --- documents ---
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_documents ON documents
--   AS RESTRICTIVE
--   FOR ALL
--   USING (company_id::text = arkalythix_security.current_company_id());

-- --- agent_run_states ---
-- ALTER TABLE agent_run_states ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_agent_runs ON agent_run_states
--   AS RESTRICTIVE
--   FOR ALL
--   USING (company_id::text = arkalythix_security.current_company_id());

-- --- agent_run_events ---
-- ALTER TABLE agent_run_events ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_agent_events ON agent_run_events
--   AS RESTRICTIVE
--   FOR ALL
--   USING (company_id::text = arkalythix_security.current_company_id());

-- --- auth_user_companies ---
-- ALTER TABLE auth_user_companies ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_auth_user_companies ON auth_user_companies
--   AS RESTRICTIVE
--   FOR ALL
--   USING (user_id::text = arkalythix_security.current_user_id());

-- ============================================================
-- 5. Application roles
-- ============================================================

-- CREATE ROLE app_authenticated;
-- CREATE ROLE app_worker;
-- CREATE ROLE app_migration;
-- CREATE ROLE app_admin;
-- 
-- -- Workers bypass RLS (they validate scope in application code)
-- ALTER TABLE evidence_nodes OWNER TO app_admin;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON evidence_nodes TO app_worker;
-- 
-- -- Migrations bypass all RLS
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO app_migration;

-- ============================================================
-- 6. Session context middleware (application side)
-- ============================================================
--
-- Every HTTP request should run this at the start:
--   SELECT set_config('app.current_organization_id', $1, true)  -- true = LOCAL scope
--   SELECT set_config('app.current_company_id', $2, true)
--   SELECT set_config('app.current_user_id', $3, true)
--
-- Workers must also set these before accessing tenant-owned tables.
--
-- SET LOCAL is transaction-scoped → safe with connection pooling.
-- If the connection is returned to the pool, the next request
-- will set new values. A request that forgets to set them
-- will get NULL → fail closed → 0 rows.

-- ============================================================
-- 7. Rollback script (run if RLS causes issues)
-- ============================================================
--
-- BEGIN;
--   ALTER TABLE evidence_nodes DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE evidence_nodes NO FORCE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS tenant_isolation_evidence_nodes ON evidence_nodes;
--   -- repeat for each table
-- COMMIT;
