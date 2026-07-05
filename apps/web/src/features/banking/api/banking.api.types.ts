export type BankAccountType = "CHECKING" | "SAVINGS" | "CREDIT";
export type TransactionType = "CREDIT" | "DEBIT";
export type DocumentType = "INVOICE" | "BILL";
export type Currency = "PEN" | "USD";
export type BankCsvFormat =
	| "BCP"
	| "BBVA"
	| "INTERBANK"
	| "SCOTIABANK"
	| "GENERIC";

export type ImportTransactionRow = {
	date: Date;
	description: string;
	amount: number;
	type: "CREDIT" | "DEBIT";
	reference?: string;
};

export interface CreateBankAccountPayload {
	accountName: string;
	accountNumber: string;
	accountType: BankAccountType;
	bankName: string;
	bankCode?: string;
	branch?: string;
	currency?: Currency;
	currentBalance?: number;
}

export interface CreateTransactionPayload {
	accountId: string;
	transactionDate: string | Date;
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
}
