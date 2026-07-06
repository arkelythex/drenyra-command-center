import { Elysia } from "elysia";
import type { z } from "zod";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { companyScopeGuard } from "../shared/plugins";
import {
	CreateProductSchema as CreateProductOpenApiSchema,
	ListProductsQuerySchema as ListProductsOpenApiSchema,
	ProductIdParamsSchema as ProductIdParamsOpenApiSchema,
	UpdateProductSchema as UpdateProductOpenApiSchema,
} from "./products.schema";
import {
	CreateProductBodySchema,
	ListProductsQuerySchema,
	ProductIdParamsSchema,
	ProductListResponseSchema,
	ProductNullableResponseSchema,
	ProductRecordSchema,
	UpdateProductBodySchema,
} from "./products.schemas";
import { ProductsService } from "./products.service";

function validationErrorResponse(error: z.ZodError<unknown>) {
	return fail("Invalid products request parameters", "VALIDATION_ERROR", {
		details: {
			issues: error.issues.map((issue) => ({
				path: issue.path,
				message: issue.message,
			})),
		},
	});
}

function responseContractErrorResponse(error: z.ZodError<unknown>) {
	return fail(
		JSON.stringify({
			message: "Products response violated its contract",
			issues: error.issues.map((issue) => ({
				path: issue.path,
				message: issue.message,
			})),
		}),
		"PRODUCT_CONTRACT_ERROR",
	);
}

/**
 * Dormant product-catalog surface preserved for future activation.
 *
 * This module is not mounted in `apps/api/src/app-core.ts`; product runtime
 * truth should not be inferred from code presence alone.
 */
export const productsModule = new Elysia({ prefix: "/api/products" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/",
		async ({ query, set }) => {
			const parsedQuery = ListProductsQuerySchema.safeParse(query);
			if (!parsedQuery.success) {
				set.status = 422;
				return validationErrorResponse(parsedQuery.error);
			}

			try {
				const data = await ProductsService.list(parsedQuery.data.companyId);
				const contract = ProductListResponseSchema.safeParse(data);
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
			query: ListProductsOpenApiSchema,
			detail: { tags: ["Products"], summary: "Listar productos" },
		},
	)

	.post(
		"/",
		async ({ body, set }) => {
			const parsedBody = CreateProductBodySchema.safeParse(body);
			if (!parsedBody.success) {
				set.status = 422;
				return validationErrorResponse(parsedBody.error);
			}

			try {
				const data = await ProductsService.create(parsedBody.data);
				const contract = ProductRecordSchema.safeParse(data);
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
			body: CreateProductOpenApiSchema,
			detail: { tags: ["Products"], summary: "Crear nuevo producto" },
		},
	)

	.get(
		"/:id",
		async ({ params, set }) => {
			const parsedParams = ProductIdParamsSchema.safeParse(params);
			if (!parsedParams.success) {
				set.status = 422;
				return validationErrorResponse(parsedParams.error);
			}

			try {
				const data = await ProductsService.getById(parsedParams.data.id);
				const contract = ProductNullableResponseSchema.safeParse(data);
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
			params: ProductIdParamsOpenApiSchema,
			detail: { tags: ["Products"], summary: "Obtener producto por ID" },
		},
	)

	.patch(
		"/:id",
		async ({ params, body, set }) => {
			const parsedParams = ProductIdParamsSchema.safeParse(params);
			if (!parsedParams.success) {
				set.status = 422;
				return validationErrorResponse(parsedParams.error);
			}

			const parsedBody = UpdateProductBodySchema.safeParse(body);
			if (!parsedBody.success) {
				set.status = 422;
				return validationErrorResponse(parsedBody.error);
			}

			try {
				const data = await ProductsService.update(
					parsedParams.data.id,
					parsedBody.data,
				);
				const contract = ProductRecordSchema.safeParse(data);
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
			params: ProductIdParamsOpenApiSchema,
			body: UpdateProductOpenApiSchema,
			detail: { tags: ["Products"], summary: "Actualizar producto" },
		},
	)

	.delete(
		"/:id",
		async ({ params, set }) => {
			const parsedParams = ProductIdParamsSchema.safeParse(params);
			if (!parsedParams.success) {
				set.status = 422;
				return validationErrorResponse(parsedParams.error);
			}

			try {
				const data = await ProductsService.delete(parsedParams.data.id);
				const contract = ProductRecordSchema.safeParse(data);
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
			params: ProductIdParamsOpenApiSchema,
			detail: { tags: ["Products"], summary: "Eliminar producto" },
		},
	);
