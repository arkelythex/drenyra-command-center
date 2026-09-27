import { AccountingPeriod } from "@drenyra/domain/accounting/accounting-period";
import type { AccountingPeriodRepository } from "@drenyra/domain/repositories/accounting-period.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresAccountingPeriodRepository implements AccountingPeriodRepository {
    save(period: AccountingPeriod, companyId: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<AccountingPeriod | null>;
    findByCompanyAndPeriod(companyId: string, year: number, month: number): Promise<AccountingPeriod | null>;
    findAllByCompany(companyId: string): Promise<AccountingPeriod[]>;
    findByYear(companyId: string, year: number): Promise<AccountingPeriod[]>;
    getCurrentPeriod(companyId: string): Promise<AccountingPeriod | null>;
    delete(id: string): Promise<void>;
    count(companyId: string): Promise<number>;
    private mapToDomain;
}
//# sourceMappingURL=postgres-accounting-period.repository.d.ts.map