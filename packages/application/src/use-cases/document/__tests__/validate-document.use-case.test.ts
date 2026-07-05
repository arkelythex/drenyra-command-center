import { beforeEach, describe, expect, it, vi } from "vitest";
import { Document } from "@drenyra/domain/entities/Document";
import type { DocumentRepository } from "@drenyra/domain/repositories/document.repository";
import { NotFoundError } from "@drenyra/shared/errors";
import { ValidateDocumentUseCase } from "../validate-document.use-case";

function createMockDocument(
	overrides: Partial<Parameters<typeof Document.create>[0]> = {},
) {
	return Document.create({
		id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
		clientId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
		clientName: "Test Client",
		fileName: "invoice.pdf",
		fileUrl: "https://example.com/invoice.pdf",
		fileType: "PDF",
		fileSize: 1024,
		status: "PENDING_VALIDATION",
		extractedData: {
			providerRUC: "20123456789",
			providerName: "Proveedor SAC",
			totalAmount: 1180,
		},
		confidenceLevel: "HIGH",
		uploadedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	});
}

function createMockRepository(): DocumentRepository {
	return {
		save: vi.fn(),
		saveForCompany: vi.fn(),
		update: vi.fn(),
		updateForCompany: vi.fn(),
		findById: vi.fn(),
		findByIdForCompany: vi.fn(),
		findAll: vi.fn(),
		count: vi.fn(),
	};
}

describe("ValidateDocumentUseCase", () => {
	let useCase: ValidateDocumentUseCase;
	let mockRepo: DocumentRepository;
	const companyId = "123e4567-e89b-12d3-a456-426614174001";

	beforeEach(() => {
		mockRepo = createMockRepository();
		useCase = new ValidateDocumentUseCase(mockRepo);
	});

	it("throws NotFoundError when the document does not exist", async () => {
		vi.mocked(mockRepo.findByIdForCompany).mockResolvedValue(null);

		await expect(
			useCase.execute({
				companyId,
				documentId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
				validatedBy: "user-123",
			}),
		).rejects.toThrow(NotFoundError);

		expect(mockRepo.findByIdForCompany).toHaveBeenCalledWith(
			"c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
			companyId,
		);
	});

	it("validates the document through the company-scoped path", async () => {
		vi.mocked(mockRepo.findByIdForCompany).mockResolvedValue(createMockDocument());
		vi.mocked(mockRepo.updateForCompany).mockResolvedValue(undefined);

		await useCase.execute({
			companyId,
			documentId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			validatedBy: "user-123",
			notes: "Verificado con documento físico",
		});

		expect(mockRepo.updateForCompany).toHaveBeenCalledWith(
			expect.any(Document),
			companyId,
		);
		const updatedDoc = vi.mocked(mockRepo.updateForCompany).mock.calls[0][0];
		expect(updatedDoc.status).toBe("VALIDATED");
		expect(updatedDoc.validatedBy).toBe("user-123");
	});

	it("applies corrected data before validating", async () => {
		vi.mocked(mockRepo.findByIdForCompany).mockResolvedValue(
			createMockDocument({
				extractedData: {
					providerRUC: "20123456789",
					providerName: "Proveedor Original",
					totalAmount: 1000,
				},
			}),
		);
		vi.mocked(mockRepo.updateForCompany).mockResolvedValue(undefined);

		await useCase.execute({
			companyId,
			documentId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			validatedBy: "user-123",
			correctedData: {
				providerName: "Proveedor Corregido SAC",
				totalAmount: 1180,
			},
		});

		const updatedDoc = vi.mocked(mockRepo.updateForCompany).mock.calls[0][0];
		expect(updatedDoc.extractedData.providerName).toBe("Proveedor Corregido SAC");
		expect(updatedDoc.extractedData.totalAmount).toBe(1180);
		expect(updatedDoc.status).toBe("VALIDATED");
	});
});
