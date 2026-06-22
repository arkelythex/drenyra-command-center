import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@dnd-kit/core', () => ({
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn((sensor) => sensor),
  useSensors: vi.fn((...sensors) => sensors),
}));

const mocks = vi.hoisted(() => ({
  getProjection: vi.fn(),
  getActual: vi.fn(),
  getForecast: vi.fn(),
  getVariance: vi.fn(),
  getSummary: vi.fn(),
}));

vi.mock('@/features/cashflow/api/cashflow.api', () => ({
  cashflowApi: {
    getProjection: mocks.getProjection,
    getActual: mocks.getActual,
    getForecast: mocks.getForecast,
    getVariance: mocks.getVariance,
  },
}));

vi.mock('@/features/banking/api/banking.api', () => ({
  bankingApi: {
    getSummary: mocks.getSummary,
  },
}));

vi.mock('@/lib/use-active-company-context', () => ({
  useActiveCompanyContext: vi.fn(() => ({
    companyContext: {
      companyId: '00000000-0000-0000-0000-000000000001',
      companyName: 'NEBULA OPERACIONES LOGISTICAS S.A.C.',
      ruc: '20608451231',
      isDemoFallback: true,
    },
    availableCompanies: [],
    setActiveCompanyById: vi.fn(),
  })),
}));

import { useCashflow } from '../useCashflow';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCashflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getProjection.mockResolvedValue({
      ok: true,
      data: {
        companyId: 'company-1',
        period: { startDate: '2026-03-05', endDate: '2026-04-04' },
        currency: 'PEN',
        summary: {
          totalInflows: 5000,
          totalOutflows: 1800,
          netCashflow: 3200,
          isDeficit: false,
        },
        inflows: [
          {
            id: 'inv-1',
            type: 'inflow',
            documentType: 'invoice',
            reference: 'F001-123',
            amount: 3000,
            dueDate: '2026-03-08',
            status: 'pending',
            customerOrVendor: 'Cliente Uno SAC',
          },
        ],
        outflows: [
          {
            id: 'bill-1',
            type: 'outflow',
            documentType: 'bill',
            reference: 'B001-456',
            amount: 1800,
            dueDate: '2026-02-01',
            status: 'overdue',
            customerOrVendor: 'Proveedor Dos EIRL',
          },
        ],
        overdueItems: 1,
        weeklyBreakdown: [],
      },
    });

    mocks.getActual.mockResolvedValue({
      ok: true,
      data: {
        companyId: 'company-1',
        period: { startDate: '2026-02-04', endDate: '2026-03-05' },
        currency: 'PEN',
        actualInflows: 4200,
        actualOutflows: 1500,
        netCashflow: 2700,
        transactionCount: { inflows: 4, outflows: 3 },
      },
    });

    mocks.getForecast.mockResolvedValue({
      ok: true,
      data: {
        companyId: 'company-1',
        months: 3,
        currency: 'PEN',
        forecast: [
          {
            month: '2026-04',
            expectedInflows: 3500,
            expectedOutflows: 1600,
            netCashflow: 1900,
            confidence: 0.82,
          },
        ],
        method: 'historical_average',
        basedOnMonths: 4,
      },
    });

    mocks.getVariance.mockResolvedValue({
      ok: true,
      data: {
        companyId: 'company-1',
        period: { startDate: '2026-02-04', endDate: '2026-03-05' },
        currency: 'PEN',
        projected: { inflows: 5000, outflows: 1800, netCashflow: 3200 },
        actual: { inflows: 4200, outflows: 1500, netCashflow: 2700 },
        variance: {
          inflows: -800,
          outflows: -300,
          netCashflow: -500,
          inflowsPercentage: -16,
          outflowsPercentage: -16.67,
          netPercentage: -15.63,
        },
        alerts: [],
      },
    });

    mocks.getSummary.mockResolvedValue({
      ok: true,
      data: {
        totalAccounts: 2,
        totalBalance: '145000.50',
        totalBalancePEN: '145000.50',
        totalBalanceUSD: '0.00',
        unreconciledTransactions: 2,
      },
    });
  });

  it('initializes with board viewMode', async () => {
    const { result } = renderHook(() => useCashflow(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data.tasks['inv-1']).toBeDefined();
    });

    expect(result.current.viewMode).toBe('board');
  });

  it('maps projection items into board columns', async () => {
    const { result } = renderHook(() => useCashflow(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(Object.keys(result.current.data.tasks)).toHaveLength(2);
    });

    expect(result.current.data.columns.pending.taskIds).toContain('inv-1');
    expect(result.current.data.columns.audit.taskIds).toContain('bill-1');
    expect(result.current.data.tasks['inv-1'].type).toBe('INCOME');
    expect(result.current.data.tasks['bill-1'].priority).toBe('HIGH');
  });

  it('hydrates liquidity and forecast stats from live endpoints', async () => {
    const { result } = renderHook(() => useCashflow(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.stats.totalCash).toBe(145000.5);
    });

    expect(result.current.stats.actualInflows).toBe(4200);
    expect(result.current.stats.expensePending).toBe(1800);
    expect(result.current.stats.nextForecastNet).toBe(1900);
    expect(result.current.isUsingFallback).toBe(false);
  });

  it('falls back to local board data when API fails', async () => {
    mocks.getProjection.mockRejectedValueOnce(new Error('down'));
    mocks.getActual.mockRejectedValueOnce(new Error('down'));
    mocks.getForecast.mockRejectedValueOnce(new Error('down'));
    mocks.getVariance.mockRejectedValueOnce(new Error('down'));
    mocks.getSummary.mockRejectedValueOnce(new Error('down'));

    const { result } = renderHook(() => useCashflow(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(Object.keys(result.current.data.tasks)).toHaveLength(13);
    });

    expect(result.current.stats.totalCash).toBe(1121182.37);
    expect(result.current.isUsingFallback).toBe(true);
  });

  it('allows switching view mode and exposes drag callbacks', async () => {
    const { result } = renderHook(() => useCashflow(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data.tasks['inv-1']).toBeDefined();
    });

    act(() => {
      result.current.setViewMode('forecast');
    });

    expect(result.current.viewMode).toBe('forecast');
    expect(typeof result.current.onDragStart).toBe('function');
    expect(typeof result.current.onDragEnd).toBe('function');
    expect(result.current.sensors).toBeDefined();
  });
});
