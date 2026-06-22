import { useMemo, useState } from 'react';
import { useInvoicesQuery } from './useInvoicesQuery';
import type { Invoice } from './useInvoices';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
type InvoiceBoardView = 'summary' | 'aging';
type InvoicesByStatus = Record<InvoiceStatus, Invoice[]>;

const EMPTY_INVOICES_BY_STATUS: InvoicesByStatus = {
  draft: [],
  sent: [],
  paid: [],
  overdue: [],
};

const isInvoiceStatus = (status: string): status is InvoiceStatus =>
  status === 'draft' || status === 'sent' || status === 'paid' || status === 'overdue';

export const useInvoicesBoard = () => {
  const [activeView, setActiveView] = useState<InvoiceBoardView>('summary');
  const { invoices, createInvoice, updateStatus, isLoading, error } = useInvoicesQuery();
  const allInvoices: Invoice[] = Array.isArray(invoices) ? invoices : [];

  // Transform Flat List -> Kanban Columns
  const invoicesByStatus = useMemo(() => {
    const groups: InvoicesByStatus = {
      draft: [],
      sent: [],
      paid: [],
      overdue: [],
    };

    allInvoices.forEach((invoice) => {
      const normalizedStatus = (invoice.status ?? 'draft').toLowerCase();
      if (isInvoiceStatus(normalizedStatus)) {
        groups[normalizedStatus].push(invoice);
      }
    });

    return groups.draft.length + groups.sent.length + groups.paid.length + groups.overdue.length > 0
      ? groups
      : EMPTY_INVOICES_BY_STATUS;
  }, [allInvoices]);

  // Calculate Totals
  const columnTotals = useMemo(() => {
    const calculateTotal = (list: Invoice[]) =>
      list.reduce((sum, invoice) => sum + Number(invoice.totalAmount ?? invoice.amount ?? 0), 0);
    return {
      draft: calculateTotal(invoicesByStatus.draft),
      sent: calculateTotal(invoicesByStatus.sent),
      paid: calculateTotal(invoicesByStatus.paid),
      overdue: calculateTotal(invoicesByStatus.overdue),
    };
  }, [invoicesByStatus]);

  return {
    allInvoices,
    invoicesByStatus,
    columnTotals,
    activeView,
    setActiveView,
    createInvoice,
    updateInvoiceStatus: (id: string, status: InvoiceStatus) => updateStatus({ id, status }),
    isLoading,
    error,
  };
};
