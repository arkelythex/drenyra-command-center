export type AccountingTransactionType = "SALE" | "PURCHASE" | "PAYMENT" | "RECEIPT" | "ADJUSTMENT" | "TRANSFER";
export type BankTransactionType = "DEBIT" | "CREDIT";
export type CashflowTransactionType = "INCOME" | "EXPENSE";
export type TransactionType = AccountingTransactionType | BankTransactionType | CashflowTransactionType;
export declare const ACCOUNTING_TRANSACTION_TYPES: readonly AccountingTransactionType[];
export declare const BANK_TRANSACTION_TYPES: readonly BankTransactionType[];
export declare const CASHFLOW_TRANSACTION_TYPES: readonly CashflowTransactionType[];
export declare const ACCOUNTING_TRANSACTION_TYPE_LABELS: Record<AccountingTransactionType, string>;
export declare const BANK_TRANSACTION_TYPE_LABELS: Record<BankTransactionType, string>;
export declare const CASHFLOW_TRANSACTION_TYPE_LABELS: Record<CashflowTransactionType, string>;
export declare function isAccountingTransactionType(value: unknown): value is AccountingTransactionType;
export declare function isBankTransactionType(value: unknown): value is BankTransactionType;
export declare function isCashflowTransactionType(value: unknown): value is CashflowTransactionType;
//# sourceMappingURL=TransactionType.d.ts.map