/**
 * ExchangeRate Service
 *
 * Orchestrates exchange rate business rules with persistence.
 */

import {
	ExchangeRate,
	InvalidExchangeRateError,
} from "@drenyra/domain/accounting/exchange-rate";
import type { ExchangeRateRepository } from "@drenyra/domain/repositories/exchange-rate.repository";

export interface SetRateDTO {
	date: Date;
	currencyFrom: string;
	currencyTo: string;
	buyRate: number;
	sellRate: number;
	sunatReferenceRate?: number;
}

export class ExchangeRateService {
	constructor(
		private readonly rateRepo: ExchangeRateRepository,
	) {}

	/**
	 * Set a new exchange rate for a given date and currency pair.
	 * Validates input and creates the domain entity.
	 */
	async setRate(companyId: string, dto: SetRateDTO): Promise<ExchangeRate> {
		if (!companyId || companyId.trim().length === 0) {
			throw new InvalidExchangeRateError(
				dto.currencyFrom,
				dto.currencyTo,
				"Company ID is required",
			);
		}

		// Domain entity validates all rate parameters
		const rate = ExchangeRate.create(
			dto.date,
			dto.currencyFrom,
			dto.currencyTo,
			dto.buyRate,
			dto.sellRate,
			dto.sunatReferenceRate ?? null,
		);

		await this.rateRepo.save(rate, companyId);

		return rate;
	}

	/**
	 * Get the exchange rate for a given date and currency pair.
	 * Tries exact date match first, falls back to latest rate before the date.
	 */
	async getRate(
		companyId: string,
		date: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate | null> {
		if (!companyId || companyId.trim().length === 0) {
			throw new InvalidExchangeRateError(
				currencyFrom,
				currencyTo,
				"Company ID is required",
			);
		}

		// First try exact date match
		const exact = await this.rateRepo.findByDateAndCurrency(
			companyId,
			date,
			currencyFrom,
			currencyTo,
		);

		if (exact) return exact;

		// Fall back to latest rate before the given date
		return this.rateRepo.findLatestBefore(
			companyId,
			date,
			currencyFrom,
			currencyTo,
		);
	}

	/**
	 * Get exchange rates for a date range.
	 */
	async getRateHistory(
		companyId: string,
		startDate: Date,
		endDate: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate[]> {
		return this.rateRepo.findByDateRange(
			companyId,
			startDate,
			endDate,
			currencyFrom,
			currencyTo,
		);
	}
}
