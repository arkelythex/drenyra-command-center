-- H02 Wave 1 — Minimal PostgreSQL test schema
--
-- Contiene únicamente las tablas necesarias para validar el aislamiento
-- tenant de AccountRepository y JournalEntryRepository.
--
-- Uso:
--   psql "$DATABASE_URL_TEST" -v ON_ERROR_STOP=1 -f packages/persistence/test/schema/h02-wave1.sql
--   psql "$DATABASE_URL_TEST" -v ON_ERROR_STOP=1 -f scripts/ci/h02-seed-test-data.sql
--   DATABASE_URL_TEST="$DATABASE_URL_TEST" bun test packages/persistence/src/repositories/__tests__/h02-pr1.4-cross-tenant.test.ts
--
-- Generado a partir de los schemas Drizzle en packages/persistence/src/schema/.
-- v1 — H02 Wave 1

BEGIN;

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;

-- ============================================================
-- TYPES (needed by some tables)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.organization_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ruc VARCHAR(11) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  health_score INTEGER DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}',
  business_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_ruc_idx ON public.organizations(ruc);
CREATE INDEX IF NOT EXISTS organizations_status_idx ON public.organizations(status);

-- ============================================================
-- USERS (Drenyra users table — companies.owner_id references this)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL DEFAULT '',
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER',
  company_id UUID,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- COMPANIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id),
  economic_group_id UUID,
  is_primary BOOLEAN DEFAULT false,
  ruc VARCHAR(11) NOT NULL UNIQUE,
  country_code VARCHAR(2) DEFAULT 'pe' NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  settings_language VARCHAR(10) DEFAULT 'es',
  settings_timezone VARCHAR(50) DEFAULT 'America/Lima',
  settings_currency VARCHAR(3) DEFAULT 'PEN',
  settings_auto_close_period BOOLEAN DEFAULT true,
  settings_show_amounts_in_words BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- AUTH USERS (Better Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auth_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  image TEXT,
  ruc TEXT DEFAULT '',
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- AUTH USER COMPANIES (membership bridge)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auth_user_companies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.auth_users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  membership_role VARCHAR(50) NOT NULL DEFAULT 'ACCOUNTANT',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_user_companies_user_id_idx ON public.auth_user_companies(user_id);
CREATE INDEX IF NOT EXISTS auth_user_companies_company_id_idx ON public.auth_user_companies(company_id);
CREATE UNIQUE INDEX IF NOT EXISTS auth_user_companies_user_company_uidx ON public.auth_user_companies(user_id, company_id);

-- ============================================================
-- PCGE ACCOUNTS (Plan Contable General Empresarial)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pcge_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  level VARCHAR(1) NOT NULL,
  type VARCHAR(50) NOT NULL,
  parent_id UUID REFERENCES public.pcge_accounts(id),
  is_active VARCHAR(1) NOT NULL DEFAULT 'S',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pcge_accounts_company_code_idx ON public.pcge_accounts(company_id, code);
CREATE INDEX IF NOT EXISTS pcge_accounts_parent_idx ON public.pcge_accounts(parent_id);

-- ============================================================
-- JOURNAL ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id),
  entry_number VARCHAR(50) NOT NULL,
  period_key VARCHAR(7) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  gloss TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'borrador',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_entries_company_period_idx ON public.journal_entries(company_id, period_key);
CREATE INDEX IF NOT EXISTS journal_entries_entry_number_idx ON public.journal_entries(entry_number);
CREATE INDEX IF NOT EXISTS journal_entries_status_idx ON public.journal_entries(status);

-- ============================================================
-- JOURNAL ENTRY LINES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  debit_cents INTEGER NOT NULL DEFAULT 0,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_entry_lines_entry_idx ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS journal_entry_lines_account_idx ON public.journal_entry_lines(account_code);

-- ============================================================
-- Schema validation
-- ============================================================
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'organizations', 'users', 'companies',
    'auth_users', 'auth_user_companies',
    'pcge_accounts',
    'journal_entries', 'journal_entry_lines'
  ] LOOP
    IF to_regclass('public.' || tbl) IS NULL THEN
      missing_tables := missing_tables || tbl;
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

COMMIT;
