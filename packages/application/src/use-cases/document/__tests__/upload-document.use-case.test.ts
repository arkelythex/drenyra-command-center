import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UploadDocumentDTO } from "../../dtos/document/upload-document.dto";
import type { IStorageService } from "../../ports/storage.port";
import { Document } from "@arkelythex/domain/entities/Document";
import type { DocumentRepository } from "@arkelythex/domain/repositories/document.repository";
import { UploadDocumentUseCase } from "../upload-document.use-case";

describe("UploadDocumentUseCase", () => {
	let useCase: UploadDocumentUseCase;
	let mockDocumentRepository: DocumentRepository;
	let mockStorageService: IStorageService;

	const validClientId = "123e4567-e89b-12d3-a456-426614174000";
	const companyId = "123e4567-e89b-12d3-a456-426614174001";

	beforeEach(() => {
		mockDocumentRepository = {
			save: vi.fn(),
			saveForCompany: vi.fn(),
			update: vi.fn(),
			updateForCompany: vi.fn(),
			findById: vi.fn(),
			findByIdForCompany: vi.fn(),
			findAll: vi.fn(),
			count: vi.fn(),
		};

		mockStorageService = {
			upload: vi.fn(),
			delete: vi.fn(),
			getUrl: vi.fn(),
		} as unknown as IStorageService;

		useCase = new UploadDocumentUseCase(
			mockDocumentRepository,
			mockStorageService,
		);
	});

	it("uploads a File and persists it through the company path", async () => {
		const file = new File(["test content"], "invoice.pdf", {
			type: "application/pdf",
		});
		const uploadedFileUrl = "https://storage.example.com/documents/invoice.pdf";

		vi.mocked(mockStorageService.upload).mockResolvedValue(uploadedFileUrl);
		vi.mocked(mockDocumentRepository.saveForCompany).mockResolvedValue(undefined);

		const input: UploadDocumentDTO = {
			companyId,
			clientId: validClientId,
			clientName: "Acme Corp",
			file,
			fileName: "invoice.pdf",
			fileType: "PDF",
		};

		const result = await useCase.execute(input);

		expect(mockStorageService.upload).toHaveBeenCalledWith(file, {
			folder: `documents/${validClientId}`,
			fileName: "invoice.pdf",
		});
		expect(mockDocumentRepository.saveForCompany).toHaveBeenCalledTimes(1);
		expect(mockDocumentRepository.save).not.toHaveBeenCalled();

		const [savedDocument, receivedCompanyId] = vi
			.mocked(mockDocumentRepository.saveForCompany)
			.mock.calls[0];
		expect(savedDocument).toBeInstanceOf(Document);
		expect(receivedCompanyId).toBe(companyId);
		expect(savedDocument.clientId).toBe(validClientId);
		expect(savedDocument.fileUrl).toBe(uploadedFileUrl);
		expect(savedDocument.fileType).toBe("PDF");
		expect(savedDocument.fileSize).toBe(file.size);
		expect(savedDocument.status).toBe("UPLOADED");

		expect(result).toEqual({
			documentId: expect.any(String),
			fileUrl: uploadedFileUrl,
			status: "UPLOADED",
		});
	});

	it("uploads a Buffer and preserves its byte size", async () => {
		const buffer = Buffer.from("test xml content");
		const uploadedFileUrl = "https://storage.example.com/documents/factura.xml";

		vi.mocked(mockStorageService.upload).mockResolvedValue(uploadedFileUrl);
		vi.mocked(mockDocumentRepository.saveForCompany).mockResolvedValue(undefined);

		const input: UploadDocumentDTO = {
			companyId,
			clientId: validClientId,
			clientName: "Global Inc",
			file: buffer,
			fileName: "factura.xml",
			fileType: "XML",
		};

		await useCase.execute(input);

		const [savedDocument] = vi
			.mocked(mockDocumentRepository.saveForCompany)
			.mock.calls[0];
		expect(savedDocument.fileSize).toBe(buffer.length);
		expect(savedDocument.fileType).toBe("XML");
	});

	it("propagates repository errors after upload", async () => {
		const file = new File(["test"], "test.pdf");

		vi.mocked(mockStorageService.upload).mockResolvedValue(
			"https://example.com/file.pdf",
		);
		vi.mocked(mockDocumentRepository.saveForCompany).mockRejectedValue(
			new Error("Database connection failed"),
		);

		await expect(
			useCase.execute({
				companyId,
				clientId: validClientId,
				clientName: "Client",
				file,
				fileName: "test.pdf",
				fileType: "PDF",
			}),
		).rejects.toThrow("Database connection failed");
	});
});
