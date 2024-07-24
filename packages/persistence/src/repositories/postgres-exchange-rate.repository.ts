/**
 * PostgreSQL Implementation of ExchangeRateRepository
 *
 * Infrastructure layer — implements domain repository interface.
 */

import { ExchangeRate } from "@drenyra/domain/accounting/exchange-rate";
import type { ExchangeRateRepository } from "@drenyra/domain/repositories/exchange-rate.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { db } from "@drenyra/persistence/client";
import { exchangeRates } from "@drenyra/persistence/schema";
import { randomUUID } from "crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";

/**
 * Rates are stored as integers with 4 decimal places (e.g., 37250 = 3.7250).
 */
function rateToDb(value: number): number {
	return Math.round(value * 10000);
}

function rateFromDb(value: number): number {
	return value / 10000;
}

export class PostgresExchangeRateRepository implements ExchangeRateRepository {
	async save(rate: ExchangeRate, companyId: string): Promise<void> {
		const id = randomUUID();

		await db.insert(exchangeRates).values({
			id,
			companyId,
			date: rate.date,
			currencyFrom: rate.currencyFrom,
			currencyTo: rate.currencyTo,
			buyRate: rateToDb(rate.buy),
			sellRate: rateToDb(rate.sell),
			sunatReference:
				rate.sunatReference !== null ? rateToDb(rate.sunatReference) : null,
		});
	}

	async findById(
		scope: TenantScope,
		id: string,
	): Promise<ExchangeRate | null> {
		const result = await db
			.select()
			.from(exchangeRates)
			.where(
				and(
					eq(exchangeRates.id, id),
					eq(exchangeRates.companyId, scope.companyId),
				),
			)
			.limit(1);

		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}



	async findByDateAndCurrency(
		companyId: string,
		date: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate | null> {
		// Compare by date range (start of day to end of day)
		const start = new Date(date);
		start.setHours(0, 0, 0, 0);
		const end = new Date(date);
		end.setHours(23, 59, 59, 999);

		const result = await db
			.select()
			.from(exchangeRates)
			.where(
				and(
					eq(exchangeRates.companyId, companyId),
					gte(exchangeRates.date, start),
					lte(exchangeRates.date, end),
					eq(exchangeRates.currencyFrom, currencyFrom),
					eq(exchangeRates.currencyTo, currencyTo),
				),
			)
			.limit(1);

		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}

	async findByDateRange(
		companyId: string,
		startDate: Date,
		endDate: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate[]> {
		const result = await db
			.select()
			.from(exchangeRates)
			.where(
				and(
					eq(exchangeRates.companyId, companyId),
					gte(exchangeRates.date, startDate),
					lte(exchangeRates.date, endDate),
					eq(exchangeRates.currencyFrom, currencyFrom),
					eq(exchangeRates.currencyTo, currencyTo),
				),
			)
			.orderBy(desc(exchangeRates.date));

		return result.map((row) => this.mapToDomain(row));
	}

	async findLatestBefore(
		companyId: string,
		date: Date,
		currencyFrom: string,
		currencyTo: string,
	): Promise<ExchangeRate | null> {
		const result = await db
			.select()
			.from(exchangeRates)
			.where(
				and(
					eq(exchangeRates.companyId, companyId),
					lte(exchangeRates.date, date),
					eq(exchangeRates.currencyFrom, currencyFrom),
					eq(exchangeRates.currencyTo, currencyTo),
				),
			)
			.orderBy(desc(exchangeRates.date))
			.limit(1);

		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}

	async delete(id: string): Promise<void> {
		await db.delete(exchangeRates).where(eq(exchangeRates.id, id));
	}

	private mapToDomain(raw: typeof exchangeRates.$inferSelect): ExchangeRate {
		return ExchangeRate.fromJSON({
			date: raw.date.toISOString(),
			currencyFrom: raw.currencyFrom,
			currencyTo: raw.currencyTo,
			buy: rateFromDb(raw.buyRate),
			sell: rateFromDb(raw.sellRate),
			sunatReference:
				raw.sunatReference !== null ? rateFromDb(raw.sunatReference) : null,
		});
	}
}
