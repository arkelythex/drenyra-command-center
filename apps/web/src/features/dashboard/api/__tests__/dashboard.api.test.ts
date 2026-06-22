import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  sireStatusGetMock,
  overviewGetMock,
  unwrapMock,
} = vi.hoisted(() => ({
  sireStatusGetMock: vi.fn(),
  overviewGetMock: vi.fn(),
  unwrapMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: {
    api: {
      dashboard: {
        'sire-status': {
          get: sireStatusGetMock,
        },
        overview: {
          get: overviewGetMock,
        },
      },
    },
  },
}));

vi.mock('@/lib/api-helpers', () => ({
  unwrap: unwrapMock,
  extractOkDataOrPassthrough: (payload: unknown) => payload,
}));

import { dashboardApi } from '../dashboard.api';

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('computes SIRE match rate from backend status payload', async () => {
      sireStatusGetMock.mockResolvedValue({ data: { ok: true } });
      unwrapMock.mockResolvedValue({
        totalInvoices: 50,
        matched: 35,
        unmatched: 10,
        rejected: 5,
      });

      const result = await dashboardApi.getSummary('company-123');

      expect(sireStatusGetMock).toHaveBeenCalledWith({
        query: { companyId: 'company-123' },
      });
      expect(result).toEqual({
        ok: true,
        data: {
          status: {
            matched: 35,
            unmatched: 10,
            rejected: 5,
            totalInvoices: 50,
            matchRate: 70,
          },
        },
      });
    });

    it('avoids division-by-zero when totalInvoices is 0', async () => {
      sireStatusGetMock.mockResolvedValue({ data: { ok: true } });
      unwrapMock.mockResolvedValue({
        totalInvoices: 0,
        matched: 0,
        unmatched: 0,
        rejected: 0,
      });

      const result = await dashboardApi.getSummary('company-0');

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.status.matchRate).toBe(0);
      expect(result.data.status.totalInvoices).toBe(0);
    });
  });

  describe('getRecentTransactions', () => {
    it('builds synthetic summary data from dashboard overview', async () => {
      overviewGetMock.mockResolvedValue({ data: { ok: true } });
      unwrapMock.mockResolvedValueOnce({
        processedDocs: {
          processed: 12,
          pending: 3,
          rejected: 1,
        },
      });

      const result = await dashboardApi.getRecentTransactions(3, 'company-fallback');

      expect(overviewGetMock).toHaveBeenCalledWith({
        query: { companyId: 'company-fallback', currency: 'PEN' },
      });
      expect(result).toEqual({
        ok: true,
        data: [
          {
            id: 'summary-processed',
            number: 'Aceptados',
            totalAmount: 12,
            status: 'PAID',
          },
          {
            id: 'summary-pending',
            number: 'Pendientes',
            totalAmount: 3,
            status: 'DRAFT',
          },
          {
            id: 'summary-rejected',
            number: 'Rechazados',
            totalAmount: 1,
            status: 'REJECTED',
          },
        ],
      });
    });

    it('returns empty array when no companyId is provided', async () => {
      const result = await dashboardApi.getRecentTransactions(3);

      expect(result).toEqual({ ok: true, data: [] });
      expect(overviewGetMock).not.toHaveBeenCalled();
    });
  });
});
