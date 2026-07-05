import { z } from "zod";

const UuidSchema = z.string().uuid();
const EffectSchema = z.enum(["ALLOW", "DENY", "REQUIRE_APPROVAL"]);

export const CreateAiToolPermissionBodySchema = z.object({
	toolName: z.string().min(1),
	effect: EffectSchema,
	companyId: UuidSchema.optional(),
	organizationId: UuidSchema.optional(),
});

export const UpdateAiToolPermissionBodySchema = z
	.object({
		toolName: z.string().min(1).optional(),
		effect: EffectSchema.optional(),
		companyId: UuidSchema.optional(),
		organizationId: UuidSchema.optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one field is required",
	});

export const ListAiToolPermissionsQuerySchema = z.object({
	companyId: UuidSchema.optional(),
});

export const AiToolPermissionIdParamsSchema = z.object({
	id: UuidSchema,
});

export const AiToolPermissionRecordSchema = z.object({
	id: UuidSchema,
	toolName: z.string().min(1),
	effect: EffectSchema,
	companyId: UuidSchema.nullable(),
	organizationId: UuidSchema.nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const AiToolPermissionListResponseSchema = z.array(
	AiToolPermissionRecordSchema,
);
export const AiToolPermissionNullableResponseSchema =
	AiToolPermissionRecordSchema.nullable();

export type CreateAiToolPermissionBody = z.infer<
	typeof CreateAiToolPermissionBodySchema
>;
export type UpdateAiToolPermissionBody = z.infer<
	typeof UpdateAiToolPermissionBodySchema
>;
