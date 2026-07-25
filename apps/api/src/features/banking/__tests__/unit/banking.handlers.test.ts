import { beforeEach, describe, expect, it, vi } from "vitest";

const { reconcileTransactionMock } = vi.hoisted(() => ({
	reconcileTransactionMock: vi.fn(),
}));

vi.mock("../../application/services/banking.application-service", () => ({
	BankingApplicationService: class BankingApplicationService {
		reconcileTransaction = reconcileTransactionMock;
		listAccounts = vi.fn();
		getAccount = vi.fn();
		getBalance = vi.fn();
		createAccount = vi.fn();
		deleteAccount = vi.fn();
		listTransactions = vi.fn();
		createTransaction = vi.fn();
		getSummary = vi.fn();
		importTransactions = vi.fn();
		autoReconcile = vi.fn();
	},
}));

vi.mock("../../application/services/airline-ticket-report.service", () => ({
	AirlineTicketReportService: class AirlineTicketReportService {
		generate = vi.fn();
	},
}));

vi.mock("../../application/services/reconciliation.service", () => ({
	ReconciliationService: {
		getShadowMetrics: vi.fn(),
		evaluateShadowCutover: vi.fn(),
	},
}));

vi.mock("../../../security/session-context", () => ({
	resolveSessionContext: vi.fn(),
}));

import { bankingHandlers } from "../../api/banking.handlers";
import {
	BankingRepository,
	type BankTransactionRecord,
} from "../../infrastructure/banking.repository";

const transactionRecord: BankTransactionRecord = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	companyId: "cmp-1",
	accountId: "550e8400-e29b-41d4-a716-446655440099",
	transactionDate: "2026-01-15",
	description: "Pago proveedor",
	reference: null,
	type: "DEBIT",
	amount: "100.0000",
	balance: "900.0000",
	category: null,
	tags: null,
	isReconciled: false,
	reconciledAt: null,
	reconciledBy: null,
	invoiceId: null,
	billId: null,
	createdAt: new Date("2026-01-15T00:00:00.000Z"),
	importedFrom: "MANUAL",
};

describe("bankingHandlers.reconcileTransaction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(
			BankingRepository.prototype,
			"findTransactionById",
		).mockResolvedValue(transactionRecord);
	});

	it("returns auth error when company context is missing", async () => {
		const response = await bankingHandlers.reconcileTransaction({
			params: { id: "550e8400-e29b-41d4-a716-446655440000" },
			body: {
				userId: "11111111-1111-1111-1111-111111111111",
			},
			headers: { "x-company-id": "cmp-1" },
			set: {},
		});

		expect(reconcileTransactionMock).not.toHaveBeenCalled();
		expect(response).toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});

	it("returns auth error when no legacy user can be resolved", async () => {
		const set: { status?: number | string } = {};
		const response = await bankingHandlers.reconcileTransaction({
			params: { id: "550e8400-e29b-41d4-a716-446655440000" },
			body: {},
			headers: { "x-company-id": "cmp-1" },
			set,
		});

		expect(set.status).toBe(401);
		expect(reconcileTransactionMock).not.toHaveBeenCalled();
		expect(response).toMatchObject({
			success: false,
			code: "COMPANY_CONTEXT_REQUIRED",
		});
	});
});
