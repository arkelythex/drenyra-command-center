import { t } from "elysia";

/**
 * Request body schema for creating an AI tool permission.
 */
export const CreateAiToolPermissionSchema = t.Object({
	toolName: t.String({ description: "Nombre de la herramienta de IA" }),
	effect: t.Union(
		[t.Literal("ALLOW"), t.Literal("DENY"), t.Literal("REQUIRE_APPROVAL")],
		{ description: "Efecto del permiso" },
	),
	companyId: t.Optional(
		t.String({ description: "ID de la empresa (opcional)" }),
	),
	organizationId: t.Optional(
		t.String({ description: "ID de la organización (opcional)" }),
	),
});

/**
 * Request body schema for updating an AI tool permission.
 */
export const UpdateAiToolPermissionSchema = t.Object({
	toolName: t.Optional(
		t.String({ description: "Nombre de la herramienta de IA" }),
	),
	effect: t.Optional(
		t.Union([
			t.Literal("ALLOW"),
			t.Literal("DENY"),
			t.Literal("REQUIRE_APPROVAL"),
		]),
	),
	companyId: t.Optional(
		t.String({ description: "ID de la empresa (opcional)" }),
	),
	organizationId: t.Optional(
		t.String({ description: "ID de la organización (opcional)" }),
	),
});

/**
 * Query string schema for listing AI tool permissions.
 */
export const ListAiToolPermissionsQuerySchema = t.Object({
	companyId: t.Optional(t.String()),
});

/**
 * Params schema for AI tool permission id routes.
 */
export const AiToolPermissionIdParamsSchema = t.Object({
	id: t.String(),
});
