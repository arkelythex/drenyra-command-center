import { Money } from "@drenyra/domain";
import { db as globalDb } from "@drenyra/persistence/client";
import { and, eq, gte, lte, sql } from "@drenyra/persistence/query";
import { bills, invoices } from "@drenyra/persistence/schema";
import { moneyFromDecimalString, zeroMoney } from "../_internal/money-utils";
import type { CashFlowReport } from "../reports.schemas";

/**
 * GetCashFlowQuery class.
 *
 * @example
 * ```ts
 * const value = new GetCashFlowQuery();
 * console.log(value);
 * ```
 */
export class GetCashFlowQuery {
	constructor(private db = globalDb) {}

	async execute(
		companyId: string,
		startDate: Date,
		endDate: Date,
	): Promise<CashFlowReport> {
		const inflowResult = await this.db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.paidAmount} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.currency, "PEN"),
					eq(invoices.status, "PAID"),
					sql`COALESCE(${invoices.paidDate}, ${invoices.issueDate}) >= ${startDate}`,
					sql`COALESCE(${invoices.paidDate}, ${invoices.issueDate}) <= ${endDate}`,
				),
			);

		const outflowResult = await this.db
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

		const inflow = moneyFromDecimalString(inflowResult[0]?.total || "0", "PEN");
		const outflow = moneyFromDecimalString(
			outflowResult[0]?.total || "0",
			"PEN",
		);
		const operating = Money.fromCents(
			inflow.getCents() - outflow.getCents(),
			"PEN",
		);

		return {
			period: { startDate, endDate },
			operating: operating.toString(),
			investing: zeroMoney("PEN").toString(),
			financing: zeroMoney("PEN").toString(),
			netCashFlow: operating.toString(),
		};
	}
}
