/**
 * Banking Domain Types
 * Core type definitions for the banking bounded context
 */

import type { Currency } from '@arkelythex/domain/value-objects/Money';
import type { BankAccountType } from '@arkelythex/domain/value-objects/AccountType';

/**
 * Bank account category.
 *
 * @deprecated Import BankAccountType from @arkelythex/domain instead
 * @example
 * ```ts
 * const type: BankAccountType = 'CHECKING';
 * ```
 */
export type AccountType = BankAccountType;

import type { BankTransactionType } from '@arkelythex/domain/value-objects/TransactionType';

/**
 * Bank transaction direction.
 *
 * @deprecated Import BankTransactionType from @arkelythex/domain instead
 * @example
 * ```ts
 * const type: BankTransactionType = 'DEBIT';
 * ```
 */
export type TransactionType = BankTransactionType;

/**
 * Lifecycle status of a transaction within reconciliation.
 *
 * @example
 * ```ts
 * const status: ReconciliationStatus = 'PENDING';
 * ```
 */
export type ReconciliationStatus = 'PENDING' | 'MATCHED' | 'RECONCILED' | 'REJECTED';

/**
 * Matching strategy used to score a reconciliation candidate.
 *
 * @example
 * ```ts
 * const criteria: MatchCriteria = 'AMOUNT_DATE';
 * ```
 */
export type MatchCriteria = 'REFERENCE' | 'AMOUNT_DATE' | 'AMOUNT_ENTITY' | 'PARTIAL';

/**
 * Document type that can be reconciled against a bank transaction.
 *
 * @example
 * ```ts
 * const docType: DocumentType = 'INVOICE';
 * ```
 */
export type DocumentType = 'INVOICE' | 'BILL';

/**
 * Source of imported bank transactions.
 *
 * @example
 * ```ts
 * const source: ImportSource = 'CSV';
 * ```
 */
export type ImportSource = 'MANUAL' | 'CSV' | 'BANK_API' | 'MT940';

/**
 * Bank account persistence/transport shape used by the Banking bounded context.
 *
 * @example
 * ```ts
 * const props = {
 *   id: 'acc_123',
 *   accountType: 'CHECKING',
 *   currency: 'PEN',
 * } as BankAccountProps;
 * ```
 */
export interface BankAccountProps {
  id: string;
  companyId: string;
  accountName: string;
  accountNumber: string;
  accountType: AccountType;
  bankName: string;
  bankCode?: string;
  branch?: string;
  currency: Currency;
  currentBalance: string;
  availableBalance?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Bank transaction persistence/transport shape used by the Banking bounded context.
 *
 * @example
 * ```ts
 * const tx = {
 *   id: 'tx_123',
 *   type: 'DEBIT',
 *   amount: '150.00',
 * } as BankTransactionProps;
 * ```
 */
export interface BankTransactionProps {
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
  reconciledBy?: string;
  invoiceId?: string;
  billId?: string;
  importedFrom: ImportSource;
  createdAt: Date;
}

/**
 * A scored match between a bank transaction and a business document (invoice/bill).
 *
 * @example
 * ```ts
 * const match = {
 *   transactionId: 'tx_123',
 *   documentType: 'INVOICE',
 *   matchScore: 80,
 *   matchCriteria: 'AMOUNT_DATE',
 * } as ReconciliationMatchProps;
 * ```
 */
export interface ReconciliationMatchProps {
  transactionId: string;
  documentId: string;
  documentType: DocumentType;
  matchScore: number;
  matchCriteria: MatchCriteria;
  matchedAt: Date;
  matchedBy: string;
  isConfirmed: boolean;
}

/**
 * Representation of a partial payment linked to multiple transactions.
 *
 * @example
 * ```ts
 * const pp = {
 *   invoiceId: 'inv_123',
 *   status: 'PARTIAL',
 *   totalPaid: '100.00',
 * } as PartialPaymentProps;
 * ```
 */
export interface PartialPaymentProps {
  id: string;
  invoiceId: string;
  transactionIds: string[];
  totalPaid: string;
  totalDue: string;
  currency: Currency;
  status: 'PARTIAL' | 'COMPLETE';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result summary for reconciliation runs.
 *
 * @example
 * ```ts
 * const result = {
 *   reconciledCount: 10,
 *   totalProcessed: 20,
 *   unmatched: 10,
 * } as ReconciliationResult;
 * ```
 */
export interface ReconciliationResult {
  reconciledCount: number;
  totalProcessed: number;
  matches: ReconciliationMatchProps[];
  unmatched: number;
  errors: Array<{ transactionId: string; error: string }>;
}

/**
 * Aggregate view of banking state for a company.
 *
 * @example
 * ```ts
 * const summary = {
 *   totalAccounts: 2,
 *   totalBalancePEN: '1000.00',
 *   totalBalanceUSD: '0.00',
 *   unreconciledTransactions: 5,
 * } as BankingSummary;
 * ```
 */
export interface BankingSummary {
  totalAccounts: number;
  totalBalancePEN: string;
  totalBalanceUSD: string;
  unreconciledTransactions: number;
  lastReconciliation?: Date;
}

/**
 * Input payload for creating a bank account.
 *
 * @example
 * ```ts
 * const dto: CreateAccountDTO = {
 *   accountName: 'Cuenta principal',
 *   accountNumber: '191-1234567890',
 *   accountType: 'CHECKING',
 *   bankName: 'BCP',
 * };
 * ```
 */
export interface CreateAccountDTO {
  accountName: string;
  accountNumber: string;
  accountType: AccountType;
  bankName: string;
  bankCode?: string;
  branch?: string;
  currency?: Currency;
  currentBalance?: number;
}

/**
 * Input payload for creating a bank transaction.
 *
 * @example
 * ```ts
 * const dto: CreateTransactionDTO = {
 *   accountId: 'acc_123',
 *   transactionDate: new Date(),
 *   description: 'Pago factura',
 *   type: 'DEBIT',
 *   amount: 150.5,
 * };
 * ```
 */
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

/**
 * Filtering and pagination options for listing transactions.
 *
 * @example
 * ```ts
 * const filters: TransactionFilters = { isReconciled: false, limit: 50, offset: 0 };
 * ```
 */
export interface TransactionFilters {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  isReconciled?: boolean;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

/**
 * Input payload for importing a single transaction row.
 *
 * @example
 * ```ts
 * const row: ImportTransactionDTO = {
 *   date: new Date(),
 *   description: 'DEPÓSITO',
 *   amount: 500,
 *   type: 'CREDIT',
 * };
 * ```
 */
export interface ImportTransactionDTO {
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  reference?: string;
}

/**
 * Result summary for an import operation.
 *
 * @example
 * ```ts
 * const res: ImportResult = { imported: 10, skipped: 2, errors: [] };
 * ```
 */
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}
