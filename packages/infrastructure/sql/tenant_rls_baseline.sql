CREATE SCHEMA IF NOT EXISTS arkalythix_security;

CREATE OR REPLACE FUNCTION arkalythix_security.has_tenant_access(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN current_setting('arkalythix.current_company_id', true) ~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN current_setting('arkalythix.current_company_id', true)::uuid = target_company_id
    ELSE false
  END;
$$;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_tenant_guard ON public.invoices;
CREATE POLICY invoices_tenant_guard
  ON public.invoices
  FOR ALL
  USING (arkalythix_security.has_tenant_access(company_id))
  WITH CHECK (arkalythix_security.has_tenant_access(company_id));

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bills_tenant_guard ON public.bills;
CREATE POLICY bills_tenant_guard
  ON public.bills
  FOR ALL
  USING (arkalythix_security.has_tenant_access(company_id))
  WITH CHECK (arkalythix_security.has_tenant_access(company_id));

ALTER TABLE public.business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partners FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS business_partners_tenant_guard ON public.business_partners;
CREATE POLICY business_partners_tenant_guard
  ON public.business_partners
  FOR ALL
  USING (arkalythix_security.has_tenant_access(company_id))
  WITH CHECK (arkalythix_security.has_tenant_access(company_id));

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bank_accounts_tenant_guard ON public.bank_accounts;
CREATE POLICY bank_accounts_tenant_guard
  ON public.bank_accounts
  FOR ALL
  USING (arkalythix_security.has_tenant_access(company_id))
  WITH CHECK (arkalythix_security.has_tenant_access(company_id));

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bank_transactions_tenant_guard ON public.bank_transactions;
CREATE POLICY bank_transactions_tenant_guard
  ON public.bank_transactions
  FOR ALL
  USING (arkalythix_security.has_tenant_access(company_id))
  WITH CHECK (arkalythix_security.has_tenant_access(company_id));
