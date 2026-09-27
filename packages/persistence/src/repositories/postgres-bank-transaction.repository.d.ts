import { BankTransaction, type BankTransactionType } from "@drenyra/domain/entities/BankTransaction";
import type { BankTransactionFilters, BankTransactionRepository, PaginatedResult, PaginationOptions } from "@drenyra/domain/repositories/bank-transaction.repository";
export declare class PostgresBankTransactionRepository implements BankTransactionRepository {
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
    markAsReconciled(ids: number[], _reconciliationId: number): Promise<void>;
    unmarkReconciled(ids: number[]): Promise<void>;
    private toInsert;
    private buildConditions;
    private mapToDomain;
}
//# sourceMappingURL=postgres-bank-transaction.repository.d.ts.map