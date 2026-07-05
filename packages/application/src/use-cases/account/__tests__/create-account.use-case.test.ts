/**
 * Create Account Use Case Tests
 *
 * Tests for the CreateAccountUseCase following Clean Architecture patterns.
 * Uses mocked repository to isolate use case logic from infrastructure.
 */

import { Account } from "@drenyra/domain/entities/Account";
import type { AccountRepository } from "@drenyra/domain/repositories/account.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { CreateAccountDTO } from "../../../dtos/account/account.dto";
import { CreateAccountUseCase } from "../create-account.use-case";

// Helper to create a valid CreateAccountDTO
function createValidDTO(
	overrides: Partial<CreateAccountDTO> = {},
): CreateAccountDTO {
	return {
		organizationId: 1,
		code: "10",
		name: "Efectivo y Equivalentes",
		description: "Cuenta de efectivo",
		level: "1",
		type: "Activo",
		isGroup: true,
		isSystem: false,
		currency: "PEN",
		...overrides,
	};
}

// Helper to create a mock parent account
function createMockParentAccount(
	overrides: Partial<{
		id: string;
		code: string;
		isGroup: boolean;
	}> = {},
): Account {
	return Account.create({
		id: overrides.id ?? "550e8400-e29b-41d4-a716-446655440000",
		organizationId: 1,
		code: overrides.code ?? "10",
		name: "Efectivo",
		level: "1",
		type: "Activo",
		isGroup: overrides.isGroup ?? true,
		isActive: true,
		isSystem: false,
		currency: "PEN",
		balance: Money.fromAmount(0, "PEN"),
		balanceUSD: Money.fromAmount(0, "USD"),
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

describe("CreateAccountUseCase", () => {
	let useCase: CreateAccountUseCase;
	let mockRepository: { [K in keyof AccountRepository]: Mock };

	beforeEach(() => {
		// Create mock repository
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

		useCase = new CreateAccountUseCase(mockRepository);
	});

	describe("Success Cases", () => {
		it("should create a valid account", async () => {
			const dto = createValidDTO();

			const result = await useCase.execute(dto);

			expect(result).toBeDefined();
			expect(result.code).toBe("10");
			expect(result.name).toBe("Efectivo y Equivalentes");
			expect(result.type).toBe("Activo");
			expect(result.isActive).toBe(true);
			expect(mockRepository.save).toHaveBeenCalledTimes(1);
		});

		it("should create account with parent", async () => {
			const parentId = "550e8400-e29b-41d4-a716-446655440000";
			const parentAccount = createMockParentAccount({
				id: parentId,
				code: "10",
			});
			mockRepository.findById.mockResolvedValue(parentAccount);

			const dto = createValidDTO({
				code: "101",
				level: "2",
				parentId: parentId,
			});

			const result = await useCase.execute(dto);

			expect(result.code).toBe("101");
			expect(mockRepository.findById).toHaveBeenCalledWith(parentId);
			expect(mockRepository.save).toHaveBeenCalled();
		});

		it("should create account with all optional fields", async () => {
			const dto = createValidDTO({
				description: "Descripción detallada",
				destination: "Destino especial",
			});

			const result = await useCase.execute(dto);

			expect(result.description).toBe("Descripción detallada");
		});
	});

	describe("Validation Errors", () => {
		it("should throw error when code already exists", async () => {
			mockRepository.codeExists.mockResolvedValue(true);

			const dto = createValidDTO();

			await expect(useCase.execute(dto)).rejects.toThrow(
				/Ya existe una cuenta con el código 10/,
			);
		});

		it("should throw error for invalid code format (non-numeric)", async () => {
			const dto = createValidDTO({ code: "10A" });

			await expect(useCase.execute(dto)).rejects.toThrow();
		});

		it("should throw error when code length does not match level", async () => {
			const dto = createValidDTO({
				code: "101", // 3 digits
				level: "1", // Level 1 requires 2 digits
			});

			await expect(useCase.execute(dto)).rejects.toThrow();
		});

		it("should throw error when type does not match code", async () => {
			const dto = createValidDTO({
				code: "10",
				type: "Pasivo", // Should be Activo for code starting with 1
			});

			await expect(useCase.execute(dto)).rejects.toThrow();
		});

		it("should throw error for empty name", async () => {
			const dto = createValidDTO({ name: "" });

			await expect(useCase.execute(dto)).rejects.toThrow();
		});
	});

	describe("Parent Account Validation", () => {
		it("should throw error when parent account does not exist", async () => {
			mockRepository.findById.mockResolvedValue(null);

			const dto = createValidDTO({
				code: "101",
				level: "2",
				parentId: "660e8400-e29b-41d4-a716-446655440001",
			});

			await expect(useCase.execute(dto)).rejects.toThrow(
				"La cuenta padre no existe",
			);
		});

		it("should throw error when parent cannot have children", async () => {
			const parentId = "770e8400-e29b-41d4-a716-446655440002";
			const parentAccount = createMockParentAccount({
				id: parentId,
				code: "10",
				isGroup: false, // Movement account, cannot have children
			});
			mockRepository.findById.mockResolvedValue(parentAccount);

			const dto = createValidDTO({
				code: "101",
				level: "2",
				parentId: parentId,
			});

			await expect(useCase.execute(dto)).rejects.toThrow(
				"La cuenta padre no puede tener subcuentas",
			);
		});

		it("should throw error when child code does not start with parent code", async () => {
			const parentId = "880e8400-e29b-41d4-a716-446655440003";
			const parentAccount = createMockParentAccount({
				id: parentId,
				code: "10",
			});
			mockRepository.findById.mockResolvedValue(parentAccount);

			const dto = createValidDTO({
				code: "201", // Should start with '10'
				level: "2",
				type: "Activo",
				parentId: parentId,
			});

			await expect(useCase.execute(dto)).rejects.toThrow(
				"El código debe comenzar con el código de la cuenta padre",
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle undefined optional fields", async () => {
			const dto: CreateAccountDTO = {
				organizationId: 1,
				code: "10",
				name: "Test Account",
				level: "1",
				type: "Activo",
				isGroup: true,
				isSystem: false,
				currency: "PEN",
			};

			const result = await useCase.execute(dto);

			expect(result.description).toBeUndefined();
		});

		it("should handle account with USD currency", async () => {
			const dto = createValidDTO({ currency: "USD" });

			const result = await useCase.execute(dto);

			expect(result.currency).toBe("USD");
		});

		it("should handle system account creation", async () => {
			const dto = createValidDTO({ isSystem: true });

			const result = await useCase.execute(dto);

			expect(result.isSystem).toBe(true);
		});

		it("should call repository.codeExists with correct parameters", async () => {
			const dto = createValidDTO({
				organizationId: 5,
				code: "20",
			});

			await useCase.execute(dto);

			expect(mockRepository.codeExists).toHaveBeenCalledWith(5, "20");
		});

		it("should always set balance to zero for new accounts", async () => {
			const dto = createValidDTO();

			const result = await useCase.execute(dto);

			expect(result.balance.getAmount()).toBe(0);
		});
	});

	describe("Account Level Validation", () => {
		const levelCodeMapping = [
			{ level: "1", code: "10" },
			{ level: "2", code: "101" },
			{ level: "3", code: "1011" },
			{ level: "4", code: "10111" },
			{ level: "5", code: "101111" },
		] as const;

		it.each(
			levelCodeMapping,
		)("should accept level $level with $code.length-digit code", async ({
			level,
			code,
		}) => {
			const dto = createValidDTO({ level, code });

			const result = await useCase.execute(dto);

			expect(result.level).toBe(level);
			expect(result.code).toBe(code);
		});
	});
});
