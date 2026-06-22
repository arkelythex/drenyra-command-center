import { renderHook, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useActiveCompanyContextMock: vi.fn(),
  fetchBillsMock: vi.fn(),
  persistBillStatusTransitionMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('@/lib/use-active-company-context', () => ({
  useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

vi.mock('../use-bills.query', () => ({
  fetchBills: mocks.fetchBillsMock,
}));

vi.mock('../use-bills.workflow', () => ({
  persistBillStatusTransition: mocks.persistBillStatusTransitionMock,
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccessMock,
    error: mocks.toastErrorMock,
  },
}));

import { useBills } from '../useBills';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper };
}

describe('useBills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useActiveCompanyContextMock.mockReturnValue({
      companyContext: {
        companyId: 'company-bills-1',
        companyName: 'NEBULA OPERACIONES LOGISTICAS S.A.C.',
        ruc: '20608451231',
        isDemoFallback: false,
      },
      availableCompanies: [],
      setActiveCompanyById: vi.fn(),
    });
    mocks.fetchBillsMock.mockResolvedValue([]);
    mocks.persistBillStatusTransitionMock.mockResolvedValue(undefined);
  });

  it('fetches bills using the active company context', async () => {
    const { wrapper } = createWrapper();
    renderHook(() => useBills(), { wrapper });

    await waitFor(() => {
      expect(mocks.fetchBillsMock).toHaveBeenCalledWith('company-bills-1');
    });
  });

  it('shows a contextual error toast when a status mutation fails', async () => {
    mocks.fetchBillsMock.mockResolvedValue([
      {
        id: 'bill-1',
        vendor: { name: 'Proveedor 1', initials: 'P1' },
        amount: 100,
        invoiceNumber: 'F001-1',
        dueDate: '2026-03-10',
        status: 'review',
        currency: 'PEN',
      },
    ]);
    mocks.persistBillStatusTransitionMock.mockRejectedValue(
      new Error('COMPANY_SCOPE_REQUIRED'),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBills(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateBillStatus('bill-1', 'approval');
    });

    await waitFor(() => {
      expect(mocks.toastErrorMock).toHaveBeenCalledWith(
        'Selecciona una empresa activa',
        expect.objectContaining({
          description: expect.stringContaining('empresa activa'),
        }),
      );
    });
  });

  it('shows a business-friendly message for invalid local transitions', async () => {
    mocks.fetchBillsMock.mockResolvedValue([
      {
        id: 'bill-2',
        vendor: { name: 'Proveedor 2', initials: 'P2' },
        amount: 100,
        invoiceNumber: 'F001-2',
        dueDate: '2026-03-10',
        status: 'paid',
        currency: 'PEN',
      },
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBills(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateBillStatus('bill-2', 'approval');
    });

    expect(mocks.toastErrorMock).toHaveBeenCalledWith(
      'La transición de estado no está permitida',
      expect.objectContaining({
        description: expect.stringContaining('paid a approval'),
      }),
    );
  });
});
