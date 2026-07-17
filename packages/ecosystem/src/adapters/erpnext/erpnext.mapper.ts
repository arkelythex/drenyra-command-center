import type { JournalAccount, JournalEntryInput } from "./erpnext.types";
import { PCGE_TO_ERPNext_SAMPLE } from "./erpnext.types";

/**
 * Maps Drenyra fiscal events to ERPNext journal entries.
 * Uses PCGE (Peruvian Chart of Accounts) code mapping.
 */

export interface FiscalJournalEvent {
	companyRuc: string;
	companyName: string;
	invoiceId: string;
	invoiceSeries: string;
	invoiceNumber: string;
	issueDate: string;
	currency: string;
	totalCents: number;
	igvCents: number;
	subtotalCents: number;
	customerRuc?: string;
	customerName?: string;
	supplierRuc?: string;
	supplierName?: string;
}

/**
 * Convert a sales invoice fiscal event to an ERPNext journal entry.
 */
export function mapSalesInvoiceToJournalEntry(
	event: FiscalJournalEvent,
	pcgeMapping: Record<string, string> = PCGE_TO_ERPNext_SAMPLE,
): JournalEntryInput {
	const total = event.totalCents / 100;
	const igv = event.igvCents / 100;
	const base = event.subtotalCents / 100;

	const company = event.companyName;

	const accounts: JournalAccount[] = [];

	// Debit: Customer receivable (PCGE 12)
	accounts.push({
		account: pcgeMapping["12"] ?? "Trade Accounts Receivable - Third Parties",
		partyType: "Customer",
		party: event.customerName,
		debitInAccountCurrency: total,
		creditInAccountCurrency: 0,
	});

	// Credit: Sales revenue (PCGE 70)
	accounts.push({
		account: pcgeMapping["70"] ?? "Sales",
		debitInAccountCurrency: 0,
		creditInAccountCurrency: base,
	});

	// Credit: IGV payable (PCGE 46 — Tax Liabilities)
	accounts.push({
		account: pcgeMapping["46"] ?? "Tax Liabilities",
		debitInAccountCurrency: 0,
		creditInAccountCurrency: igv,
	});

	return {
		postingDate: event.issueDate,
		company,
		accounts,
		userRemark: `Invoice ${event.invoiceSeries}-${event.invoiceNumber} posted via Drenyra`,
		billNo: `${event.invoiceSeries}-${event.invoiceNumber}`,
		billDate: event.issueDate,
	};
}

/**
 * Convert a purchase invoice fiscal event to an ERPNext journal entry.
 */
export function mapPurchaseInvoiceToJournalEntry(
	event: FiscalJournalEvent,
	pcgeMapping: Record<string, string> = PCGE_TO_ERPNext_SAMPLE,
): JournalEntryInput {
	const total = event.totalCents / 100;
	const igv = event.igvCents / 100;
	const base = event.subtotalCents / 100;
	const company = event.companyName;

	const accounts: JournalAccount[] = [];

	// Debit: Purchases (PCGE 60)
	accounts.push({
		account: pcgeMapping["60"] ?? "Purchases",
		debitInAccountCurrency: base,
		creditInAccountCurrency: 0,
	});

	// Debit: IGV credit (PCGE 46 sub-account)
	accounts.push({
		account: `${pcgeMapping["46"] ?? "Tax Liabilities"} - IGV Credit`,
		debitInAccountCurrency: igv,
		creditInAccountCurrency: 0,
	});

	// Credit: Supplier payable (PCGE 42)
	accounts.push({
		account: pcgeMapping["42"] ?? "Other Accounts Payable",
		partyType: "Supplier",
		party: event.supplierName,
		debitInAccountCurrency: 0,
		creditInAccountCurrency: total,
	});

	return {
		postingDate: event.issueDate,
		company,
		accounts,
		userRemark: `Purchase ${event.invoiceSeries}-${event.invoiceNumber} posted via Drenyra`,
		billNo: `${event.invoiceSeries}-${event.invoiceNumber}`,
		billDate: event.issueDate,
	};
}
