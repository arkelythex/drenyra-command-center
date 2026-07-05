/**
 * Update Account Use Case Tests
 *
 * Tests for the UpdateAccountUseCase covering:
 * - Successful updates
 * - System account restrictions
 * - Parent change validation
 * - Circular reference prevention
 */

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import {
	Account,
	type AccountLevel,
} from "@drenyra/domain/entities/Account";
import type { AccountRepository } from "@drenyra/domain/repositories/account.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import type { UpdateAccountDTO } from "../../../dtos/account/account.dto";
import { UpdateAccountUseCase } from "../update-account.use-case";

// Helper to create a mock account
function createMockAccount(
	overrides: Partial<{
		id: string;
		code: string;
		name: string;
		level: string;
		isSystem: boolean;
		isGroup: boolean;
		parentId: string;
	}> = {},
): Account {
	return Account.create({
		id: overrides.id ?? "acc-123",
		organizationId: 1,
		code: overrides.code ?? "10",
		name: overrides.name ?? "Test Account",
		level: (overrides.level ?? "1") as AccountLevel,
		type: "Activo",
		parentId: overrides.parentId,
		isGroup: overrides.isGroup ?? true,
		isActive: true,
		isSystem: overrides.isSystem ?? false,
		currency: "PEN",
		balance: Money.fromAmount(0, "PEN"),
		balanceUSD: Money.fromAmount(0, "USD"),
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

describe("UpdateAccountUseCase", () => {
	let useCase: UpdateAccountUseCase;
	let mockRepository: { [K in keyof AccountRepository]: Mock };

	beforeEach(() => {
		mockRepository = {
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

		useCase = new UpdateAccountUseCase(mockRepository);
	});

	describe("Success Cases", () => {
		it("should update account name", async () => {
			const existingAccount = createMockAccount({ name: "Old Name" });
			mockRepository.findById.mockResolvedValue(existingAccount);

			const dto: UpdateAccountDTO = { name: "New Name" };

				const result = await useCase.execute("acc-123", dto);

			expect(result.name).toBe("New Name");
			expect(mockRepository.save).toHaveBeenCalled();
		});

		it("should update account description", async () => {
			const existingAccount = createMockAccount();
			mockRepository.findById.mockResolvedValue(existingAccount);

			const dto: UpdateAccountDTO = { description: "Nueva descripción" };

				const result = await useCase.execute("acc-123", dto);

			expect(mockRepository.save).toHaveBeenCalled();
		});

		it("should update multiple fields at once", async () => {
			const existingAccount = createMockAccount({ isSystem: false });
			mockRepository.findById.mockResolvedValue(existingAccount);

			const dto: UpdateAccountDTO = {
				name: "Updated Name",
				description: "Updated Description",
				destination: "New Destination",
			};

				const result = await useCase.execute("acc-123", dto);

			expect(result.name).toBe("Updated Name");
			expect(mockRepository.save).toHaveBeenCalled();
		});

		it("should update account code when valid", async () => {
			const existingAccount = createMockAccount({
				id: "acc-123",
				code: "10",
				isSystem: false,
			});
			mockRepository.findById.mockResolvedValue(existingAccount);
			mockRepository.codeExists.mockResolvedValue(false);

			const dto: UpdateAccountDTO = { code: "20" };

				const result = await useCase.execute("acc-123", dto);

			expect(result.code).toBe("20");
		});
	});

	describe("Error Cases", () => {
		it("should throw error when account not found", async () => {
			mockRepository.findById.mockResolvedValue(null);

			const dto: UpdateAccountDTO = { name: "New Name" };

			await expect(useCase.execute("non-existent", dto)).rejects.toThrow(
				"Cuenta no encontrada",
			);
		});

		it("should throw error when new code already exists", async () => {
			const existingAccount = createMockAccount({ code: "10" });
			mockRepository.findById.mockResolvedValue(existingAccount);
			mockRepository.codeExists.mockResolvedValue(true);

			const dto: UpdateAccountDTO = { code: "20" };

			await expect(useCase.execute("acc-123", dto)).rejects.toThrow(
				/Ya existe una cuenta con el código 20/,
			);
		});

		it("should throw error when changing to non-group with children", async () => {
			const existingAccount = createMockAccount({ isGroup: true });
			mockRepository.findById.mockResolvedValue(existingAccount);
			mockRepository.hasChildren.mockResolvedValue(true);

			const dto: UpdateAccountDTO = { isGroup: false };

			await expect(useCase.execute("acc-123", dto)).rejects.toThrow(
				"No se puede convertir en cuenta de movimiento porque tiene subcuentas",
			);
		});
	});

	describe("Parent Change Validation", () => {
		it("should throw error when new parent does not exist", async () => {
			const existingAccount = createMockAccount();
			mockRepository.findById
				.mockResolvedValueOnce(existingAccount) // First call for account
				.mockResolvedValueOnce(null); // Second call for parent

			// Use a valid UUID format
			const dto: UpdateAccountDTO = {
				parentId: "123e4567-e89b-12d3-a456-426614174000",
			};

			await expect(useCase.execute("acc-123", dto)).rejects.toThrow(
				"La nueva cuenta padre no existe",
			);
		});

		it("should throw error when new parent cannot have children", async () => {
			// Level 1 account (2 digits) trying to change parent to a non-group account
			const parentUuid = "456e4567-e89b-12d3-a456-426614174001";
			const existingAccount = createMockAccount({
				id: "acc-123",
				code: "10",
				level: "1",
			});
			const newParent = createMockAccount({
				id: parentUuid,
				code: "20",
				level: "1",
				isGroup: false, // Cannot have children
			});

			mockRepository.findById
				.mockResolvedValueOnce(existingAccount)
				.mockResolvedValueOnce(newParent);

			const dto: UpdateAccountDTO = { parentId: parentUuid };

			await expect(useCase.execute("acc-123", dto)).rejects.toThrow(
				"La nueva cuenta padre no puede tener subcuentas",
			);
		});

		it("should throw error when creating circular reference", async () => {
			// Account 10 (level 1) trying to set 101 (level 2, its child) as parent
			const childUuid = "789e4567-e89b-12d3-a456-426614174002";
			const existingAccount = createMockAccount({
				id: "acc-123",
				code: "10",
				level: "1",
			});
			const potentialParent = createMockAccount({
				id: childUuid,
				code: "101", // Starts with '10', so it's a child (level 2 = 3 digits)
				level: "2",
				isGroup: true,
			});

			mockRepository.findById
				.mockResolvedValueOnce(existingAccount)
				.mockResolvedValueOnce(potentialParent);

			const dto: UpdateAccountDTO = { parentId: childUuid };

			await expect(useCase.execute("acc-123", dto)).rejects.toThrow(
				"No se puede asignar como padre a una subcuenta",
			);
		});

		it("should allow changing to valid new parent", async () => {
			const newParentUuid = "999e4567-e89b-12d3-a456-426614174003";
			const oldParentUuid = "111e4567-e89b-12d3-a456-426614174004";
			const existingAccount = createMockAccount({
				id: "acc-123",
				code: "101", // Level 2 (3 digits)
				level: "2",
				parentId: oldParentUuid,
			});
			const newParent = createMockAccount({
				id: newParentUuid,
				code: "10", // Level 1 (2 digits)
				level: "1",
				isGroup: true,
			});

			mockRepository.findById
				.mockResolvedValueOnce(existingAccount)
				.mockResolvedValueOnce(newParent);

			const dto: UpdateAccountDTO = { parentId: newParentUuid };

				const result = await useCase.execute("acc-123", dto);

			expect(mockRepository.save).toHaveBeenCalled();
		});
	});

	describe("System Account Restrictions", () => {
		it("should throw error when modifying code of system account", async () => {
			const systemAccount = createMockAccount({ isSystem: true, code: "10" });
			mockRepository.findById.mockResolvedValue(systemAccount);

			const dto: UpdateAccountDTO = { code: "20" };

			await expect(useCase.execute("acc-123", dto)).rejects.toThrow(
				/No se pueden modificar los campos code/,
			);
		});

		it("should throw error when modifying type of system account", async () => {
			const systemAccount = createMockAccount({ isSystem: true });
			mockRepository.findById.mockResolvedValue(systemAccount);

			const dto: UpdateAccountDTO = { type: "Pasivo" };

			await expect(useCase.execute("acc-123", dto)).rejects.toThrow(
				/No se pueden modificar los campos type/,
			);
		});

		it("should allow updating name of system account", async () => {
			const systemAccount = createMockAccount({
				isSystem: true,
				name: "Old Name",
			});
			mockRepository.findById.mockResolvedValue(systemAccount);

			const dto: UpdateAccountDTO = { name: "Updated System Account Name" };

				const result = await useCase.execute("acc-123", dto);

			expect(result.name).toBe("Updated System Account Name");
		});

		it("should allow updating description of system account", async () => {
			const systemAccount = createMockAccount({ isSystem: true });
			mockRepository.findById.mockResolvedValue(systemAccount);

			const dto: UpdateAccountDTO = { description: "New description" };

			await expect(useCase.execute("acc-123", dto)).resolves.toBeDefined();
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty update DTO", async () => {
			const existingAccount = createMockAccount();
			mockRepository.findById.mockResolvedValue(existingAccount);

			const dto: UpdateAccountDTO = {};

				const result = await useCase.execute("acc-123", dto);

			expect(mockRepository.save).toHaveBeenCalled();
		});

		it("should handle null description", async () => {
			const existingAccount = createMockAccount();
			mockRepository.findById.mockResolvedValue(existingAccount);

			const dto: UpdateAccountDTO = { description: null };

			const result = await useCase.execute("acc-123", dto);

			expect(result.description).toBeUndefined();
		});

		it("should handle null parentId (removing parent)", async () => {
			const existingAccount = createMockAccount({ parentId: "old-parent" });
			mockRepository.findById.mockResolvedValue(existingAccount);

			const dto: UpdateAccountDTO = { parentId: null };

			const result = await useCase.execute("acc-123", dto);

			expect(result.parentId).toBeUndefined();
		});

		it("should not check code exists when code is unchanged", async () => {
			const existingAccount = createMockAccount({ code: "10" });
			mockRepository.findById.mockResolvedValue(existingAccount);

			const dto: UpdateAccountDTO = { code: "10", name: "Updated Name" };

			const result = await useCase.execute("acc-123", dto);

			expect(mockRepository.codeExists).not.toHaveBeenCalled();
		});

		it("should exclude current account when checking code exists", async () => {
			const existingAccount = createMockAccount({ id: "acc-123", code: "10" });
			mockRepository.findById.mockResolvedValue(existingAccount);
			mockRepository.codeExists.mockResolvedValue(false);

			const dto: UpdateAccountDTO = { code: "20" };

			const result = await useCase.execute("acc-123", dto);

			expect(mockRepository.codeExists).toHaveBeenCalledWith(
				expect.any(Number),
				"20",
				"acc-123", // excludeId
			);
		});
	});
});
