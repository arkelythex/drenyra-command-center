/**
 * Delete Journal Entry Use Case Tests
 * Comprehensive tests for journal entry deletion (0% → 100% coverage)
 */

import { JournalEntry } from "@drenyra/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { Money } from "@drenyra/domain/value-objects/Money";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteJournalEntryUseCase } from "../delete-journal-entry.use-case";

const scope: TenantScope = { organizationId: "1", companyId: "company-a1" };

describe("DeleteJournalEntryUseCase", () => {
	let useCase: DeleteJournalEntryUseCase;
	let mockJournalRepository: JournalEntryRepository;

	beforeEach(() => {
		mockJournalRepository = {
			save: vi.fn(),
			findById: vi.fn(),
			findByOrganizationId: vi.fn(),
			findByDateRange: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		} as unknown as JournalEntryRepository;

		useCase = new DeleteJournalEntryUseCase(mockJournalRepository);
	});

	const createMockJournalEntry = (
		status: "borrador" | "mayorizado" = "borrador",
	) => {
		return JournalEntry.create({
			id: "journal-123",
			organizationId: "org-456",
			entryNumber: "AST-001",
			date: new Date("2025-01-15"),
			description: "Test journal entry",
			reference: "REF-001",
			gloss: "Por venta de mercadería", // Required field
			status,
			lines: [
				{
					accountId: "acc-1",
					accountCode: "10",
					accountName: "Caja",
					debit: Money.fromAmount(1000, "PEN"),
					credit: Money.zero("PEN"),
					description: "Debit entry",
				},
				{
					accountId: "acc-2",
					accountCode: "40",
					accountName: "Ventas",
					debit: Money.zero("PEN"),
					credit: Money.fromAmount(1000, "PEN"),
					description: "Credit entry",
				},
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	};

	describe("execute", () => {
		it("should delete draft journal entry successfully", async () => {
			const draftEntry = createMockJournalEntry("borrador");

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(draftEntry);
			vi.mocked(mockJournalRepository.delete).mockResolvedValue(undefined);

			await useCase.execute(scope, "journal-123");

			expect(mockJournalRepository.findById).toHaveBeenCalledWith(
				scope,
				"journal-123",
			);
			expect(mockJournalRepository.delete).toHaveBeenCalledWith(
				scope,
				"journal-123",
			);
			expect(mockJournalRepository.delete).toHaveBeenCalledTimes(1);
		});

		it("should call repository methods in correct order", async () => {
			const draftEntry = createMockJournalEntry("borrador");

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(draftEntry);
			vi.mocked(mockJournalRepository.delete).mockResolvedValue(undefined);

			await useCase.execute(scope, "journal-123");

			const findByIdCall = vi.mocked(mockJournalRepository.findById).mock
				.invocationCallOrder[0];
			const deleteCall = vi.mocked(mockJournalRepository.delete).mock
				.invocationCallOrder[0];

			expect(findByIdCall).toBeLessThan(deleteCall);
		});

		it("should handle different journal entry IDs", async () => {
			const draftEntry = createMockJournalEntry("borrador");

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(draftEntry);
			vi.mocked(mockJournalRepository.delete).mockResolvedValue(undefined);

			await useCase.execute(scope, "different-id-789");

			expect(mockJournalRepository.findById).toHaveBeenCalledWith(
				scope,
				"different-id-789",
			);
			expect(mockJournalRepository.delete).toHaveBeenCalledWith(
				scope,
				"different-id-789",
			);
		});
	});

	describe("error handling", () => {
		it("should throw error when journal entry not found", async () => {
			vi.mocked(mockJournalRepository.findById).mockResolvedValue(null);

			await expect(useCase.execute(scope, "non-existent-id")).rejects.toThrow(
				"Asiento no encontrado",
			);

			expect(mockJournalRepository.findById).toHaveBeenCalledWith(
				scope,
				"non-existent-id",
			);
			expect(mockJournalRepository.delete).not.toHaveBeenCalled();
		});

		it("should throw error when journal entry not found (undefined)", async () => {
			vi.mocked(mockJournalRepository.findById).mockResolvedValue(
				undefined as unknown as Awaited<
					ReturnType<typeof mockJournalRepository.findById>
				>,
			);

			await expect(useCase.execute(scope, "non-existent-id")).rejects.toThrow(
				"Asiento no encontrado",
			);

			expect(mockJournalRepository.delete).not.toHaveBeenCalled();
		});

		it("should throw error when trying to delete posted journal entry", async () => {
			const postedEntry = createMockJournalEntry("mayorizado");

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(postedEntry);

			await expect(useCase.execute(scope, "journal-123")).rejects.toThrow(
				"Solo se pueden eliminar asientos en borrador",
			);

			expect(mockJournalRepository.findById).toHaveBeenCalledWith(
				scope,
				"journal-123",
			);
			expect(mockJournalRepository.delete).not.toHaveBeenCalled();
		});

		it("should propagate repository find errors", async () => {
			vi.mocked(mockJournalRepository.findById).mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(useCase.execute(scope, "journal-123")).rejects.toThrow(
				"Database connection failed",
			);

			expect(mockJournalRepository.delete).not.toHaveBeenCalled();
		});

		it("should propagate repository delete errors", async () => {
			const draftEntry = createMockJournalEntry("borrador");

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(draftEntry);
			vi.mocked(mockJournalRepository.delete).mockRejectedValue(
				new Error("Foreign key constraint violation"),
			);

			await expect(useCase.execute(scope, "journal-123")).rejects.toThrow(
				"Foreign key constraint violation",
			);

			expect(mockJournalRepository.findById).toHaveBeenCalled();
			expect(mockJournalRepository.delete).toHaveBeenCalled();
		});
	});

	describe("business rules", () => {
		it("should respect canBeDeleted business rule", async () => {
			const draftEntry = createMockJournalEntry("borrador");

			// Ensure canBeDeleted returns true for borrador
			expect(draftEntry.canBeDeleted()).toBe(true);

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(draftEntry);
			vi.mocked(mockJournalRepository.delete).mockResolvedValue(undefined);

			await expect(
				useCase.execute(scope, "journal-123"),
			).resolves.not.toThrow();
		});

		it("should prevent deletion of posted entries via business rule", async () => {
			const postedEntry = createMockJournalEntry("mayorizado");

			// Ensure canBeDeleted returns false for mayorizado
			expect(postedEntry.canBeDeleted()).toBe(false);

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(postedEntry);

			await expect(useCase.execute(scope, "journal-123")).rejects.toThrow(
				"Solo se pueden eliminar asientos en borrador",
			);
		});
	});

	describe("integration scenarios", () => {
		it("should complete full deletion workflow for draft entry", async () => {
			const draftEntry = createMockJournalEntry("borrador");

			vi.mocked(mockJournalRepository.findById).mockResolvedValue(draftEntry);
			vi.mocked(mockJournalRepository.delete).mockResolvedValue(undefined);

			// Should not throw
			await useCase.execute(scope, "journal-123");

			// Verify complete workflow executed
			expect(mockJournalRepository.findById).toHaveBeenCalledTimes(1);
			expect(mockJournalRepository.delete).toHaveBeenCalledTimes(1);
		});

		it("should handle multiple deletion attempts correctly", async () => {
			const draftEntry1 = createMockJournalEntry("borrador");
			const draftEntry2 = createMockJournalEntry("borrador");

			vi.mocked(mockJournalRepository.findById)
				.mockResolvedValueOnce(draftEntry1)
				.mockResolvedValueOnce(draftEntry2);
			vi.mocked(mockJournalRepository.delete).mockResolvedValue(undefined);

			await useCase.execute(scope, "journal-1");
			await useCase.execute(scope, "journal-2");

			expect(mockJournalRepository.delete).toHaveBeenCalledTimes(2);
			expect(mockJournalRepository.delete).toHaveBeenCalledWith(
				scope,
				"journal-1",
			);
			expect(mockJournalRepository.delete).toHaveBeenCalledWith(
				scope,
				"journal-2",
			);
		});
	});

	describe("tenant isolation", () => {
		it("looks the entry up inside the caller's tenant scope", async () => {
			vi.mocked(mockJournalRepository.findById).mockResolvedValue(
				createMockJournalEntry("borrador"),
			);
			vi.mocked(mockJournalRepository.delete).mockResolvedValue(undefined);

			await useCase.execute(scope, "journal-123");

			expect(mockJournalRepository.findById).toHaveBeenCalledWith(
				scope,
				"journal-123",
			);
		});

		it("does not delete an entry the scope cannot see (cross-tenant)", async () => {
			vi.mocked(mockJournalRepository.findById).mockResolvedValue(null);

			await expect(useCase.execute(scope, "foreign-entry")).rejects.toThrow(
				"Asiento no encontrado",
			);
			expect(mockJournalRepository.delete).not.toHaveBeenCalled();
		});
	});
});
