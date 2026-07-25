import type { Invoice } from "@drenyra/domain/entities/Invoice";
import type { InvoiceRepository } from "@drenyra/domain/repositories/invoice.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetInvoiceDetailsUseCase } from "../get-invoice-details.use-case";
import { ListInvoicesUseCase } from "../list-invoices.use-case";
import { createTestInvoice, TEST_IDS } from "./fixtures";

describe("GetInvoiceDetailsUseCase", () => {
	let mockRepository: InvoiceRepository;
	let useCase: GetInvoiceDetailsUseCase;
	let sampleInvoice: Invoice;

	beforeEach(() => {
		sampleInvoice = createTestInvoice();

		mockRepository = {
			save: vi.fn(),
			saveForOrganization: vi.fn(),
			update: vi.fn(),
			updateForOrganization: vi.fn(),
			delete: vi.fn(),
			findById: vi.fn().mockResolvedValue(sampleInvoice),
			findAll: vi.fn(),
			count: vi.fn(),
		};

		useCase = new GetInvoiceDetailsUseCase(mockRepository);
	});

	const testScope = {
		organizationId: "org-1",
		companyId: "company-1",
	};

	it("should return invoice when it exists", async () => {
		// Act
		const result = await useCase.execute(testScope, TEST_IDS.INVOICE_1);

		// Assert
		expect(mockRepository.findById).toHaveBeenCalledWith(
			testScope,
			TEST_IDS.INVOICE_1,
		);
		expect(result).toBe(sampleInvoice);
		expect(result.id).toBe(TEST_IDS.INVOICE_1);
	});

	it("should throw error when invoice does not exist", async () => {
		// Arrange
		mockRepository.findById = vi.fn().mockResolvedValue(null);

		// Act & Assert
		await expect(
			useCase.execute(testScope, TEST_IDS.NON_EXISTENT),
		).rejects.toThrow("not found");
	});

	it("should throw error when ID does not match any invoice", async () => {
		// Arrange
		mockRepository.findById = vi.fn().mockResolvedValue(null);

		// Act & Assert
		await expect(useCase.execute(testScope, "any-id-format")).rejects.toThrow(
			"not found",
		);
	});
});

