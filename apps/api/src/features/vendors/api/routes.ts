/**
 * Vendor API Routes
 *
 * RESTful endpoints for vendor management.
 *
 * @module vendors/api
 */

import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { fail, ok } from "../../shared/api-response";
import { createVendor } from "../application/commands/create-vendor.command";
import { deleteVendor } from "../application/commands/delete-vendor.command";
import { updateVendor } from "../application/commands/update-vendor.command";
import { getVendor } from "../application/queries/get-vendor.query";
import { listVendors } from "../application/queries/list-vendors.query";

function readRequiredCompanyId(
	headers: Record<string, unknown>,
): string | null {
	const direct = headers["x-company-id"] ?? headers["X-Company-Id"];
	return typeof direct === "string" && direct.trim() ? direct.trim() : null;
}

function failMissingCompanyScope(set: { status?: unknown }) {
	set.status = 400;
	return fail(
		"X-Company-Id is required for vendor object access",
		"COMPANY_SCOPE_REQUIRED",
	);
}

function failVendorNotFound(set: { status?: unknown }) {
	set.status = 404;
	return fail("Proveedor no encontrado", "VENDOR_NOT_FOUND");
}

function isVendorNotFound(error: unknown): boolean {
	return error instanceof Error && error.message === "Proveedor no encontrado";
}

/**
 * vendorRoutes const.
 *
 * @example
 * ```ts
 * console.log(vendorRoutes);
 * ```
 */
export const vendorRoutes = new Elysia({ prefix: "/api/vendors" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	/**
	 * POST /api/vendors - Create vendor
	 */
	.post(
		"/",
		async ({ body }) => {
			const vendor = await createVendor(body);

			return ok(vendor.toJSON());
		},
		{
			body: t.Object({
				companyId: t.String({ minLength: 1 }),
				taxId: t.String({ minLength: 11, maxLength: 11 }),
				legalName: t.String({ minLength: 1, maxLength: 255 }),
				email: t.Optional(t.String({ format: "email" })),
				vendorRating: t.Optional(t.Numeric({ minimum: 0, maximum: 100 })),
				paymentTermDays: t.Optional(t.Numeric({ minimum: 0, maximum: 3650 })),
				preferredPaymentMethod: t.Optional(
					t.Union([
						t.Literal("TRANSFER"),
						t.Literal("CASH"),
						t.Literal("CHECK"),
					]),
				),
				bankAccount: t.Optional(t.String({ maxLength: 255 })),
				purchaseCategories: t.Optional(
					t.Array(t.String({ minLength: 1, maxLength: 100 }), { maxItems: 50 }),
				),
			}),
			detail: {
				summary: "Create vendor",
				tags: ["Vendors"],
			},
		},
	)

	/**
	 * GET /api/vendors - List vendors
	 */
	.get(
		"/",
		async ({ query }) => {
			const vendors = await listVendors({
				companyId: query.companyId,
				...(query.includeInactive !== undefined
					? { includeInactive: query.includeInactive }
					: {}),
				...(query.minRating !== undefined
					? { minRating: Number(query.minRating) }
					: {}),
				...(query.category !== undefined ? { category: query.category } : {}),
			});

			return ok(vendors.map((v) => v.toJSON()));
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
				includeInactive: t.Optional(t.Boolean()),
				minRating: t.Optional(t.Numeric({ minimum: 0, maximum: 100 })),
				category: t.Optional(t.String({ maxLength: 100 })),
			}),
			detail: {
				summary: "List vendors",
				tags: ["Vendors"],
			},
		},
	)

	/**
	 * GET /api/vendors/:id - Get vendor
	 */
	.get(
		"/:id",
		async ({ params, headers, set }) => {
			const companyId = readRequiredCompanyId(
				headers as Record<string, unknown>,
			);
			if (!companyId) return failMissingCompanyScope(set);

			try {
				const vendor = await getVendor({ id: params.id, companyId });
				return ok(vendor.toJSON());
			} catch (error) {
				if (isVendorNotFound(error)) return failVendorNotFound(set);
				throw error;
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			detail: {
				summary: "Get vendor by ID",
				tags: ["Vendors"],
			},
		},
	)

	/**
	 * PATCH /api/vendors/:id - Update vendor (partial)
	 */
	.patch(
		"/:id",
		async ({ params, body, headers, set }) => {
			const companyId = readRequiredCompanyId(
				headers as Record<string, unknown>,
			);
			if (!companyId) return failMissingCompanyScope(set);

			try {
				const vendor = await updateVendor({
					id: params.id,
					companyId,
					...body,
				});
				return ok(vendor.toJSON());
			} catch (error) {
				if (isVendorNotFound(error)) return failVendorNotFound(set);
				throw error;
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				taxId: t.Optional(t.String({ minLength: 11, maxLength: 11 })),
				legalName: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
				email: t.Optional(t.String({ format: "email" })),
				vendorRating: t.Optional(t.Numeric({ minimum: 0, maximum: 100 })),
				paymentTermDays: t.Optional(t.Numeric({ minimum: 0, maximum: 3650 })),
				preferredPaymentMethod: t.Optional(
					t.Union([
						t.Literal("TRANSFER"),
						t.Literal("CASH"),
						t.Literal("CHECK"),
					]),
				),
				bankAccount: t.Optional(t.String({ maxLength: 255 })),
				purchaseCategories: t.Optional(
					t.Array(t.String({ minLength: 1, maxLength: 100 }), { maxItems: 50 }),
				),
			}),
			detail: {
				summary: "Update vendor",
				tags: ["Vendors"],
			},
		},
	)

	/**
	 * DELETE /api/vendors/:id - Soft delete vendor
	 */
	.delete(
		"/:id",
		async ({ params, headers, set }) => {
			const companyId = readRequiredCompanyId(
				headers as Record<string, unknown>,
			);
			if (!companyId) return failMissingCompanyScope(set);

			try {
				const vendor = await deleteVendor({ id: params.id, companyId });
				return ok({
					vendor: vendor.toJSON(),
					message: "Proveedor marcado como inactivo (soft delete)",
				});
			} catch (error) {
				if (isVendorNotFound(error)) return failVendorNotFound(set);
				throw error;
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			detail: {
				summary: "Delete vendor (soft)",
				tags: ["Vendors"],
			},
		},
	);

export default vendorRoutes;
