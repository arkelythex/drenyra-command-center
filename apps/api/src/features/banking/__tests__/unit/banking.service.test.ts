import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBankingServiceWithMocks } from "./banking-mock-setup";

const { BankingApplicationService } = await import(
	"../../application/services/banking.application-service"
);

describe("BankingApplicationService", () => {
	const { mocks, constructorArgs } = createBankingServiceWithMocks();
	const service = new BankingApplicationService(...constructorArgs);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delegates account operations to AccountService", async () => {
		mocks.accountService.listAccounts.mockResolvedValue([]);
		mocks.accountService.getAccount.mockResolvedValue({ id: "acc-1" });
		mocks.accountService.createAccount.mockResolvedValue({ id: "acc-2" });

		await service.listAccounts("comp-1");
		await service.getAccount("acc-1");
		await service.createAccount("comp-1", { accountName: "Main" } as Parameters<
			typeof service.createAccount
		>[1]);
		await service.updateAccount("acc-1", {
			accountName: "Updated",
		} as Parameters<typeof service.updateAccount>[1]);
		await service.deleteAccount("acc-1");

		expect(mocks.accountService.listAccounts).toHaveBeenCalledWith("comp-1");
		expect(mocks.accountService.getAccount).toHaveBeenCalledWith("acc-1");
		expect(mocks.accountService.createAccount).toHaveBeenCalled();
		expect(mocks.accountService.updateAccount).toHaveBeenCalled();
		expect(mocks.accountService.deleteAccount).toHaveBeenCalled();
	});

	it("delegates transaction write ops to function commands/queries", async () => {
		mocks.getTransactions.mockResolvedValue([]);
		mocks.recordTransaction.mockResolvedValue({
			transactionId: "tx-1",
			newBalance: "100.00",
		});

		await service.listTransactions("acc-1");
		await service.createTransaction("comp-1", {
			accountId: "acc-1",
			transactionDate: new Date(2026, 0, 1),
			description: "Test",
			type: "CREDIT",
			amount: 50,
		} as Parameters<typeof service.createTransaction>[1]);
		await service.reconcileTransaction("tx-1", "user-1");
		await service.importTransactions("comp-1", "acc-1", []);

		expect(mocks.getTransactions).toHaveBeenCalledWith({
			accountId: "acc-1",
			startDate: undefined,
			endDate: undefined,
		});
		expect(mocks.recordTransaction).toHaveBeenCalled();
		expect(mocks.reconcileTransaction).toHaveBeenCalledWith({
			transactionId: "tx-1",
			userId: "user-1",
			documentId: undefined,
			documentType: undefined,
		});
		expect(mocks.importTransactions).toHaveBeenCalled();
	});

	it("delegates reconciliation to ReconciliationService and summary to getBankingSummary", async () => {
		mocks.getBankingSummary.mockResolvedValue({
			totalAccounts: 0,
			totalBalance: "0.00",
			totalBalancePEN: "0.00",
			totalBalanceUSD: "0.00",
			unreconciledTransactions: 0,
		});
		mocks.reconciliationService.autoReconcile.mockResolvedValue({
			reconciledCount: 0,
			attemptedCount: 0,
			matches: [],
		});

		const summary = await service.getSummary("comp-1");
		const result = await service.autoReconcile("comp-1", "acc-1");

		expect(summary.totalAccounts).toBe(0);
		expect(result.reconciledCount).toBe(0);
		expect(mocks.getBankingSummary).toHaveBeenCalledWith({
			companyId: "comp-1",
		});
		expect(mocks.reconciliationService.autoReconcile).toHaveBeenCalledWith(
			"comp-1",
			"acc-1",
		);
	});
});
