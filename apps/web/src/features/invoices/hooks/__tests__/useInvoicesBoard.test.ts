/**
 * @fileoverview Tests for useInvoicesBoard hook
 * @module features/invoices/hooks/__tests__/useInvoicesBoard.test
 *
 * Validates kanban board transformation logic:
 * - Flat invoice list -> grouped columns by status
 * - Column total calculations (totalAmount vs amount fallback)
 * - Edge cases: empty data, unknown status, non-array responses
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Invoice } from '../useInvoices';

// Mock useInvoicesQuery -- factory prevents vitest from resolving transitive deps
vi.mock('../useInvoicesQuery', () => ({
  useInvoicesQuery: vi.fn(),
}));

import { useInvoicesQuery } from '../useInvoicesQuery';
import { useInvoicesBoard } from '../useInvoicesBoard';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

const createInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: crypto.randomUUID(),
  customer: { name: 'Empresa SAC', initials: 'ES', email: 'contact@empresa.com' },
  amount: 1000,
  invoiceNumber: 'F001-00001',
  dueDate: '2026-03-15',
  status: 'draft',
  currency: 'PEN',
  ...overrides,
});

const mockQueryReturn = (
  invoices: Invoice[] | undefined = [],
  extra: Partial<ReturnType<typeof useInvoicesQuery>> = {},
) => {
  vi.mocked(useInvoicesQuery).mockReturnValue({
    invoices: invoices as Invoice[],
    createInvoice: vi.fn(),
    updateStatus: vi.fn(),
    isLoading: false,
    error: null,
    isCreating: false,
    ...extra,
  });
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useInvoicesBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Grouping
  // -----------------------------------------------------------------------

  describe('invoicesByStatus (grouping)', () => {
    it('should group invoices by status correctly', () => {
      // Arrange
      const invoices: Invoice[] = [
        createInvoice({ id: '1', status: 'draft', amount: 100 }),
        createInvoice({ id: '2', status: 'sent', amount: 200 }),
        createInvoice({ id: '3', status: 'paid', amount: 300 }),
        createInvoice({ id: '4', status: 'overdue', amount: 400 }),
        createInvoice({ id: '5', status: 'draft', amount: 150 }),
      ];
      mockQueryReturn(invoices);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert
      expect(result.current.invoicesByStatus.draft).toHaveLength(2);
      expect(result.current.invoicesByStatus.sent).toHaveLength(1);
      expect(result.current.invoicesByStatus.paid).toHaveLength(1);
      expect(result.current.invoicesByStatus.overdue).toHaveLength(1);

      expect(result.current.invoicesByStatus.draft.map((i) => i.id)).toEqual(['1', '5']);
      expect(result.current.invoicesByStatus.sent[0].id).toBe('2');
    });

    it('should return empty groups when no invoices exist', () => {
      // Arrange
      mockQueryReturn([]);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert
      expect(result.current.invoicesByStatus).toEqual({
        draft: [],
        sent: [],
        paid: [],
        overdue: [],
      });
      expect(result.current.allInvoices).toEqual([]);
    });

    it('should handle invoices with unknown status by ignoring them', () => {
      // Arrange -- force an invalid status through the type system
      const invoices = [
        createInvoice({ id: '1', status: 'draft', amount: 100 }),
        createInvoice({ id: '2', status: 'INVALID' as Invoice['status'], amount: 999 }),
      ];
      mockQueryReturn(invoices);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert -- the invalid status is dropped; only draft appears
      expect(result.current.invoicesByStatus.draft).toHaveLength(1);
      expect(result.current.invoicesByStatus.sent).toHaveLength(0);
      expect(result.current.invoicesByStatus.paid).toHaveLength(0);
      expect(result.current.invoicesByStatus.overdue).toHaveLength(0);
    });
  });

  // -----------------------------------------------------------------------
  // Column Totals
  // -----------------------------------------------------------------------

  describe('columnTotals (calculation)', () => {
    it('should calculate column totals correctly', () => {
      // Arrange
      const invoices: Invoice[] = [
        createInvoice({ status: 'draft', amount: 1000 }),
        createInvoice({ status: 'draft', amount: 2000 }),
        createInvoice({ status: 'sent', amount: 3500 }),
        createInvoice({ status: 'paid', amount: 5000 }),
        createInvoice({ status: 'overdue', amount: 750 }),
      ];
      mockQueryReturn(invoices);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert
      expect(result.current.columnTotals).toEqual({
        draft: 3000,
        sent: 3500,
        paid: 5000,
        overdue: 750,
      });
    });

    it('should use totalAmount when available, fallback to amount', () => {
      // Arrange
      const invoices: Invoice[] = [
        createInvoice({ status: 'sent', amount: 1000, totalAmount: 1180 }), // with totalAmount
        createInvoice({ status: 'sent', amount: 2000, totalAmount: undefined }), // fallback to amount
      ];
      mockQueryReturn(invoices);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert -- totalAmount (1180) + amount (2000) = 3180
      expect(result.current.columnTotals.sent).toBe(3180);
    });

    it('should return zero totals when no invoices exist', () => {
      // Arrange
      mockQueryReturn([]);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert
      expect(result.current.columnTotals).toEqual({
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
      });
    });
  });

  // -----------------------------------------------------------------------
  // Active View
  // -----------------------------------------------------------------------

  describe('activeView', () => {
    it('should default activeView to summary', () => {
      // Arrange
      mockQueryReturn([]);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert
      expect(result.current.activeView).toBe('summary');
    });

    it('should allow switching activeView', () => {
      // Arrange
      mockQueryReturn([]);
      const { result } = renderHook(() => useInvoicesBoard());

      // Act
      act(() => {
        result.current.setActiveView('aging');
      });

      // Assert
      expect(result.current.activeView).toBe('aging');
    });
  });

  // -----------------------------------------------------------------------
  // Edge Cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle non-array invoice data gracefully', () => {
      // Arrange -- simulate useInvoicesQuery returning something that is NOT an array
      mockQueryReturn(undefined);

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert -- should degrade to empty arrays, never throw
      expect(result.current.allInvoices).toEqual([]);
      expect(result.current.invoicesByStatus).toEqual({
        draft: [],
        sent: [],
        paid: [],
        overdue: [],
      });
    });

    it('should propagate isLoading from useInvoicesQuery', () => {
      // Arrange
      mockQueryReturn([], { isLoading: true });

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert
      expect(result.current.isLoading).toBe(true);
    });

    it('should propagate error from useInvoicesQuery', () => {
      // Arrange
      const queryError = new Error('Network failure');
      mockQueryReturn([], { error: queryError });

      // Act
      const { result } = renderHook(() => useInvoicesBoard());

      // Assert
      expect(result.current.error).toBe(queryError);
    });
  });
});
