import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useActiveCompanyContextMock: vi.fn(),
}));

vi.mock('@/lib/use-active-company-context', () => ({
  useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

import { useDocuments } from '../useDocuments';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper };
}

describe('useDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useActiveCompanyContextMock.mockReturnValue({
      companyContext: {
        companyId: 'company-1',
        companyName: 'LOGISTICA REAL S.A.C.',
        ruc: '20123456789',
        isDemoFallback: false,
      },
      availableCompanies: [],
      setActiveCompanyById: vi.fn(),
    });
  });

  it('loads documents with a company-scoped identity and filters by search', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDocuments(), { wrapper });

    await waitFor(() => {
      expect(result.current.documents).toHaveLength(4);
    }, { timeout: 2000 });

    expect(result.current.documents[0].id).toBe('company-1:doc-1');
    expect(result.current.companyContext.companyId).toBe('company-1');

    act(() => {
      result.current.setSearchQuery('B003');
    });

    await waitFor(() => {
      expect(result.current.documents).toHaveLength(1);
    }, { timeout: 2000 });

    expect(result.current.documents[0].id).toBe('company-1:doc-3');
  });

  it('reacts to an active company change without reusing the prior dataset identity', async () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(() => useDocuments(), { wrapper });

    await waitFor(() => {
      expect(result.current.documents[0].id).toBe('company-1:doc-1');
    }, { timeout: 2000 });

    mocks.useActiveCompanyContextMock.mockReturnValue({
      companyContext: {
        companyId: 'company-2',
        companyName: 'GRUPO BETA S.A.C.',
        ruc: '20567891234',
        isDemoFallback: false,
      },
      availableCompanies: [],
      setActiveCompanyById: vi.fn(),
    });

    rerender();

    await waitFor(() => {
      expect(result.current.documents[0].id).toBe('company-2:doc-1');
    }, { timeout: 2000 });
  });
});
