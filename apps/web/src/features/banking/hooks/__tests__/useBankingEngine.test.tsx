import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/inbox/api/inbox.api', () => ({
  inboxApi: {
    listTransactions: vi.fn(),
  },
}));

vi.mock('@/lib/runtime-config', () => ({
  runtimeConfig: {
    mockMode: false,
  },
}));

const { captureErrorMock, trackEventMock } = vi.hoisted(() => ({
  captureErrorMock: vi.fn(),
  trackEventMock: vi.fn(),
}));

vi.mock('@/lib/monitoring', () => ({
  captureError: captureErrorMock,
  trackEvent: trackEventMock,
}));

import { inboxApi } from '@/features/inbox/api/inbox.api';
import { runtimeConfig } from '@/lib/runtime-config';
import { useBankingEngine } from '../useBankingEngine';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useBankingEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runtimeConfig.mockMode = false;
    vi.mocked(inboxApi.listTransactions).mockResolvedValue([]);
  });

  it('uses only base transactions in mock mode', async () => {
    runtimeConfig.mockMode = true;

    const { result } = renderHook(() => useBankingEngine(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(12);
    });

    expect(inboxApi.listTransactions).not.toHaveBeenCalled();
    expect(result.current.transactions[0].id).toBe('tx1');
  });

  it('injects dynamic ALICORP match when expense exists', async () => {
    runtimeConfig.mockMode = false;
    vi.mocked(inboxApi.listTransactions).mockResolvedValue([
      {
        id: 'inv-alicorp',
        series: 'F001',
        number: '123',
        totalAmount: '1180.00',
        partner: {
          legalName: 'ALICORP S.A.A.',
        },
      },
    ]);

    const { result } = renderHook(() => useBankingEngine(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions).toHaveLength(13);
    });

    const first = result.current.transactions[0];
    expect(first.id).toBe('bank-alicorp-001');
    expect(first.amount).toBe(-1180);
    expect(first.suggestedMatch?.score).toBe(100);
    expect(first.suggestedMatch?.docNumber).toBe('F001-123');
  });

  it('tracks reconciliation intent on confirmMatch', async () => {
    runtimeConfig.mockMode = true;

    const { result } = renderHook(() => useBankingEngine(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.transactions.some((tx) => tx.id === 'tx1')).toBe(true);
    });

    act(() => {
      result.current.confirmMatch('tx1', 'F001-777');
    });

    expect(trackEventMock).toHaveBeenCalledWith('banking_reconciliation_confirmed', {
      accountId: 'bcp-mn',
      docId: 'F001-777',
      txId: 'tx1',
    });
  });
});
