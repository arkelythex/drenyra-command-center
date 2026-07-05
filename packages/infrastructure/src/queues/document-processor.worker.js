import { Money } from "@drenyra/domain/value-objects/Money";
import { classifyExpense } from "@drenyra/infrastructure/ai/accounting-classifier.service";
import { extractInvoiceData } from "@drenyra/infrastructure/ai/ocr.service";
import { UBLParser } from "@drenyra/infrastructure/xml/ubl-parser";
import { DocumentRepositoryImpl } from "@drenyra/persistence/repositories/document.repository";
import { isValidRUC } from "@drenyra/shared/validation/ruc";
import { Worker } from "bullmq";
import { z } from "zod";
import { loggers } from "../logger";
import { getRedisConnection, isRedisConfigured } from "./redis";

let worker = null;
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
];
function isSafeRemoteUrl(value) {
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
	companyId: z.string().min(1),
	documentId: z.string().min(1),
	fileUrl: z.string().url().refine(isSafeRemoteUrl, {
		message: "fileUrl must be a safe remote HTTP(S) URL",
	}),
	fileType: z.enum(["XML", "PDF", "IMAGE"]),
	fileName: z.string().min(1),
});
async function processDocument(job) {
	const startTime = Date.now();
	const { companyId, documentId, fileUrl, fileType, fileName } =
		documentFetchSchema.parse(job.data);
	loggers.worker.info("Processing document", { documentId, fileType });
	const repository = new DocumentRepositoryImpl();
	try {
		const document = await repository.findByIdForCompany(documentId, companyId);
		if (!document) {
			throw new Error(`Document ${documentId} not found`);
		}
		const extractingDoc = document.startExtraction();
		await repository.updateForCompany(extractingDoc, companyId);
		function toMoney(value, currency) {
			if (value === undefined) {
				return undefined;
			}
			return Money.fromAmount(value, currency);
		}
		function toExtractedDataPayload(data) {
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
			};
		}
		let extractedData;
		let source;
		if (fileType === "XML") {
			loggers.worker.info("Parsing XML", { fileName });
			const parser = new UBLParser();
			const response = await fetch(fileUrl);
			const xmlContent = await response.text();
			const parsed = parser.parseInvoice(xmlContent);
			const currency = parsed.currency;
			extractedData = {
				providerRUC: parsed.supplierRuc,
				providerName: parsed.supplierName,
				issueDate: parsed.issueDate ? new Date(parsed.issueDate) : undefined,
				documentNumber: parsed.id,
				baseAmount: toMoney(parsed.subtotal, currency),
				igvAmount: toMoney(parsed.igv, currency),
				totalAmount: toMoney(parsed.totalAmount, currency),
				currency,
				confidenceScore: 100,
			};
			source = "XML";
		} else {
			loggers.worker.info("Running OCR", { fileName });
			const ocrResult = await extractInvoiceData({
				imageUrl: fileType === "IMAGE" ? fileUrl : undefined,
				pdfUrl: fileType === "PDF" ? fileUrl : undefined,
			});
			if (!ocrResult.success || !ocrResult.data) {
				throw new Error(ocrResult.error || "OCR failed");
			}
			const data = ocrResult.data;
			const currency = data.currency;
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
		if (extractedData.providerName) {
			try {
				const classificationAmount =
					extractedData.totalAmount ??
					Money.zero(extractedData.currency ?? "PEN");
				const classification = await classifyExpense({
					itemDescription: extractedData.providerName,
					amount: classificationAmount.toNumber(),
					businessType: "general",
				});
				if (classification) {
					extractedData.suggestedAccount = classification.accountCode;
					extractedData.suggestedAccountName = classification.accountName;
					extractedData.classificationConfidence = classification.confidence;
				}
			} catch (classifyError) {
				loggers.worker.warn("Classification failed", {
					documentId,
					error: classifyError,
				});
			}
		}
		if (extractedData.providerRUC && !isValidRUC(extractedData.providerRUC)) {
			throw new Error(
				`Invalid supplier RUC extracted for document ${documentId}: ${extractedData.providerRUC}`,
			);
		}
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
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		loggers.worker.error("Error processing document", {
			documentId,
			error: errorMessage,
		});
		try {
			const document = await repository.findByIdForCompany(
				documentId,
				companyId,
			);
			if (document) {
				const errorDoc = document.markAsError(errorMessage);
				await repository.updateForCompany(errorDoc, companyId);
			}
		} catch (updateError) {
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
export function startWorker() {
	if (!isRedisConfigured()) {
		loggers.worker.warn("Redis no configurado - Worker no iniciado");
		return null;
	}
	if (worker) {
		loggers.worker.info("Worker already running");
		return worker;
	}
	const connection = getRedisConnection();
	worker = new Worker(QUEUE_NAME, processDocument, {
		connection: connection,
		concurrency: 5,
		limiter: {
			max: 10,
			duration: 1000,
		},
	});
	worker.on("completed", (job, result) => {
		loggers.worker.info("Job completed", {
			jobId: job.id,
			source: result.source,
			processingTimeMs: result.processingTimeMs,
		});
	});
	worker.on("failed", (job, err) => {
		loggers.worker.error("Job failed", { jobId: job?.id, error: err.message });
	});
	worker.on("error", (err) => {
		loggers.worker.error("Worker error", { error: err.message });
	});
	loggers.worker.info("Document processor worker started", { concurrency: 5 });
	return worker;
}
export async function stopWorker() {
	if (worker) {
		await worker.close();
		worker = null;
		loggers.worker.info("Document processor worker stopped");
	}
}
export function isWorkerRunning() {
	return worker !== null;
}
export async function processDocumentSync(data) {
	const mockJob = {
		data,
		id: data.documentId,
		name: "process-document",
		updateProgress: async () => {},
	};
	return processDocument(mockJob);
}
//# sourceMappingURL=document-processor.worker.js.map
