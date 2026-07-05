/**
 * Delete Account Use Case Tests
 *
 * Tests for the DeleteAccountUseCase covering:
 * - Successful deletion
 * - System account protection
 * - Children validation
 * - Transaction validation
 * - Zero balance validation
 */

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { Account } from "@drenyra/domain/entities/Account";
import type { AccountRepository } from "@drenyra/domain/repositories/account.repository";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import { DeleteAccountUseCase } from "../delete-account.use-case";

// Helper to create a mock account
function createMockAccount(
	overrides: Partial<{
		id: string;
		code: string;
		isSystem: boolean;
		balance: number;
	}> = {},
): Account {
	return Account.create({
		id: overrides.id ?? "acc-123",
		organizationId: 1,
		code: overrides.code ?? "10",
		name: "Test Account",
		level: "1",
		type: "Activo",
		isGroup: true,
		isActive: true,
		isSystem: overrides.isSystem ?? false,
		currency: "PEN",
		balance: Money.fromAmount(overrides.balance ?? 0, "PEN"),
		balanceUSD: Money.fromAmount(0, "USD"),
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

describe("DeleteAccountUseCase", () => {
	let useCase: DeleteAccountUseCase;
	let mockAccountRepository: { [K in keyof AccountRepository]: Mock };
	let mockJournalRepository: { [K in keyof JournalEntryRepository]: Mock };

	beforeEach(() => {
		mockAccountRepository = {
			save: vi.fn().mockResolvedValue(undefined),
			findById: vi.fn().mockResolvedValue(null),
			findByCode: vi.fn().mockResolvedValue(null),
			findAll: vi.fn().mockResolvedValue([]),
			findWithFilters: vi.fn().mockResolvedValue([]),
			findChildren: vi.fn().mockResolvedValue([]),
			findMovementAccounts: vi.fn().mockResolvedValue([]),
			getHierarchy: vi.fn().mockResolvedValue([]),
			delete: vi.fn().mockResolvedValue(undefined),
			hasChildren: vi.fn().mockResolvedValue(false),
			codeExists: vi.fn().mockResolvedValue(false),
			count: vi.fn().mockResolvedValue(0),
			getNextChildCode: vi.fn().mockResolvedValue("1011"),
		} as unknown as { [K in keyof AccountRepository]: Mock };

		mockJournalRepository = {
			countByAccountId: vi.fn().mockResolvedValue(0),
		} as unknown as { [K in keyof JournalEntryRepository]: Mock };

		useCase = new DeleteAccountUseCase(
			mockAccountRepository,
			mockJournalRepository,
		);
	});

	describe("Success Cases", () => {
		it("should delete a valid account", async () => {
			const account = createMockAccount({
				id: "acc-123",
				code: "10",
				isSystem: false,
				balance: 0,
			});
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);
			mockJournalRepository.countByAccountId.mockResolvedValue(0);

			const result = await useCase.execute("acc-123");

			expect(result.success).toBe(true);
			expect(result.deletedAccountId).toBe("acc-123");
			expect(result.deletedCode).toBe("10");
			expect(mockAccountRepository.delete).toHaveBeenCalledWith("acc-123");
		});

		it("should work without journal repository", async () => {
			const useCaseWithoutJournal = new DeleteAccountUseCase(
				mockAccountRepository,
				// No journal repository
			);

			const account = createMockAccount({
				isSystem: false,
				balance: 0,
			});
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);

			const result = await useCaseWithoutJournal.execute("acc-123");

			expect(result.success).toBe(true);
			expect(mockJournalRepository.countByAccountId).not.toHaveBeenCalled();
		});
	});

	describe("Error Cases", () => {
		it("should throw error when account not found", async () => {
			mockAccountRepository.findById.mockResolvedValue(null);

			await expect(useCase.execute("non-existent")).rejects.toThrow(
				"Cuenta no encontrada",
			);
		});

		it("should throw error for system account", async () => {
			const systemAccount = createMockAccount({ isSystem: true });
			mockAccountRepository.findById.mockResolvedValue(systemAccount);

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				"No se puede eliminar una cuenta del sistema",
			);
		});

		it("should throw error when account has children", async () => {
			const account = createMockAccount({ isSystem: false });
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(true);

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				"No se puede eliminar una cuenta que tiene subcuentas",
			);
		});

		it("should throw error when account has transactions", async () => {
			const account = createMockAccount({ isSystem: false, balance: 0 });
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);
			mockJournalRepository.countByAccountId.mockResolvedValue(5);

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				/No se puede eliminar la cuenta porque tiene 5 asiento\(s\) contable\(s\)/,
			);
		});

		it("should throw error when account has non-zero balance", async () => {
			const account = createMockAccount({
				isSystem: false,
				balance: 1000, // Non-zero balance
			});
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);
			mockJournalRepository.countByAccountId.mockResolvedValue(0);

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				"No se puede eliminar una cuenta con saldo diferente de cero",
			);
		});
	});

	describe("Validation Order", () => {
		it("should check canBeDeleted before hasChildren", async () => {
			const systemAccount = createMockAccount({ isSystem: true });
			mockAccountRepository.findById.mockResolvedValue(systemAccount);

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				"No se puede eliminar una cuenta del sistema",
			);

			// hasChildren should not be called because we fail early
			expect(mockAccountRepository.hasChildren).not.toHaveBeenCalled();
		});

		it("should check hasChildren before transactions", async () => {
			const account = createMockAccount({ isSystem: false });
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(true);

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				/tiene subcuentas/,
			);

			// countByAccountId should not be called because we fail early
			expect(mockJournalRepository.countByAccountId).not.toHaveBeenCalled();
		});

		it("should check transactions before balance", async () => {
			const account = createMockAccount({
				isSystem: false,
				balance: 1000, // Would fail on balance
			});
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);
			mockJournalRepository.countByAccountId.mockResolvedValue(3); // Fails first

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				/asiento\(s\) contable\(s\)/,
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle account with exactly 0 balance", async () => {
			const account = createMockAccount({
				isSystem: false,
				balance: 0,
			});
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);
			mockJournalRepository.countByAccountId.mockResolvedValue(0);

			const result = await useCase.execute("acc-123");

			expect(result.success).toBe(true);
		});

		it("should handle single transaction count message", async () => {
			const account = createMockAccount({ isSystem: false, balance: 0 });
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);
			mockJournalRepository.countByAccountId.mockResolvedValue(1);

			await expect(useCase.execute("acc-123")).rejects.toThrow(
				/1 asiento\(s\) contable\(s\)/,
			);
		});

		it("should handle empty string account ID", async () => {
			mockAccountRepository.findById.mockResolvedValue(null);

			await expect(useCase.execute("")).rejects.toThrow("Cuenta no encontrada");
		});

		it("should return correct deleted code in result", async () => {
			// Create account with 5-digit code (level 4 requires 5 digits)
			const account = Account.create({
				id: "acc-456",
				organizationId: 1,
				code: "12345",
				name: "Test Account",
				level: "4", // Level 4 requires 5 digits
				type: "Activo",
				isGroup: false,
				isActive: true,
				isSystem: false,
				currency: "PEN",
				balance: Money.fromAmount(0, "PEN"),
				balanceUSD: Money.fromAmount(0, "USD"),
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockAccountRepository.findById.mockResolvedValue(account);
			mockAccountRepository.hasChildren.mockResolvedValue(false);
			mockJournalRepository.countByAccountId.mockResolvedValue(0);

			const result = await useCase.execute("acc-456");

			expect(result.deletedCode).toBe("12345");
			expect(result.deletedAccountId).toBe("acc-456");
		});
	});
});
