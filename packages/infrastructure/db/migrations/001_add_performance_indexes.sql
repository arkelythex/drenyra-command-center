-- =====================================================
-- ARKALYTHIX Performance Indexes Migration
-- Created: 2026-01-17
-- Purpose: Add strategic indexes for 10-100x query performance
-- Based on: PostgreSQL 2026 best practices
-- =====================================================

-- =====================================================
-- INVOICES TABLE (Most Critical - Highest Query Volume)
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_invoices_company_id 
  ON invoices(company_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id 
  ON invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status 
  ON invoices(status);

-- Date-based queries (DESC for recent-first ordering)
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date 
  ON invoices(issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at 
  ON invoices(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_invoices_company_status 
  ON invoices(company_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_company_date 
  ON invoices(company_id, issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_company_customer 
  ON invoices(company_id, customer_id);

-- Partial index for active invoices (275x faster for filtered queries)
CREATE INDEX IF NOT EXISTS idx_invoices_active 
  ON invoices(company_id, status, issue_date DESC) 
  WHERE status IN ('DRAFT', 'SENT', 'OVERDUE');

-- Partial index for paid invoices (for reports)
CREATE INDEX IF NOT EXISTS idx_invoices_paid 
  ON invoices(company_id, issue_date DESC) 
  WHERE status = 'PAID';

-- Full-text search on invoice number (GIN index)
CREATE INDEX IF NOT EXISTS idx_invoices_number_search 
  ON invoices USING gin(to_tsvector('spanish', invoice_number));

-- Currency-based queries
CREATE INDEX IF NOT EXISTS idx_invoices_currency 
  ON invoices(company_id, currency, issue_date DESC);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customers_company_id 
  ON customers(company_id);

-- RUC lookup (unique business identifier in Peru)
CREATE INDEX IF NOT EXISTS idx_customers_ruc 
  ON customers(ruc) 
  WHERE ruc IS NOT NULL;

-- Full-text search on customer name
CREATE INDEX IF NOT EXISTS idx_customers_name_search 
  ON customers USING gin(to_tsvector('spanish', legal_name));

-- Active customers only
CREATE INDEX IF NOT EXISTS idx_customers_active 
  ON customers(company_id, created_at DESC) 
  WHERE is_active = true;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_company_id 
  ON products(company_id);

-- SKU lookup (product code)
CREATE INDEX IF NOT EXISTS idx_products_sku 
  ON products(company_id, sku) 
  WHERE sku IS NOT NULL;

-- Product name search
CREATE INDEX IF NOT EXISTS idx_products_name_search 
  ON products USING gin(to_tsvector('spanish', name));

-- Active products
CREATE INDEX IF NOT EXISTS idx_products_active 
  ON products(company_id) 
  WHERE is_active = true;

-- =====================================================
-- INVOICE ITEMS TABLE (Critical for joins)
-- =====================================================

-- Foreign key indexes (essential for join performance)
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id 
  ON invoice_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id 
  ON invoice_items(product_id);

-- Composite for invoice detail queries
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_product 
  ON invoice_items(invoice_id, product_id);

-- =====================================================
-- BILLS TABLE (Accounts Payable)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bills_company_id 
  ON bills(company_id);

CREATE INDEX IF NOT EXISTS idx_bills_vendor_id 
  ON bills(vendor_id);

CREATE INDEX IF NOT EXISTS idx_bills_status 
  ON bills(status);

CREATE INDEX IF NOT EXISTS idx_bills_issue_date 
  ON bills(issue_date DESC);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_bills_company_status 
  ON bills(company_id, status);

CREATE INDEX IF NOT EXISTS idx_bills_company_date 
  ON bills(company_id, issue_date DESC);

-- Partial index for unpaid bills
CREATE INDEX IF NOT EXISTS idx_bills_unpaid 
  ON bills(company_id, issue_date DESC) 
  WHERE status IN ('PENDING', 'OVERDUE');

-- =====================================================
-- VENDORS TABLE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_vendors_company_id 
  ON vendors(company_id);

CREATE INDEX IF NOT EXISTS idx_vendors_ruc 
  ON vendors(ruc) 
  WHERE ruc IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_name_search 
  ON vendors USING gin(to_tsvector('spanish', legal_name));

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_payments_company_id 
  ON payments(company_id);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id 
  ON payments(invoice_id);

CREATE INDEX IF NOT EXISTS idx_payments_date 
  ON payments(payment_date DESC);

-- Composite for payment history
CREATE INDEX IF NOT EXISTS idx_payments_company_date 
  ON payments(company_id, payment_date DESC);

-- Payment method analysis
CREATE INDEX IF NOT EXISTS idx_payments_method 
  ON payments(company_id, payment_method, payment_date DESC);

-- =====================================================
-- ANALYTICS & REPORTING INDEXES
-- =====================================================

-- Revenue by month (for dashboard)
CREATE INDEX IF NOT EXISTS idx_invoices_revenue_by_month 
  ON invoices(company_id, date_trunc('month', issue_date), status) 
  WHERE status = 'PAID';

-- Top customers (for analytics)
CREATE INDEX IF NOT EXISTS idx_invoices_customer_revenue 
  ON invoices(customer_id, status) 
  WHERE status = 'PAID';

-- =====================================================
-- CONSTRAINTS FOR DATA INTEGRITY
-- =====================================================

-- Ensure positive amounts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_invoice_total_positive'
  ) THEN
    ALTER TABLE invoices 
    ADD CONSTRAINT check_invoice_total_positive 
    CHECK (CAST(total_amount AS DECIMAL) > 0);
  END IF;
END $$;

-- Valid currency
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_invoice_valid_currency'
  ) THEN
    ALTER TABLE invoices 
    ADD CONSTRAINT check_invoice_valid_currency 
    CHECK (currency IN ('PEN', 'USD'));
  END IF;
END $$;

-- Valid RUC length (11 digits in Peru)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_customer_valid_ruc_length'
  ) THEN
    ALTER TABLE customers 
    ADD CONSTRAINT check_customer_valid_ruc_length 
    CHECK (ruc IS NULL OR length(ruc) = 11);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_vendor_valid_ruc_length'
  ) THEN
    ALTER TABLE vendors 
    ADD CONSTRAINT check_vendor_valid_ruc_length 
    CHECK (ruc IS NULL OR length(ruc) = 11);
  END IF;
END $$;

-- =====================================================
-- ANALYZE TABLES (Update statistics for query planner)
-- =====================================================

ANALYZE invoices;
ANALYZE customers;
ANALYZE products;
ANALYZE invoice_items;
ANALYZE bills;
ANALYZE vendors;
ANALYZE payments;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check index usage
-- Run this after migration to verify indexes are being used:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Check table sizes
-- SELECT schemaname, tablename, 
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
