/**
 * Create Journal Entry Use Case Tests
 *
 * Tests for the CreateJournalEntryUseCase covering:
 * - Successful journal entry creation
 * - Validation of balance (debit = credit)
 * - Account existence validation
 * - Line validation (at least 2 lines)
 */

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import type { CreateJournalEntryDTO } from "../../../dtos/journal/journal-entry.dto";
import { CreateJournalEntryUseCase } from "../create-journal-entry.use-case";

// Test UUIDs - using consistent UUIDs for testing
const TEST_UUID_1 = "00000000-0000-4000-8000-000000000001";
const TEST_UUID_2 = "00000000-0000-4000-8000-000000000002";
const TEST_UUID_3 = "00000000-0000-4000-8000-000000000003";
const TEST_UUID_4 = "00000000-0000-4000-8000-000000000004";
const TEST_UUID_INVALID = "00000000-0000-4000-8000-000000000099";

// Helper to create valid DTO
function createValidDTO(
	overrides: Partial<CreateJournalEntryDTO> = {},
): CreateJournalEntryDTO {
	return {
		organizationId: 1,
		date: new Date("2024-01-15"),
		gloss: "Asiento de prueba",
		lines: [
			{
				accountId: TEST_UUID_1,
				description: "Débito a efectivo",
				debit: 1000,
				credit: 0,
			},
			{
				accountId: TEST_UUID_2,
				description: "Crédito a ventas",
				debit: 0,
				credit: 1000,
			},
		],
		...overrides,
	};
}

