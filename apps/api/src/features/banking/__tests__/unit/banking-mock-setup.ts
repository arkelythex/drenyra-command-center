import { vi } from "vitest";

export const mockDb = {
	query: {
		bankTransactions: { findMany: vi.fn() },
		invoices: { findFirst: vi.fn(), findMany: vi.fn() },
		bills: { findFirst: vi.fn(), findMany: vi.fn() },
		businessPartners: { findMany: vi.fn() },
	},
	update: vi.fn().mockReturnValue({
		set: vi
			.fn()
			.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
	}),
};

vi.mock("@drenyra/infrastructure", () => ({
	db: mockDb,
	eq: (a: unknown, b: unknown) => ({ column: a, value: b }),
	and: (...conditions: unknown[]) => conditions,
	like: (a: unknown, b: unknown) => ({ column: a, pattern: b }),
	gte: (a: unknown, b: unknown) => ({ column: a, value: b, op: ">=" }),
	lte: (a: unknown, b: unknown) => ({ column: a, value: b, op: "<=" }),
	desc: (a: unknown) => ({ column: a, order: "desc" }),
	bankTransactions: {
		id: "id",
		companyId: "company_id",
		accountId: "account_id",
		isReconciled: "is_reconciled",
		transactionDate: "transaction_date",
	},
	invoices: {
		companyId: "company_id",
		invoiceNumber: "invoice_number",
		balanceDue: "balance_due",
		dueDate: "due_date",
		customerId: "customer_id",
	},
	bills: {
		companyId: "company_id",
		billNumber: "bill_number",
		totalAmount: "total_amount",
		dueDate: "due_date",
		vendorId: "vendor_id",
	},
	businessPartners: { companyId: "company_id" },
	bankAccounts: {
		id: "id",
		companyId: "company_id",
		accountName: "account_name",
		isDefault: "is_default",
	},
}));

export const mockRecordTransaction = vi
	.fn()
	.mockResolvedValue({ transactionId: "tx-1", newBalance: "100.00" });
export const mockReconcileTransaction = vi.fn().mockResolvedValue(undefined);
export const mockImportTransactions = vi
	.fn()
	.mockResolvedValue({ imported: 2, skipped: 0, errors: [] });
export const mockGetTransactions = vi.fn().mockResolvedValue([]);
export const mockGetBankingSummary = vi.fn().mockResolvedValue({
	totalAccounts: 2,
	totalBalance: "100.00",
	totalBalancePEN: "100.00",
	totalBalanceUSD: "0.00",
	unreconciledTransactions: 0,
});

vi.mock("../../application/commands/record-transaction.command", () => ({
	recordTransaction: mockRecordTransaction,
}));

vi.mock("../../application/commands/reconcile-transaction.command", () => ({
	reconcileTransaction: mockReconcileTransaction,
}));

vi.mock("../../application/commands/import-transactions.command", () => ({
	importTransactions: mockImportTransactions,
}));

vi.mock("../../application/queries/get-transactions.query", () => ({
	getTransactions: mockGetTransactions,
}));

vi.mock("../../application/queries/get-banking-summary.query", () => ({
	getBankingSummary: mockGetBankingSummary,
}));

export const createAccountService = () => ({
	listAccounts: vi.fn(),
	getAccount: vi.fn(),
	createAccount: vi.fn(),
	updateAccount: vi.fn(),
	deleteAccount: vi.fn(),
	getBalance: vi.fn(),
});

export const createReconciliationService = () => ({
	autoReconcile: vi.fn(),
});

export function createBankingServiceWithMocks() {
	const accountService = createAccountService();
	const reconciliationService = createReconciliationService();

	return {
		mocks: {
			accountService,
			reconciliationService,
			recordTransaction: mockRecordTransaction,
			reconcileTransaction: mockReconcileTransaction,
			importTransactions: mockImportTransactions,
			getTransactions: mockGetTransactions,
			getBankingSummary: mockGetBankingSummary,
		},
		constructorArgs: [accountService, reconciliationService] as const,
	};
}
