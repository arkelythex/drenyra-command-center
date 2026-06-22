/**
 * Smart Ingest Use Case
 *
 * Implements XML-First strategy for cost optimization:
 * 1. Groups files by base name
 * 2. Prioritizes XML over PDF/Image
 * 3. Attaches PDF as visual backup for XML
 * 4. Only queues OCR for files without XML
 */
import type {
	BatchUploadDTO,
	SmartIngestResultDTO,
} from "../../dtos/document/smart-ingest.dto";
import type { IStorageService } from "../../ports/storage.port";
import type {
	IDocumentSyncProcessor,
	IUBLInvoiceParser,
} from "../../ports/document-processing.port";
import { Document } from "@arkelythex/domain/entities/Document";
import type { DocumentRepository } from "@arkelythex/domain/repositories/document.repository";
import { dispatchDocumentProcessing } from "../../lib/job-dispatcher";
import { saveDocumentWithTenant } from "./support/document-tenant";

interface FileGroup {
	baseName: string;
	xml?: { file: File; fileName: string };
	pdf?: { file: File; fileName: string };
	image?: { file: File; fileName: string };
}

/**
 * SmartIngestUseCase class.
 *
 * @example
 * ```ts
 * const value = new SmartIngestUseCase();
 * console.log(value);
 * ```
 */
export class SmartIngestUseCase {
	constructor(
		private readonly documentRepository: DocumentRepository,
		private readonly storageService: IStorageService,
		private readonly services: {
			syncProcessor: IDocumentSyncProcessor;
			xmlParser: IUBLInvoiceParser;
		},
	) {}

	async execute(input: BatchUploadDTO): Promise<SmartIngestResultDTO> {
		const result: SmartIngestResultDTO = {
			totalFiles: input.files.length,
			xmlProcessed: 0,
			ocrQueued: 0,
			errors: 0,
			costSaved: 0,
			documents: [],
		};

		// Group files by base name
		const groups = this.groupFilesByBaseName(input.files);

		for (const group of groups.values()) {
			try {
				if (group.xml) {
					// XML-FIRST: Process XML directly (free & fast)
					const xmlResult = await this.processXML(
						group.xml.file,
						group.xml.fileName,
						input,
						input.clientId,
						input.clientName,
						group.pdf?.file, // Attach PDF as backup
					);

					result.documents.push({
						documentId: xmlResult.documentId,
						fileName: group.xml.fileName,
						source: "XML",
						attachments: group.pdf ? [group.pdf.fileName] : undefined,
					});

					result.xmlProcessed++;
					result.costSaved += 0.03; // Estimated OCR cost saved
				} else if (group.pdf || group.image) {
					// FALLBACK: Queue for OCR processing
					const file = (group.pdf || group.image)!;
					const fileType = group.pdf ? "PDF" : "IMAGE";

					const queueResult = await this.queueForOCR(
						file.file,
						file.fileName,
						fileType as "PDF" | "IMAGE",
						input,
						input.clientId,
						input.clientName,
					);

					result.documents.push({
						documentId: queueResult.documentId,
						fileName: file.fileName,
						source: "OCR_QUEUED",
					});

					result.ocrQueued++;
				}
			} catch (error) {
				const fileName =
					group.xml?.fileName ||
					group.pdf?.fileName ||
					group.image?.fileName ||
					"unknown";
				result.errors++;
				result.documents.push({
					documentId: "",
					fileName,
					source: "ERROR",
					error: error instanceof Error ? error.message : "Error desconocido",
				});
			}
		}

		console.info(
			`[SmartIngest] Processed: ${result.xmlProcessed} XML, ${result.ocrQueued} queued for OCR, ${result.errors} errors`,
		);
		console.info(
			`[SmartIngest] Estimated cost saved: $${result.costSaved.toFixed(2)}`,
		);

		return result;
	}

