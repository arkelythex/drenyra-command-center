import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInvoiceCalculations } from '../useInvoiceCalculations';

describe('useInvoiceCalculations', () => {
  it('calculates subtotal, igv and total for mixed tax types', () => {
    const items = [
      { id: '1', description: 'Servicio gravado', quantity: 2, unitPrice: 100, taxType: 'GRAVADO' as const },
      { id: '2', description: 'Servicio exonerado', quantity: 1, unitPrice: 50, taxType: 'EXONERADO' as const },
      { id: '3', description: 'Servicio inafecto', quantity: 3, unitPrice: 20, taxType: 'INAFECTO' as const },
    ];

    const { result } = renderHook(() => useInvoiceCalculations(items));

    expect(result.current.subtotal).toBe(310);
    expect(result.current.igvAmount).toBe(36);
    expect(result.current.totalAmount).toBe(346);
  });

  it('returns zeros when there are no items', () => {
    const { result } = renderHook(() => useInvoiceCalculations([]));

    expect(result.current).toEqual({
      subtotal: 0,
      igvAmount: 0,
      totalAmount: 0,
    });
  });
});
