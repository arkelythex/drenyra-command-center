import { Transaction } from "@drenyra/domain/entities/Transaction";
import type { PaginatedResult, PaginationOptions, TransactionFilters, TransactionRepository } from "@drenyra/domain/repositories/transaction.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresTransactionRepository implements TransactionRepository {
    save(transaction: Transaction, organizationId: number): Promise<void>;
    update(transaction: Transaction, organizationId: number): Promise<void>;
    delete(id: string, organizationId: number): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<Transaction | null>;
    _findByIdLegacy(id: string, organizationId: number): Promise<Transaction | null>;
    findByReferenceNumber(referenceNumber: string, organizationId: number): Promise<Transaction | null>;
    findAll(organizationId: number, filters?: TransactionFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Transaction>>;
    findByAccount(_accountCode: string, _organizationId: number, _dateFrom?: Date, _dateTo?: Date): Promise<Transaction[]>;
    count(organizationId: number, filters?: TransactionFilters): Promise<number>;
    getNextReferenceNumber(organizationId: number, type: string): Promise<string>;
    private buildFilterConditions;
    private mapToDomain;
}
//# sourceMappingURL=repository.d.ts.map