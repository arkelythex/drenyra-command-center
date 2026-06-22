import { Elysia } from "elysia";
import { idParamsSchema, listQuerySchema } from "../schemas";
import type { DocumentsRouteHandlers } from "./types";

/**
 * buildDocumentQueryRoutes operation.
 *
 * @param handlers - Input for handlers.
 * @returns Result of buildDocumentQueryRoutes.
 * @example
 * ```ts
 * const result = buildDocumentQueryRoutes({} as DocumentsRouteHandlers);
 * console.log(result);
 * ```
 */
export function buildDocumentQueryRoutes(handlers: DocumentsRouteHandlers) {
	return new Elysia()
		.get("/", handlers.listDocumentsHandler as never, {
			query: listQuerySchema,
			detail: {
				tags: ["Documents"],
				summary: "List documents with filters",
				description: "Get documents for Kanban board with status counts",
			},
		})
		.get("/:id", handlers.getDocumentByIdHandler as never, {
			params: idParamsSchema,
			detail: {
				tags: ["Documents"],
				summary: "Get document by ID",
				description: "Fetch single document details",
			},
		});
}
