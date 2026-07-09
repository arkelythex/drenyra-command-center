export interface BankAccount {
	id: string;
	companyId: string;
	accountName: string;
	accountNumber: string;
	accountType: "CHECKING" | "SAVINGS" | "CREDIT";
	bankName: string;
	currency: "PEN" | "USD";
	currentBalance: string;
	availableBalance?: string;
	isActive: boolean;
	isDefault: boolean;
}

export interface BankTransaction {
	id: string;
	accountId: string;
	transactionDate: string;
	description: string;
	reference?: string;
	type: "CREDIT" | "DEBIT";
	amount: string;
	balance?: string;
	category?: string;
	isReconciled: boolean;
	invoiceId?: string;
	billId?: string;
	matchScore?: number;
	matchCriteria?: "REFERENCE" | "AMOUNT_DATE" | "AMOUNT_ENTITY" | "PARTIAL";
}

export interface ReconciliationMatch {
	transactionId: string;
	documentId: string;
	documentType: "INVOICE" | "BILL";
	matchScore: number;
	matchCriteria: string;
}

export interface ReconciliationResult {
	companyId: string;
	accountId: string;
	reconciledCount: number;
	matches: ReconciliationMatch[];
}

export interface BankingState {
	selectedAccountId: string | null;
	lastReconciliationResult: ReconciliationResult | null;
}

export interface BankingActions {
	selectAccount: (id: string) => void;
	clearSelectedAccount: () => void;
	setLastReconciliationResult: (
		result: BankingState["lastReconciliationResult"],
	) => void;
	clearLastReconciliationResult: () => void;
	reset: () => void;
}

export const initialState: BankingState = {
	selectedAccountId: null,
	lastReconciliationResult: null,
};
