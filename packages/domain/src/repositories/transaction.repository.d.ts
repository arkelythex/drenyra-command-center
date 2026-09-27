import type { Transaction, TransactionStatus, TransactionType } from "../entities/Transaction";
export interface TransactionFilters {
    status?: TransactionStatus;
    type?: TransactionType;
    dateFrom?: Date;
    dateTo?: Date;
    referenceNumber?: string;
    minAmount?: number;
    maxAmount?: number;
    accountCode?: string;
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
export interface TransactionRepository {
    save(transaction: Transaction, organizationId: number): Promise<void>;
    update(transaction: Transaction, organizationId: number): Promise<void>;
    delete(id: string, organizationId: number): Promise<void>;
    findById(scope: import("../scope").TenantScope, id: string): Promise<Transaction | null>;
    _findByIdLegacy(id: string, organizationId: number): Promise<Transaction | null>;
    findByReferenceNumber(referenceNumber: string, organizationId: number): Promise<Transaction | null>;
    findAll(organizationId: number, filters?: TransactionFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Transaction>>;
    findByAccount(accountCode: string, organizationId: number, dateFrom?: Date, dateTo?: Date): Promise<Transaction[]>;
    count(organizationId: number, filters?: TransactionFilters): Promise<number>;
    getNextReferenceNumber(organizationId: number, type: TransactionType): Promise<string>;
}
//# sourceMappingURL=transaction.repository.d.ts.map