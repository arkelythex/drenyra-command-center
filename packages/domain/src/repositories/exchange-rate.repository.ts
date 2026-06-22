/**
 * ExchangeRate Repository Interface
 *
 * Port for exchange rate persistence.
 * Following dependency inversion — domain defines the contract.
 */

import type { ExchangeRate } from "../accounting/exchange-rate";

export interface ExchangeRateRepository {
	save(rate: ExchangeRate, companyId: string): Promise<void>;
	findById(id: string): Promise<ExchangeRate | null>;
	findByDateAndCurrency(
		companyId: string,
		date: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate | null>;
	findByDateRange(
		companyId: string,
		startDate: Date,
		endDate: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate[]>;
	findLatestBefore(
		companyId: string,
		date: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate | null>;
	delete(id: string): Promise<void>;
}
