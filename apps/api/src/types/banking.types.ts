/**
 * Banking Types
 */

import type { BankAccountType } from '@arkelythex/domain/value-objects/AccountType';

/**
 * @deprecated Import BankAccountType from @arkelythex/domain instead
 */
export type AccountType = BankAccountType;
import type { BankTransactionType } from '@arkelythex/domain/value-objects/TransactionType';

/**
 * @deprecated Import BankTransactionType from @arkelythex/domain instead
 */
export type TransactionType = BankTransactionType;
export type ReconciliationStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface BankAccount {
  id: string;
  companyId: string;
  accountName: string;
  accountNumber: string;
  accountType: AccountType;
  bankName: string;
  bankCode?: string;
  branch?: string;
  currency: string;
  currentBalance: string;
  availableBalance?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankTransaction {
  id: string;
  companyId: string;
  accountId: string;
  transactionDate: Date;
  description: string;
  reference?: string;
  type: TransactionType;
  amount: string;
  balance?: string;
  category?: string;
  tags?: string[];
  isReconciled: boolean;
  reconciledAt?: Date;
  invoiceId?: string;
  billId?: string;
  paymentId?: string;
  createdAt: Date;
  importedFrom?: string;
}

export interface BankReconciliation {
  id: string;
  companyId: string;
  accountId: string;
  startDate: Date;
  endDate: Date;
  openingBalance: string;
  closingBalance: string;
  statementBalance?: string;
  status: ReconciliationStatus;
  difference?: string;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateAccountDTO {
  accountName: string;
  accountNumber: string;
  accountType: AccountType;
  bankName: string;
  bankCode?: string;
  branch?: string;
  currency?: string;
  currentBalance?: number;
}

export interface CreateTransactionDTO {
  accountId: string;
  transactionDate: Date;
  description: string;
  reference?: string;
  type: TransactionType;
  amount: number;
  category?: string;
  tags?: string[];
}

export interface BankingSummary {
  totalAccounts: number;
  totalBalance: string;
  totalBalancePEN: string;
  totalBalanceUSD: string;
  unreconciledTransactions: number;
  lastReconciliation?: Date;
}
