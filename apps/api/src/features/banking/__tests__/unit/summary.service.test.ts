import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRepository = {
	findAllAccounts: vi.fn(),
	countUnreconciled: vi.fn(),
};

vi.mock("../../infrastructure/banking.repository", () => ({
	bankingRepository: mockRepository,
}));

const { SummaryService } = await import(
	"../../application/services/summary.service"
);

describe("SummaryService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("aggregates balances by currency and counts unreconciled", async () => {
		mockRepository.findAllAccounts.mockResolvedValue([
			{ currentBalance: "100.00", currency: "PEN", isActive: true },
			{ currentBalance: "50.00", currency: "USD", isActive: true },
			{ currentBalance: "25.00", currency: "PEN", isActive: false },
		]);
		mockRepository.countUnreconciled.mockResolvedValue(3);

		const service = new SummaryService();
		const result = await service.getSummary("comp-1");

		expect(result.totalAccounts).toBe(2);
		expect(result.totalBalancePEN).toBe("100.00");
		expect(result.totalBalanceUSD).toBe("50.00");
		expect(result.unreconciledTransactions).toBe(3);
	});
});
