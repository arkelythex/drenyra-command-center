import { invoices } from "@drenyra/persistence/schema";
import { db as globalDb } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import type { SalesByCustomerRow } from "../reports.schemas";
import { moneyFromDecimalString } from "../_internal/money-utils";

interface SalesByCustomerAggregateRow {
	customerId: string | null;
	total: string | null;
	count: number | string;
}

function normalizeCount(value: number | string): number {
	const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`Invalid sales-by-customer count: ${value}`);
	}
	return parsed;
}

/**
 * GetSalesByCustomerQuery class.
 *
 * @example
 * ```ts
 * const value = new GetSalesByCustomerQuery();
 * console.log(value);
 * ```
 */
export class GetSalesByCustomerQuery {
	constructor(private db = globalDb) {}

	async execute(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<SalesByCustomerRow[]> {
		const rows: SalesByCustomerAggregateRow[] = await this.db
			.select({
				customerId: invoices.customerId,
				total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
				count: sql<number | string>`CAST(COUNT(*) AS INTEGER)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.currency, "PEN"),
					gte(invoices.issueDate, startDate),
					lte(invoices.issueDate, endDate),
				),
			)
			.groupBy(invoices.customerId);

		return rows.map((row) => ({
			customerId: row.customerId,
			total: moneyFromDecimalString(row.total ?? "0", "PEN").toString(),
			count: normalizeCount(row.count),
		}));
	}
}
