import { z } from "zod";

/**
 * Request schema for SIRE massive analysis endpoint.
 */
export const AnalyzeSireBodySchema = z.object({
	file: z.instanceof(File),
});

/**
 * Analyze Sire query schema.
 */
export const AnalyzeSireQuerySchema = z.object({
	companyId: z.string().min(1),
});

/**
 * Submit Sire schema.
 */
export const SubmitSireSchema = z.object({
	companyId: z.string().min(1),
	period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
	ledgerType: z.union([z.literal("ventas"), z.literal("compras")]),
	payloadFormat: z.union([
		z.literal("txt"),
		z.literal("csv"),
		z.literal("json"),
		z.literal("xml"),
	]),
	payloadBase64: z.string().min(1),
	ruc: z
		.string()
		.regex(/^\d{11}$/)
		.optional(),
	idempotencyKey: z.string().min(8).optional(),
	dryRun: z.boolean().optional(),
	companyAnnualIncomePen: z.coerce.number().min(0).optional(),
	isPrico: z.coerce.boolean().optional(),
	governance: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Sire conciliation query schema.
 */
export const SireConciliationQuerySchema = z.object({
	companyId: z.string().min(1),
	period: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
		.optional(),
	totalTolerance: z.coerce.number().min(0).optional(),
	igvTolerance: z.coerce.number().min(0).optional(),
	recordTolerance: z.coerce.number().min(0).optional(),
});

/**
 * Sire dashboard query schema.
 */
export const SireDashboardQuerySchema = z.object({
	companyId: z.string().min(1),
	period: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
		.optional(),
	companyAnnualIncomePen: z.coerce.number().min(0).optional(),
	isPrico: z.coerce.boolean().optional(),
});
