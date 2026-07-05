import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteInvoiceUseCase } from "../delete-invoice.use-case";
import { createTestInvoice, TEST_IDS } from "./fixtures";

describe("DeleteInvoiceUseCase", () => {
	let mockRepository: InvoiceRepository;
	let useCase: DeleteInvoiceUseCase;

	beforeEach(() => {
		mockRepository = {
			save: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			findById: vi.fn(),
			findAll: vi.fn(),
			count: vi.fn(),
		};

		useCase = new DeleteInvoiceUseCase(mockRepository);
	});

	describe("Business Rules", () => {
		it("should delete DRAFT invoice successfully", async () => {
			// Arrange
			const draftInvoice = createTestInvoice({ status: "DRAFT" });
			mockRepository.findById = vi.fn().mockResolvedValue(draftInvoice);

			// Act
			await useCase.execute({ id: TEST_IDS.INVOICE_1 });

			// Assert
			expect(mockRepository.findById).toHaveBeenCalledWith(TEST_IDS.INVOICE_1);
			expect(mockRepository.delete).toHaveBeenCalledWith(TEST_IDS.INVOICE_1);
		});

		it("should delete CANCELLED invoice successfully", async () => {
			// Arrange
			const cancelledInvoice = createTestInvoice({ status: "CANCELLED" });
			mockRepository.findById = vi.fn().mockResolvedValue(cancelledInvoice);

			// Act
			await useCase.execute({ id: TEST_IDS.INVOICE_1 });

			// Assert
			expect(mockRepository.delete).toHaveBeenCalledWith(TEST_IDS.INVOICE_1);
		});

		it("should throw error when trying to delete SENT invoice", async () => {
			// Arrange
			const sentInvoice = createTestInvoice({ status: "SENT" });
			mockRepository.findById = vi.fn().mockResolvedValue(sentInvoice);

			// Act & Assert
			await expect(useCase.execute({ id: TEST_IDS.INVOICE_1 })).rejects.toThrow(
				"Nota de Crédito",
			);
			expect(mockRepository.delete).not.toHaveBeenCalled();
		});

		it("should throw error when trying to delete ACCEPTED invoice", async () => {
			// Arrange
			const acceptedInvoice = createTestInvoice({ status: "ACCEPTED" });
			mockRepository.findById = vi.fn().mockResolvedValue(acceptedInvoice);

			// Act & Assert
			await expect(useCase.execute({ id: TEST_IDS.INVOICE_1 })).rejects.toThrow(
				"Nota de Crédito",
			);
			expect(mockRepository.delete).not.toHaveBeenCalled();
		});

		it("should throw error when trying to delete PENDING invoice", async () => {
			// Arrange
			const pendingInvoice = createTestInvoice({ status: "PENDING" });
			mockRepository.findById = vi.fn().mockResolvedValue(pendingInvoice);

			// Act & Assert
			await expect(useCase.execute({ id: TEST_IDS.INVOICE_1 })).rejects.toThrow(
				"PENDING",
			);
			expect(mockRepository.delete).not.toHaveBeenCalled();
		});

		it("should throw error when invoice does not exist", async () => {
			// Arrange
			mockRepository.findById = vi.fn().mockResolvedValue(null);

			// Act & Assert
			await expect(
				useCase.execute({ id: TEST_IDS.NON_EXISTENT }),
			).rejects.toThrow("not found");
			expect(mockRepository.delete).not.toHaveBeenCalled();
		});
	});

	describe("Audit Trail", () => {
		it("should accept optional reason for deletion", async () => {
			// Arrange
			const draftInvoice = createTestInvoice({ status: "DRAFT" });
			mockRepository.findById = vi.fn().mockResolvedValue(draftInvoice);

			// Act
			await useCase.execute({
				id: TEST_IDS.INVOICE_1,
				reason: "Duplicate entry",
			});

			// Assert
			expect(mockRepository.delete).toHaveBeenCalledWith(TEST_IDS.INVOICE_1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle null id gracefully", async () => {
			// Act & Assert
			await expect(useCase.execute({ id: "" })).rejects.toThrow();
		});

		it("should handle invalid UUID format", async () => {
			// Act & Assert
			await expect(useCase.execute({ id: "invalid-id" })).rejects.toThrow();
		});
	});
});
