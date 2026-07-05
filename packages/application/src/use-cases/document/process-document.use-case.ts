/**
 * Process Document Use Case
 *
 * Processes a single document (OCR extraction + AI classification).
 * Used by the queue worker for async processing.
 */

import type { ExtractedData } from "@drenyra/domain/entities/Document";
import type { DocumentRepository } from "@drenyra/domain/repositories/document.repository";
import {
	type IExpenseClassifier,
	type IInvoiceOCRService,
	type IUBLInvoiceParser,
} from "../../ports/document-processing.port";
import {
	findDocumentByTenant,
	updateDocumentWithTenant,
} from "./support/document-tenant";

/**
 * ProcessDocumentInput interface.
 *
 * @example
 * ```ts
 * const value: ProcessDocumentInput = {} as ProcessDocumentInput;
 * console.log(value);
 * ```
 */
export interface ProcessDocumentInput {
	companyId: string;
	documentId: string;
	fileUrl: string;
	fileType: "IMAGE" | "PDF" | "XML";
}

/**
 * ProcessDocumentResult interface.
 *
 * @example
 * ```ts
 * const value: ProcessDocumentResult = {} as ProcessDocumentResult;
 * console.log(value);
 * ```
 */
export interface ProcessDocumentResult {
	success: boolean;
	documentId: string;
	source: "XML" | "OCR";
	evidenceBundle?: {
		scope: {
			companyId: string;
			documentId: string;
		};
		evidenceType: "document_extraction";
	};
	deterministicValidationRequest?: {
		scope: {
			companyId: string;
			documentId: string;
		};
		payload: {
			ruc?: string;
			totalAmount?: number;
			igvAmount?: number;
		};
	};
	extractedData?: ExtractedData & {
		suggestedAccount?: string;
		suggestedAccountName?: string;
		classificationConfidence?: number;
	};
	processingTimeMs: number;
	error?: string;
}

/**
 * Orchestrates the processing pipeline for an individual document.
 *
 * @description This use case handles the transition of a document through several
 * critical phases: initial status update (EXTRACTING), raw data extraction via
 * OCR or XML parsing, AI-based accounting classification, and final status
 * persistence. It is designed to be resilient, providing fallbacks for AI
 * failures and ensuring high observability through detailed result reporting.
 *
 * @see {@link DocumentRepository} for persistence logic.
 * @see {@link UBLParser} for XML extraction.
 * @since 1.1.0
 * @example
 * ```ts
 * const value = new ProcessDocumentUseCase();
 * console.log(value);
 * ```
 */

export class ProcessDocumentUseCase {
	/**
	 * Creates an instance of ProcessDocumentUseCase.
	 *
	 * @param {DocumentRepository} documentRepository - The repository for document persistence and state management.
	 */
	constructor(
		private readonly documentRepository: DocumentRepository,
		private readonly services: {
			expenseClassifier: IExpenseClassifier;
			ocrService: IInvoiceOCRService;
			xmlParser: IUBLInvoiceParser;
		},
	) {}

