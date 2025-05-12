-- W2-04B — Natural Uniqueness Data Audit
--
-- Run BEFORE applying migration 0020 to detect existing duplicates.
-- Each query shows which entities would break the new constraint.
--
-- Usage:
--   psql $DATABASE_URL -f scripts/ci/audit-natural-uniqueness.sql
--
-- Expected output: zero rows in each section (clean = ready to migrate).

\echo '══════════════════════════════════════════════════════════════'
\echo '  W2-04B Natural Uniqueness — Data Audit'
\echo ''
\echo '  Zero rows = clean. Any row below must be resolved before migration.'
\echo '══════════════════════════════════════════════════════════════'

-- ─── 1. sire_submissions ─────────────────────────────────────────────────────

\echo ''
\echo '─── 1. sire_submissions: duplicates by (company_id, period, ledger_type)'

SELECT company_id, period, ledger_type, COUNT(*) as cnt
FROM sire_submissions
GROUP BY company_id, period, ledger_type
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- ─── 2. journal_entries ──────────────────────────────────────────────────────

\echo ''
\echo '─── 2. journal_entries: duplicates by (company_id, period_key, entry_number)'

SELECT company_id, period_key, entry_number, COUNT(*) as cnt
FROM journal_entries
GROUP BY company_id, period_key, entry_number
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- ─── 3. invoices ─────────────────────────────────────────────────────────────

\echo ''
\echo '─── 3. invoices: duplicates by (company_id, series, correlative)'

SELECT company_id, series, correlative, COUNT(*) as cnt
FROM invoices
GROUP BY company_id, series, correlative
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

-- ─── 4. pcge_accounts ────────────────────────────────────────────────────────

\echo ''
\echo '─── 4. pcge_accounts: duplicates by (company_id, code)'

SELECT company_id, code, COUNT(*) as cnt
FROM pcge_accounts
GROUP BY company_id, code
HAVING COUNT(*) > 1
ORDER BY cnt DESC;

\echo ''
\echo '══════════════════════════════════════════════════════════════'
\echo '  Audit complete. Resolve any rows above before migration.'
\echo '══════════════════════════════════════════════════════════════'
