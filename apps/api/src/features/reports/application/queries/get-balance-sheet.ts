/**
 * GetBalanceSheet — Returns the balance sheet report as of a given date.
 *
 * @module reports/application/queries
 */

import { Money } from "@drenyra/domain";
import { db as globalDb } from "@drenyra/persistence/client";
import { and, eq, lte, sql } from "@drenyra/persistence/query";
import { bills, invoices } from "@drenyra/persistence/schema";
import { moneyFromDecimalString } from "../../_internal/money-utils";
import type { BalanceSheetReport } from "../../reports.schemas";

/**
 * Executes a balance sheet report for the given company as of a specific date.
 *
 * @param companyId - The company UUID
 * @param asOfDate - The date as of which to report
 * @param db - Database instance (defaults to global)
 * @returns The balance sheet report
 */
export async function getBalanceSheet(
	companyId: string,
	asOfDate: Date,
	db = globalDb,
): Promise<BalanceSheetReport> {
	const receivablesResult = await db
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

	const payablesResult = await db
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
