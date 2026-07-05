/**
 * GetSalesByCustomer — Returns sales grouped by customer for a given period.
 *
 * @module reports/application/queries
 */

import { db as globalDb } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import { invoices } from "@drenyra/persistence/schema";
import { moneyFromDecimalString } from "../../_internal/money-utils";
import type { SalesByCustomerRow } from "../../reports.schemas";

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
 * Executes a sales-by-customer report for the given company and date range.
 *
 * @param companyId - The company UUID
 * @param startDate - Start of the report period
 * @param endDate - End of the report period
 * @param db - Database instance (defaults to global)
 * @returns Array of sales by customer rows
 */
export async function getSalesByCustomer(
	companyId: string,
	startDate: Date,
	endDate: Date,
	db = globalDb,
): Promise<SalesByCustomerRow[]> {
	const rows: SalesByCustomerAggregateRow[] = await db
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
