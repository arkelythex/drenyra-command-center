import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateInvoiceDTO } from "../../dtos/invoice/create-invoice.dto";
import { Invoice } from "@drenyra/domain/entities/Invoice";
import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import { CreateInvoiceUseCase } from "../create-invoice.use-case";
import { TEST_RUCS } from "./fixtures";

describe("CreateInvoiceUseCase", () => {
	let createInvoiceUseCase: CreateInvoiceUseCase;
	let mockInvoiceRepository: InvoiceRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		mockInvoiceRepository = {
			save: vi.fn(),
			saveForOrganization: vi.fn(),
			update: vi.fn(),
			updateForOrganization: vi.fn(),
			delete: vi.fn(),
			findById: vi.fn(),
			findAll: vi.fn(),
			count: vi.fn(),
		};
		createInvoiceUseCase = new CreateInvoiceUseCase(mockInvoiceRepository);
	});

	describe("Success Cases", () => {
		it("should process the DTO, create a domain Invoice, and call the repository to save it", async () => {
			// Arrange: Create a valid DTO with valid SUNAT RUC
			const dto: CreateInvoiceDTO = {
				series: "F001",
				number: 123,
				issueDate: new Date(),
				clientName: "Test Client",
				clientRUC: TEST_RUCS.SUNAT, // Valid SUNAT RUC
				currency: "PEN",
				items: [
					{
						description: "Test Item",
						quantity: 2,
						unitPrice: 10000, // 100.00 PEN in cents
					},
				],
			};

			// Act: Execute the use case
			await createInvoiceUseCase.execute(dto);

			// Assert
			// 1. Check if the repository's save method was called
			expect(mockInvoiceRepository.save).toHaveBeenCalledTimes(1);

			// 2. Check that it was called with an instance of the Invoice domain entity
			const saveMock = vi.mocked(mockInvoiceRepository.save);
			const savedInvoiceArg = saveMock.mock.calls[0]?.[0];
			expect(savedInvoiceArg).toBeInstanceOf(Invoice);

			// 3. Verify values on the created domain entity
			expect(savedInvoiceArg.clientName).toBe("Test Client");
			expect(savedInvoiceArg.series.toString()).toBe("F001");
			expect(savedInvoiceArg.totalAmount.getAmount()).toBe(23600); // 2 * 100 * 1.18
		});

		it("should create invoice with valid BCP RUC", async () => {
			// Arrange
			const dto: CreateInvoiceDTO = {
				series: "F001",
				number: 124,
				issueDate: new Date(),
				clientName: "Banco de Crédito del Perú",
				clientRUC: TEST_RUCS.BCP,
				currency: "PEN",
				items: [{ description: "Servicio", quantity: 1, unitPrice: 5000 }],
			};

			// Act
			await createInvoiceUseCase.execute(dto);

			// Assert
			expect(mockInvoiceRepository.save).toHaveBeenCalledTimes(1);
		});

		it("should use tenant-aware save path when organizationId is provided", async () => {
			const dto: CreateInvoiceDTO = {
				organizationId: 42,
				series: "F001",
				number: 129,
				issueDate: new Date(),
				clientName: "Tenant Scoped Client",
				clientRUC: TEST_RUCS.SUNAT,
				currency: "PEN",
				items: [{ description: "Servicio", quantity: 1, unitPrice: 5000 }],
			};

			await createInvoiceUseCase.execute(dto);

			expect(mockInvoiceRepository.saveForOrganization).toHaveBeenCalledTimes(1);
			expect(mockInvoiceRepository.save).not.toHaveBeenCalled();
			const saveForOrganizationMock = vi.mocked(
				mockInvoiceRepository.saveForOrganization,
			);
			expect(saveForOrganizationMock.mock.calls[0]?.[1]).toBe(
				42,
			);
		});
	});

	describe("Validation Errors", () => {
		it("should throw an error when missing RUC or DNI", async () => {
			// Arrange: Create an invalid DTO (missing both RUC and DNI)
			const invalidDto: CreateInvoiceDTO = {
				series: "F001",
				number: 124,
				issueDate: new Date(),
				clientName: "Invalid Client",
				currency: "PEN",
				items: [{ description: "Item", quantity: 1, unitPrice: 100 }],
			};

			// Act & Assert - Zod schema requires RUC or DNI
			await expect(createInvoiceUseCase.execute(invalidDto)).rejects.toThrow(
				/RUC|DNI/,
			);

			// Ensure save was not called if validation fails
			expect(mockInvoiceRepository.save).not.toHaveBeenCalled();
		});

		it("should throw error for invalid RUC format", async () => {
			// Arrange
			const invalidDto: CreateInvoiceDTO = {
				series: "F001",
				number: 125,
				issueDate: new Date(),
				clientName: "Test Client",
				clientRUC: "12345678901", // Invalid: wrong check digit
				currency: "PEN",
				items: [{ description: "Item", quantity: 1, unitPrice: 100 }],
			};

			// Act & Assert
			await expect(createInvoiceUseCase.execute(invalidDto)).rejects.toThrow();
			expect(mockInvoiceRepository.save).not.toHaveBeenCalled();
		});

		it("should throw error for empty items array", async () => {
			// Arrange
			const invalidDto: CreateInvoiceDTO = {
				series: "F001",
				number: 126,
				issueDate: new Date(),
				clientName: "Test Client",
				clientRUC: TEST_RUCS.SUNAT,
				currency: "PEN",
				items: [],
			};

			// Act & Assert
			await expect(createInvoiceUseCase.execute(invalidDto)).rejects.toThrow();
			expect(mockInvoiceRepository.save).not.toHaveBeenCalled();
		});
	});

	describe("Edge Cases", () => {
		it("should handle zero quantity gracefully", async () => {
			// Arrange
			const dto: CreateInvoiceDTO = {
				series: "F001",
				number: 127,
				issueDate: new Date(),
				clientName: "Test Client",
				clientRUC: TEST_RUCS.SUNAT,
				currency: "PEN",
				items: [{ description: "Item", quantity: 0, unitPrice: 100 }],
			};

			// Act & Assert
			await expect(createInvoiceUseCase.execute(dto)).rejects.toThrow();
		});

		it("should handle negative unit price gracefully", async () => {
			// Arrange
			const dto: CreateInvoiceDTO = {
				series: "F001",
				number: 128,
				issueDate: new Date(),
				clientName: "Test Client",
				clientRUC: TEST_RUCS.SUNAT,
				currency: "PEN",
				items: [{ description: "Item", quantity: 1, unitPrice: -100 }],
			};

			// Act & Assert
			await expect(createInvoiceUseCase.execute(dto)).rejects.toThrow();
		});
	});
});
