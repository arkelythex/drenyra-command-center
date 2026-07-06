/**
 * Banking — DTO types for frontend consumption.
 *
 * @module @drenyra/application/banking
 */

// ─── Core types ──────────────────────────────────────────────────

export type BankAccountType = "CHECKING" | "SAVINGS" | "CREDIT";
export type TransactionType = "CREDIT" | "DEBIT";
export type DocumentType = "INVOICE" | "BILL";
export type CurrencyCode = "PEN" | "USD";
export type BankCsvFormat =
	| "BCP"
	| "BBVA"
	| "INTERBANK"
	| "SCOTIABANK"
	| "GENERIC";

// ─── Account DTOs ────────────────────────────────────────────────

export interface BankAccountDTO {
	id: string;
	companyId: string;
	name: string;
	type: BankAccountType;
	currency: CurrencyCode;
	bankName: string;
	accountNumber: string;
	currentBalance: string;
	isDefault?: boolean;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateBankAccountRequest {
	accountName: string;
	accountNumber: string;
	accountType: BankAccountType;
	bankName: string;
	bankCode?: string;
	branch?: string;
	currency?: CurrencyCode;
	currentBalance?: number;
}

// ─── Transaction DTOs ────────────────────────────────────────────

export interface BankTransactionDTO {
	id: string;
	accountId: string;
	companyId: string;
	transactionDate: string;
	description: string;
	type: TransactionType;
	amount: string;
	currency: CurrencyCode;
	reference?: string;
	category?: string;
	tags?: string[];
	isReconciled: boolean;
	reconciledDocumentId?: string;
	reconciledDocumentType?: DocumentType;
	createdAt: string;
}

export interface CreateTransactionRequest {
	accountId: string;
	transactionDate: string;
	description: string;
	type: TransactionType;
	amount: number;
	reference?: string;
	category?: string;
	tags?: string[];
}

export interface TransactionFilters {
	startDate?: string;
	endDate?: string;
	type?: TransactionType;
	category?: string;
	isReconciled?: boolean;
}

// ─── Reconciliation DTOs ─────────────────────────────────────────

export interface ReconciliationResultDTO {
	matched: number;
	unmatched: number;
	matchedAmount: string;
	unmatchedAmount: string;
	currency: CurrencyCode;
	accountId: string;
	period: string;
}

export interface AutoReconcileResult {
	matched: number;
	unmatched: number;
}

// ─── Summary DTOs ────────────────────────────────────────────────

export interface BankSummaryDTO {
	totalAccounts: number;
	totalBalancePEN: string;
	totalBalanceUSD: string;
	totalBalance: string;
	unreconciledTransactions: number;
}