	/**
	 * Executes the document processing workflow.
	 *
	 * @description Steps:
	 * 1. Fetches metadata from repository.
	 * 2. Moves status to `EXTRACTING`.
	 * 3. Dispatches to either XML or OCR pipeline.
	 * 4. Enriches with AI accounting classification (account codes/names).
	 * 5. Persists the final extracted state.
	 *
	 * @param {ProcessDocumentInput} input - Contains the document ID, file URL, and detected file type.
	 * @param {string} input.documentId - Unique identifier of the document in DB.
	 * @param {string} input.fileUrl - Public or signed URL for file access.
	 * @param {'IMAGE' | 'PDF' | 'XML'} input.fileType - Detected format for specialized processing.
	 *
	 * @returns {Promise<ProcessDocumentResult>} A structured result indicating success, processing time, and extracted data.
	 *
	 * @throws {Error} If the document is not found in the repository.
	 *
	 * @example
	 * const useCase = new ProcessDocumentUseCase(repo);
	 * const result = await useCase.execute({
	 *   documentId: 'uuid-123',
	 *   fileUrl: 'https://cdn.com/inv.xml',
	 *   fileType: 'XML'
	 * });
	 * if (result.success) console.info(result.extractedData.totalAmount);
	 */
	async execute(input: ProcessDocumentInput): Promise<ProcessDocumentResult> {
		const startTime = Date.now();

		try {
			// Get document from DB
			const document = await findDocumentByTenant(
				this.documentRepository,
				input.documentId,
				input,
			);
			if (!document) {
				throw new Error(`Documento ${input.documentId} no encontrado`);
			}

			// Update status to EXTRACTING
			const extractingDoc = document.startExtraction();
			await updateDocumentWithTenant(
				this.documentRepository,
				extractingDoc,
				input,
			);

			let extractedData: ExtractedData & {
				suggestedAccount?: string;
				suggestedAccountName?: string;
				classificationConfidence?: number;
			};
			let source: "XML" | "OCR";

			// Process based on file type
			if (input.fileType === "XML") {
				extractedData = await this.processXML(input.fileUrl);
				source = "XML";
			} else {
				extractedData = await this.processOCR(input.fileUrl, input.fileType);
				source = "OCR";
			}

			// Add AI classification
			await this.addClassification(extractedData);

			// Complete extraction
			const completedDoc = extractingDoc.completeExtraction(extractedData);
			await updateDocumentWithTenant(
				this.documentRepository,
				completedDoc,
				input,
			);

			const processingTimeMs = Date.now() - startTime;

			return {
				success: true,
				documentId: input.documentId,
				source,
				evidenceBundle: {
					scope: { companyId: input.companyId, documentId: input.documentId },
					evidenceType: "document_extraction",
				},
				deterministicValidationRequest: {
					scope: { companyId: input.companyId, documentId: input.documentId },
					payload: {
						ruc: extractedData.providerRUC,
						totalAmount: extractedData.totalAmount,
						igvAmount: extractedData.igvAmount,
					},
				},
				extractedData,
				processingTimeMs,
			};
		} catch (error) {
			const processingTimeMs = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : "Error desconocido";

			// Mark document as error
			try {
				const document = await findDocumentByTenant(
					this.documentRepository,
					input.documentId,
					input,
				);
				if (document) {
					const errorDoc = document.markAsError(errorMessage);
					await updateDocumentWithTenant(
						this.documentRepository,
						errorDoc,
						input,
					);
				}
			} catch {
				// fail closed: keep original processing error as authoritative result
			}

			return {
				success: false,
				documentId: input.documentId,
				source: input.fileType === "XML" ? "XML" : "OCR",
				processingTimeMs,
				error: errorMessage,
			};
		}
	}

	/**
	 * Process XML file
	 */
	private async processXML(fileUrl: string): Promise<ExtractedData> {
		const response = await fetch(fileUrl);
		const xmlContent = await response.text();

		const parsed = this.services.xmlParser.parseInvoice(xmlContent);

		return {
			providerRUC: parsed.supplierRuc,
			providerName: parsed.supplierName,
			issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
			documentNumber: parsed.id,
			baseAmount: parsed.subtotal,
			igvAmount: parsed.igv,
			totalAmount: parsed.totalAmount,
			currency: parsed.currency as "PEN" | "USD",
			confidenceScore: 100,
		};
	}

	/**
	 * Process image/PDF with OCR
	 */
	private async processOCR(
		fileUrl: string,
		fileType: "IMAGE" | "PDF",
	): Promise<ExtractedData> {
		const ocrResult = await this.services.ocrService.extractInvoiceData({
			imageUrl: fileType === "IMAGE" ? fileUrl : undefined,
			pdfUrl: fileType === "PDF" ? fileUrl : undefined,
		});

		if (!ocrResult.success || !ocrResult.data) {
			throw new Error(ocrResult.error || "Error en OCR");
		}

		const data = ocrResult.data;

		return {
			providerRUC: data.clientRuc || undefined,
			providerName: data.clientName,
			issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
			documentNumber:
				data.series && data.number
					? `${data.series}-${data.number}`
					: undefined,
			baseAmount: data.base,
			igvAmount: data.igv,
			totalAmount: data.total,
			currency: data.currency as "PEN" | "USD",
			confidenceScore: data.confidence ? data.confidence * 100 : 80,
		};
	}

	/**
	 * Add AI classification to extracted data
	 */
	private async addClassification(
		extractedData: ExtractedData & {
			suggestedAccount?: string;
			suggestedAccountName?: string;
			classificationConfidence?: number;
		},
	): Promise<void> {
		if (!extractedData.providerName) return;

		try {
			// Try AI classification
			const classification =
				await this.services.expenseClassifier.classifyExpense({
					itemDescription: extractedData.providerName,
					amount: extractedData.totalAmount || 0,
				});

			if (classification) {
				extractedData.suggestedAccount = classification.accountCode;
				extractedData.suggestedAccountName = classification.accountName;
				extractedData.classificationConfidence = classification.confidence;
				return;
			}
		} catch {
			// advisory AI failure should not block deterministic fallback classification
		}

		// Fallback to rule-based classification
		const fallback = this.services.expenseClassifier.quickClassify(
			extractedData.providerName,
		);
		extractedData.suggestedAccount = fallback.accountCode;
		extractedData.suggestedAccountName = fallback.accountName;
		extractedData.classificationConfidence = 0.7; // Lower confidence for rule-based
	}
}
