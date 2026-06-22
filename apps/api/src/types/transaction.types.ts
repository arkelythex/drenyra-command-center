import type { Currency } from '@arkelythex/domain';
import type { CashflowTransactionType } from '@arkelythex/domain/value-objects/TransactionType';
import type { SpotDetractionProfile } from '../features/taxation/domain/spot-detraction-profile';

/**
 * @deprecated Import CashflowTransactionType from @arkelythex/domain instead
 */
export type TransactionType = CashflowTransactionType;

export interface CreateTransactionDTO {
  companyId: string; // Required: company context for the transaction
  type: TransactionType;
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
