import { Elysia } from "elysia";
import { batchUploadBodySchema, uploadBodySchema } from "../schemas";
import type { DocumentsRouteHandlers } from "./types";

/**
 * buildDocumentUploadRoutes operation.
 *
 * @param handlers - Input for handlers.
 * @returns Result of buildDocumentUploadRoutes.
 * @example
 * ```ts
 * const result = buildDocumentUploadRoutes({} as DocumentsRouteHandlers);
 * console.log(result);
 * ```
 */
export function buildDocumentUploadRoutes(handlers: DocumentsRouteHandlers) {
	return new Elysia()
		.post("/upload", handlers.uploadDocumentHandler as never, {
			body: uploadBodySchema,
			detail: {
				tags: ["Documents"],
				summary: "Upload single document",
				description:
					"Upload a single document (PDF, XML, or image) for OCR processing",
			},
		})
		.post("/batch-upload", handlers.batchUploadDocumentsHandler as never, {
			body: batchUploadBodySchema,
			detail: {
				tags: ["Documents"],
				summary: "Batch upload with Smart Ingest",
				description:
					"Upload multiple documents. XML files are processed immediately, PDF/images queued for OCR",
			},
		});
}
