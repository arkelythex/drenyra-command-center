-- H02 Wave 1 — Test fixture seed data
-- This seeds the minimum data needed for cross-tenant integration tests.

BEGIN;

-- ============================================================
-- Organizations
-- ============================================================
INSERT INTO organizations (id, name, ruc, slug, status, is_active, business_name, settings)
VALUES
  (1, 'Drenyra SAC', '20546296564', 'drenyra-sac', 'ACTIVE', true, 'Drenyra SAC', '{}'),
  (2, 'Competencia SAC', '20601234573', 'competencia-sac', 'ACTIVE', true, 'Competencia SAC', '{}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Users
-- ============================================================
INSERT INTO users (id, email, name, role, is_active)
VALUES
  ('00000000-0000-0000-0000-00000000000a', 'admin@drenyra.com', 'Admin Drenyra', 'ADMIN', true),
  ('00000000-0000-0000-0000-00000000000b', 'admin@competencia.com', 'Admin Competencia', 'ADMIN', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Companies
-- ============================================================
INSERT INTO companies (id, owner_id, ruc, business_name, country_code, is_active, is_primary)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', '20546296564', 'Drenyra Principal', 'pe', true, true),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-00000000000a', '20601234573', 'Drenyra Secundaria', 'pe', true, false),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', '20601234581', 'Competencia Única', 'pe', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Auth users + companies bridge
-- ============================================================
INSERT INTO auth_users (id, name, email, email_verified)
VALUES
  ('auth-user-a', 'Admin Drenyra', 'admin@drenyra.com', true),
  ('auth-user-b', 'Admin Competencia', 'admin@competencia.com', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_user_companies (id, user_id, company_id, membership_role, is_default)
VALUES
  ('membership-a-a1', 'auth-user-a', '00000000-0000-0000-0000-0000000000a1', 'OWNER', true),
  ('membership-a-a2', 'auth-user-a', '00000000-0000-0000-0000-0000000000a2', 'ACCOUNTANT', false),
  ('membership-b-b1', 'auth-user-b', '00000000-0000-0000-0000-0000000000b1', 'OWNER', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PCGE Accounts (simplified)
-- ============================================================
INSERT INTO pcge_accounts (id, company_id, code, name, level, type, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', '10', 'Caja A1', '1', 'Activo', 'S'),
  ('10000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-0000000000a2', '10', 'Caja A2', '1', 'Activo', 'S'),
  ('10000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-0000000000b1', '10', 'Caja B1', '1', 'Activo', 'S'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', '11', 'Banco A1', '1', 'Activo', 'S'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', '40', 'Capital A1', '1', 'Patrimonio', 'S'),
  ('10000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-0000000000b1', '11', 'Banco B1', '1', 'Activo', 'S')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Journal Entries
-- ============================================================
INSERT INTO journal_entries (id, company_id, entry_number, period_key, date, gloss, status)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'AS-2026-0001', '2026-07', '2026-07-01', 'Apertura A1', 'borrador'),
  ('20000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-0000000000b1', 'AS-2026-0001', '2026-07', '2026-07-01', 'Apertura B1', 'borrador')
ON CONFLICT (id) DO NOTHING;

-- Entry A1 lines
INSERT INTO journal_entry_lines (id, journal_entry_id, account_code, description, debit_cents, credit_cents)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10', 'Apertura', 100000, 0),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '40', 'Capital', 0, 100000)
ON CONFLICT (id) DO NOTHING;

-- Entry B1 lines
INSERT INTO journal_entry_lines (id, journal_entry_id, account_code, description, debit_cents, credit_cents)
VALUES
  ('30000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000101', '10', 'Apertura B1', 50000, 0),
  ('30000000-0000-0000-0000-000000000102', '20000000-0000-0000-0000-000000000101', '40', 'Capital B1', 0, 50000)
ON CONFLICT (id) DO NOTHING;

COMMIT;
