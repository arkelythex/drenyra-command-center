import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRepository = {
	findTransactions: vi.fn(),
	findAccountById: vi.fn(),
	createTransaction: vi.fn(),
	updateAccount: vi.fn(),
	reconcileTransaction: vi.fn(),
};

vi.mock("../../infrastructure/banking.repository", () => ({
	bankingRepository: mockRepository,
}));

const { TransactionService } = await import(
	"../../application/services/transaction.service"
);
type CreateTransactionInput = Parameters<
	TransactionService["createTransaction"]
>[1];
type CreateTransactionResult = Awaited<
	ReturnType<TransactionService["createTransaction"]>
>;

describe("TransactionService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("lists transactions with date filters", async () => {
		mockRepository.findTransactions.mockResolvedValue([{ id: "tx-1" }]);

		const service = new TransactionService();
		const start = new Date(2025, 0, 1);
		const end = new Date(2025, 0, 31);
		const result = await service.listTransactions("acc-1", start, end);

		expect(result).toEqual([{ id: "tx-1" }]);
		expect(mockRepository.findTransactions).toHaveBeenCalledWith("acc-1", {
			startDate: start,
			endDate: end,
		});
	});

	it("throws when account is missing", async () => {
		mockRepository.findAccountById.mockResolvedValue(null);

		const service = new TransactionService();
		await expect(
			service.createTransaction("comp-1", {
				accountId: "acc-1",
				transactionDate: new Date(2025, 0, 5),
				description: "Test",
				type: "CREDIT",
				amount: 25,
			} as CreateTransactionInput),
		).rejects.toThrow("Account not found");
	});

	it("creates a transaction and updates account balance", async () => {
		mockRepository.findAccountById.mockResolvedValue({
			id: "acc-1",
			currentBalance: "100.00",
			currency: "PEN",
		});
		mockRepository.createTransaction.mockResolvedValue({ id: "tx-1" });

		const service = new TransactionService();
		const date = new Date(2025, 0, 5);
		await service.createTransaction("comp-1", {
			accountId: "acc-1",
			transactionDate: date,
			description: "Payment",
			type: "CREDIT",
			amount: 25,
			tags: ["income"],
		} as CreateTransactionInput);

		expect(mockRepository.createTransaction).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "comp-1",
				accountId: "acc-1",
				transactionDate: "2025-01-05",
				description: "Payment",
				type: "CREDIT",
				amount: "25",
				balance: "125.00",
				tags: '["income"]',
				isReconciled: false,
				importedFrom: "MANUAL",
			}),
		);
		expect(mockRepository.updateAccount).toHaveBeenCalledWith("acc-1", {
			currentBalance: "125.00",
		});
	});

	it("reconciles a transaction", async () => {
		const service = new TransactionService();
		await service.reconcileTransaction("tx-1", "user-1");

		expect(mockRepository.reconcileTransaction).toHaveBeenCalledWith(
			"tx-1",
			"user-1",
			undefined,
			undefined,
		);
	});

	it("imports transactions and continues on error", async () => {
		const service = new TransactionService();
		const createSpy = vi.spyOn(service, "createTransaction");

		createSpy
			.mockResolvedValueOnce({ id: "tx-1" } as CreateTransactionResult)
			.mockRejectedValueOnce(new Error("boom"));

		const imported = await service.importTransactions("comp-1", "acc-1", [
			{
				date: new Date(2025, 0, 1),
				description: "A",
				amount: 10,
				type: "CREDIT",
			},
			{
				date: new Date(2025, 0, 2),
				description: "B",
				amount: 20,
				type: "DEBIT",
			},
		]);

		expect(imported).toBe(1);
		expect(createSpy).toHaveBeenCalledTimes(2);
	});
});
