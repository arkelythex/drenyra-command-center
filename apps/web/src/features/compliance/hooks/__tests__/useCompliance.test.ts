import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useActiveCompanyContextMock: vi.fn(),
}));

vi.mock('@/lib/use-active-company-context', () => ({
  useActiveCompanyContext: mocks.useActiveCompanyContextMock,
}));

import { useCompliance } from '../useCompliance';
import { complianceKeys } from '../../compliance.query';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { wrapper };
}

describe('useCompliance', () => {
  beforeEach(() => {
    mocks.useActiveCompanyContextMock.mockReturnValue({
      companyContext: {
        companyId: 'company-1',
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with sire tab and static sync stats', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCompliance(), { wrapper });

    expect(result.current.activeTab).toBe('sire');
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.syncStats.complianceScore).toBe(94.7);
    expect(result.current.syncStats.totalContributors).toBe(21);
  });

  it('allows switching active compliance tab', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCompliance(), { wrapper });

    act(() => {
      result.current.setActiveTab('detracciones');
    });

    expect(result.current.activeTab).toBe('detracciones');
  });

  it('runGlobalSync toggles syncing state and refreshes lastSync', async () => {
    vi.useFakeTimers();
    const seededAt = '2026-01-01T00:00:00.000Z';
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    queryClient.setQueryData(complianceKeys.overview('company-1'), {
      lastSync: seededAt,
      syncStats: {
        rucCoverage: '98.2%',
        cpeIntegrity: '99.8%',
        sireMatches: 148,
        pendingDetractions: 6,
        totalDocuments: 2341,
        complianceScore: 94.7,
        riskAlerts: 12,
        lastAudit: '2025-01-18',
        nextScheduled: '2025-02-15',
        activeContributors: 15,
        inactiveContributors: 2,
        noHabidoContributors: 4,
        totalContributors: 21,
      },
    });
    const seededWrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);
    const { result } = renderHook(() => useCompliance(), { wrapper: seededWrapper });
    const initialSync = result.current.lastSync;

    let syncPromise: Promise<void> | undefined;
    act(() => {
      syncPromise = result.current.runGlobalSync();
    });

    expect(result.current.isSyncing).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await syncPromise;
    });

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSync.getTime()).toBeGreaterThan(initialSync.getTime());
  });
});