	/**
	 * Group files by their base name (without extension)
	 */
	private groupFilesByBaseName(
		files: Array<{
			file: File;
			fileName: string;
			fileType: "IMAGE" | "PDF" | "XML";
		}>,
	): Map<string, FileGroup> {
		const groups = new Map<string, FileGroup>();

		for (const { file, fileName, fileType } of files) {
			// Extract base name without extension
			const baseName = fileName
				.replace(/\.(xml|pdf|jpg|jpeg|png|gif)$/i, "")
				.toLowerCase();

			const existing = groups.get(baseName) || { baseName };

			switch (fileType) {
				case "XML":
					existing.xml = { file, fileName };
					break;
				case "PDF":
					existing.pdf = { file, fileName };
					break;
				case "IMAGE":
					existing.image = { file, fileName };
					break;
			}

			groups.set(baseName, existing);
		}

		return groups;
	}

	/**
	 * Process XML file directly (free, fast, 100% accurate)
	 */
	private async processXML(
		file: File,
		fileName: string,
		tenant: { companyId: string },
		clientId: string,
		clientName: string,
		pdfBackup?: File,
	): Promise<{ documentId: string }> {
		// Read XML content
		const xmlContent = await file.text();

		// Parse XML
		const parsed = this.services.xmlParser.parseInvoice(xmlContent);

		// Upload XML to storage
		const fileUrl = await this.storageService.upload(file, {
			folder: `documents/${clientId}`,
			fileName,
			contentType: "application/xml",
		});

		// Upload PDF backup if exists
		if (pdfBackup) {
			await this.storageService.upload(pdfBackup, {
				folder: `documents/${clientId}`,
				fileName: pdfBackup.name,
				contentType: "application/pdf",
			});
		}

		// Create document with extracted data
		const documentId = crypto.randomUUID();
		const document = Document.create({
			id: documentId,
			clientId,
			clientName,
			fileName,
			fileUrl,
			fileType: "XML",
			fileSize: file.size,
			status: "PENDING_VALIDATION", // XML goes directly to validation
			extractedData: {
				providerRUC: parsed.supplierRuc,
				providerName: parsed.supplierName,
				issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
				documentNumber: parsed.id,
				baseAmount: parsed.subtotal,
				igvAmount: parsed.igv,
				totalAmount: parsed.totalAmount,
				currency: parsed.currency as "PEN" | "USD",
				confidenceScore: 100, // XML is 100% accurate
			},
			confidenceLevel: "HIGH",
			uploadedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.saveDocument(document, tenant);

		return { documentId };
	}

	/**
	 * Queue document for OCR processing
	 */
	private async queueForOCR(
		file: File,
		fileName: string,
		fileType: "PDF" | "IMAGE",
		tenant: { companyId: string },
		clientId: string,
		clientName: string,
	): Promise<{ documentId: string }> {
		// Upload file to storage first
		const fileUrl = await this.storageService.upload(file, {
			folder: `documents/${clientId}`,
			fileName,
		});

		// Create document record
		const documentId = crypto.randomUUID();
		const document = Document.create({
			id: documentId,
			clientId,
			clientName,
			fileName,
			fileUrl,
			fileType,
			fileSize: file.size,
			status: "UPLOADED",
			uploadedAt: new Date(),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await this.saveDocument(document, tenant);

		// Dispatch for processing (Inngest or BullMQ based on feature flag)
		const jobId = await dispatchDocumentProcessing({
			companyId: tenant.companyId,
			documentId,
			fileUrl,
			fileType,
			fileName,
			clientId,
			userId: clientId, // Track until auth context provides real userId
		});

		if (jobId === null) {
			// BullMQ mode + Redis not available - process synchronously
			console.info(
				`[SmartIngest] Processing ${documentId} synchronously (no Redis)`,
			);

			await this.services.syncProcessor.processDocumentSync({
				companyId: tenant.companyId,
				documentId,
				fileUrl,
				fileType,
				fileName,
				clientId,
				userId: clientId,
				timestamp: Date.now(),
			});
		}

		return { documentId };
	}

	private async saveDocument(
		document: Document,
		tenant: { companyId: string },
	): Promise<void> {
		await saveDocumentWithTenant(this.documentRepository, document, tenant);
	}
}
