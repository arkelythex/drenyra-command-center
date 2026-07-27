/**
 * PLE Schemas
 *
 * Zod schemas for PLE generation request/response validation.
 */

import { z } from "zod";

/**
 * Request schema for PLE generation.
 */
export const PleGenerationRequestSchema = z.object({
	period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM"),
	ruc: z.string().length(11, "RUC must be exactly 11 characters"),
});

/**
 * PLE generation response schema.
 */
export const PleGenerationResponseSchema = z.object({
	generationId: z.string().uuid(),
	bookType: z.enum(["LE-DIARIO", "LE-MAYOR", "LE-COMPRAS", "LE-VENTAS"]),
	period: z.string(),
	ruc: z.string(),
	status: z.enum(["generated", "validated", "validation_failed", "filed"]),
	cdrHash: z.string().optional(),
	downloadUrl: z.string().optional(),
	fileSizeBytes: z.number().int().optional(),
});
