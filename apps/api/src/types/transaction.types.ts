import type { Currency } from '@drenyra/domain';
import type { CashflowTransactionType } from '@drenyra/domain/value-objects/TransactionType';
import type { SpotDetractionProfile } from '../features/taxation/domain/spot-detraction-profile';

export interface CreateTransactionDTO {
  companyId: string; // Required: company context for the transaction
  type: CashflowTransactionType;
  partnerId: string;
  totalAmount: string;
  currency: Currency;
  hasDetraction: boolean;
  detractionProfile?: SpotDetractionProfile;
}

export interface TransactionFilters {
  type?: string;
  partnerId?: string;
  dateFrom?: string;
  dateTo?: string;
}
