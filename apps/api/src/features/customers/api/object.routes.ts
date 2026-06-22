import { Elysia } from "elysia";
import { z } from "zod";
import { fail, ok } from "../../shared/api-response";
import { DeleteCustomerCommand } from "../application/commands/delete-customer.command";
import { UpdateCustomerCommand } from "../application/commands/update-customer.command";
import { GetCustomerQuery } from "../application/queries/get-customer.query";

function readRequiredCompanyId(
	headers: Record<string, unknown>,
): string | null {
	const direct = headers["x-company-id"] ?? headers["X-Company-Id"];
	return typeof direct === "string" && direct.trim() ? direct.trim() : null;
}

function failMissingCompanyScope(set: { status?: unknown }) {
	set.status = 400;
	return fail(
		"X-Company-Id is required for customer object access",
		"COMPANY_SCOPE_REQUIRED",
	);
}

function failCustomerNotFound(set: { status?: unknown }) {
	set.status = 404;
	return fail("Cliente no encontrado", "CUSTOMER_NOT_FOUND");
}

function isCustomerNotFound(error: unknown): boolean {
	return error instanceof Error && error.message === "Cliente no encontrado";
}

/**
 * Customer object routes scoped by required company context.
 *
 * @returns Elysia plugin with GET, PATCH, and DELETE customer object endpoints.
 * @throws Re-throws unexpected command/query errors after converting not-found errors.
 * @example
 * ```ts
 * const app = new Elysia().use(customerObjectRoutes);
 * ```
 */
export const customerObjectRoutes = new Elysia()
	.get(
		"/:id",
		async ({ params, query, headers, set }) => {
			const companyId = readRequiredCompanyId(
				headers as Record<string, unknown>,
			);
			if (!companyId) return failMissingCompanyScope(set);

			const queryHandler = new GetCustomerQuery();
			try {
				const result = await queryHandler.execute({
					id: params.id,
					companyId,
					includeInvoices: query.includeInvoices,
					invoiceLimit: query.invoiceLimit
						? Number(query.invoiceLimit)
						: undefined,
				});

				return ok({
					customer: result.customer.toJSON(),
					invoices: result.invoices,
				});
			} catch (error) {
				if (isCustomerNotFound(error)) return failCustomerNotFound(set);
				throw error;
			}
		},
		{
			params: z.object({ id: z.string() }),
			query: z.object({
				includeInvoices: z.boolean().optional(),
				invoiceLimit: z.coerce.number().min(1).max(100).optional(),
			}),
			detail: {
				summary: "Get customer by ID",
				description: `
Returns a single customer with optional invoice history.

**Options:**
- includeInvoices: Include recent invoices (default: false)
- invoiceLimit: Max invoices to return (default: 10, max: 100)
        `,
				tags: ["Customers"],
			},
		},
	)
	.patch(
		"/:id",
		async ({ params, body, headers, set }) => {
			const companyId = readRequiredCompanyId(
				headers as Record<string, unknown>,
			);
			if (!companyId) return failMissingCompanyScope(set);

			const command = new UpdateCustomerCommand();
			try {
				const customer = await command.execute({
					id: params.id,
					companyId,
					...body,
				});

				return ok(customer.toJSON());
			} catch (error) {
				if (isCustomerNotFound(error)) return failCustomerNotFound(set);
				throw error;
			}
		},
		{
			params: z.object({ id: z.string() }),
			body: z.object({
				taxId: z.string().min(11).max(11).optional(),
				legalName: z.string().min(1).max(255).optional(),
				email: z.string().email().optional(),
				address: z.string().optional(),
				phone: z.string().optional(),
				creditLimit: z.number().min(0).optional(),
				creditDays: z.number().min(0).optional(),
				customerSegment: z
					.union([
						z.literal("RETAIL"),
						z.literal("WHOLESALE"),
						z.literal("GOVERNMENT"),
					])
					.optional(),
			}),
			detail: {
				summary: "Update customer",
				description: `
Updates customer fields. All fields are optional.

**Validation:**
- If taxId is updated, it must pass RUC Módulo 11 validation
        `,
				tags: ["Customers"],
			},
		},
	)
	.delete(
		"/:id",
		async ({ params, headers, set }) => {
			const companyId = readRequiredCompanyId(
				headers as Record<string, unknown>,
			);
			if (!companyId) return failMissingCompanyScope(set);

			const command = new DeleteCustomerCommand();
			try {
				const customer = await command.execute({
					id: params.id,
					companyId,
				});

				return ok({
					customer: customer.toJSON(),
					message: "Cliente marcado como inactivo (soft delete)",
				});
			} catch (error) {
				if (isCustomerNotFound(error)) return failCustomerNotFound(set);
				throw error;
			}
		},
		{
			params: z.object({ id: z.string() }),
			detail: {
				summary: "Delete customer (soft)",
				description: `
Performs soft delete by marking customer as INACTIVO.

**Important:**
- Customer is NOT physically deleted (audit purposes)
- Can be reactivated by updating sunatCondition to HABIDO
- Related invoices remain unchanged
        `,
				tags: ["Customers"],
			},
		},
	);
