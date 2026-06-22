import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  useInvoicesBoardControllerMock,
  setShowCreateModalMock,
  createInvoiceMock,
  setSearchQueryMock,
  handleViewChangeMock,
  handleMobileTabChangeMock,
} = vi.hoisted(() => ({
  useInvoicesBoardControllerMock: vi.fn(),
  setShowCreateModalMock: vi.fn(),
  createInvoiceMock: vi.fn(),
  setSearchQueryMock: vi.fn(),
  handleViewChangeMock: vi.fn(),
  handleMobileTabChangeMock: vi.fn(),
}));

vi.mock('../../hooks/useInvoicesBoardController', () => ({
  useInvoicesBoardController: useInvoicesBoardControllerMock,
}));


const { preloadCreateInvoiceDialogMock } = vi.hoisted(() => ({
  preloadCreateInvoiceDialogMock: vi.fn(),
}));

vi.mock('../create-invoice/create-invoice-dialog-loader', async () => {
  const dialog = await import('../create-invoice/CreateInvoiceDialog');
  return {
    loadCreateInvoiceDialogModule: async () => dialog,
    preloadCreateInvoiceDialog: preloadCreateInvoiceDialogMock,
  };
});

vi.mock('../create-invoice/CreateInvoiceDialog', () => ({
  CreateInvoiceDialog: ({
    open,
    onOpenChange,
    onSubmit,
    companyId,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (payload: unknown) => Promise<void>;
    companyId: string;
  }) => (
    <div data-testid="create-dialog-mock">
      <span>{open ? 'dialog-open' : 'dialog-closed'}</span>
      <span>{companyId}</span>
      <button type="button" onClick={() => onOpenChange(false)}>
        Dialog Close
      </button>
      <button
        type="button"
        onClick={() => {
          void onSubmit({ from: 'dialog' });
        }}
      >
        Dialog Submit
      </button>
    </div>
  ),
}));

vi.mock('../InvoicesSummaryBoard', () => ({
  InvoicesSummaryBoard: ({
    onCreateInvoice,
    onCreateInvoiceIntent,
  }: {
    onCreateInvoice: () => void;
    onCreateInvoiceIntent?: () => void;
  }) => (
    <div data-testid="summary-board-mock">
      <button type="button" onClick={onCreateInvoice} onPointerEnter={onCreateInvoiceIntent} onFocus={onCreateInvoiceIntent}>
        Summary Create
      </button>
    </div>
  ),
}));

vi.mock('../tabs/InvoicesAgingTab', () => ({
  InvoicesAgingTab: () => <div data-testid="aging-tab-mock">Aging Tab</div>,
}));

vi.mock('../invoices-board/mobile-toolbar', () => ({
  InvoicesBoardMobileToolbar: ({
    onCreateInvoice,
    onCreateInvoiceIntent,
    onSearchQueryChange,
  }: {
    onCreateInvoice: () => void;
    onCreateInvoiceIntent?: () => void;
    onSearchQueryChange: (value: string) => void;
  }) => (
    <div data-testid="mobile-toolbar-mock">
      <button type="button" onClick={onCreateInvoice} onPointerEnter={onCreateInvoiceIntent} onFocus={onCreateInvoiceIntent}>
        Mobile Create
      </button>
      <button type="button" onClick={() => onSearchQueryChange('mobile-query')}>
        Mobile Search
      </button>
    </div>
  ),
}));

vi.mock('../invoices-board/desktop-header', () => ({
  InvoicesBoardDesktopHeader: ({
    onCreateInvoice,
    onCreateInvoiceIntent,
    onSearchQueryChange,
    onViewChange,
  }: {
    onCreateInvoice: () => void;
    onCreateInvoiceIntent?: () => void;
    onSearchQueryChange: (value: string) => void;
    onViewChange: (value: 'summary' | 'aging') => void;
  }) => (
    <div data-testid="desktop-header-mock">
      <button type="button" onClick={onCreateInvoice} onPointerEnter={onCreateInvoiceIntent} onFocus={onCreateInvoiceIntent}>
        Desktop Create
      </button>
      <button type="button" onClick={() => onSearchQueryChange('desktop-query')}>
        Desktop Search
      </button>
      <button type="button" onClick={() => onViewChange('aging')}>
        Desktop Aging
      </button>
    </div>
  ),
}));

vi.mock('@/components/layout/MobileTabNavigation', () => ({
  MobileTabNavigation: ({
    onTabChange,
  }: {
    onTabChange: (value: string) => void;
  }) => (
    <div data-testid="mobile-tabs-mock">
      <button type="button" onClick={() => onTabChange('aging')}>
        Mobile Aging
      </button>
    </div>
  ),
}));

import { InvoicesBoard } from '../InvoicesBoard';

const createControllerState = () => ({
  activeView: 'summary' as const,
  showCreateModal: true,
  searchQuery: '',
  normalizedQuery: '',
  companyId: 'company-1',
  isLoading: false,
  error: null,
  hasSearchResults: true,
  filteredInvoicesByStatus: {
    draft: [],
    sent: [],
    overdue: [],
    paid: [],
  },
  filteredColumnTotals: {
    sent: 0,
    overdue: 0,
  },
  allInvoices: [],
  createInvoice: createInvoiceMock,
  updateInvoiceStatus: vi.fn(),
  formatMoney: (value: number) => `S/ ${value.toFixed(2)}`,
  handleViewChange: handleViewChangeMock,
  handleMobileTabChange: handleMobileTabChangeMock,
  setShowCreateModal: setShowCreateModalMock,
  setSearchQuery: setSearchQueryMock,
});

describe('InvoicesBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preloadCreateInvoiceDialogMock.mockClear();

    useInvoicesBoardControllerMock.mockReturnValue(createControllerState());
  });

  it('renders summary view and wires create/search/dialog handlers', async () => {
    render(<InvoicesBoard />);

    expect(await screen.findByTestId('summary-board-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('aging-tab-mock')).not.toBeInTheDocument();
    expect(await screen.findByText('dialog-open')).toBeInTheDocument();
    expect(screen.getByText('company-1')).toBeInTheDocument();

    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Desktop Create' }));
    fireEvent.focus(screen.getByRole('button', { name: 'Mobile Create' }));
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Summary Create' }));
    expect(preloadCreateInvoiceDialogMock).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole('button', { name: 'Desktop Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mobile Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Summary Create' }));
    expect(setShowCreateModalMock).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Desktop Search' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mobile Search' }));
    expect(setSearchQueryMock).toHaveBeenCalledWith('desktop-query');
    expect(setSearchQueryMock).toHaveBeenCalledWith('mobile-query');

    fireEvent.click(screen.getByRole('button', { name: 'Dialog Submit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Dialog Close' }));
    expect(createInvoiceMock).toHaveBeenCalledWith({ from: 'dialog' });
    expect(setShowCreateModalMock).toHaveBeenCalledWith(false);
  });

  it('renders aging view when activeView is aging', async () => {
    useInvoicesBoardControllerMock.mockReturnValue({
      ...createControllerState(),
      activeView: 'aging',
      showCreateModal: false,
    });

    render(<InvoicesBoard />);

    expect(await screen.findByTestId('aging-tab-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('summary-board-mock')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('create-dialog-mock')).not.toBeInTheDocument();
    });
  });
});
