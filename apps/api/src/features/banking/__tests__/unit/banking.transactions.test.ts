import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBankingServiceWithMocks } from "./banking-mock-setup";

const { BankingApplicationService } = await import(
	"../../application/services/banking.application-service"
);

describe("BankingApplicationService / Transaction Management", () => {
	const { mocks, constructorArgs } = createBankingServiceWithMocks();
	const service = new BankingApplicationService(...constructorArgs);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("listTransactions delegates to getTransactions", async () => {
		mocks.getTransactions.mockResolvedValue([{ id: "tx-1" }]);

		const result = await service.listTransactions("acc-1");

		expect(result).toEqual([{ id: "tx-1" }]);
		expect(mocks.getTransactions).toHaveBeenCalledWith({
			accountId: "acc-1",
			startDate: undefined,
			endDate: undefined,
		});
	});

	it("createTransaction delegates to recordTransaction and returns id+balance", async () => {
		mocks.recordTransaction.mockResolvedValue({
			transactionId: "tx-99",
			newBalance: "1180.00",
		});

		const result = await service.createTransaction("comp-1", {
			accountId: "acc-1",
			transactionDate: new Date(2026, 0, 15),
			description: "Cobro factura",
			type: "CREDIT",
			amount: 1180,
		} as Parameters<typeof service.createTransaction>[1]);

		expect(result).toEqual({ id: "tx-99", balance: "1180.00" });
		expect(mocks.recordTransaction).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "comp-1",
				accountId: "acc-1",
				amount: 1180,
				type: "CREDIT",
			}),
		);
	});

	it("reconcileTransaction delegates to reconcileTransaction", async () => {
		await service.reconcileTransaction("tx-1", "user-1", "inv-abc", "INVOICE");

		expect(mocks.reconcileTransaction).toHaveBeenCalledWith({
			transactionId: "tx-1",
			userId: "user-1",
			documentId: "inv-abc",
			documentType: "INVOICE",
		});
	});

	it("getBalance delegates to AccountService", async () => {
		mocks.accountService.getBalance.mockResolvedValue({
			current: "100.00",
			available: "90.00",
		});

		const result = await service.getBalance("acc-1");

		expect(result).toEqual({ current: "100.00", available: "90.00" });
		expect(mocks.accountService.getBalance).toHaveBeenCalledWith("acc-1");
	});

	it("importTransactions delegates to importTransactions and returns ImportResult", async () => {
		const mockResult = { imported: 2, skipped: 0, errors: [] };
		mocks.importTransactions.mockResolvedValue(mockResult);

		const result = await service.importTransactions("comp-1", "acc-1", []);

		expect(result).toEqual(mockResult);
		expect(mocks.importTransactions).toHaveBeenCalledWith({
			companyId: "comp-1",
			accountId: "acc-1",
			source: "CSV",
			transactions: [],
		});
	});
});
