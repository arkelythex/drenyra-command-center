/**
 * CreateBankAccountUseCase Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { BankAccount } from "@drenyra/domain/entities/BankAccount";
import type { BankAccountRepository } from "@drenyra/domain/repositories/bank-account.repository";
import { CreateBankAccountUseCase } from "../create-bank-account.use-case";

// Mock repository
const createMockRepository = (): BankAccountRepository => ({
	save: vi.fn(),
	findById: vi.fn(),
	findByOrganization: vi.fn(),
	findByAccountNumber: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
});

describe("CreateBankAccountUseCase", () => {
	let useCase: CreateBankAccountUseCase;
	let mockRepo: ReturnType<typeof createMockRepository>;

	beforeEach(() => {
		mockRepo = createMockRepository();
		useCase = new CreateBankAccountUseCase(mockRepo);
	});

	describe("Validation", () => {
		it("should reject invalid organization ID (0)", async () => {
			const result = await useCase.execute({
				organizationId: 0,
				bankName: "BCP",
				accountNumber: "123-456-789",
				accountType: "Corriente",
				currency: "PEN",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("ID de organización inválido");
		});

		it("should reject negative organization ID", async () => {
			const result = await useCase.execute({
				organizationId: -1,
				bankName: "BCP",
				accountNumber: "123-456-789",
				accountType: "Corriente",
				currency: "PEN",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("ID de organización inválido");
		});
	});

	describe("Duplicate detection", () => {
		it("should reject duplicate account number", async () => {
			const existingAccount = BankAccount.createNew({
				organizationId: 1,
				bankName: "BCP",
				accountNumber: "123-456-789",
				accountType: "Corriente",
				currency: "PEN",
			});

			mockRepo.findByAccountNumber = vi.fn().mockResolvedValue(existingAccount);

			const result = await useCase.execute({
				organizationId: 1,
				bankName: "Interbank",
				accountNumber: "123-456-789",
				accountType: "Ahorro",
				currency: "PEN",
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("Ya existe una cuenta con el número");
			expect(mockRepo.findByAccountNumber).toHaveBeenCalledWith(
				"123-456-789",
				1,
			);
		});

		it("should allow same account number in different organizations", async () => {
			mockRepo.findByAccountNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((acc) => Promise.resolve(acc));

			const result = await useCase.execute({
				organizationId: 2,
				bankName: "BCP",
				accountNumber: "123-456-789",
				accountType: "Corriente",
				currency: "PEN",
			});

			expect(result.success).toBe(true);
			expect(mockRepo.findByAccountNumber).toHaveBeenCalledWith(
				"123-456-789",
				2,
			);
		});
	});

	describe("Successful creation", () => {
		it("should create bank account with required fields", async () => {
			mockRepo.findByAccountNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((acc) => Promise.resolve(acc));

			const result = await useCase.execute({
				organizationId: 1,
				bankName: "BCP",
				accountNumber: "191-12345678-0-01",
				accountType: "Corriente",
				currency: "PEN",
			});

			expect(result.success).toBe(true);
			expect(result.data).toBeDefined();
			expect(result.data?.bankName).toBe("BCP");
			expect(result.data?.accountNumber).toBe("191-12345678-0-01");
			expect(mockRepo.save).toHaveBeenCalled();
		});

		it("should create bank account with all optional fields", async () => {
			mockRepo.findByAccountNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((acc) => Promise.resolve(acc));

			const result = await useCase.execute({
				organizationId: 1,
				bankName: "Interbank",
				accountNumber: "200-123456789012",
				accountType: "Ahorro",
				currency: "USD",
				initialBalance: 5000,
				accountingAccountId: "104101",
				cci: "00320012345678901234",
				swiftCode: "BINPPEPL",
				notes: "Cuenta para pagos internacionales",
			});

			expect(result.success).toBe(true);
			expect(result.data?.currency).toBe("USD");
			expect(result.data?.accountType).toBe("Ahorro");
			expect(result.data?.notes).toBe("Cuenta para pagos internacionales");
		});

		it("should default initial balance to 0", async () => {
			mockRepo.findByAccountNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockImplementation((acc) => Promise.resolve(acc));

			const result = await useCase.execute({
				organizationId: 1,
				bankName: "BBVA",
				accountNumber: "011-12345678",
				accountType: "Corriente",
				currency: "PEN",
			});

			expect(result.success).toBe(true);
			// currentBalance is a Money value object, check amount via getAmount()
			expect(result.data?.currentBalance.getAmount()).toBe(0);
		});
	});

	describe("Error handling", () => {
		it("should handle repository errors gracefully", async () => {
			mockRepo.findByAccountNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi
				.fn()
				.mockRejectedValue(new Error("Database connection failed"));

			const result = await useCase.execute({
				organizationId: 1,
				bankName: "BCP",
				accountNumber: "123-456-789",
				accountType: "Corriente",
				currency: "PEN",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Database connection failed");
		});

		it("should handle unknown errors", async () => {
			mockRepo.findByAccountNumber = vi.fn().mockResolvedValue(null);
			mockRepo.save = vi.fn().mockRejectedValue("Unknown error");

			const result = await useCase.execute({
				organizationId: 1,
				bankName: "BCP",
				accountNumber: "123-456-789",
				accountType: "Corriente",
				currency: "PEN",
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Error al crear cuenta bancaria");
		});
	});
});
