/**
 * Stub for @arkelythex/infrastructure package
 * Used in test environment to prevent import errors
 */
import { vi } from 'vitest';

export const db = {
  query: {
    bankTransactions: { findMany: vi.fn(), findFirst: vi.fn() },
    bankAccounts: { findMany: vi.fn(), findFirst: vi.fn() },
    invoices: { findFirst: vi.fn(), findMany: vi.fn() },
    bills: { findFirst: vi.fn(), findMany: vi.fn() },
    businessPartners: { findMany: vi.fn() },
  },
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{}]) }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined)
    }),
  }),
};

export const eq = (a: any, b: any) => ({ column: a, value: b });
export const and = (...conditions: any[]) => conditions;
export const like = (a: any, b: any) => ({ column: a, pattern: b });
export const gte = (a: any, b: any) => ({ column: a, value: b, op: '>=' });
export const lte = (a: any, b: any) => ({ column: a, value: b, op: '<=' });
export const desc = (a: any) => ({ column: a, order: 'desc' });

export const bankTransactions = {
  id: 'id',
  companyId: 'company_id',
  accountId: 'account_id',
  isReconciled: 'is_reconciled',
  transactionDate: 'transaction_date',
};

export const bankAccounts = {
  id: 'id',
  companyId: 'company_id',
  accountName: 'account_name',
  isDefault: 'is_default',
};

export const invoices = {
  companyId: 'company_id',
  invoiceNumber: 'invoice_number',
  balanceDue: 'balance_due',
  dueDate: 'due_date',
  customerId: 'customer_id',
  id: 'id',
};

export const bills = {
  companyId: 'company_id',
  billNumber: 'bill_number',
  totalAmount: 'total_amount',
  dueDate: 'due_date',
  vendorId: 'vendor_id',
  id: 'id',
};

export const businessPartners = {
  companyId: 'company_id',
  id: 'id',
  legalName: 'legal_name',
};
