/**
 * PLE Generator Service
 *
 * Orchestrates PLE generation: reads ledger data → formats → validates → hashes → persists.
 * Flow:
 *   1. Query ledger entries for the period
 *   2. Format to SUNAT 5.1 fixed-width text
 *   3. Validate structurally and accounting-wise
 *   4. Compute SHA-256 hash (CDR)
 *   5. Persist to ple_generations
 */

import type { PleBookType, PleGenerationResult, PleGenerationStatus } from "../../domain/ple.types";
import { createHash } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { pleGenerations } from "@drenyra/persistence/schema";
import { eq, and } from "@drenyra/persistence/query";
import { validateStructural, validateAccounting } from "./ple-validator.service";

/**
 * Compute SHA-256 hash of PLE file content (CDR).
 */
function computeCdrHash(content: string): string {
	return createHash("sha256").update(content, "utf-8").digest("hex");
}

export class PleGeneratorService {
	/**
	 * Generate a PLE book for a company/period/RUC.
	 *
	 * @param companyId - Company UUID.
	 * @param bookType - Type of PLE book.
	 * @param period - Fiscal period (YYYY-MM).
	 * @param ruc - Company RUC for the file.
	 * @param formattedContent - Pre-formatted PLE text content.
	 * @returns Generation result with status and download URL.
	 */
	async generatePleBook(
		companyId: string,
		bookType: PleBookType,
		period: string,
		ruc: string,
		formattedContent: string,
	): Promise<PleGenerationResult> {
		// 1. Check if generation already exists
		const existing = await db.query.pleGenerations.findFirst({
			where: and(
				eq(pleGenerations.companyId, companyId),
				eq(pleGenerations.bookType, bookType),
				eq(pleGenerations.period, period),
			),
		});

		if (existing) {
			// Re-generate — update existing record
			const cdrHash = computeCdrHash(formattedContent);

			// Validate
			const structuralResult = validateStructural(formattedContent, bookType);
			const accountingResult = validateAccounting(formattedContent, bookType);

			const allErrors = [...structuralResult.errors, ...accountingResult.errors];
			const validationPassed = structuralResult.valid && accountingResult.valid;
			const status: PleGenerationStatus = validationPassed ? "validated" : "validation_failed";

			await db
				.update(pleGenerations)
				.set({
					fileContent: validationPassed ? formattedContent : null,
					fileSizeBytes: Buffer.byteLength(formattedContent, "utf-8"),
					cdrHash: validationPassed ? cdrHash : null,
					status,
					validationErrors: allErrors.length > 0 ? JSON.parse(JSON.stringify(allErrors)) : null,
					validatedAt: validationPassed ? new Date() : null,
					updatedAt: new Date(),
				})
				.where(eq(pleGenerations.id, existing.id));

			return {
				generationId: existing.id,
				bookType,
				period,
				ruc,
				status,
				cdrHash: validationPassed ? cdrHash : undefined,
				downloadUrl: `/api/v1/reports/ple/download/${existing.id}`,
				fileSizeBytes: validationPassed ? Buffer.byteLength(formattedContent, "utf-8") : undefined,
			};
		}

		// 2. New generation
		const cdrHash = computeCdrHash(formattedContent);

		// 3. Validate
		const structuralResult = validateStructural(formattedContent, bookType);
		const accountingResult = validateAccounting(formattedContent, bookType);

		const allErrors = [...structuralResult.errors, ...accountingResult.errors];
		const validationPassed = structuralResult.valid && accountingResult.valid;
		const status: PleGenerationStatus = validationPassed ? "validated" : "validation_failed";

		// 4. Persist
		const [saved] = await db
			.insert(pleGenerations)
			.values({
				companyId,
				bookType,
				period,
				ruc,
				status,
				fileContent: validationPassed ? formattedContent : null,
				fileSizeBytes: validationPassed ? Buffer.byteLength(formattedContent, "utf-8") : null,
				cdrHash: validationPassed ? cdrHash : null,
				validationErrors: allErrors.length > 0 ? JSON.parse(JSON.stringify(allErrors)) : null,
				validatedAt: validationPassed ? new Date() : null,
			})
			.returning();

		return {
			generationId: saved.id,
			bookType,
			period,
			ruc,
			status,
			cdrHash: validationPassed ? cdrHash : undefined,
			downloadUrl: `/api/v1/reports/ple/download/${saved.id}`,
			fileSizeBytes: validationPassed ? Buffer.byteLength(formattedContent, "utf-8") : undefined,
		};
	}

	/**
	 * Get a PLE generation by ID for download.
	 *
	 * @param generationId - The generation UUID.
	 * @returns Generation record or null.
	 */
	async getGeneration(generationId: string) {
		return await db.query.pleGenerations.findFirst({
			where: eq(pleGenerations.id, generationId),
		});
	}
}
