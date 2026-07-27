/**
 * GetTrialBalance — Returns trial balance as of a given date.
 *
 * Aggregates invoice and bill data by account to produce trial balance entries.
 */

import { db as globalDb } from "@drenyra/persistence/client";
import { and, eq, lte, sql } from "@drenyra/persistence/query";
import { invoices, bills } from "@drenyra/persistence/schema";
import type { TrialBalanceReport } from "../../reports.schemas";

interface AccountEntry {
	accountCode: string;
	accountName: string;
	debitBalance: string;
	creditBalance: string;
}

/**
 * Get trial balance as of a specific date.
 */
export async function getTrialBalance(
	companyId: string,
	asOfDate: Date,
	db = globalDb,
): Promise<TrialBalanceReport> {
	const accounts: AccountEntry[] = [];

	// Revenue accounts (Class 7 — credit normal)
	const revenueResult = await db
		.select({
			accountCode: sql<string>`'701'`,
			accountName: sql<string>`'VENTAS'`,
			total: sql<string>`COALESCE(SUM(CAST(${invoices.totalAmount} AS DECIMAL)), 0)`,
		})
		.from(invoices)
		.where(
			and(
				eq(invoices.companyId, companyId),
				eq(invoices.currency, "PEN"),
				lte(invoices.issueDate, asOfDate),
			),
		);

	if (revenueResult[0]?.total && parseFloat(revenueResult[0].total) > 0) {
		accounts.push({
			accountCode: "701",
			accountName: "VENTAS",
			debitBalance: "0.00",
			creditBalance: revenueResult[0].total,
		});
	}

	// Expense accounts (Class 6 — debit normal)
	const expenseResult = await db
		.select({
			accountCode: sql<string>`'601'`,
			accountName: sql<string>`'COMPRAS'`,
			total: sql<string>`COALESCE(SUM(CAST(${bills.totalAmount} AS DECIMAL)), 0)`,
		})
		.from(bills)
		.where(
			and(
				eq(bills.companyId, companyId),
				eq(bills.currency, "PEN"),
				lte(bills.issueDate, asOfDate),
			),
		);

	if (expenseResult[0]?.total && parseFloat(expenseResult[0].total) > 0) {
		accounts.push({
			accountCode: "601",
			accountName: "COMPRAS",
			debitBalance: expenseResult[0].total,
			creditBalance: "0.00",
		});
	}

	// Asset accounts — Cuentas por cobrar (Class 1)
	const arResult = await db
		.select({
			accountCode: sql<string>`'121'`,
			accountName: sql<string>`'CUENTAS POR COBRAR'`,
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

	if (arResult[0]?.total && parseFloat(arResult[0].total) > 0) {
		accounts.push({
			accountCode: "121",
			accountName: "CUENTAS POR COBRAR",
			debitBalance: arResult[0].total,
			creditBalance: "0.00",
		});
	}

	// Liability accounts — Cuentas por pagar (Class 4)
	const apResult = await db
		.select({
			accountCode: sql<string>`'421'`,
			accountName: sql<string>`'CUENTAS POR PAGAR'`,
			total: sql<string>`COALESCE(SUM(CAST(${bills.totalAmount} AS DECIMAL)), 0)`,
		})
		.from(bills)
		.where(
			and(
				eq(bills.companyId, companyId),
				eq(bills.currency, "PEN"),
				lte(bills.issueDate, asOfDate),
			),
		);

	if (apResult[0]?.total && parseFloat(apResult[0].total) > 0) {
		accounts.push({
			accountCode: "421",
			accountName: "CUENTAS POR PAGAR",
			debitBalance: "0.00",
			creditBalance: apResult[0].total,
		});
	}

	return {
		asOfDate,
		accounts,
		generatedAt: new Date().toISOString(),
		totalDebits: accounts
			.reduce((sum, a) => sum + parseFloat(a.debitBalance), 0)
			.toFixed(2),
		totalCredits: accounts
			.reduce((sum, a) => sum + parseFloat(a.creditBalance), 0)
			.toFixed(2),
	};
}