describe("CreateJournalEntryUseCase", () => {
	let useCase: CreateJournalEntryUseCase;
	let mockJournalRepository: { [K in keyof JournalEntryRepository]: Mock };
	let mockAccountService: { getById: Mock };

	beforeEach(() => {
		mockJournalRepository = {
			save: vi.fn().mockResolvedValue(undefined),
			findById: vi.fn().mockResolvedValue(null),
			findAll: vi.fn().mockResolvedValue([]),
			findWithFilters: vi.fn().mockResolvedValue([]),
			delete: vi.fn().mockResolvedValue(undefined),
			getNextEntryNumber: vi.fn().mockResolvedValue("2024-00001"),
			count: vi.fn().mockResolvedValue(0),
			countByAccountId: vi.fn().mockResolvedValue(0),
		} as unknown as { [K in keyof JournalEntryRepository]: Mock };

		mockAccountService = {
			getById: vi.fn().mockImplementation((id: string) =>
				Promise.resolve({
					code: id === TEST_UUID_1 ? "10" : "70",
					name: id === TEST_UUID_1 ? "Efectivo" : "Ventas",
				}),
			),
		} as { getById: Mock };

		useCase = new CreateJournalEntryUseCase(
			mockJournalRepository,
			mockAccountService,
		);
	});

	describe("Success Cases", () => {
		it("should create a valid journal entry", async () => {
			const dto = createValidDTO();

			const result = await useCase.execute(dto, "user-123");

			expect(result).toBeDefined();
			expect(result.gloss).toBe("Asiento de prueba");
			expect(result.status).toBe("borrador");
			expect(result.lines).toHaveLength(2);
			expect(mockJournalRepository.save).toHaveBeenCalledTimes(1);
		});

		it("should generate entry number from repository", async () => {
			mockJournalRepository.getNextEntryNumber.mockResolvedValue("2024-00042");

			const dto = createValidDTO();

			const result = await useCase.execute(dto, "user-123");

			expect(result.entryNumber).toBe("2024-00042");
			expect(mockJournalRepository.getNextEntryNumber).toHaveBeenCalledWith(
				1,
				2024,
			);
		});

		it("should create journal lines with account details", async () => {
			const dto = createValidDTO();

			const result = await useCase.execute(dto, "user-123");

			expect(result.lines[0]?.accountCode).toBe("10");
			expect(result.lines[0]?.accountName).toBe("Efectivo");
			expect(result.lines[1]?.accountCode).toBe("70");
			expect(result.lines[1]?.accountName).toBe("Ventas");
		});

		it("should create balanced entry with multiple lines", async () => {
			const dto = createValidDTO({
				lines: [
					{
						accountId: TEST_UUID_1,
						description: "Débito 1",
						debit: 500,
						credit: 0,
					},
					{
						accountId: TEST_UUID_1,
						description: "Débito 2",
						debit: 500,
						credit: 0,
					},
					{
						accountId: TEST_UUID_2,
						description: "Crédito",
						debit: 0,
						credit: 1000,
					},
				],
			});

			const result = await useCase.execute(dto, "user-123");

			expect(result.lines).toHaveLength(3);
			expect(result.isBalanced()).toBe(true);
		});
	});

	describe("Validation Errors", () => {
		it("should throw error when account does not exist", async () => {
			mockAccountService.getById.mockResolvedValue(null);

			const dto = createValidDTO();

			await expect(useCase.execute(dto, "user-123")).rejects.toThrow(
				/Cuenta no encontrada/,
			);
		});

		it("should throw error when entry is not balanced", async () => {
			const dto = createValidDTO({
				lines: [
					{
						accountId: TEST_UUID_1,
						description: "Débito",
						debit: 1000,
						credit: 0,
					},
					{
						accountId: TEST_UUID_2,
						description: "Crédito",
						debit: 0,
						credit: 500,
					}, // Unbalanced
				],
			});

			await expect(useCase.execute(dto, "user-123")).rejects.toThrow();
		});

		it("should throw error when less than 2 lines", async () => {
			const dto = createValidDTO({
				lines: [
					{
						accountId: TEST_UUID_1,
						description: "Solo una línea",
						debit: 1000,
						credit: 0,
					},
				],
			});

			await expect(useCase.execute(dto, "user-123")).rejects.toThrow();
		});

		it("should throw error when gloss is empty", async () => {
			const dto = createValidDTO({ gloss: "" });

			await expect(useCase.execute(dto, "user-123")).rejects.toThrow();
		});

		it("should throw error when line has both debit and credit", async () => {
			const dto = createValidDTO({
				lines: [
					{
						accountId: TEST_UUID_1,
						description: "Ambos",
						debit: 500,
						credit: 500,
					},
					{
						accountId: TEST_UUID_2,
						description: "Crédito",
						debit: 0,
						credit: 1000,
					},
				],
			});

			await expect(useCase.execute(dto, "user-123")).rejects.toThrow();
		});
	});

	describe("Edge Cases", () => {
		it("should handle very small amounts", async () => {
			const dto = createValidDTO({
				lines: [
					{
						accountId: TEST_UUID_1,
						description: "Pequeño débito",
						debit: 0.01,
						credit: 0,
					},
					{
						accountId: TEST_UUID_2,
						description: "Pequeño crédito",
						debit: 0,
						credit: 0.01,
					},
				],
			});

			const result = await useCase.execute(dto, "user-123");

			expect(result.getTotalDebit().getAmount()).toBe(0.01);
		});

		it("should handle large amounts", async () => {
			const dto = createValidDTO({
				lines: [
					{
						accountId: TEST_UUID_1,
						description: "Grande débito",
						debit: 999999999.99,
						credit: 0,
					},
					{
						accountId: TEST_UUID_2,
						description: "Grande crédito",
						debit: 0,
						credit: 999999999.99,
					},
				],
			});

			const result = await useCase.execute(dto, "user-123");

			expect(result.getTotalDebit().getAmount()).toBe(999999999.99);
		});

		it("should handle optional fields in lines", async () => {
			const dto = createValidDTO({
				lines: [
					{
						accountId: TEST_UUID_1,
						description: "Con documento",
						debit: 1000,
						credit: 0,
						documentType: "FACTURA",
						documentNumber: "F001-00001",
						dueDate: new Date("2024-02-15"),
					},
					{
						accountId: TEST_UUID_2,
						description: "Sin documento",
						debit: 0,
						credit: 1000,
					},
				],
			});

			const result = await useCase.execute(dto, "user-123");

			expect(result.lines[0]?.documentType).toBe("FACTURA");
			expect(result.lines[0]?.documentNumber).toBe("F001-00001");
			expect(result.lines[1]?.documentType).toBeUndefined();
		});

		it("should create entry with correct date year for entry number", async () => {
			const dto = createValidDTO({
				date: new Date("2025-06-15"),
			});

			await useCase.execute(dto, "user-123");

			expect(mockJournalRepository.getNextEntryNumber).toHaveBeenCalledWith(
				1,
				2025,
			);
		});

		it("should always create entry in borrador status", async () => {
			const dto = createValidDTO();

			const result = await useCase.execute(dto, "user-123");

			expect(result.status).toBe("borrador");
			expect(result.canBeModified()).toBe(true);
		});
	});

	describe("Account Validation", () => {
		it("should fetch all accounts for lines", async () => {
			const dto = createValidDTO({
				lines: [
					{ accountId: TEST_UUID_1, description: "D1", debit: 400, credit: 0 },
					{ accountId: TEST_UUID_2, description: "D2", debit: 300, credit: 0 },
					{ accountId: TEST_UUID_3, description: "D3", debit: 300, credit: 0 },
					{ accountId: TEST_UUID_4, description: "C1", debit: 0, credit: 1000 },
				],
			});

			mockAccountService.getById.mockImplementation((id: string) =>
				Promise.resolve({ code: id, name: `Account ${id}` }),
			);

			await useCase.execute(dto, "user-123");

			expect(mockAccountService.getById).toHaveBeenCalledTimes(4);
			expect(mockAccountService.getById).toHaveBeenCalledWith(TEST_UUID_1);
			expect(mockAccountService.getById).toHaveBeenCalledWith(TEST_UUID_2);
			expect(mockAccountService.getById).toHaveBeenCalledWith(TEST_UUID_3);
			expect(mockAccountService.getById).toHaveBeenCalledWith(TEST_UUID_4);
		});

		it("should fail on first missing account", async () => {
			const dto = createValidDTO({
				lines: [
					{ accountId: TEST_UUID_1, description: "D1", debit: 500, credit: 0 },
					{
						accountId: TEST_UUID_INVALID,
						description: "D2",
						debit: 500,
						credit: 0,
					},
					{ accountId: TEST_UUID_3, description: "C1", debit: 0, credit: 1000 },
				],
			});

			mockAccountService.getById.mockImplementation((id: string) =>
				id === TEST_UUID_INVALID
					? Promise.resolve(null)
					: Promise.resolve({ code: id, name: id }),
			);

			await expect(useCase.execute(dto, "user-123")).rejects.toThrow(
				/Cuenta no encontrada/,
			);
		});
	});
});
