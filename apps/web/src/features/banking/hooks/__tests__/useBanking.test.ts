import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the API module before importing the hook
vi.mock('@/lib/api', () => ({
  api: {
    api: {
      banking: {
        accounts: {
          get: vi.fn().mockResolvedValue({
            data: { success: true, data: [] },
            error: null,
          }),
        },
      },
    },
  },
  getTenantContext: vi.fn(() => ({
    companyId: '00000000-0000-0000-0000-000000000001',
  })),
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

import { useBanking, MOCK_ACCOUNTS } from '../useBanking';

/**
 * useBanking uses useSuspenseQuery, so we need:
 * 1. QueryClientProvider for TanStack Query context
 * 2. React.Suspense to catch the suspension thrown by useSuspenseQuery
 * 3. waitFor() to wait until the query resolves and result.current is available
 */
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
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(React.Suspense, { fallback: null }, children),
    );
  };
}

describe('useBanking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start with the first mock account selected by default', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      // Assert -- wait for suspense to resolve
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });
      expect(result.current.selectedAccountId).toBe(MOCK_ACCOUNTS[0].id);
    });

    it('should have empty search query initially', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });
      expect(result.current.searchQuery).toBe('');
    });

    it('should have a selected account object matching selectedAccountId', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });
      expect(result.current.selectedAccount).toBeDefined();
      expect(result.current.selectedAccount.id).toBe(result.current.selectedAccountId);
    });
  });

  describe('account grouping', () => {
    it('should group accounts by type: bank, detraction, credit', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      // Assert -- MOCK_ACCOUNTS has 2 BANK, 1 DETRACTION, 1 CREDIT
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });
      expect(result.current.accountsByType.bank).toHaveLength(2);
      expect(result.current.accountsByType.detraction).toHaveLength(1);
      expect(result.current.accountsByType.credit).toHaveLength(1);
    });

    it('should include correct accounts in each group', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      // Assert
      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      const bankIds = result.current.accountsByType.bank.map((a) => a.id);
      expect(bankIds).toContain('acc1');
      expect(bankIds).toContain('acc2');

      const detractionIds = result.current.accountsByType.detraction.map((a) => a.id);
      expect(detractionIds).toContain('acc3');

      const creditIds = result.current.accountsByType.credit.map((a) => a.id);
      expect(creditIds).toContain('card1');
    });
  });

  describe('account selection', () => {
    it('should allow selecting an account by id', async () => {
      // Arrange
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      // Act
      act(() => {
        result.current.setSelectedAccountId('acc3');
      });

      // Assert
      expect(result.current.selectedAccountId).toBe('acc3');
      expect(result.current.selectedAccount.id).toBe('acc3');
      expect(result.current.selectedAccount.type).toBe('DETRACTION');
    });

    it('should fall back to first account when selecting invalid id', async () => {
      // Arrange
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      // Act
      act(() => {
        result.current.setSelectedAccountId('nonexistent-id');
      });

      // Assert -- selectedAccount falls back to accounts[0]
      expect(result.current.selectedAccount.id).toBe(MOCK_ACCOUNTS[0].id);
    });
  });

  describe('search query', () => {
    it('should allow setting search query', async () => {
      // Arrange
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      // Act
      act(() => {
        result.current.setSearchQuery('BCP');
      });

      // Assert
      expect(result.current.searchQuery).toBe('BCP');
    });

    it('should allow clearing search query', async () => {
      // Arrange
      const { result } = renderHook(() => useBanking(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      // Act
      act(() => {
        result.current.setSearchQuery('BCP');
      });
      act(() => {
        result.current.setSearchQuery('');
      });

      // Assert
      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('MOCK_ACCOUNTS data integrity', () => {
    it('should have 4 mock accounts', () => {
      expect(MOCK_ACCOUNTS).toHaveLength(4);
    });

    it('should have valid currency for all accounts (PEN or USD)', () => {
      for (const account of MOCK_ACCOUNTS) {
        expect(['PEN', 'USD']).toContain(account.currency);
      }
    });

    it('should have the detraction account linked to Banco de la Nacion', () => {
      const detraction = MOCK_ACCOUNTS.find((a) => a.type === 'DETRACTION');
      expect(detraction).toBeDefined();
      expect(detraction?.bankName).toBe('Banco de la Naci\u00f3n');
    });
  });
});
