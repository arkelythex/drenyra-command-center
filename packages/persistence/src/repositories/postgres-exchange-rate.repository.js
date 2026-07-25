import { randomUUID } from "node:crypto";
import { ExchangeRate } from "@drenyra/domain/accounting/exchange-rate";
import { db } from "@drenyra/persistence/client";
import { exchangeRates } from "@drenyra/persistence/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";

function rateToDb(value) {
	return Math.round(value * 10000);
}
function rateFromDb(value) {
	return value / 10000;
}
export class PostgresExchangeRateRepository {
	async save(rate, companyId) {
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
	async findById(id) {
		const result = await db
			.select()
			.from(exchangeRates)
			.where(eq(exchangeRates.id, id))
			.limit(1);
		if (!result[0]) return null;
		return this.mapToDomain(result[0]);
	}
	async findByDateAndCurrency(companyId, date, currencyFrom, currencyTo) {
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
		companyId,
		startDate,
		endDate,
		currencyFrom,
		currencyTo,
	) {
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
	async findLatestBefore(companyId, date, currencyFrom, currencyTo) {
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
	async delete(id) {
		await db.delete(exchangeRates).where(eq(exchangeRates.id, id));
	}
	mapToDomain(raw) {
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
