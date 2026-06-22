import { Money } from "@arkelythex/domain";
import { bills, invoices } from "@arkelythex/persistence/schema";
import { db as globalDb } from "@arkelythex/persistence/client";
import { and, eq, gte, lte, sql } from "@arkelythex/persistence/query";
import type { ProfitLossReport } from "../reports.schemas";
import { moneyFromDecimalString } from "../_internal/money-utils";

/**
 * GetProfitLossQuery class.
 *
 * @example
 * ```ts
 * const value = new GetProfitLossQuery();
 * console.log(value);
 * ```
 */
export class GetProfitLossQuery {
	constructor(private db = globalDb) {}

	async execute(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<ProfitLossReport> {
		const revenueResult = await this.db
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

		const expenseResult = await this.db
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

		const revenue = moneyFromDecimalString(
			revenueResult[0]?.total || "0",
			"PEN",
		);
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
}
