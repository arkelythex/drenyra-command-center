export interface InvoiceFilters {
  search?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  status?: string[];
}
