import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBankingServiceWithMocks } from "./banking-mock-setup";

const { BankingApplicationService } = await import(
	"../../application/services/banking.application-service"
);

describe("BankingApplicationService / Reconciliation & Summary", () => {
	const { mocks, constructorArgs } = createBankingServiceWithMocks();
	const service = new BankingApplicationService(...constructorArgs);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("autoReconcile delegates to ReconciliationService", async () => {
		mocks.reconciliationService.autoReconcile.mockResolvedValue({
			reconciledCount: 1,
			attemptedCount: 2,
			matches: [],
		});

		const result = await service.autoReconcile("comp-1", "acc-1");

		expect(result).toEqual({
			reconciledCount: 1,
			attemptedCount: 2,
			matches: [],
		});
		expect(mocks.reconciliationService.autoReconcile).toHaveBeenCalledWith(
			"comp-1",
			"acc-1",
		);
	});

	it("getSummary delegates to getBankingSummary", async () => {
		mocks.getBankingSummary.mockResolvedValue({
			totalAccounts: 2,
			totalBalance: "100.00",
			totalBalancePEN: "100.00",
			totalBalanceUSD: "0.00",
			unreconciledTransactions: 0,
		});

		const result = await service.getSummary("comp-1");

		expect(result.totalAccounts).toBe(2);
		expect(mocks.getBankingSummary).toHaveBeenCalledWith({
			companyId: "comp-1",
		});
	});
});
