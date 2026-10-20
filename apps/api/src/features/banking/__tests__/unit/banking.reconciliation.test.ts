import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBankingServiceWithMocks } from "./banking-mock-setup";

const { BankingApplicationService } = await import(
	"../../application/services/banking.application-service"
);

describe("BankingApplicationService / Summary", () => {
	const { mocks, constructorArgs } = createBankingServiceWithMocks();
	const service = new BankingApplicationService(...constructorArgs);

	beforeEach(() => {
		vi.clearAllMocks();
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
