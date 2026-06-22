/**
 * Transaction Type Value Objects
 *
 * Defines the THREE different transaction type systems used in ARKELYTHEX.
 * Each system serves a different purpose and should not be confused.
 *
 * **IMPORTANT:** This file consolidates 3 previously conflicting definitions.
 *
 * @module domain/value-objects/TransactionType
 * @since 2026-02-10 (Phase 2 Type Consolidation)
 * Accounting transaction types (double-entry bookkeeping).
 * Used in the domain layer for journal entries and ledger postings.
 *
 * @typedef {('SALE' | 'PURCHASE' | 'PAYMENT' | 'RECEIPT' | 'ADJUSTMENT' | 'TRANSFER')} AccountingTransactionType
 *
 * @property SALE - Venta (revenue transaction)
 * @property PURCHASE - Compra (expense transaction)
 * @property PAYMENT - Pago (outgoing payment)
 * @property RECEIPT - Cobro (incoming receipt)
 * @property ADJUSTMENT - Ajuste (accounting adjustment)
 * @property TRANSFER - Transferencia (internal transfer)
 *
 * @example
 * ```typescript
 * const journalEntry: AccountingTransactionType = 'SALE';
 * ```
 */

export type AccountingTransactionType =
  | 'SALE'        // Venta
  | 'PURCHASE'    // Compra
  | 'PAYMENT'     // Pago
  | 'RECEIPT'     // Cobro
  | 'ADJUSTMENT'  // Ajuste
  | 'TRANSFER';   // Transferencia

/**
 * Bank transaction types (bank account movements).
 * Used in the banking feature for reconciliation and statement processing.
 *
 * @typedef {('DEBIT' | 'CREDIT')} BankTransactionType
 *
 * @property DEBIT - Débito (money out, decrease in account balance)
 * @property CREDIT - Crédito (money in, increase in account balance)
 *
 * @example
 * ```typescript
 * const bankMovement: BankTransactionType = 'DEBIT';
 * ```
 */
export type BankTransactionType =
  | 'DEBIT'   // Débito (salida)
  | 'CREDIT'; // Crédito (entrada)

/**
 * Cashflow transaction types (financial reports).
 * Used in dashboards and reports for high-level financial analysis.
 *
 * @typedef {('INCOME' | 'EXPENSE')} CashflowTransactionType
 *
 * @property INCOME - Ingreso (revenue, positive cashflow)
 * @property EXPENSE - Egreso (cost, negative cashflow)
 *
 * @example
 * ```typescript
 * const cashflow: CashflowTransactionType = 'INCOME';
 * ```
 */
export type CashflowTransactionType =
  | 'INCOME'   // Ingreso
  | 'EXPENSE'; // Egreso

/**
 * @deprecated Use specific type instead (AccountingTransactionType, BankTransactionType, or CashflowTransactionType)
 * @example
 * ```ts
 * const value: TransactionType = {} as TransactionType;
 * console.log(value);
 * ```
 */

export type TransactionType = AccountingTransactionType | BankTransactionType | CashflowTransactionType;

// ===== Constants and Helpers =====

/**
 * All valid accounting transaction types.
 * @example
 * ```ts
 * console.log(ACCOUNTING_TRANSACTION_TYPES);
 * ```
 */

export const ACCOUNTING_TRANSACTION_TYPES: readonly AccountingTransactionType[] = [
  'SALE',
  'PURCHASE',
  'PAYMENT',
  'RECEIPT',
  'ADJUSTMENT',
  'TRANSFER',
] as const;

/**
 * All valid bank transaction types.
 * @example
 * ```ts
 * console.log(BANK_TRANSACTION_TYPES);
 * ```
 */

export const BANK_TRANSACTION_TYPES: readonly BankTransactionType[] = [
  'DEBIT',
  'CREDIT',
] as const;

/**
 * All valid cashflow transaction types.
 * @example
 * ```ts
 * console.log(CASHFLOW_TRANSACTION_TYPES);
 * ```
 */

export const CASHFLOW_TRANSACTION_TYPES: readonly CashflowTransactionType[] = [
  'INCOME',
  'EXPENSE',
] as const;

/**
 * Spanish labels for accounting transaction types.
 * @example
 * ```ts
 * console.log(ACCOUNTING_TRANSACTION_TYPE_LABELS);
 * ```
 */

export const ACCOUNTING_TRANSACTION_TYPE_LABELS: Record<AccountingTransactionType, string> = {
  SALE: 'Venta',
  PURCHASE: 'Compra',
  PAYMENT: 'Pago',
  RECEIPT: 'Cobro',
  ADJUSTMENT: 'Ajuste',
  TRANSFER: 'Transferencia',
} as const;

/**
 * Spanish labels for bank transaction types.
 * @example
 * ```ts
 * console.log(BANK_TRANSACTION_TYPE_LABELS);
 * ```
 */

export const BANK_TRANSACTION_TYPE_LABELS: Record<BankTransactionType, string> = {
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
} as const;

/**
 * Spanish labels for cashflow transaction types.
 * @example
 * ```ts
 * console.log(CASHFLOW_TRANSACTION_TYPE_LABELS);
 * ```
 */

export const CASHFLOW_TRANSACTION_TYPE_LABELS: Record<CashflowTransactionType, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Egreso',
} as const;

/**
 * Type guards
 * @param value - Input for value.
 * @returns Result of isAccountingTransactionType.
 * @example
 * ```ts
 * const result = isAccountingTransactionType(undefined);
 * console.log(result);
 * ```
 */

export function isAccountingTransactionType(value: unknown): value is AccountingTransactionType {
  return typeof value === 'string' && ACCOUNTING_TRANSACTION_TYPES.includes(value as AccountingTransactionType);
}

/**
 * isBankTransactionType operation.
 *
 * @param value - Input for value.
 * @returns Result of isBankTransactionType.
 * @example
 * ```ts
 * const result = isBankTransactionType(undefined);
 * console.log(result);
 * ```
 */
export function isBankTransactionType(value: unknown): value is BankTransactionType {
  return typeof value === 'string' && BANK_TRANSACTION_TYPES.includes(value as BankTransactionType);
}

/**
 * isCashflowTransactionType operation.
 *
 * @param value - Input for value.
 * @returns Result of isCashflowTransactionType.
 * @example
 * ```ts
 * const result = isCashflowTransactionType(undefined);
 * console.log(result);
 * ```
 */
export function isCashflowTransactionType(value: unknown): value is CashflowTransactionType {
  return typeof value === 'string' && CASHFLOW_TRANSACTION_TYPES.includes(value as CashflowTransactionType);
}
