import { Money } from "@drenyra/domain";
import { db as globalDb } from "@drenyra/persistence/client";
import { and, eq, lte, sql } from "@drenyra/persistence/query";
import { bills, invoices } from "@drenyra/persistence/schema";
import { moneyFromDecimalString } from "../_internal/money-utils";
import type { BalanceSheetReport } from "../reports.schemas";

/**
 * GetBalanceSheetQuery class.
 *
 * @example
 * ```ts
 * const value = new GetBalanceSheetQuery();
 * console.log(value);
 * ```
 */
export class GetBalanceSheetQuery {
	constructor(private db = globalDb) {}

	async execute(
		companyId: string,
		asOfDate: Date,
	): Promise<BalanceSheetReport> {
		const receivablesResult = await this.db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${invoices.balanceDue} AS DECIMAL)), 0)`,
			})
			.from(invoices)
			.where(
				and(
					eq(invoices.companyId, companyId),
					eq(invoices.currency, "PEN"),
					lte(invoices.issueDate, asOfDate),
					sql`(${invoices.status} = 'SENT' OR ${invoices.status} = 'OVERDUE')`,
				),
			);

		const payablesResult = await this.db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${bills.totalAmount} AS DECIMAL)), 0)`,
			})
			.from(bills)
			.where(
				and(
					eq(bills.companyId, companyId),
					eq(bills.currency, "PEN"),
					lte(bills.issueDate, asOfDate),
					sql`(${bills.status} = 'SENT' OR ${bills.status} = 'OVERDUE')`,
				),
			);

		const assets = moneyFromDecimalString(
			receivablesResult[0]?.total || "0",
			"PEN",
		);
		const liabilities = moneyFromDecimalString(
			payablesResult[0]?.total || "0",
			"PEN",
		);
		const equity = Money.fromCents(
			assets.getCents() - liabilities.getCents(),
			"PEN",
		);

		return {
			asOfDate,
			assets: { total: assets.toString() },
			liabilities: { total: liabilities.toString() },
			equity: { total: equity.toString() },
		};
	}
}
