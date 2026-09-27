import type { BankTransaction, BankTransactionType } from "../entities/BankTransaction";
export interface BankTransactionFilters {
    bankAccountId?: number;
    type?: BankTransactionType;
    isReconciled?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
    importBatch?: string;
}
export interface PaginationOptions {
    page: number;
    limit: number;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface BankTransactionRepository {
    save(transaction: BankTransaction): Promise<BankTransaction>;
    saveMany(transactions: BankTransaction[]): Promise<BankTransaction[]>;
    update(transaction: BankTransaction): Promise<BankTransaction>;
    findById(id: number, bankAccountId: number): Promise<BankTransaction | null>;
    findByBankAccount(bankAccountId: number, filters?: BankTransactionFilters, pagination?: PaginationOptions): Promise<PaginatedResult<BankTransaction>>;
    findUnreconciled(bankAccountId: number): Promise<BankTransaction[]>;
    findByImportBatch(importBatch: string): Promise<BankTransaction[]>;
    count(bankAccountId: number, filters?: BankTransactionFilters): Promise<number>;
    getSumByType(bankAccountId: number, dateFrom?: Date, dateTo?: Date): Promise<Record<BankTransactionType, number>>;
    delete(id: number, bankAccountId: number): Promise<void>;
    deleteByImportBatch(importBatch: string): Promise<number>;
    markAsReconciled(ids: number[], reconciliationId: number): Promise<void>;
    unmarkReconciled(ids: number[]): Promise<void>;
}
//# sourceMappingURL=bank-transaction.repository.d.ts.map