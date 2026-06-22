/**
 * GetProfitLoss — Returns the profit and loss report for a given period.
 *
 * @module reports/application/queries
 */

import { Money } from "@arkelythex/domain";
import { db as globalDb } from "@arkelythex/persistence/client";
import { and, eq, gte, lte, sql } from "@arkelythex/persistence/query";
import { bills, invoices } from "@arkelythex/persistence/schema";
import { moneyFromDecimalString } from "../../_internal/money-utils";
import type { ProfitLossReport } from "../../reports.schemas";

/**
 * Executes a profit and loss report for the given company and date range.
 *
 * @param companyId - The company UUID
 * @param startDate - Start of the report period
 * @param endDate - End of the report period
 * @param db - Database instance (defaults to global)
 * @returns The profit and loss report
 */
export async function getProfitLoss(
	companyId: string,
	startDate: Date,
	endDate: Date,
	db = globalDb,
): Promise<ProfitLossReport> {
	const revenueResult = await db
		.select({
			total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
		})
		.from(invoices)
		.where(
			and(
				eq(invoices.companyId, companyId),
				eq(invoices.currency, "PEN"),
				eq(invoices.status, "PAID"),
				gte(invoices.issueDate, startDate),
				lte(invoices.issueDate, endDate),
			),
		);

	const expenseResult = await db
		.select({
			total: sql<string>`COALESCE(SUM(CAST(${bills.totalAmount} AS DECIMAL)), 0)`,
		})
		.from(bills)
		.where(
			and(
				eq(bills.companyId, companyId),
				eq(bills.currency, "PEN"),
				eq(bills.status, "PAID"),
				gte(bills.issueDate, startDate),
				lte(bills.issueDate, endDate),
			),
		);

	const revenue = moneyFromDecimalString(revenueResult[0]?.total || "0", "PEN");
	const expenses = moneyFromDecimalString(
		expenseResult[0]?.total || "0",
		"PEN",
	);
	const netIncome = Money.fromCents(
		revenue.getCents() - expenses.getCents(),
		"PEN",
	);

	return {
		period: { startDate, endDate },
		revenue: revenue.toString(),
		expenses: expenses.toString(),
		netIncome: netIncome.toString(),
	};
}
