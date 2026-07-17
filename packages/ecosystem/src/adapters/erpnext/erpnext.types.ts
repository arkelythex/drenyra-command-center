/**
 * ERPNext-specific types for the Drenyra ecosystem connector.
 */

export interface ErpnextAuth {
	apiKey: string;
	apiSecret: string;
}

export type ErpnextOperation =
	| { type: "journal_entry.create"; data: JournalEntryInput }
	| { type: "journal_entry.list"; filters?: Record<string, unknown> }
	| { type: "party.create"; data: PartyInput }
	| { type: "party.get"; name: string }
	| { type: "trial_balance.get"; filters?: TrialBalanceFilter }
	| { type: "health" };

export interface JournalEntryInput {
	postingDate: string; // ISO date
	company: string; // ERPNext company name
	accounts: JournalAccount[];
	userRemark?: string;
	billNo?: string; // Invoice reference
	billDate?: string;
}

export interface JournalAccount {
	account: string; // ERPNext account name
	partyType?: string; // "Customer" | "Supplier"
	party?: string; // Party name
	debitInAccountCurrency: number;
	creditInAccountCurrency: number;
}

export interface PartyInput {
	partyType: "Customer" | "Supplier";
	partyName: string;
	taxId: string; // RUC number
	company: string;
	email?: string;
	phone?: string;
	address?: string;
}

export interface TrialBalanceFilter {
	company: string;
	fromDate?: string;
	toDate?: string;
	account?: string;
}

export interface ErpnextResponse<T> {
	data: T;
	message?: string;
}

// GL Account mapping: PCGE (Peru) → ERPNext
export const PCGE_TO_ERPNext_SAMPLE: Record<string, string> = {
	"10": "Cash and Cash Equivalents",
	"11": "Current Financial Investments",
	"12": "Trade Accounts Receivable - Third Parties",
	"14": "Trade Accounts Receivable - Related Parties",
	"16": "Other Accounts Receivable",
	"20": "Inventories",
	"21": "Work in Progress",
	"33": "Property, Plant and Equipment",
	"40": "Trade Accounts Payable - Third Parties",
	"41": "Trade Accounts Payable - Related Parties",
	"42": "Other Accounts Payable",
	"46": "Tax Liabilities",
	"50": "Capital Stock",
	"59": "Retained Earnings",
	"60": "Purchases",
	"61": "Variation of Inventories",
	"62": "Third-Party Services",
	"63": "Taxes",
	"64": "Personnel Expenses",
	"70": "Sales",
	"71": "Other Operating Income",
	"75": "Other Income",
	"76": "Financial Income",
	"77": "Financial Expenses",
	"79": "Extraordinary Items",
};
