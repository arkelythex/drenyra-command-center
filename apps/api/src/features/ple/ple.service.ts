/**
 * PLE Application Service
 *
 * Orchestrates PLE book generation, validation, retrieval, and filing.
 * Coordinates between the TXT generator, validator, and persistence layer.
 */
import { db } from "@drenyra/persistence/client";
import { and, desc, eq } from "@drenyra/persistence/query";
import { pleGenerations } from "@drenyra/persistence/schema";
import { PleGeneratorService } from "./ple-generator.service";
import { PleValidator } from "./ple-validator.service";
import type {
	GeneratePleBookInput,
	ListPleBooksParams,
	PleBookType,
	PleFileName,
	PleGenerationResult,
	PleGenerationStatus,
	PleValidationResult,
} from "./ple.types";

// ─── Internal row type (matches pleGenerations schema) ─────────────

interface PleGenerationRow {
	id: string;
	companyId: string;
	bookType: string;
	period: string;
	ruc: string;
	status: string;
	fileContent: string | null;
	fileSizeBytes: number | null;
	cdrHash: string | null;
	validationErrors: unknown;
	sunatResponse: unknown;
	generatedBy: string | null;
	generatedAt: Date;
	validatedAt: Date | null;
	filedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

// ─── Row → Result mapping ──────────────────────────────────────────

function mapRow(row: PleGenerationRow): PleGenerationResult {
	return {
		id: row.id,
		bookType: row.bookType as PleBookType,
		period: row.period,
		ruc: row.ruc,
		status: row.status as PleGenerationStatus,
		fileContent: row.fileContent,
		fileSizeBytes: row.fileSizeBytes,
		cdrHash: row.cdrHash,
		generatedAt: row.generatedAt.toISOString(),
	};
}

// ─── Public API ────────────────────────────────────────────────────

export class PleService {
	/**
	 * Generate a PLE book, compute CDR hash if requested, and persist.
	 *
	 * For MVP, the caller provides the data rows directly. Future versions
	 * will read from journal entries, accounts, and document tables.
	 */
	static async generateBook(
		input: GeneratePleBookInput & {
			ruc: string;
			generatedBy?: string;
			computeCdr?: boolean;
			rows?: unknown[];
		},
	): Promise<PleGenerationResult> {
		const config = {
			ruc: input.ruc,
			companyId: input.companyId,
			period: input.period,
		};

		// Generate TXT content from provided rows or empty array
		const rows = (input.rows ?? []) as never[];
		const fileContent = PleGeneratorService.generateBook(
			config,
			input.bookType,
			rows,
		);

		const fileSizeBytes = Buffer.byteLength(fileContent, "utf8");
		let cdrHash: string | null = null;

		if (input.computeCdr) {
			cdrHash = PleGeneratorService.generateCdrHash(fileContent);
		}

		const [result] = await db
			.insert(pleGenerations)
			.values({
				companyId: input.companyId,
				bookType: input.bookType,
				period: input.period,
				ruc: input.ruc,
				status: "generated",
				fileContent,
				fileSizeBytes,
				cdrHash,
				generatedBy: input.generatedBy ?? null,
			})
			.onConflictDoUpdate({
				target: [
					pleGenerations.companyId,
					pleGenerations.bookType,
					pleGenerations.period,
				],
				set: {
					fileContent,
					fileSizeBytes,
					cdrHash,
					status: "generated",
					updatedAt: new Date(),
				},
			})
			.returning();

		return mapRow(result as PleGenerationRow);
	}

	/**
	 * Retrieve a PLE generation by ID.
	 */
	static async getBook(id: string): Promise<PleGenerationResult | null> {
		const rows = await db
			.select()
			.from(pleGenerations)
			.where(eq(pleGenerations.id, id))
			.limit(1);

		if (rows.length === 0) return null;
		return mapRow(rows[0] as PleGenerationRow);
	}

	/**
	 * List PLE generations for a company, optionally filtered by period and book type.
	 */
	static async listBooks(
		params: ListPleBooksParams,
	): Promise<PleGenerationResult[]> {
		const conditions = [eq(pleGenerations.companyId, params.companyId)];

		if (params.period) {
			conditions.push(eq(pleGenerations.period, params.period));
		}

		if (params.bookType) {
			conditions.push(eq(pleGenerations.bookType, params.bookType));
		}

		const rows = await db
			.select()
			.from(pleGenerations)
			.where(and(...conditions))
			.orderBy(desc(pleGenerations.generatedAt));

		return rows.map((row) => mapRow(row as PleGenerationRow));
	}

	/**
	 * Validate a PLE book by its generation ID.
	 * Updates the status to "validated" or "validation_failed".
	 */
	static async validateBook(id: string): Promise<PleValidationResult> {
		const book = await PleService.getBook(id);
		if (!book) {
			throw new Error(`PLE generation not found: ${id}`);
		}

		const content = book.fileContent ?? "";
		const result = PleValidator.validate(book.bookType, content, {
			expectedRuc: book.ruc,
		});

		const newStatus: PleGenerationStatus = result.valid
			? "validated"
			: "validation_failed";

		await db
			.update(pleGenerations)
			.set({
				status: newStatus,
				validationErrors: result.errors.length > 0 ? result.errors : null,
				validatedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(pleGenerations.id, id));

		return result;
	}

	/**
	 * Mark a PLE generation as filed with SUNAT.
	 */
	static async markAsFiled(
		id: string,
		sunatResponse?: Record<string, unknown>,
	): Promise<PleGenerationResult> {
		const [row] = await db
			.update(pleGenerations)
			.set({
				status: "filed",
				sunatResponse: sunatResponse ?? null,
				filedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(pleGenerations.id, id))
			.returning();

		return mapRow(row as PleGenerationRow);
	}

	/**
	 * Generate CDR hash for content (pass-through to generator).
	 */
	static generateCdrHash(content: string): string {
		return PleGeneratorService.generateCdrHash(content);
	}

	/**
	 * Generate SUNAT filename (pass-through to generator).
	 */
	static generateFileName(
		ruc: string,
		period: string,
		bookType: PleBookType,
	): PleFileName {
		return PleGeneratorService.generateFileName(ruc, period, bookType);
	}
}
