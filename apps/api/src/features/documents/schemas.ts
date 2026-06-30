import { z } from "zod";
import { DocumentStatusEnum, DocumentTypeEnum } from "./contracts";

/**
 * uploadBodySchema for single document upload.
 */
export const uploadBodySchema = z.union([
	z.object({
		file: z.instanceof(File),
		organizationId: z.coerce.number().min(1).optional(),
		companyId: z.string().min(1).optional(),
		type: DocumentTypeEnum.optional(),
		expedienteId: z.string().min(1).optional(),
		companyRuc: z.string().min(11).max(11).optional(),
		fiscalPeriod: z
			.string()
			.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
			.optional(),
	}),
	z.object({
		file: z.instanceof(File),
		organizationId: z.coerce.number().min(1).optional(),
		companyId: z.string().min(1).optional(),
		type: DocumentTypeEnum.optional(),
		expedienteId: z.string().min(1).optional(),
		companyRuc: z.string().min(11).max(11).optional(),
		fiscalPeriod: z
			.string()
			.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
			.optional(),
	}),
]);

/**
 * Validate params schema.
 */
export const validateParamsSchema = z.object({
	id: z.string().min(1),
});

/**
 * Validate body schema.
 */
export const validateBodySchema = z.object({
	correctedData: z
		.object({
			issuerRUC: z.string().optional(),
			issuerName: z.string().optional(),
			total: z.number().optional(),
			igv: z.number().optional(),
			documentDate: z.string().optional(),
			pcgeAccount: z.string().optional(),
		})
		.optional(),
	status: z.union([z.literal("approved"), z.literal("needs_review")]),
});

/**
 * Reject params schema.
 */
export const rejectParamsSchema = z.object({
	id: z.string().min(1),
});

/**
 * Reject body schema.
 */
export const rejectBodySchema = z.object({
	reason: z.string().min(1),
	category: z
		.union([
			z.literal("invalid_format"),
			z.literal("duplicate"),
			z.literal("incorrect_data"),
			z.literal("other"),
		])
		.optional(),
});

/**
 * Batch upload body schema.
 */
export const batchUploadBodySchema = z.union([
	z.object({
		files: z.array(z.instanceof(File)),
		organizationId: z.coerce.number().min(1).optional(),
		companyId: z.string().min(1).optional(),
	}),
	z.object({
		files: z.array(z.instanceof(File)),
		organizationId: z.coerce.number().min(1).optional(),
		companyId: z.string().min(1).optional(),
	}),
]);

/**
 * List query schema.
 */
export const listQuerySchema = z.object({
	organizationId: z.coerce.number().min(1).optional(),
	companyId: z.string().min(1).optional(),
	status: DocumentStatusEnum.optional(),
	period: z
		.string()
		.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
		.optional(),
	search: z.string().optional(),
	limit: z.coerce.number().min(1).max(500).optional(),
	offset: z.coerce.number().min(0).optional(),
});

/**
 * ID params schema.
 */
export const idParamsSchema = z.object({
	id: z.string().min(1),
});

/**
 * Update status body schema.
 */
export const updateStatusBodySchema = z.object({
	status: z.union([
		z.literal("listo_para_sire"),
		z.literal("rechazado_por_sire"),
	]),
	reason: z.string().optional(),
});
