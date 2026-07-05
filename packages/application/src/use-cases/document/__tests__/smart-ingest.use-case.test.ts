import { Document } from "@drenyra/domain/entities/Document";
import type { DocumentRepository } from "@drenyra/domain/repositories/document.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	IDocumentSyncProcessor,
	IUBLInvoiceParser,
} from "../../../ports/document-processing.port";
import type { IStorageService } from "../../../ports/storage.port";
import { SmartIngestUseCase } from "../smart-ingest.use-case";

// Mock job-dispatcher module (direct import, must be hoisted)
vi.mock("../../../lib/job-dispatcher", () => ({
	dispatchDocumentProcessing: vi.fn(),
}));

// Import mocked module
import { dispatchDocumentProcessing } from "../../../lib/job-dispatcher";

const mockParseInvoice = vi.fn();
const mockProcessDocumentSync = vi.fn();

function createRepository(): DocumentRepository {
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

function createStorageService(): IStorageService {
	return {
		upload: vi.fn(),
		delete: vi.fn(),
		getSignedUrl: vi.fn(),
	};
}

function createServices() {
	return {
		syncProcessor: {
			processDocumentSync: mockProcessDocumentSync,
		} as unknown as IDocumentSyncProcessor,
		xmlParser: { parseInvoice: mockParseInvoice } as IUBLInvoiceParser,
	};
}

function createFile(
	name: string,
	type: "XML" | "PDF" | "IMAGE",
	content = "<invoice><total>118.00</total></invoice>",
): File {
	const blob = new Blob([content], { type: "application/octet-stream" });
	return Object.assign(blob, {
		name,
		lastModified: Date.now(),
		webkitRelativePath: "",
	}) as File;
}

const VALID_XML_PARSE_RESULT = {
	supplierRuc: "20100070970",
	supplierName: "Proveedor SAC",
	issueDate: "2026-02-28",
	id: "F001-1",
	subtotal: 100,
	igv: 18,
	totalAmount: 118,
	currency: "PEN",
};

const COMPANY_ID = "123e4567-e89b-12d3-a456-426614174000";
const CLIENT_ID = "223e4567-e89b-12d3-a456-426614174001";
const CLIENT_NAME = "ACME SAC";

describe("SmartIngestUseCase", () => {
	let repository: DocumentRepository;
	let storageService: IStorageService;
	let useCase: SmartIngestUseCase;
	let services: ReturnType<typeof createServices>;

	beforeEach(() => {
		repository = createRepository();
		storageService = createStorageService();
		services = createServices();
		useCase = new SmartIngestUseCase(repository, storageService, services);

		vi.mocked(storageService.upload).mockResolvedValue(
			"https://storage.test/documents/doc.xml",
		);
		vi.mocked(dispatchDocumentProcessing).mockResolvedValue(null);

		mockParseInvoice.mockReturnValue(VALID_XML_PARSE_RESULT);
		mockProcessDocumentSync.mockResolvedValue({
			success: true,
			documentId: "doc_1",
			source: "XML",
			processingTimeMs: 150,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("single file processing", () => {
		it("should process XML file via XML-First path", async () => {
			const file = createFile("invoice-f001-1.xml", "XML");
			const result = await useCase.execute({
				files: [{ file, fileName: "invoice-f001-1.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.totalFiles).toBe(1);
			expect(result.xmlProcessed).toBe(1);
			expect(result.ocrQueued).toBe(0);
			expect(result.errors).toBe(0);
			expect(result.costSaved).toBe(0.03);
			expect(result.documents).toHaveLength(1);
			expect(result.documents[0].source).toBe("XML");
			expect(result.documents[0].documentId).toBeTruthy();
		});

		it("should parse XML content and extract invoice data", async () => {
			const file = createFile("invoice.xml", "XML");
			await useCase.execute({
				files: [{ file, fileName: "invoice.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(mockParseInvoice).toHaveBeenCalledTimes(1);
			expect(mockParseInvoice).toHaveBeenCalledWith(
				"<invoice><total>118.00</total></invoice>",
			);
		});

		it("should upload XML to storage with correct options", async () => {
			const file = createFile("invoice.xml", "XML");
			await useCase.execute({
				files: [{ file, fileName: "invoice.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(vi.mocked(storageService.upload)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(storageService.upload)).toHaveBeenCalledWith(
				file,
				expect.objectContaining({
					folder: `documents/${CLIENT_ID}`,
					fileName: "invoice.xml",
					contentType: "application/xml",
				}),
			);
		});

		it("should save document with tenant scoping", async () => {
			const file = createFile("invoice.xml", "XML");
			await useCase.execute({
				files: [{ file, fileName: "invoice.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(vi.mocked(repository.saveForCompany)).toHaveBeenCalledTimes(1);
			expect(vi.mocked(repository.save)).not.toHaveBeenCalled();

			const [savedDocument, savedCompanyId] = vi.mocked(
				repository.saveForCompany,
			).mock.calls[0];
			expect(savedDocument).toBeInstanceOf(Document);
			expect(savedCompanyId).toBe(COMPANY_ID);
		});

		it("should create XML document with PENDING_VALIDATION status and extracted data", async () => {
			const file = createFile("invoice.xml", "XML");
			await useCase.execute({
				files: [{ file, fileName: "invoice.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			const [savedDocument] = vi.mocked(repository.saveForCompany).mock
				.calls[0] as [Document];
			expect(savedDocument.status).toBe("PENDING_VALIDATION");
			expect(savedDocument.fileType).toBe("XML");
			expect(savedDocument.clientId).toBe(CLIENT_ID);
			expect(savedDocument.clientName).toBe(CLIENT_NAME);
			expect(savedDocument.extractedData).toBeDefined();
			expect(savedDocument.extractedData?.providerRUC).toBe("20100070970");
			expect(savedDocument.extractedData?.totalAmount).toBe(118);
			expect(savedDocument.extractedData?.confidenceScore).toBe(100);
			expect(savedDocument.confidenceLevel).toBe("HIGH");
		});

		it("should queue PDF file for OCR processing", async () => {
			const file = createFile("invoice.pdf", "PDF");
			const result = await useCase.execute({
				files: [{ file, fileName: "invoice.pdf", fileType: "PDF" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.totalFiles).toBe(1);
			expect(result.xmlProcessed).toBe(0);
			expect(result.ocrQueued).toBe(1);
			expect(result.errors).toBe(0);
			expect(result.costSaved).toBe(0);
			expect(result.documents[0].source).toBe("OCR_QUEUED");
		});

		it("should create OCR document with UPLOADED status (no extracted data)", async () => {
			const file = createFile("invoice.pdf", "PDF");
			await useCase.execute({
				files: [{ file, fileName: "invoice.pdf", fileType: "PDF" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			const [savedDocument] = vi.mocked(repository.saveForCompany).mock
				.calls[0] as [Document];
			expect(savedDocument.status).toBe("UPLOADED");
			expect(savedDocument.extractedData).toBeUndefined();
			expect(savedDocument.confidenceLevel).toBeUndefined();
		});

		it("should process IMAGE file via OCR fallback", async () => {
			const file = createFile("receipt.jpg", "IMAGE");
			const result = await useCase.execute({
				files: [{ file, fileName: "receipt.jpg", fileType: "IMAGE" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.ocrQueued).toBe(1);
			expect(result.documents[0].source).toBe("OCR_QUEUED");
		});

		it("should call dispatchDocumentProcessing with userId = clientId", async () => {
			vi.mocked(dispatchDocumentProcessing).mockResolvedValue("job_123");
			const file = createFile("invoice.pdf", "PDF");
			await useCase.execute({
				files: [{ file, fileName: "invoice.pdf", fileType: "PDF" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(dispatchDocumentProcessing).toHaveBeenCalledTimes(1);
			const payload = vi.mocked(dispatchDocumentProcessing).mock.calls[0][0];
			expect(payload.userId).toBe(CLIENT_ID);
			expect(payload.userId).not.toBe("system");
		});
	});

	describe("XML + PDF grouping", () => {
		it("should process XML and attach PDF as attachment when both exist for same base name", async () => {
			const xmlFile = createFile("invoice-f001-1.xml", "XML");
			const pdfFile = createFile("invoice-f001-1.pdf", "PDF");

			const result = await useCase.execute({
				files: [
					{ file: xmlFile, fileName: "invoice-f001-1.xml", fileType: "XML" },
					{ file: pdfFile, fileName: "invoice-f001-1.pdf", fileType: "PDF" },
				],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			// 1 XML processed, PDF is attached not queued separately
			expect(result.xmlProcessed).toBe(1);
			expect(result.ocrQueued).toBe(0);
			expect(result.documents).toHaveLength(1);

			// PDF backup should also be uploaded
			expect(vi.mocked(storageService.upload)).toHaveBeenCalledTimes(2);
			expect(result.documents[0].attachments).toEqual(["invoice-f001-1.pdf"]);
		});

		it("should upload PDF backup alongside XML", async () => {
			const xmlFile = createFile("invoice.xml", "XML");
			const pdfFile = createFile("invoice.pdf", "PDF");

			await useCase.execute({
				files: [
					{ file: xmlFile, fileName: "invoice.xml", fileType: "XML" },
					{ file: pdfFile, fileName: "invoice.pdf", fileType: "PDF" },
				],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			// First upload: XML, Second upload: PDF
			const calls = vi.mocked(storageService.upload).mock.calls;
			expect(calls).toHaveLength(2);
			expect(calls[1][1]).toMatchObject({
				contentType: "application/pdf",
			});
		});
	});

	describe("sync processing fallback", () => {
		it("should call syncProcessor when dispatch returns null (no queue)", async () => {
			vi.mocked(dispatchDocumentProcessing).mockResolvedValue(null);

			const file = createFile("invoice.pdf", "PDF");
			await useCase.execute({
				files: [{ file, fileName: "invoice.pdf", fileType: "PDF" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(mockProcessDocumentSync).toHaveBeenCalledTimes(1);
			const syncPayload = mockProcessDocumentSync.mock.calls[0][0];
			expect(syncPayload.companyId).toBe(COMPANY_ID);
			expect(syncPayload.userId).toBe(CLIENT_ID);
			expect(syncPayload.fileType).toBe("PDF");
		});

		it("should NOT call syncProcessor when dispatch returns a job ID", async () => {
			vi.mocked(dispatchDocumentProcessing).mockResolvedValue("job_abc123");

			const file = createFile("invoice.pdf", "PDF");
			await useCase.execute({
				files: [{ file, fileName: "invoice.pdf", fileType: "PDF" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(mockProcessDocumentSync).not.toHaveBeenCalled();
		});
	});

	describe("multiple files", () => {
		it("should process multiple independent files", async () => {
			const files = [
				createFile("invoice-001.xml", "XML"),
				createFile("invoice-002.xml", "XML"),
				createFile("receipt-001.pdf", "PDF"),
			];

			const result = await useCase.execute({
				files: [
					{ file: files[0], fileName: "invoice-001.xml", fileType: "XML" },
					{ file: files[1], fileName: "invoice-002.xml", fileType: "XML" },
					{ file: files[2], fileName: "receipt-001.pdf", fileType: "PDF" },
				],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.totalFiles).toBe(3);
			expect(result.xmlProcessed).toBe(2);
			expect(result.ocrQueued).toBe(1);
			expect(result.errors).toBe(0);
			expect(result.costSaved).toBe(0.06); // 2 XMLs × $0.03
		});
	});

	describe("error handling", () => {
		it("should handle XML parse failure gracefully", async () => {
			mockParseInvoice.mockImplementation(() => {
				throw new Error("Invalid XML structure");
			});

			const file = createFile("bad.xml", "XML");
			const result = await useCase.execute({
				files: [{ file, fileName: "bad.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.errors).toBe(1);
			expect(result.xmlProcessed).toBe(0);
			expect(result.documents[0].source).toBe("ERROR");
			expect(result.documents[0].error).toBe("Invalid XML structure");
		});

		it("should handle storage upload failure gracefully", async () => {
			vi.mocked(storageService.upload).mockRejectedValue(
				new Error("Storage quota exceeded"),
			);

			const file = createFile("invoice.xml", "XML");
			const result = await useCase.execute({
				files: [{ file, fileName: "invoice.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.errors).toBe(1);
			expect(result.xmlProcessed).toBe(0);
			expect(result.documents[0].error).toBe("Storage quota exceeded");
		});

		it("should handle repository save failure gracefully", async () => {
			vi.mocked(repository.saveForCompany).mockRejectedValue(
				new Error("Database connection failed"),
			);

			const file = createFile("invoice.xml", "XML");
			const result = await useCase.execute({
				files: [{ file, fileName: "invoice.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.errors).toBe(1);
			expect(result.documents[0].source).toBe("ERROR");
		});

		it("should continue processing remaining files after an error", async () => {
			vi.mocked(storageService.upload).mockRejectedValueOnce(
				new Error("Upload failed"),
			);

			const xmlOk = createFile("good.xml", "XML");
			const xmlBad = createFile("bad.xml", "XML");

			const result = await useCase.execute({
				files: [
					{ file: xmlBad, fileName: "bad.xml", fileType: "XML" },
					{ file: xmlOk, fileName: "good.xml", fileType: "XML" },
				],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			expect(result.errors).toBe(1);
			expect(result.xmlProcessed).toBe(1);
			expect(result.documents).toHaveLength(2);

			const errorDocs = result.documents.filter((d) => d.source === "ERROR");
			const successDocs = result.documents.filter((d) => d.source === "XML");
			expect(errorDocs).toHaveLength(1);
			expect(successDocs).toHaveLength(1);
		});
	});

	describe("tenant isolation", () => {
		it("should use *ForCompany method for all saves", async () => {
			const xmlFile = createFile("invoice.xml", "XML");
			const pdfFile = createFile("receipt.pdf", "PDF");

			await useCase.execute({
				files: [
					{ file: xmlFile, fileName: "invoice.xml", fileType: "XML" },
					{ file: pdfFile, fileName: "receipt.pdf", fileType: "PDF" },
				],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			// saveForCompany called for each file (XML + PDF = 2)
			expect(vi.mocked(repository.saveForCompany)).toHaveBeenCalledTimes(2);
			expect(vi.mocked(repository.save)).not.toHaveBeenCalled();
			expect(vi.mocked(repository.update)).not.toHaveBeenCalled();
			expect(vi.mocked(repository.updateForCompany)).not.toHaveBeenCalled();
		});

		it("should pass companyId to saveForCompany for every document", async () => {
			const file = createFile("invoice.xml", "XML");
			await useCase.execute({
				files: [{ file, fileName: "invoice.xml", fileType: "XML" }],
				companyId: COMPANY_ID,
				clientId: CLIENT_ID,
				clientName: CLIENT_NAME,
			});

			const [, companyId] = vi.mocked(repository.saveForCompany).mock.calls[0];
			expect(companyId).toBe(COMPANY_ID);
		});
	});
});
