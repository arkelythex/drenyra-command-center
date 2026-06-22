import { useMemo } from 'react';

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxType: 'GRAVADO' | 'EXONERADO' | 'INAFECTO';
}

export const useInvoiceCalculations = (items: InvoiceItem[]) => {
  const totals = useMemo(() => {
    let subtotal = 0;
    let igvAmount = 0;

    items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemIgv = item.taxType === 'GRAVADO' ? itemSubtotal * 0.18 : 0;
      
      subtotal += itemSubtotal;
      igvAmount += itemIgv;
    });

    return {
      subtotal,
      igvAmount,
      totalAmount: subtotal + igvAmount,
    };
  }, [items]);

  return totals;
};
