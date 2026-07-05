import type { Currency } from '@drenyra/domain';

export interface CreateInvoiceDTO {
  companyId: string;
  customerId: string;
  series: string;
  issueDate: string;
  dueDate: string;
  currency?: Currency;
  exchangeRate?: string;
  notes?: string;
  items: InvoiceItemDTO[];
}

export interface InvoiceItemDTO {
  productId?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxType?: 'GRAVADO' | 'EXONERADO' | 'INAFECTO';
}

export interface InvoiceTotals {
  subtotal: string;
  igvAmount: string;
  totalAmount: string;
  balanceDue: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'OVERDUE' | 'PAID' | 'CANCELLED';
