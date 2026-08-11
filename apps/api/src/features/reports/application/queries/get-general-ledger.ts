/**
 * GetGeneralLedger — Returns general ledger detail for an account within a period.
 *
 * Shows individual entries with running balance.
 */

import { db as globalDb } from "@drenyra/persistence/client";
import { and, desc, eq, gte, lte } from "@drenyra/persistence/query";
import { invoices, bills } from "@drenyra/persistence/schema";
import type { GeneralLedgerReportSchema } from "../../v1/schemas/reports.schemas";

type GeneralLedgerReport = (typeof GeneralLedgerReportSchema)["_output"];

interface LedgerEntry {
	date: string;
	voucherNo: string;
	accountCode: string;
	description: string;
	debit: string;
	credit: string;
	balance: string;
}

/**
 * Get general ledger detail.
 *
 * @param companyId - Company UUID
 * @param startDate - Period start
 * @param endDate - Period end
 * @param accountCode - Optional PCGE account code filter
 * @param db - Database instance
 */
export async function getGeneralLedger(
	companyId: string,
	startDate: Date,
	endDate: Date,
	accountCode?: string,
	db = globalDb,
): Promise<GeneralLedgerReport> {
	const entries: LedgerEntry[] = [];
	let runningBalance = 0;
	let seq = 0;

	// Invoice entries (revenue / AR)
	const invoiceEntries = await db.query.invoices.findMany({
		columns: {
			id: true,
			issueDate: true,
			invoiceNumber: true,
			totalAmount: true,
			status: true,
		},
		with: {
			customer: { columns: { legalName: true } },
		},
		where: and(
			eq(invoices.companyId, companyId),
			eq(invoices.currency, "PEN"),
			gte(invoices.issueDate, startDate),
			lte(invoices.issueDate, endDate),
		),
		orderBy: desc(invoices.issueDate),
	});

	for (const inv of invoiceEntries) {
		seq++;
		const amount = parseFloat(inv.amount ?? "0");
		runningBalance += amount;

		// Sales entry (credit)
		entries.push({
			date: inv.date.toISOString().slice(0, 10),
			voucherNo: `INV-${inv.number}`,
			accountCode: accountCode ?? "701",
			description: `FACTURA ${inv.number} - ${inv.customer?.legalName ?? ""}`,
			debit: "0.00",
			credit: amount.toFixed(2),
			balance: runningBalance.toFixed(2),
		});
	}

	// Bill entries (expenses / AP)
	if (!accountCode || accountCode.startsWith("6")) {
		const billEntries = await db.query.bills.findMany({
			columns: {
				id: true,
				issueDate: true,
				billNumber: true,
				totalAmount: true,
				status: true,
			},
			with: {
				vendor: { columns: { legalName: true } },
			},
			where: and(
				eq(bills.companyId, companyId),
				eq(bills.currency, "PEN"),
				gte(bills.issueDate, startDate),
				lte(bills.issueDate, endDate),
			),
			orderBy: desc(bills.issueDate),
		});

		for (const bill of billEntries) {
			seq++;
			const amount = parseFloat(bill.amount ?? "0");
			runningBalance -= amount;

			entries.push({
				date: bill.date.toISOString().slice(0, 10),
				voucherNo: `BILL-${bill.number}`,
				accountCode: accountCode ?? "601",
				description: `COMPRA ${bill.number} - ${bill.vendor?.legalName ?? ""}`,
				debit: amount.toFixed(2),
				credit: "0.00",
				balance: runningBalance.toFixed(2),
			});
		}
	}

	return {
		period: {
			startDate: startDate.toISOString().slice(0, 10),
			endDate: endDate.toISOString().slice(0, 10),
		},
		entries,
		generatedAt: new Date().toISOString(),
	};
}
