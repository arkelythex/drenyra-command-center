import { ExchangeRate } from "@drenyra/domain/accounting/exchange-rate";
import type { ExchangeRateRepository } from "@drenyra/domain/repositories/exchange-rate.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresExchangeRateRepository implements ExchangeRateRepository {
    save(rate: ExchangeRate, companyId: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<ExchangeRate | null>;
    findByDateAndCurrency(companyId: string, date: Date, currencyFrom: string, currencyTo: string): Promise<ExchangeRate | null>;
    findByDateRange(companyId: string, startDate: Date, endDate: Date, currencyFrom: string, currencyTo: string): Promise<ExchangeRate[]>;
    findLatestBefore(companyId: string, date: Date, currencyFrom: string, currencyTo: string): Promise<ExchangeRate | null>;
    delete(id: string): Promise<void>;
    private mapToDomain;
}
//# sourceMappingURL=postgres-exchange-rate.repository.d.ts.map