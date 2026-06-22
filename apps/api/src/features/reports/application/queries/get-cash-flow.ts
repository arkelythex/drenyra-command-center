/**
 * GetCashFlow — Returns the cash flow report for a given period.
 *
 * @module reports/application/queries
 */

import { Money } from "@arkelythex/domain";
import { db as globalDb } from "@arkelythex/persistence/client";
import { and, eq, gte, lte, sql } from "@arkelythex/persistence/query";
import { bills, invoices } from "@arkelythex/persistence/schema";
import { moneyFromDecimalString, zeroMoney } from "../../_internal/money-utils";
import type { CashFlowReport } from "../../reports.schemas";

/**
 * Executes a cash flow report for the given company and date range.
 *
 * @param companyId - The company UUID
 * @param startDate - Start of the report period
 * @param endDate - End of the report period
 * @param db - Database instance (defaults to global)
 * @returns The cash flow report
 */
export async function getCashFlow(
	companyId: string,
	startDate: Date,
	endDate: Date,
	db = globalDb,
): Promise<CashFlowReport> {
	const inflowResult = await db
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

	const outflowResult = await db
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
	const outflow = moneyFromDecimalString(outflowResult[0]?.total || "0", "PEN");
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
