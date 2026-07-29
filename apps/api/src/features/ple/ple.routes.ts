/**
 * PLE Routes — Programa de Libros Electrónicos
 *
 * REST API endpoints for PLE book generation, validation, download, and filing.
 *
 * Routes:
 * - GET    /api/ple/books              — List books for period
 * - POST   /api/ple/books/generate     — Generate a PLE book
 * - GET    /api/ple/books/:id          — Get book details
 * - GET    /api/ple/books/:id/download — Download TXT file
 * - POST   /api/ple/books/:id/validate — Validate a book
 * - POST   /api/ple/books/:id/file     — Mark as filed with SUNAT
 */
import { Elysia } from "elysia";
import { PleService } from "./ple.service";
import type { PleBookType } from "./ple.types";

// ─── Route Handler Helpers ─────────────────────────────────────────

function parsePagination(query: Record<string, unknown>) {
	return {
		period: (query.period as string) ?? undefined,
		bookType: (query.bookType as PleBookType) ?? undefined,
	};
}

const VALID_BOOK_TYPES: PleBookType[] = [
	"LE-DIARIO",
	"LE-MAYOR",
	"LE-COMPRAS",
	"LE-VENTAS",
];

function isValidBookType(value: unknown): value is PleBookType {
	return (
		typeof value === "string" && VALID_BOOK_TYPES.includes(value as PleBookType)
	);
}

// ─── Routes ────────────────────────────────────────────────────────

export const pleRoutes = new Elysia({ prefix: "/api/ple" })
	/**
	 * GET /api/ple/books
	 *
	 * List PLE generations for the authenticated company.
	 */
	.get(
		"/books",
		// biome-ignore lint/suspicious/noExplicitAny: Elysia context
		async ({ query, tenantContext, set }: any) => {
			const companyId = tenantContext?.companyId;

			if (!companyId) {
				set.status = 401;
				return { success: false, error: "Authentication required" };
			}

			const { period, bookType } = parsePagination(query ?? {});

			const books = await PleService.listBooks({
				companyId,
				period,
				bookType,
			});

			return { success: true, data: books };
		},
		{
			detail: {
				tags: ["PLE"],
				summary: "List PLE book generations",
			},
		},
	)

	/**
	 * POST /api/ple/books/generate
	 *
	 * Generate a PLE book from ledger data.
	 */
	.post(
		"/books/generate",
		// biome-ignore lint/suspicious/noExplicitAny: Elysia context
		async ({ body, set, tenantContext }: any) => {
			const companyId = tenantContext?.companyId ?? body?.companyId;

			if (!companyId) {
				set.status = 400;
				return { success: false, error: "companyId is required" };
			}

			if (!body?.period || !body?.bookType || !body?.ruc) {
				set.status = 400;
				return {
					success: false,
					error: "period, bookType, and ruc are required",
				};
			}

			if (!isValidBookType(body.bookType)) {
				set.status = 400;
				return {
					success: false,
					error: `Invalid bookType: ${body.bookType}`,
				};
			}

			try {
				const result = await PleService.generateBook({
					companyId,
					period: body.period,
					bookType: body.bookType as PleBookType,
					ruc: body.ruc,
					computeCdr: body.computeCdr ?? false,
				});

				set.status = 201;
				return { success: true, data: result };
			} catch (error) {
				set.status = 500;
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Failed to generate PLE book",
				};
			}
		},
		{
			detail: {
				tags: ["PLE"],
				summary: "Generate a PLE book",
			},
		},
	)

	/**
	 * GET /api/ple/books/:id
	 *
	 * Retrieve a specific PLE generation by ID.
	 */
	.get(
		"/books/:id",
		// biome-ignore lint/suspicious/noExplicitAny: Elysia context
		async ({ params, set }: any) => {
			const book = await PleService.getBook(params.id);

			if (!book) {
				set.status = 404;
				return { success: false, error: "PLE generation not found" };
			}

			return { success: true, data: book };
		},
		{
			detail: {
				tags: ["PLE"],
				summary: "Get PLE book details",
			},
		},
	)

	/**
	 * GET /api/ple/books/:id/download
	 *
	 * Download the generated TXT file.
	 */
	.get(
		"/books/:id/download",
		// biome-ignore lint/suspicious/noExplicitAny: Elysia context
		async ({ params, set }: any) => {
			const book = await PleService.getBook(params.id);

			if (!book || !book.fileContent) {
				set.status = 404;
				return {
					success: false,
					error: "PLE generation or content not found",
				};
			}

			const filename = PleService.generateFileName(
				book.ruc,
				book.period,
				book.bookType,
			);

			set.headers["Content-Type"] = "text/plain; charset=utf-8";
			set.headers["Content-Disposition"] =
				`attachment; filename="${filename.filename}"`;

			return book.fileContent;
		},
		{
			detail: {
				tags: ["PLE"],
				summary: "Download PLE TXT file",
			},
		},
	)

	/**
	 * POST /api/ple/books/:id/validate
	 *
	 * Validate a PLE book against SUNAT format rules.
	 */
	.post(
		"/books/:id/validate",
		// biome-ignore lint/suspicious/noExplicitAny: Elysia context
		async ({ params, set }: any) => {
			try {
				const result = await PleService.validateBook(params.id);

				return {
					success: true,
					data: {
						valid: result.valid,
						errors: result.errors,
						warnings: result.warnings,
					},
				};
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Validation failed";
				const status = message.includes("not found") ? 404 : 500;
				set.status = status;
				return { success: false, error: message };
			}
		},
		{
			detail: {
				tags: ["PLE"],
				summary: "Validate PLE book",
			},
		},
	)

	/**
	 * POST /api/ple/books/:id/file
	 *
	 * Mark a PLE book as filed with SUNAT.
	 */
	.post(
		"/books/:id/file",
		// biome-ignore lint/suspicious/noExplicitAny: Elysia context
		async ({ params, body, set }: any) => {
			const book = await PleService.getBook(params.id);

			if (!book) {
				set.status = 404;
				return { success: false, error: "PLE generation not found" };
			}

			if (book.status !== "validated") {
				set.status = 400;
				return {
					success: false,
					error: `Book must be validated before filing. Current status: ${book.status}`,
				};
			}

			const result = await PleService.markAsFiled(params.id, {
				ticket: body?.sunatTicket,
				message: body?.message,
			});

			return { success: true, data: result };
		},
		{
			detail: {
				tags: ["PLE"],
				summary: "Mark PLE book as filed",
			},
		},
	);
