/**
 * BankingApplicationService - Account Management (delegation)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBankingServiceWithMocks } from "./banking-mock-setup";

const { BankingApplicationService } = await import(
	"../../application/services/banking.application-service"
);

describe("BankingApplicationService / Account Management", () => {
	const { mocks, constructorArgs } = createBankingServiceWithMocks();
	const service = new BankingApplicationService(...constructorArgs);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("listAccounts delegates to AccountService", async () => {
		mocks.accountService.listAccounts.mockResolvedValue([{ id: "acc-1" }]);

		const result = await service.listAccounts("comp-1");

		expect(result).toEqual([{ id: "acc-1" }]);
		expect(mocks.accountService.listAccounts).toHaveBeenCalledWith("comp-1");
	});

	it("getAccount delegates to AccountService", async () => {
		mocks.accountService.getAccount.mockResolvedValue({ id: "acc-1" });

		const result = await service.getAccount("acc-1");

		expect(result).toEqual({ id: "acc-1" });
		expect(mocks.accountService.getAccount).toHaveBeenCalledWith("acc-1");
	});

	it("createAccount delegates to AccountService", async () => {
		mocks.accountService.createAccount.mockResolvedValue({ id: "acc-1" });

		const result = await service.createAccount("comp-1", {
			accountName: "Main",
		} as Parameters<typeof service.createAccount>[1]);

		expect(result).toEqual({ id: "acc-1" });
		expect(mocks.accountService.createAccount).toHaveBeenCalledWith("comp-1", {
			accountName: "Main",
		});
	});

	it("updateAccount delegates to AccountService", async () => {
		await service.updateAccount("acc-1", {
			accountName: "Updated",
		} as Parameters<typeof service.updateAccount>[1]);

		expect(mocks.accountService.updateAccount).toHaveBeenCalledWith("acc-1", {
			accountName: "Updated",
		});
	});

	it("deleteAccount delegates to AccountService", async () => {
		await service.deleteAccount("acc-1");

		expect(mocks.accountService.deleteAccount).toHaveBeenCalledWith("acc-1");
	});

	it("getBalance delegates to AccountService", async () => {
		mocks.accountService.getBalance.mockResolvedValue({
			current: "10.00",
			available: "8.00",
		});

		const result = await service.getBalance("acc-1");

		expect(result).toEqual({ current: "10.00", available: "8.00" });
		expect(mocks.accountService.getBalance).toHaveBeenCalledWith("acc-1");
	});
});
