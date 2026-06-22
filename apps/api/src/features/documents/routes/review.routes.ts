import { Elysia } from "elysia";
import {
	idParamsSchema,
	rejectBodySchema,
	rejectParamsSchema,
	updateStatusBodySchema,
	validateBodySchema,
	validateParamsSchema,
} from "../schemas";
import type { DocumentsRouteHandlers } from "./types";

/**
 * buildDocumentReviewRoutes operation.
 *
 * @param handlers - Input for handlers.
 * @returns Result of buildDocumentReviewRoutes.
 * @example
 * ```ts
 * const result = buildDocumentReviewRoutes({} as DocumentsRouteHandlers);
 * console.log(result);
 * ```
 */
export function buildDocumentReviewRoutes(handlers: DocumentsRouteHandlers) {
	return new Elysia()
		.post("/validate/:id", handlers.validateDocumentHandler as never, {
			params: validateParamsSchema,
			body: validateBodySchema,
			detail: {
				tags: ["Documents"],
				summary: "Validate/correct OCR results",
				description: "Approve OCR extraction or provide corrections",
			},
		})
		.post("/reject/:id", handlers.rejectDocumentHandler as never, {
			params: rejectParamsSchema,
			body: rejectBodySchema,
			detail: {
				tags: ["Documents"],
				summary: "Reject document",
				description: "Mark document as rejected with reason",
			},
		})
		.patch("/:id/status", handlers.updateDocumentStatusHandler as never, {
			params: idParamsSchema,
			body: updateStatusBodySchema,
			detail: {
				tags: ["Documents"],
				summary: "Update document status",
				description: "Bulk status updates (approve/reject)",
			},
		});
}
