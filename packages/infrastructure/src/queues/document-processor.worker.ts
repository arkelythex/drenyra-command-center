/**
 * Document Processor Worker
 *
 * BullMQ worker that processes documents from the queue.
 * Implements XML-First strategy for cost optimization.
 */

import type { ExtractedData } from "@drenyra/domain/entities/Document";
import { Money } from "@drenyra/domain/value-objects/Money";
import { classifyExpense } from "@drenyra/infrastructure/ai/accounting-classifier.service";
import { extractInvoiceData } from "@drenyra/infrastructure/ai/ocr.service";
import { UBLParser } from "@drenyra/infrastructure/xml/ubl-parser";
import { DocumentRepositoryImpl } from "@drenyra/persistence/repositories/document.repository";
import { isValidRUC } from "@drenyra/shared/validation/ruc";
import { type Job, Worker } from "bullmq";
import { z } from "zod";
import { loggers } from "../logger";
import { validateWorkerScope } from "../workers/scope-validator";
import type {
	DocumentJobData,
	DocumentJobResult,
} from "./document-processor.queue";
import { getRedisConnection, isRedisConfigured } from "./redis";

let worker: Worker<DocumentJobData, DocumentJobResult> | null = null;

const QUEUE_NAME = "document-processing";
const PRIVATE_HOST_PATTERNS = [
	/^localhost$/i,
	/^127\./,
	/^10\./,
	/^192\.168\./,
	/^172\.(1[6-9]|2\d|3[0-1])\./,
	/^0\./,
	/^169\.254\./,
	/^::1$/i,
	/^fc/i,
	/^fd/i,
] as const;

function isSafeRemoteUrl(value: string): boolean {
	try {
		const url = new URL(value);
		if (url.protocol !== "https:" && url.protocol !== "http:") {
			return false;
		}

		const hostname = url.hostname.toLowerCase();
		return !PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
	} catch {
		return false;
	}
}

const documentFetchSchema = z.object({
	organizationId: z.string().min(1),
	companyId: z.string().min(1),
	documentId: z.string().min(1),
	fileUrl: z.string().url().refine(isSafeRemoteUrl, {
		message: "fileUrl must be a safe remote HTTP(S) URL",
	}),
	fileType: z.enum(["XML", "PDF", "IMAGE"]),
	fileName: z.string().min(1),
});

/**
 * Process a single document
 */
async function processDocument(
	job: Job<DocumentJobData>,
): Promise<DocumentJobResult> {
	const startTime = Date.now();
	const { organizationId, companyId, documentId, fileUrl, fileType, fileName } =
		documentFetchSchema.parse(job.data);

	// Perimeter security: validate scope before any business logic
	validateWorkerScope({ organizationId, companyId }, "tenant");

	loggers.worker.info("Processing document", { documentId, fileType });

	const repository = new DocumentRepositoryImpl();

	try {
		// Get document from DB
		const document = await repository.findByIdForCompany(documentId, companyId);
		if (!document) {
			throw new Error(`Document ${documentId} not found`);
		}

		// Update status to EXTRACTING
		const extractingDoc = document.startExtraction();
		await repository.updateForCompany(extractingDoc, companyId);

		interface ExtractedDocumentData {
			providerRUC?: string;
			providerName?: string;
			issueDate?: Date;
			documentNumber?: string;
			baseAmount?: Money;
			igvAmount?: Money;
			totalAmount?: Money;
			currency?: "PEN" | "USD";
			confidenceScore?: number;
			suggestedAccount?: string;
			suggestedAccountName?: string;
			classificationConfidence?: number;
		}

		function toMoney(
			value: number | undefined,
			currency: "PEN" | "USD",
		): Money | undefined {
			if (value === undefined) {
				return undefined;
			}

			return Money.fromAmount(value, currency);
		}

		function toExtractedDataPayload(
			data: ExtractedDocumentData,
		): ExtractedData {
			return {
				providerRUC: data.providerRUC,
				providerName: data.providerName,
				issueDate: data.issueDate,
				documentNumber: data.documentNumber,
				baseAmount: data.baseAmount,
				igvAmount: data.igvAmount,
				totalAmount: data.totalAmount,
				currency: data.currency,
				confidenceScore: data.confidenceScore,
			} as unknown as ExtractedData;
		}

		let extractedData: ExtractedDocumentData;
		let source: "XML" | "OCR";

		// XML-First Strategy: Process XML directly (free & fast)
		if (fileType === "XML") {
			loggers.worker.info("Parsing XML", { fileName });
			const parser = new UBLParser();

			// Fetch XML content
			const response = await fetch(fileUrl);
			const xmlContent = await response.text();

			const parsed = parser.parseInvoice(xmlContent);
			const currency = parsed.currency as "PEN" | "USD";

			extractedData = {
				providerRUC: parsed.supplierRuc,
				providerName: parsed.supplierName,
				issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
				documentNumber: parsed.id,
				baseAmount: toMoney(parsed.subtotal, currency),
				igvAmount: toMoney(parsed.igv, currency),
				totalAmount: toMoney(parsed.totalAmount, currency),
				currency,
				confidenceScore: 100, // XML is 100% accurate
			};
			source = "XML";
		} else {
			// PDF/Image: Use OCR (costs money)
			loggers.worker.info("Running OCR", { fileName });

			const ocrResult = await extractInvoiceData({
				imageUrl: fileType === "IMAGE" ? fileUrl : undefined,
				pdfUrl: fileType === "PDF" ? fileUrl : undefined,
			});

			if (!ocrResult.success || !ocrResult.data) {
				throw new Error(ocrResult.error || "OCR failed");
			}

			const data = ocrResult.data;
			const currency = data.currency as "PEN" | "USD";

			extractedData = {
				providerRUC: data.clientRuc || undefined,
				providerName: data.clientName,
				issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
				documentNumber:
					data.series && data.number
						? `${data.series}-${data.number}`
						: undefined,
				baseAmount: toMoney(data.base, currency),
				igvAmount: toMoney(data.igv, currency),
				totalAmount: toMoney(data.total, currency),
				currency,
				confidenceScore: data.confidence ? data.confidence * 100 : 80,
			};
			source = "OCR";
		}

		// Optional: Classify expense with AI
		if (extractedData.providerName) {
			try {
				const classificationAmount =
					extractedData.totalAmount ??
					Money.zero(extractedData.currency ?? "PEN");

				const classification = await classifyExpense({
					itemDescription: extractedData.providerName,
					amount: classificationAmount.toNumber(),
					businessType: "general", // Default classification until org settings are included in the worker payload.
				});

				if (classification) {
					extractedData.suggestedAccount = classification.accountCode;
					extractedData.suggestedAccountName = classification.accountName;
					extractedData.classificationConfidence = classification.confidence;
				}
			} catch (classifyError: unknown) {
				loggers.worker.warn("Classification failed", {
					documentId,
					error: classifyError,
				});
				// Continue without classification - not critical
			}
		}

		if (extractedData.providerRUC && !isValidRUC(extractedData.providerRUC)) {
			throw new Error(
				`Invalid supplier RUC extracted for document ${documentId}: ${extractedData.providerRUC}`,
			);
		}

		// Update document with extracted data
		const completedDoc = extractingDoc.completeExtraction(
			toExtractedDataPayload(extractedData),
		);
		await repository.updateForCompany(completedDoc, companyId);

		const processingTimeMs = Date.now() - startTime;

		loggers.worker.info("Document processed successfully", {
			documentId,
			source,
			processingTimeMs,
		});

		return {
			success: true,
			documentId,
			source,
			processingTimeMs,
		};
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		loggers.worker.error("Error processing document", {
			documentId,
			error: errorMessage,
		});

		// Mark document as error
		try {
			const document = await repository.findByIdForCompany(
				documentId,
				companyId,
			);
			if (document) {
				const errorDoc = document.markAsError(errorMessage);
				await repository.updateForCompany(errorDoc, companyId);
			}
		} catch (updateError: unknown) {
			loggers.worker.error("Failed to update error status", {
				documentId,
				error: updateError,
			});
		}

		return {
			success: false,
			documentId,
			source: fileType === "XML" ? "XML" : "OCR",
			processingTimeMs: Date.now() - startTime,
			error: errorMessage,
		};
	}
}

