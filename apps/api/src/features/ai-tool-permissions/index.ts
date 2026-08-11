import { Elysia } from "elysia";
import type { z } from "zod";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	AiToolPermissionIdParamsSchema as AiToolPermissionIdParamsOpenApiSchema,
	CreateAiToolPermissionSchema as CreateAiToolPermissionOpenApiSchema,
	ListAiToolPermissionsQuerySchema as ListAiToolPermissionsOpenApiSchema,
	UpdateAiToolPermissionSchema as UpdateAiToolPermissionOpenApiSchema,
} from "./ai-tool-permissions.schema";
import {
	AiToolPermissionIdParamsSchema,
	AiToolPermissionListResponseSchema,
	AiToolPermissionNullableResponseSchema,
	AiToolPermissionRecordSchema,
	CreateAiToolPermissionBodySchema,
	ListAiToolPermissionsQuerySchema,
	UpdateAiToolPermissionBodySchema,
} from "./ai-tool-permissions.schemas";
import { createPermission } from "./application/commands/create-permission";
import { deletePermission } from "./application/commands/delete-permission";
import { updatePermission } from "./application/commands/update-permission";
import { getPermission } from "./application/queries/get-permission";
import { listPermissions } from "./application/queries/list-permissions";

function validationErrorResponse(error: z.ZodError<unknown>) {
	return fail(
		"Invalid AI tool permission request parameters",
		"VALIDATION_ERROR",
		{
			details: {
				issues: error.issues.map((issue) => ({
					path: issue.path,
					message: issue.message,
				})),
			},
		},
	);
}

function responseContractErrorResponse(error: z.ZodError<unknown>) {
	return fail(
		JSON.stringify({
			message: "AI tool permission response violated its contract",
			issues: error.issues.map((issue) => ({
				path: issue.path,
				message: issue.message,
			})),
		}),
		"AI_TOOL_PERMISSION_CONTRACT_ERROR",
	);
}

export const aiToolPermissionsModule = new Elysia({
	prefix: "/api/ai-tool-permissions",
})
	.use(companyScopeGuard())
	.get(
		"/",
		async ({ query, set }) => {
			const parsedQuery = ListAiToolPermissionsQuerySchema.safeParse(query);
			if (!parsedQuery.success) {
				set.status = 422;
				return validationErrorResponse(parsedQuery.error);
			}

    			try {
    				const data = await listPermissions(
    					parsedQuery.data.companyId !== undefined
    						? { companyId: parsedQuery.data.companyId }
    						: {},
    				);
				const contract = AiToolPermissionListResponseSchema.safeParse(data);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: ListAiToolPermissionsOpenApiSchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Listar permisos de herramientas de IA",
			},
		},
	)

	.post(
		"/",
		async ({ body, set }) => {
			const parsedBody = CreateAiToolPermissionBodySchema.safeParse(body);
			if (!parsedBody.success) {
				set.status = 422;
				return validationErrorResponse(parsedBody.error);
			}

    			try {
    				const data = await createPermission({
    					toolName: parsedBody.data.toolName,
    					effect: parsedBody.data.effect,
    					...(parsedBody.data.companyId !== undefined
    						? { companyId: parsedBody.data.companyId }
    						: {}),
    					...(parsedBody.data.organizationId !== undefined
    						? { organizationId: parsedBody.data.organizationId }
    						: {}),
    				});
				const contract = AiToolPermissionRecordSchema.safeParse(data);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: CreateAiToolPermissionOpenApiSchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Crear permiso de herramienta de IA",
			},
		},
	)

	.get(
		"/:id",
		async ({ params, set }) => {
			const parsedParams = AiToolPermissionIdParamsSchema.safeParse(params);
			if (!parsedParams.success) {
				set.status = 422;
				return validationErrorResponse(parsedParams.error);
			}

			try {
				const data = await getPermission({ id: parsedParams.data.id });
				const contract = AiToolPermissionNullableResponseSchema.safeParse(data);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: AiToolPermissionIdParamsOpenApiSchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Obtener permiso de herramienta de IA por ID",
			},
		},
	)

	.patch(
		"/:id",
		async ({ params, body, set }) => {
			const parsedParams = AiToolPermissionIdParamsSchema.safeParse(params);
			if (!parsedParams.success) {
				set.status = 422;
				return validationErrorResponse(parsedParams.error);
			}

			const parsedBody = UpdateAiToolPermissionBodySchema.safeParse(body);
			if (!parsedBody.success) {
				set.status = 422;
				return validationErrorResponse(parsedBody.error);
			}

    			try {
    				const data = await updatePermission({
    					id: parsedParams.data.id,
    					data: {
    						...(parsedBody.data.toolName !== undefined
    							? { toolName: parsedBody.data.toolName }
    							: {}),
    						...(parsedBody.data.effect !== undefined
    							? { effect: parsedBody.data.effect }
    							: {}),
    						...(parsedBody.data.companyId !== undefined
    							? { companyId: parsedBody.data.companyId }
    							: {}),
    						...(parsedBody.data.organizationId !== undefined
    							? { organizationId: parsedBody.data.organizationId }
    							: {}),
    					},
    				});
				const contract = AiToolPermissionRecordSchema.safeParse(data);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: AiToolPermissionIdParamsOpenApiSchema,
			body: UpdateAiToolPermissionOpenApiSchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Actualizar permiso de herramienta de IA",
			},
		},
	)

	.delete(
		"/:id",
		async ({ params, set }) => {
			const parsedParams = AiToolPermissionIdParamsSchema.safeParse(params);
			if (!parsedParams.success) {
				set.status = 422;
				return validationErrorResponse(parsedParams.error);
			}

			try {
				const data = await deletePermission(parsedParams.data.id);
				const contract = AiToolPermissionRecordSchema.safeParse(data);
				if (!contract.success) {
					set.status = 500;
					return responseContractErrorResponse(contract.error);
				}
				return ok(contract.data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: AiToolPermissionIdParamsOpenApiSchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Eliminar permiso de herramienta de IA",
			},
		},
	);
