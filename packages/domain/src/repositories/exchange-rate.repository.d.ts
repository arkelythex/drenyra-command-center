import type { ExchangeRate } from "../accounting/exchange-rate";
import type { TenantScope } from "../scope";
export interface ExchangeRateRepository {
    save(rate: ExchangeRate, companyId: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<ExchangeRate | null>;
    findByDateAndCurrency(companyId: string, date: Date, currencyFrom: string, currencyTo: string): Promise<ExchangeRate | null>;
    findByDateRange(companyId: string, startDate: Date, endDate: Date, currencyFrom: string, currencyTo: string): Promise<ExchangeRate[]>;
    findLatestBefore(companyId: string, date: Date, currencyFrom: string, currencyTo: string): Promise<ExchangeRate | null>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=exchange-rate.repository.d.ts.map