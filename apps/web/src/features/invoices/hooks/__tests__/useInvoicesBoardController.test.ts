import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  triggerMock,
  setActiveViewMock,
  createInvoiceMock,
  updateInvoiceStatusMock,
  useActiveCompanyContextMock,
  useInvoicesBoardMock,
} = vi.hoisted(() => ({
  triggerMock: vi.fn(),
  setActiveViewMock: vi.fn(),
  createInvoiceMock: vi.fn(),
  updateInvoiceStatusMock: vi.fn(),
  useActiveCompanyContextMock: vi.fn(),
  useInvoicesBoardMock: vi.fn(),
}));

vi.mock('@/hooks/useHaptics', () => ({
  useHaptics: () => ({
    trigger: triggerMock,
  }),
}));

vi.mock('@/lib/use-active-company-context', () => ({
  useActiveCompanyContext: useActiveCompanyContextMock,
}));

vi.mock('../useInvoicesBoard', () => ({
  useInvoicesBoard: useInvoicesBoardMock,
}));

import { useInvoicesBoardController } from '../useInvoicesBoardController';

describe('useInvoicesBoardController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useActiveCompanyContextMock.mockReturnValue({
      companyContext: {
        companyId: 'company-fallback',
        companyName: 'Fallback Company',
        ruc: '20123456789',
        isDemoFallback: false,
      },
      availableCompanies: [],
      setActiveCompanyById: vi.fn(),
    });

    useInvoicesBoardMock.mockReturnValue({
      allInvoices: [
        {
          id: 'inv-1',
          customer: { name: 'Acme SAC', initials: 'AS' },
          amount: 100,
          invoiceNumber: 'F001-1',
          dueDate: '2026-03-01',
          status: 'draft',
          currency: 'PEN',
        },
        {
          id: 'inv-2',
          customer: { name: 'Beta SAC', initials: 'BS' },
          amount: 300,
          totalAmount: 354,
          invoiceNumber: 'F001-2',
          dueDate: '2026-03-02',
          status: 'sent',
          currency: 'PEN',
        },
      ],
      invoicesByStatus: {
        draft: [
          {
            id: 'inv-1',
            customer: { name: 'Acme SAC', initials: 'AS' },
            amount: 100,
            invoiceNumber: 'F001-1',
            dueDate: '2026-03-01',
            status: 'draft',
            currency: 'PEN',
          },
        ],
        sent: [
          {
            id: 'inv-2',
            customer: { name: 'Beta SAC', initials: 'BS' },
            amount: 300,
            totalAmount: 354,
            invoiceNumber: 'F001-2',
            dueDate: '2026-03-02',
            status: 'sent',
            currency: 'PEN',
          },
        ],
        overdue: [],
        paid: [],
      },
      activeView: 'summary',
      setActiveView: setActiveViewMock,
      createInvoice: createInvoiceMock,
      updateInvoiceStatus: updateInvoiceStatusMock,
      isLoading: false,
      error: null,
    });

  });

  it('uses fallback companyId and filters invoices by search query', () => {
    const { result } = renderHook(() => useInvoicesBoardController());

    expect(result.current.companyId).toBe('company-fallback');
    expect(result.current.hasSearchResults).toBe(true);
    expect(result.current.filteredColumnTotals.sent).toBe(354);

    act(() => {
      result.current.setSearchQuery('acme');
    });

    expect(result.current.filteredInvoicesByStatus.draft).toHaveLength(1);
    expect(result.current.filteredInvoicesByStatus.sent).toHaveLength(0);
    expect(result.current.filteredColumnTotals.sent).toBe(0);
  });

  it('changes view from desktop/mobile handlers and triggers haptic feedback', () => {
    const { result } = renderHook(() => useInvoicesBoardController());

    act(() => {
      result.current.handleViewChange('aging');
    });
    expect(triggerMock).toHaveBeenCalledWith('light');
    expect(setActiveViewMock).toHaveBeenCalledWith('aging');

    act(() => {
      result.current.handleMobileTabChange('summary');
    });
    expect(setActiveViewMock).toHaveBeenCalledWith('summary');

    const callsBefore = setActiveViewMock.mock.calls.length;
    act(() => {
      result.current.handleMobileTabChange('invalid-tab');
    });
    expect(setActiveViewMock.mock.calls.length).toBe(callsBefore);
  });

  it('exposes invoice data and mutation passthroughs for lazy summary board', () => {
    const { result } = renderHook(() => useInvoicesBoardController());

    expect(result.current.allInvoices).toHaveLength(2);
    expect(result.current.createInvoice).toBe(createInvoiceMock);
    expect(result.current.updateInvoiceStatus).toBe(updateInvoiceStatusMock);
  });
});
