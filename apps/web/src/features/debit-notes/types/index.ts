export interface DebitNoteRecord {
  id: string;
  referenceInvoiceId: string;
  reason: string;
  fullNumber: string;
  series: string;
  number: number;
  additionalAmount: string;
  totalAmount: string;
  baseAmount: string;
  igvAmount: string;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  issueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebitNoteListFilters {
  companyId: string;
  referenceInvoiceId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CreateDebitNotePayload {
  companyId: string;
  referenceInvoiceId: string;
  reason: string;
  series: string;
  issueDate: string;
  currency: 'PEN' | 'USD' | 'EUR';
  baseAmount: string;
  igvAmount: string;
}
