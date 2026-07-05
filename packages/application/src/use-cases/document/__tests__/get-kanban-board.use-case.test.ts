/**
 * Get Kanban Board Use Case Tests
 * Comprehensive tests for Kanban board aggregation (0% → 100% coverage)
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Document } from "@drenyra/domain/entities/Document";
import type { DocumentRepository } from "@drenyra/domain/repositories/document.repository";
import { GetKanbanBoardUseCase } from "../get-kanban-board.use-case";

describe("GetKanbanBoardUseCase", () => {
	let useCase: GetKanbanBoardUseCase;
	let mockDocumentRepository: DocumentRepository;

	beforeEach(() => {
		mockDocumentRepository = {
			save: vi.fn(),
			saveForCompany: vi.fn(),
			updateForCompany: vi.fn(),
			findById: vi.fn(),
			findByIdForCompany: vi.fn(),
			findAll: vi.fn(),
			update: vi.fn(),
			count: vi.fn(),
		} as unknown as DocumentRepository;

		useCase = new GetKanbanBoardUseCase(mockDocumentRepository);
	});

	const createMockDocument = (
		overrides: Partial<ConstructorParameters<typeof Document.create>[0]> = {},
	) => {
		return Document.create({
			id: crypto.randomUUID(),
			clientId: "123e4567-e89b-12d3-a456-426614174000",
			clientName: "Test Client",
			fileName: "test.pdf",
			fileUrl: "https://example.com/test.pdf",
			fileType: "PDF",
			fileSize: 1024,
			status: "UPLOADED",
			uploadedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
			...overrides,
		});
	};

	describe("execute", () => {
		it("should return empty Kanban board when no documents exist", async () => {
			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result).toEqual({
				porProcesar: [],
				revisionHumana: [],
				listoParaSIRE: [],
				rechazadoPorSIRE: [],
				counts: {
					porProcesar: 0,
					revisionHumana: 0,
					listoParaSIRE: 0,
					rechazadoPorSIRE: 0,
					total: 0,
				},
			});

			expect(mockDocumentRepository.findAll).toHaveBeenCalledTimes(1);
			expect(mockDocumentRepository.findAll).toHaveBeenCalledWith(
				{ companyId: "123e4567-e89b-12d3-a456-426614174001" },
			);
		});

		it("should prefer company-scoped reads when companyId is provided", async () => {
			const companyId = "123e4567-e89b-12d3-a456-426614174001";
			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue(
				[],
			);

			const result = await useCase.execute({ companyId });

			expect(result.counts.total).toBe(0);
			expect(mockDocumentRepository.findAll).toHaveBeenCalledTimes(1);
			expect(mockDocumentRepository.findAll).toHaveBeenCalledWith(
				{ companyId },
			);
		});

		it("should organize UPLOADED documents in porProcesar", async () => {
			const uploadedDoc = createMockDocument({ status: "UPLOADED" });

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([uploadedDoc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.porProcesar).toHaveLength(1);
			expect(result.porProcesar[0].status).toBe("UPLOADED");
			expect(result.counts.porProcesar).toBe(1);
			expect(result.counts.total).toBe(1);
		});

		it("should organize EXTRACTING documents in porProcesar", async () => {
			const extractingDoc = createMockDocument({ status: "EXTRACTING" });

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([extractingDoc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.porProcesar).toHaveLength(1);
			expect(result.porProcesar[0].status).toBe("EXTRACTING");
			expect(result.counts.porProcesar).toBe(1);
		});

		it("should organize PENDING_VALIDATION documents in revisionHumana", async () => {
			const pendingDoc = createMockDocument({ status: "PENDING_VALIDATION" });

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([pendingDoc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.revisionHumana).toHaveLength(1);
			expect(result.revisionHumana[0].status).toBe("PENDING_VALIDATION");
			expect(result.counts.revisionHumana).toBe(1);
			expect(result.counts.total).toBe(1);
		});

		it("should organize VALIDATED documents in listoParaSIRE", async () => {
			const validatedDoc = createMockDocument({ status: "VALIDATED" });

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([validatedDoc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.listoParaSIRE).toHaveLength(1);
			expect(result.listoParaSIRE[0].status).toBe("VALIDATED");
			expect(result.counts.listoParaSIRE).toBe(1);
		});

		it("should organize REJECTED documents in rechazadoPorSIRE", async () => {
			const rejectedDoc = createMockDocument({ status: "REJECTED" });

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([rejectedDoc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.rechazadoPorSIRE).toHaveLength(1);
			expect(result.rechazadoPorSIRE[0].status).toBe("REJECTED");
			expect(result.counts.rechazadoPorSIRE).toBe(1);
		});

		it("should organize documents across multiple columns", async () => {
			const uploadedDoc = createMockDocument({
				status: "UPLOADED",
				fileName: "uploaded.pdf",
			});
			const extractingDoc = createMockDocument({
				status: "EXTRACTING",
				fileName: "extracting.pdf",
			});
			const pendingDoc = createMockDocument({
				status: "PENDING_VALIDATION",
				fileName: "pending.pdf",
			});
			const validatedDoc = createMockDocument({
				status: "VALIDATED",
				fileName: "validated.pdf",
			});
			const rejectedDoc = createMockDocument({
				status: "REJECTED",
				fileName: "rejected.pdf",
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([
				uploadedDoc,
				extractingDoc,
				pendingDoc,
				validatedDoc,
				rejectedDoc,
			]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.porProcesar).toHaveLength(2); // UPLOADED + EXTRACTING
			expect(result.revisionHumana).toHaveLength(1);
			expect(result.listoParaSIRE).toHaveLength(1);
			expect(result.rechazadoPorSIRE).toHaveLength(1);
			expect(result.counts.total).toBe(5);
		});

		it("should calculate counts correctly", async () => {
			const docs = [
				createMockDocument({ status: "UPLOADED" }),
				createMockDocument({ status: "UPLOADED" }),
				createMockDocument({ status: "EXTRACTING" }),
				createMockDocument({ status: "PENDING_VALIDATION" }),
				createMockDocument({ status: "PENDING_VALIDATION" }),
				createMockDocument({ status: "PENDING_VALIDATION" }),
				createMockDocument({ status: "VALIDATED" }),
				createMockDocument({ status: "REJECTED" }),
			];

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue(docs);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.counts.porProcesar).toBe(3); // 2 UPLOADED + 1 EXTRACTING
			expect(result.counts.revisionHumana).toBe(3);
			expect(result.counts.listoParaSIRE).toBe(1);
			expect(result.counts.rechazadoPorSIRE).toBe(1);
			expect(result.counts.total).toBe(8);
		});
	});

	describe("client filtering", () => {
		const clientId1 = "123e4567-e89b-12d3-a456-426614174000";
		const clientId2 = "abc12345-e89b-12d3-a456-426614174999";

		it("should filter documents by client ID", async () => {
			const client1Doc1 = createMockDocument({
				clientId: clientId1,
				status: "UPLOADED",
			});
			const client1Doc2 = createMockDocument({
				clientId: clientId1,
				status: "PENDING_VALIDATION",
			});
			const client2Doc = createMockDocument({
				clientId: clientId2,
				status: "UPLOADED",
			});

			vi.mocked(mockDocumentRepository.findAll).mockImplementation(async (filters) =>
				[client1Doc1, client1Doc2, client2Doc].filter(
					(doc) => !filters.clientId || doc.clientId === filters.clientId,
				),
			);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001", clientId: clientId1 });

			expect(result.porProcesar).toHaveLength(1);
			expect(result.porProcesar[0].clientId).toBe(clientId1);
			expect(result.revisionHumana).toHaveLength(1);
			expect(result.revisionHumana[0].clientId).toBe(clientId1);
			expect(result.counts.total).toBe(2);
			expect(mockDocumentRepository.findAll).toHaveBeenCalledWith({
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: clientId1,
			});
		});

		it("should return all documents when no client ID provided", async () => {
			const doc1 = createMockDocument({
				clientId: clientId1,
				status: "UPLOADED",
			});
			const doc2 = createMockDocument({
				clientId: clientId2,
				status: "UPLOADED",
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([doc1, doc2]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.porProcesar).toHaveLength(2);
			expect(result.counts.total).toBe(2);
		});

		it("should return empty result when client has no documents", async () => {
			const otherClientDoc = createMockDocument({
				clientId: clientId2,
				status: "UPLOADED",
			});

			vi.mocked(mockDocumentRepository.findAll).mockImplementation(async (filters) =>
				[otherClientDoc].filter(
					(doc) => !filters.clientId || doc.clientId === filters.clientId,
				),
			);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001", clientId: clientId1 });

			expect(result.porProcesar).toHaveLength(0);
			expect(result.counts.total).toBe(0);
		});
	});

	describe("DTO mapping", () => {
		it("should map document entity to DTO correctly", async () => {
			const doc = createMockDocument({
				id: "doc-123",
				clientId: "client-456",
				clientName: "Acme Corp",
				fileName: "invoice.pdf",
				fileUrl: "https://example.com/invoice.pdf",
				fileType: "PDF",
				status: "UPLOADED",
				confidenceLevel: 95,
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([doc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			const mappedDoc = result.porProcesar[0];
			expect(mappedDoc.id).toBe("doc-123");
			expect(mappedDoc.clientId).toBe("client-456");
			expect(mappedDoc.clientName).toBe("Acme Corp");
			expect(mappedDoc.fileName).toBe("invoice.pdf");
			expect(mappedDoc.fileUrl).toBe("https://example.com/invoice.pdf");
			expect(mappedDoc.fileType).toBe("PDF");
			expect(mappedDoc.status).toBe("UPLOADED");
			expect(mappedDoc.confidenceLevel).toBe(95);
		});

		it("should format dates as ISO strings", async () => {
			const uploadedAt = new Date("2025-01-15T10:30:00Z");
			const doc = createMockDocument({
				status: "UPLOADED",
				uploadedAt,
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([doc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.porProcesar[0].uploadedAt).toBe("2025-01-15T10:30:00.000Z");
		});

		it("should handle optional processedAt date", async () => {
			const processedAt = new Date("2025-01-15T12:00:00Z");
			const doc = createMockDocument({
				status: "VALIDATED",
				processedAt,
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([doc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.listoParaSIRE[0].processedAt).toBe(
				"2025-01-15T12:00:00.000Z",
			);
		});

		it("should handle optional validatedAt date", async () => {
			const validatedAt = new Date("2025-01-15T14:00:00Z");
			const doc = createMockDocument({
				status: "VALIDATED",
				validatedAt,
				validatedBy: "user-123",
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([doc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.listoParaSIRE[0].validatedAt).toBe(
				"2025-01-15T14:00:00.000Z",
			);
			expect(result.listoParaSIRE[0].validatedBy).toBe("user-123");
		});

		it("should handle document with extracted data", async () => {
			const issueDate = new Date("2025-01-01");
			const doc = createMockDocument({
				status: "PENDING_VALIDATION",
				extractedData: {
					series: "F001",
					number: 123,
					clientRuc: "20512345678",
					total: 100000,
					igv: 18000,
					currency: "PEN",
					issueDate,
				},
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([doc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.revisionHumana[0].extractedData).toEqual({
				series: "F001",
				number: 123,
				clientRuc: "20512345678",
				total: 100000,
				igv: 18000,
				currency: "PEN",
				issueDate: issueDate.toISOString(),
			});
		});

		it("should handle document without extracted data", async () => {
			const doc = createMockDocument({
				status: "UPLOADED",
			});

			vi.mocked(mockDocumentRepository.findAll).mockResolvedValue([doc]);

			const result = await useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" });

			expect(result.porProcesar[0].extractedData).toBeUndefined();
		});
	});

	describe("error handling", () => {
		it("should propagate repository errors", async () => {
			vi.mocked(mockDocumentRepository.findAll).mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" })).rejects.toThrow(
				"Database connection failed",
			);
		});

		it("should handle partial repository failures", async () => {
			vi.mocked(mockDocumentRepository.findAll).mockRejectedValue(
				new Error("Query failed"),
			);

			await expect(useCase.execute({ companyId: "123e4567-e89b-12d3-a456-426614174001" })).rejects.toThrow("Query failed");
		});
	});
});
