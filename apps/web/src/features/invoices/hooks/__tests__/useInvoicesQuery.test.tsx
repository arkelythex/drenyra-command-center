import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/use-active-company-context', () => ({
  useActiveCompanyContext: vi.fn(() => ({
    companyContext: {
      companyId: 'company-1',
      companyName: 'Company 1',
      ruc: '20123456789',
      isDemoFallback: false,
    },
    availableCompanies: [],
    setActiveCompanyById: vi.fn(),
  })),
}));

vi.mock('@/features/invoices/api/invoicing.api', () => ({
  invoicingApi: {
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/features/customers/api/customers.api', () => ({
  customersApi: {
    list: vi.fn(),
  },
}));

import { toast } from 'sonner';
import { customersApi } from '@/features/customers/api/customers.api';
import { invoicingApi } from '@/features/invoices/api/invoicing.api';
import { invoiceKeys } from '@/features/invoices/api/query-keys';
import { useInvoicesQuery } from '../useInvoicesQuery';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useInvoicesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customersApi.list).mockResolvedValue([]);
    vi.mocked(invoicingApi.list).mockResolvedValue([]);
    vi.mocked(invoicingApi.create).mockResolvedValue({ id: 'new-id' });
    vi.mocked(invoicingApi.updateStatus).mockResolvedValue({});
  });

  it('maps API invoices to UI shape and filters cancelled invoices', async () => {
    vi.mocked(invoicingApi.list).mockResolvedValue([
      {
        id: 'inv-1',
        customerId: 'cust-1',
        invoiceNumber: 'F001-1',
        dueDate: '2026-03-01',
        status: 'DRAFT',
        currency: 'EUR',
        totalAmount: '118.00',
        sunatCdr: 'https://ose.example.test/cdr/F001-1.zip',
        sunatTicket: 'TKT-2026-000001',
        sunatStatus: 'ACCEPTED',
        sunatCode: '0',
        sunatMessage: 'CDR aceptado',
        transactionId: 'tx-1',
        transactionStatus: 'ACCEPTED',
      },
      {
        id: 'inv-2',
        customerId: 'abcd1234xyz',
        invoiceNumber: 'F001-2',
        dueDate: '2026-03-02',
        status: 'OVERDUE',
        currency: 'PEN',
        totalAmount: '250.50',
        notes: 'Atrasada',
      },
      {
        id: 'inv-3',
        customerId: 'cust-3',
        invoiceNumber: 'F001-3',
        dueDate: '2026-03-03',
        status: 'CANCELLED',
        currency: 'PEN',
        totalAmount: '10',
      },
    ]);
    vi.mocked(customersApi.list).mockResolvedValue([
      { id: 'cust-1', legalName: 'Comercial Uno SAC', email: 'billing@uno.pe' },
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInvoicesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invoices).toHaveLength(2);
    expect(result.current.invoices[0]).toMatchObject({
      id: 'inv-1',
      invoiceNumber: 'F001-1',
      status: 'draft',
      currency: 'PEN',
      amount: 118,
      sunatCdr: 'https://ose.example.test/cdr/F001-1.zip',
      sunatTicket: 'TKT-2026-000001',
      sunatStatus: 'ACCEPTED',
      sunatCode: '0',
      sunatMessage: 'CDR aceptado',
      transactionId: 'tx-1',
      transactionStatus: 'ACCEPTED',
      customer: {
        name: 'Comercial Uno SAC',
        initials: 'CO',
        email: 'billing@uno.pe',
      },
    });
    expect(result.current.invoices[1]).toMatchObject({
      id: 'inv-2',
      status: 'overdue',
      customer: {
        name: 'Cliente ABCD1234',
        initials: 'CL',
      },
      tags: ['Atrasada'],
    });
  });

  it('creates an invoice, shows success toast, and invalidates invoices cache', async () => {
    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useInvoicesQuery(), { wrapper });

    await act(async () => {
      await result.current.createInvoice({
        customerId: 'cust-22',
        series: 'F001',
        dueDate: '2026-03-18',
      });
    });

    expect(invoicingApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'cust-22',
        companyId: 'company-1',
        items: [],
      }),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      expect.stringContaining('Factura creada'),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['invoices'] }),
    );
  });

  it('rolls back optimistic status update when API fails', async () => {
    vi.mocked(invoicingApi.list).mockResolvedValue([
      {
        id: 'inv-rollback',
        customerId: 'cust-r',
        invoiceNumber: 'F001-99',
        dueDate: '2026-03-10',
        status: 'DRAFT',
        currency: 'PEN',
        totalAmount: '999.00',
      },
    ]);
    vi.mocked(invoicingApi.updateStatus).mockRejectedValue(new Error('upstream error'));

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useInvoicesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.invoices).toHaveLength(1);
    });

    await act(async () => {
      await result.current
        .updateStatus({ id: 'inv-rollback', status: 'sent' })
        .catch(() => undefined);
    });

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        expect.stringContaining('No se pudo actualizar el estado'),
      );
    });

    const cached = queryClient.getQueryData(
      invoiceKeys.list({ companyId: 'company-1' }),
    ) as Array<{ id: string; status: string }>;
    expect(cached[0]).toMatchObject({ id: 'inv-rollback', status: 'draft' });
  });
});