/**
 * Start the document processor worker
 * @returns Result of startWorker.
 * @example
 * ```ts
 * const result = startWorker();
 * console.log(result);
 * ```
 */

export function startWorker(): Worker<
	DocumentJobData,
	DocumentJobResult
> | null {
	if (!isRedisConfigured()) {
		loggers.worker.warn("Redis no configurado - Worker no iniciado");
		return null;
	}

	if (worker) {
		loggers.worker.info("Worker already running");
		return worker;
	}

	const connection = getRedisConnection();

	worker = new Worker<DocumentJobData, DocumentJobResult>(
		QUEUE_NAME,
		processDocument,
		{
			connection: connection as never,
			concurrency: 5, // Process 5 documents in parallel
			limiter: {
				max: 10,
				duration: 1000, // Max 10 jobs per second
			},
		},
	);

	worker.on(
		"completed",
		(job: Job<DocumentJobData>, result: DocumentJobResult) => {
			loggers.worker.info("Job completed", {
				jobId: job.id,
				source: result.source,
				processingTimeMs: result.processingTimeMs,
			});
		},
	);

	worker.on("failed", (job: Job<DocumentJobData> | undefined, err: Error) => {
		loggers.worker.error("Job failed", { jobId: job?.id, error: err.message });
	});

	worker.on("error", (err: Error) => {
		loggers.worker.error("Worker error", { error: err.message });
	});

	loggers.worker.info("Document processor worker started", { concurrency: 5 });

	return worker;
}

/**
 * Stop the worker
 * @returns Result of stopWorker.
 * @example
 * ```ts
 * const result = await stopWorker();
 * console.log(result);
 * ```
 */

export async function stopWorker(): Promise<void> {
	if (worker) {
		await (worker as unknown as { close: () => Promise<void> }).close();
		worker = null;
		loggers.worker.info("Document processor worker stopped");
	}
}

/**
 * Get worker status
 * @returns Result of isWorkerRunning.
 * @example
 * ```ts
 * const result = isWorkerRunning();
 * console.log(result);
 * ```
 */

export function isWorkerRunning(): boolean {
	return worker !== null;
}

/**
 * Process a document synchronously (when Redis is not available)
 * @param data - Input for data.
 * @returns Result of processDocumentSync.
 * @example
 * ```ts
 * const result = await processDocumentSync({} as DocumentJobData);
 * console.log(result);
 * ```
 */

export async function processDocumentSync(
	data: DocumentJobData,
): Promise<DocumentJobResult> {
	// Create a mock job for the processor
	const mockJob = {
		data,
		id: data.documentId,
		name: "process-document",
		updateProgress: async () => {},
	} as unknown as Job<DocumentJobData>;

	return processDocument(mockJob);
}