describe("ListInvoicesUseCase", () => {
	let mockRepository: InvoiceRepository;
	let useCase: ListInvoicesUseCase;
	let sampleInvoices: Invoice[];

	beforeEach(() => {
		sampleInvoices = [
			createTestInvoice({
				id: TEST_IDS.INVOICE_1,
				number: 1,
				clientName: "Client A",
				baseAmount: 1000,
			}),
			createTestInvoice({
				id: TEST_IDS.INVOICE_2,
				number: 2,
				clientName: "Client B",
				status: "SENT",
				baseAmount: 2000,
			}),
		];

		mockRepository = {
			save: vi.fn(),
			saveForOrganization: vi.fn(),
			update: vi.fn(),
			updateForOrganization: vi.fn(),
			delete: vi.fn(),
			findById: vi.fn(),
			findAll: vi.fn().mockResolvedValue(sampleInvoices),
			count: vi.fn().mockResolvedValue(2),
		};

		useCase = new ListInvoicesUseCase(mockRepository);
	});

	describe("Pagination", () => {
		it("should return paginated results with default values", async () => {
			// Act
			const result = await useCase.execute({});

			// Assert
			expect(result.page).toBe(1);
			expect(result.limit).toBe(20);
			expect(result.total).toBe(2);
			expect(result.totalPages).toBe(1);
			expect(result.invoices).toHaveLength(2);
		});

		it("should respect custom page and limit", async () => {
			// Act
			const result = await useCase.execute({
				page: 2,
				limit: 1,
			});

			// Assert
			expect(result.page).toBe(2);
			expect(result.limit).toBe(1);
			// With 2 invoices and limit 1, page 2 should have 1 invoice
			expect(result.invoices).toHaveLength(1);
		});

		it("should calculate total pages correctly", async () => {
			// Arrange
			mockRepository.count = vi.fn().mockResolvedValue(25);

			// Act
			const result = await useCase.execute({
				limit: 10,
			});

			// Assert
			expect(result.totalPages).toBe(3); // 25 / 10 = 3 pages
		});

		it("should return empty array for page beyond data", async () => {
			// Arrange
			mockRepository.findAll = vi.fn().mockResolvedValue([]);
			mockRepository.count = vi.fn().mockResolvedValue(2);

			// Act
			const result = await useCase.execute({
				page: 100,
				limit: 10,
			});

			// Assert
			expect(result.invoices).toHaveLength(0);
		});
	});

	describe("Sorting", () => {
		it("should sort by issue date ascending", async () => {
			// Act
			const result = await useCase.execute({
				sortBy: "issueDate",
				sortOrder: "asc",
			});

			// Assert
			expect(result.invoices[0].id).toBe(TEST_IDS.INVOICE_1);
			expect(result.invoices[1].id).toBe(TEST_IDS.INVOICE_2);
		});

		it("should sort by issue date descending", async () => {
			// Arrange - reverse order for desc
			mockRepository.findAll = vi
				.fn()
				.mockResolvedValue([...sampleInvoices].reverse());

			// Act
			const result = await useCase.execute({
				sortBy: "issueDate",
				sortOrder: "desc",
			});

			// Assert
			expect(result.invoices[0].id).toBe(TEST_IDS.INVOICE_2);
			expect(result.invoices[1].id).toBe(TEST_IDS.INVOICE_1);
		});

		it("should sort by total amount", async () => {
			// Act
			const result = await useCase.execute({
				sortBy: "totalAmount",
				sortOrder: "desc",
			});

			// Assert - the use case sorts in memory
			expect(result.invoices[0].totalAmount).toBeGreaterThan(
				result.invoices[1].totalAmount,
			);
		});

		it("should sort by client name", async () => {
			// Act
			const result = await useCase.execute({
				sortBy: "clientName",
				sortOrder: "asc",
			});

			// Assert
			expect(result.invoices[0].clientName).toBe("Client A");
			expect(result.invoices[1].clientName).toBe("Client B");
		});
	});

	describe("Filtering", () => {
		it("should pass filters to repository", async () => {
			// Arrange
			const filters = {
				status: "DRAFT" as const,
				clientName: "Test",
				series: "F001",
			};

			// Act
			await useCase.execute(filters);

			// Assert
			expect(mockRepository.findAll).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "DRAFT",
					clientName: "Test",
					series: "F001",
				}),
			);
		});

		it("should filter by date range", async () => {
			// Arrange
			const filters = {
				dateFrom: new Date("2024-01-01"),
				dateTo: new Date("2024-12-31"),
			};

			// Act
			await useCase.execute(filters);

			// Assert
			expect(mockRepository.findAll).toHaveBeenCalledWith(
				expect.objectContaining({
					dateFrom: filters.dateFrom,
					dateTo: filters.dateTo,
				}),
			);
		});
	});

	describe("Response Mapping", () => {
		it("should map invoices to DTOs", async () => {
			// Act
			const result = await useCase.execute({});

			// Assert
			expect(result.invoices[0]).toHaveProperty("id");
			expect(result.invoices[0]).toHaveProperty("series");
			expect(result.invoices[0]).toHaveProperty("totalAmount");
			expect(typeof result.invoices[0].totalAmount).toBe("number");
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty result set", async () => {
			// Arrange
			mockRepository.findAll = vi.fn().mockResolvedValue([]);
			mockRepository.count = vi.fn().mockResolvedValue(0);

			// Act
			const result = await useCase.execute({});

			// Assert
			expect(result.invoices).toHaveLength(0);
			expect(result.total).toBe(0);
			expect(result.totalPages).toBe(0);
		});

		it("should use default page 1 for undefined page", async () => {
			// Act
			const result = await useCase.execute({ page: undefined });

			// Assert
			expect(result.page).toBe(1);
		});

		it("should use default limit 20 for undefined limit", async () => {
			// Act
			const result = await useCase.execute({ limit: undefined });

			// Assert
			expect(result.limit).toBe(20);
		});
	});
});
