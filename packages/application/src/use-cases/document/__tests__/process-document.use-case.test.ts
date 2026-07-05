import { Document } from "@drenyra/domain/entities/Document";
import type { DocumentRepository } from "@drenyra/domain/repositories/document.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	IExpenseClassifier,
	IInvoiceOCRService,
	IUBLInvoiceParser,
} from "../../../ports/document-processing.port";
import { ProcessDocumentUseCase } from "../process-document.use-case";

const parseInvoice = vi.fn();
const extractInvoiceData = vi.fn();
const classifyExpense = vi.fn();
const quickClassify = vi.fn();

function createDocument(status: "UPLOADED" | "EXTRACTING" = "UPLOADED") {
	return Document.create({
		id: "doc_1",
		clientId: "123e4567-e89b-12d3-a456-426614174000",
		clientName: "ACME SAC",
		fileName: "invoice.xml",
		fileUrl: "https://example.com/invoice.xml",
		fileType: "XML",
		fileSize: 1024,
		status,
		uploadedAt: new Date("2026-02-28T10:00:00.000Z"),
		createdAt: new Date("2026-02-28T10:00:00.000Z"),
		updatedAt: new Date("2026-02-28T10:00:00.000Z"),
	});
}

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

function createServices(): {
	xmlParser: IUBLInvoiceParser;
	ocrService: IInvoiceOCRService;
	expenseClassifier: IExpenseClassifier;
} {
	return {
		xmlParser: { parseInvoice },
		ocrService: { extractInvoiceData },
		expenseClassifier: {
			classifyExpense,
			quickClassify,
		},
	};
}

describe("ProcessDocumentUseCase", () => {
	let repository: DocumentRepository;
	let useCase: ProcessDocumentUseCase;

	beforeEach(() => {
		repository = createRepository();
		useCase = new ProcessDocumentUseCase(repository, createServices());

		parseInvoice.mockReturnValue({
			supplierRuc: "20100070970",
			supplierName: "Proveedor SAC",
			issueDate: "2026-02-28",
			id: "F001-1",
			subtotal: 100,
			igv: 18,
			totalAmount: 118,
			currency: "PEN",
		});

		classifyExpense.mockResolvedValue(null);
		quickClassify.mockReturnValue({
			accountCode: "6311",
			accountName: "Servicios",
		});
		extractInvoiceData.mockReset();

		globalThis.fetch = vi.fn().mockResolvedValue({
			text: async () => "<Invoice />",
		}) as typeof fetch;
	});

	it("uses company-scoped repository methods during processing", async () => {
		const companyId = "123e4567-e89b-12d3-a456-426614174042";
		repository.findByIdForCompany = vi.fn().mockResolvedValue(createDocument());
		repository.updateForCompany = vi.fn().mockResolvedValue(undefined);

		const result = await useCase.execute({
			companyId,
			documentId: "doc_1",
			fileUrl: "https://example.com/invoice.xml",
			fileType: "XML",
		});

		expect(result.success).toBe(true);
		expect(repository.findByIdForCompany).toHaveBeenCalledWith(
			"doc_1",
			companyId,
		);
		expect(repository.updateForCompany).toHaveBeenCalledTimes(2);
		expect(repository.updateForCompany).toHaveBeenNthCalledWith(
			1,
			expect.any(Document),
			companyId,
		);
		expect(repository.updateForCompany).toHaveBeenNthCalledWith(
			2,
			expect.any(Document),
			companyId,
		);
		expect(result.evidenceBundle).toBeDefined();
		expect(result.evidenceBundle?.scope.companyId).toBe(companyId);
		expect(result.deterministicValidationRequest?.scope.companyId).toBe(
			companyId,
		);
		expect(repository.update).not.toHaveBeenCalled();
		expect(repository.findById).not.toHaveBeenCalled();
	});

	it("marks the document as error through the company path on failure", async () => {
		const companyId = "123e4567-e89b-12d3-a456-426614174042";
		repository.findByIdForCompany = vi
			.fn()
			.mockResolvedValueOnce(createDocument())
			.mockResolvedValueOnce(createDocument("EXTRACTING"));
		repository.updateForCompany = vi.fn().mockResolvedValue(undefined);
		parseInvoice.mockImplementation(() => {
			throw new Error("XML invalido");
		});

		const result = await useCase.execute({
			companyId,
			documentId: "doc_1",
			fileUrl: "https://example.com/invoice.xml",
			fileType: "XML",
		});

		expect(result.success).toBe(false);
		expect(result.error).toBe("XML invalido");
		expect(repository.findByIdForCompany).toHaveBeenCalledTimes(2);
		expect(repository.updateForCompany).toHaveBeenCalledTimes(2);
	});
});
