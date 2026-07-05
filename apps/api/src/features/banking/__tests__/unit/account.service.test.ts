import { beforeEach, describe, expect, it, vi } from "vitest";

// Create mock repository
const mockRepository = {
	findAllAccounts: vi.fn(),
	findAccountById: vi.fn(),
	createAccount: vi.fn(),
	updateAccount: vi.fn(),
	softDeleteAccount: vi.fn(),
};

// Mock the repository module
vi.mock("../../infrastructure/banking.repository", () => ({
	bankingRepository: mockRepository,
}));

// Import AFTER mock
const { AccountService } = await import(
	"../../application/services/account.service"
);
type CreateAccountInput = Parameters<AccountService["createAccount"]>[1];
type UpdateAccountInput = Parameters<AccountService["updateAccount"]>[1];

describe("AccountService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("lists accounts for a company", async () => {
		mockRepository.findAllAccounts.mockResolvedValue([{ id: "acc-1" }]);

		const service = new AccountService();
		const result = await service.listAccounts("comp-1");

		expect(result).toEqual([{ id: "acc-1" }]);
		expect(mockRepository.findAllAccounts).toHaveBeenCalledWith("comp-1");
	});

	it("creates accounts with defaults", async () => {
		mockRepository.createAccount.mockResolvedValue({ id: "acc-1" });

		const service = new AccountService();
		await service.createAccount("comp-1", {
			accountName: "Main",
			accountNumber: "001",
			accountType: "CHECKING",
			bankName: "Bank",
		} as CreateAccountInput);

		expect(mockRepository.createAccount).toHaveBeenCalledWith({
			companyId: "comp-1",
			accountName: "Main",
			accountNumber: "001",
			accountType: "CHECKING",
			bankName: "Bank",
			bankCode: null,
			branch: null,
			currency: "PEN",
			currentBalance: "0",
			availableBalance: "0",
			isActive: true,
			isDefault: false,
		});
	});

	it("updates account with normalized optional fields", async () => {
		const service = new AccountService();
		await service.updateAccount("acc-1", {
			currentBalance: 150.5,
			bankCode: undefined,
			branch: undefined,
			currency: undefined,
		} as UpdateAccountInput);

		expect(mockRepository.updateAccount).toHaveBeenCalledWith("acc-1", {
			currentBalance: "150.5",
			bankCode: undefined,
			branch: undefined,
			currency: undefined,
		});
	});

	it("deletes accounts via soft delete", async () => {
		const service = new AccountService();
		await service.deleteAccount("acc-9");

		expect(mockRepository.softDeleteAccount).toHaveBeenCalledWith("acc-9");
	});

	it("returns balances or throws when missing", async () => {
		mockRepository.findAccountById.mockResolvedValueOnce(null);

		const service = new AccountService();
		await expect(service.getBalance("missing")).rejects.toThrow(
			"Account not found",
		);

		mockRepository.findAccountById.mockResolvedValueOnce({
			currentBalance: "100.00",
			availableBalance: null,
		});

		const result = await service.getBalance("acc-1");
		expect(result).toEqual({ current: "100.00", available: "100.00" });
	});
});
