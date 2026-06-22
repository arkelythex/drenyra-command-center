/**
 * Smart Ingest DTOs
 *
 * DTOs for intelligent document ingestion with XML-First strategy.
 */

import { z } from "zod";

/**
 * Input for batch document upload
 * @example
 * ```ts
 * const value: BatchUploadDTO = {} as BatchUploadDTO;
 * console.log(value);
 * ```
 */

export interface BatchUploadDTO {
	files: Array<{
		file: File;
		fileName: string;
		fileType: "IMAGE" | "PDF" | "XML";
	}>;
	companyId: string;
	clientId: string;
	clientName: string;
}

/**
 * Result of smart ingestion
 * @example
 * ```ts
 * const value: SmartIngestResultDTO = {} as SmartIngestResultDTO;
 * console.log(value);
 * ```
 */

export interface SmartIngestResultDTO {
	totalFiles: number;
	xmlProcessed: number;
	ocrQueued: number;
	errors: number;
	costSaved: number; // Estimated cost saved by XML-First
	documents: Array<{
		documentId: string;
		fileName: string;
		source: "XML" | "OCR_QUEUED" | "ERROR";
		attachments?: string[]; // PDF attachments for XML
		error?: string;
	}>;
}

/**
 * Processing status for a document
 * @example
 * ```ts
 * const value: ProcessingStatusDTO = {} as ProcessingStatusDTO;
 * console.log(value);
 * ```
 */

export interface ProcessingStatusDTO {
	documentId: string;
	status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
	progress?: number; // 0-100
	result?: {
		source: "XML" | "OCR";
		extractedData?: Record<string, unknown>;
		classification?: {
			accountCode: string;
			accountName: string;
			confidence: number;
		};
	};
	error?: string;
	processingTimeMs?: number;
}

/**
 * Batch processing status
 * @example
 * ```ts
 * const value: BatchStatusDTO = {} as BatchStatusDTO;
 * console.log(value);
 * ```
 */

export interface BatchStatusDTO {
	batchId: string;
	totalDocuments: number;
	completed: number;
	processing: number;
	failed: number;
	waiting: number;
	estimatedTimeRemaining?: number; // seconds
	documents: ProcessingStatusDTO[];
}

/**
 * Webhook payload for processing completion
 * @example
 * ```ts
 * const value: ProcessingWebhookPayload = {} as ProcessingWebhookPayload;
 * console.log(value);
 * ```
 */

export interface ProcessingWebhookPayload {
	event: "document.processed" | "document.failed" | "batch.completed";
	timestamp: string;
	data: ProcessingStatusDTO | BatchStatusDTO;
}

const withDocumentTenant = <T extends z.ZodRawShape>(shape: T) =>
	z.object({
		companyId: z.string().uuid("Company ID inválido"),
		...shape,
	});

/**
 * Validation schema for batch upload
 * @example
 * ```ts
 * console.log(BatchUploadSchema);
 * ```
 */

export const BatchUploadSchema = withDocumentTenant({
	clientId: z.string().min(1, "ID de cliente requerido"),
	clientName: z.string().min(1, "Nombre de cliente requerido").max(255),
	files: z
		.array(
			z.object({
				fileName: z.string().min(1).max(255),
				fileType: z.enum(["IMAGE", "PDF", "XML"]),
			}),
		)
		.min(1, "Debe subir al menos un archivo")
		.max(100, "Máximo 100 archivos por lote"),
});

/**
 * BatchUploadInput type.
 *
 * @example
 * ```ts
 * const value: BatchUploadInput = {} as BatchUploadInput;
 * console.log(value);
 * ```
 */
export type BatchUploadInput = z.infer<typeof BatchUploadSchema>;
