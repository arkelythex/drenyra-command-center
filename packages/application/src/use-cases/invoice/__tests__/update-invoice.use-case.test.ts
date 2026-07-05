import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import { UpdateInvoiceUseCase } from "../update-invoice.use-case";
import { createTestInvoice, TEST_IDS, TEST_RUCS } from "./fixtures";

describe("UpdateInvoiceUseCase", () => {
	let mockRepository: InvoiceRepository;
	let useCase: UpdateInvoiceUseCase;

	beforeEach(() => {
		mockRepository = {
			save: vi.fn(),
			saveForOrganization: vi.fn(),
			update: vi.fn(),
			updateForOrganization: vi.fn(),
			delete: vi.fn(),
			findById: vi.fn().mockResolvedValue(createTestInvoice()),
			findAll: vi.fn(),
			count: vi.fn(),
		};

		useCase = new UpdateInvoiceUseCase(mockRepository);
	});

	describe("Business Rules", () => {
		it("should update invoice successfully when status is DRAFT", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
				clientName: "Updated Client Name",
			};

			// Act
			await useCase.execute(updates);

			// Assert
			expect(mockRepository.findById).toHaveBeenCalledWith(TEST_IDS.INVOICE_1);
			expect(mockRepository.update).toHaveBeenCalled();
		});

		it("should use tenant-aware update path when organizationId is provided", async () => {
			const updates = {
				id: TEST_IDS.INVOICE_1,
				organizationId: 42,
				clientName: "Updated Client Name",
			};

			await useCase.execute(updates);

			expect(mockRepository.updateForOrganization).toHaveBeenCalled();
			expect(mockRepository.update).not.toHaveBeenCalled();
			const updateForOrganizationMock = vi.mocked(
				mockRepository.updateForOrganization,
			);
			expect(updateForOrganizationMock.mock.calls[0]?.[1]).toBe(
				42,
			);
		});

		it("should throw error when invoice does not exist", async () => {
			// Arrange
			mockRepository.findById = vi.fn().mockResolvedValue(null);
			const updates = {
				id: TEST_IDS.NON_EXISTENT,
				clientName: "Test",
			};

			// Act & Assert
			await expect(useCase.execute(updates)).rejects.toThrow("not found");
		});

		it("should throw error when trying to update SENT invoice", async () => {
			// Arrange
			const sentInvoice = createTestInvoice({ status: "SENT" });
			mockRepository.findById = vi.fn().mockResolvedValue(sentInvoice);

			const updates = {
				id: TEST_IDS.INVOICE_1,
				clientName: "Updated Name",
			};

			// Act & Assert
			await expect(useCase.execute(updates)).rejects.toThrow(
				"cannot be modified",
			);
		});

		it("should recalculate totals when items are updated", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
				items: [
					{
						description: "New Product",
						quantity: 2,
						unitPrice: 500,
					},
				],
			};

			// Act
			await useCase.execute(updates);

			// Assert
			expect(mockRepository.update).toHaveBeenCalled();
			const updateMock = vi.mocked(mockRepository.update);
			const updatedInvoice = updateMock.mock.calls[0]?.[0];

			// Total should be 2 * 500 * 1.18 = 1180
			expect(updatedInvoice.totalAmount.getAmount()).toBe(1180);
		});

		it("should preserve existing values for non-updated fields", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
				clientName: "New Name",
			};

			// Act
			await useCase.execute(updates);

			// Assert
			const updateMock = vi.mocked(mockRepository.update);
			const updatedInvoice = updateMock.mock.calls[0]?.[0];
			expect(updatedInvoice.series.toString()).toBe("F001");
			expect(updatedInvoice.number).toBe(1);
		});
	});

	describe("Validation", () => {
		it("should validate RUC when updating clientRUC", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
				clientRUC: "invalid-ruc",
			};

			// Act & Assert
			await expect(useCase.execute(updates)).rejects.toThrow();
		});

		it("should allow updating to valid RUC", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
				clientRUC: TEST_RUCS.SUNAT,
			};

			// Act
			await useCase.execute(updates);

			// Assert
			expect(mockRepository.update).toHaveBeenCalled();
		});

		it("should reject invalid UUID", async () => {
			// Arrange
			const updates = {
				id: "not-a-uuid",
				clientName: "Test",
			};

			// Act & Assert
			await expect(useCase.execute(updates)).rejects.toThrow();
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty update object (only id)", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
			};

			// Act
			await useCase.execute(updates);

			// Assert - should still call update with existing values
			expect(mockRepository.update).toHaveBeenCalled();
		});

		it("should handle clearing clientAddress", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
				clientAddress: "",
			};

			// Act
			await useCase.execute(updates);

			// Assert
			expect(mockRepository.update).toHaveBeenCalled();
		});

		it("should handle undefined optional fields", async () => {
			// Arrange
			const updates = {
				id: TEST_IDS.INVOICE_1,
				dueDate: undefined,
			};

			// Act
			await useCase.execute(updates);

			// Assert
			expect(mockRepository.update).toHaveBeenCalled();
		});
	});
});
