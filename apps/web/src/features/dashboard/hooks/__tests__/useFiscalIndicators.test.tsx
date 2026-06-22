import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getFiscalIndicatorsMock } = vi.hoisted(() => ({
  getFiscalIndicatorsMock: vi.fn(),
}));

vi.mock('../../api/analytics.api', () => ({
  analyticsApi: {
    getFiscalIndicators: getFiscalIndicatorsMock,
  },
}));

import { useFiscalIndicators } from '../useFiscalIndicators';

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

describe('useFiscalIndicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns API indicators when query resolves', async () => {
    getFiscalIndicatorsMock.mockResolvedValue({
      exchangeRate: { compra: 3.72, venta: 3.75 },
      uit: { year: 2026, value: 5350 },
    });

    const { result } = renderHook(() => useFiscalIndicators(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getFiscalIndicatorsMock).toHaveBeenCalledTimes(1);
    expect(result.current.exchangeRate).toEqual({ compra: 3.72, venta: 3.75 });
    expect(result.current.uit).toEqual({ year: 2026, value: 5350 });
  });

  it('shows loading with default placeholders while query is pending', () => {
    getFiscalIndicatorsMock.mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useFiscalIndicators(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.exchangeRate).toEqual({ compra: 0, venta: 0 });
    expect(result.current.uit).toEqual({ year: 2026, value: 0 });
  });

  it('falls back to defaults when API payload is incomplete', async () => {
    getFiscalIndicatorsMock.mockResolvedValue({});

    const { result } = renderHook(() => useFiscalIndicators(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.exchangeRate).toEqual({ compra: 0, venta: 0 });
    expect(result.current.uit).toEqual({ year: 2026, value: 0 });
  });
});
