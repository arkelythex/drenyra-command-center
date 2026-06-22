import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { useAuthStoreMock } = vi.hoisted(() => ({
  useAuthStoreMock: vi.fn(),
}));

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuthStore: useAuthStoreMock,
}));

import { useInventory } from '../useInventory';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe('useInventory', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns formatted metrics, predictions, and movements from mocked queries', async () => {
    useAuthStoreMock.mockReturnValue({
      user: {
        companyId: 'company-1',
      },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useInventory(), {
      wrapper,
    });

    await waitFor(
      () => {
        expect(result.current.predictions).toHaveLength(2);
      },
      { timeout: 2500 },
    );

    expect(result.current.movements).toHaveLength(4);
    expect(result.current.metrics.rotationRate).toBe('1.2x');
    expect(result.current.metrics.totalValorization).toContain('1,254,300.5');
  });

  it('falls back to demo-mode company key when auth user is missing', async () => {
    useAuthStoreMock.mockReturnValue({ user: null });

    const { queryClient, wrapper } = createWrapper();
    renderHook(() => useInventory(), { wrapper });

    await waitFor(
      () => {
        expect(queryClient.getQueryData(['inventory', 'list', 'demo-mode'])).toBeTruthy();
      },
      { timeout: 2500 },
    );

    expect(queryClient.getQueryData(['inventory', 'summary', 'demo-mode'])).toBeTruthy();
    expect(queryClient.getQueryData(['inventory', 'alerts', 'demo-mode'])).toBeTruthy();
    expect(queryClient.getQueryData(['inventory', 'list', 'demo-mode'])).toBeTruthy();
  });
});
