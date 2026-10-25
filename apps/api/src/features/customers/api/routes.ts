/**
 * Customer API Routes
 *
 * RESTful endpoints for customer management.
 *
 * @module customer/api
 */

import { Elysia } from "elysia";
import { z } from "zod";
import {
	companyScopeGuard,
	rejectForeignCompanyId,
} from "../../../shared/plugins";
import { fail, ok } from "../../shared/api-response";
import { CreateCustomerCommand } from "../application/commands/create-customer.command";
import { ListCustomersQuery } from "../application/queries/list-customers.query";
import { customerObjectRoutes } from "./object.routes";

/**
 * Validation refusals of `CreateCustomerCommand`, answered as 4xx so the
 * person sees why instead of a 500.
 */
function createRefusal(
	error: unknown,
): { status: 409 | 422; code: string; message: string } | null {
	if (!(error instanceof Error)) return null;
	if (error.message.includes("Módulo 11")) {
		return {
			status: 422,
			code: "CUSTOMER_RUC_INVALID",
			message: error.message,
		};
	}
	if (error.message.startsWith("Ya existe un cliente")) {
		return { status: 409, code: "CUSTOMER_EXISTS", message: error.message };
	}
	return null;
}

/**
 * Customer routes
 * @example
 * ```ts
 * console.log(customerRoutes);
 * ```
 */

export const customerRoutes = new Elysia({ prefix: "/api/customers" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	// The companyId in the query or body must be the session's company.
	.onBeforeHandle(rejectForeignCompanyId)
	/**
	 * POST /api/customers
	 *
	 * Create a new customer
	 */
	.post(
		"/",
		async ({ body, set }) => {
			const command = new CreateCustomerCommand();
			try {
				const customer = await command.execute(body);
				return ok(customer.toJSON());
			} catch (error) {
				const refusal = createRefusal(error);
				if (!refusal) throw error;
				set.status = refusal.status;
				return fail(refusal.message, refusal.code);
			}
		},
		{
			body: z.object({
				companyId: z.string().min(1),
				taxId: z.string().min(11).max(11), // RUC: 11 digits
				legalName: z.string().min(1).max(255),
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
				summary: "Create customer",
				description: `
Creates a new customer with RUC validation (SUNAT Módulo 11).

**Validation:**
- RUC must be exactly 11 digits
- RUC must pass Módulo 11 algorithm
- Legal name is required

**Defaults:**
- sunatCondition: HABIDO (active)
- complianceScore: 100 (perfect)
        `,
				tags: ["Customers"],
			},
		},
	)

	/**
	 * GET /api/customers
	 *
	 * List all customers for a company
	 */
	.get(
		"/",
		async ({ query }) => {
			const queryHandler = new ListCustomersQuery();
			const customers = await queryHandler.execute({
				companyId: query.companyId,
				includeInactive: query.includeInactive,
				minPaymentScore:
					query.minPaymentScore !== undefined
						? Number(query.minPaymentScore)
						: undefined,
				segment: query.segment,
			});

			return ok(customers.map((c) => c.toJSON()));
		},
		{
			query: z.object({
				companyId: z.string().min(1),
				includeInactive: z.boolean().optional(),
				minPaymentScore: z.coerce.number().min(0).max(100).optional(),
				segment: z
					.union([
						z.literal("RETAIL"),
						z.literal("WHOLESALE"),
						z.literal("GOVERNMENT"),
					])
					.optional(),
			}),
			detail: {
				summary: "List customers",
				description: `
Returns all customers for a company, ordered by creation date (newest first).

**Filtering:**
- By default, only active customers (sunatCondition = HABIDO) are returned
- Set includeInactive=true to include inactive customers
        `,
				tags: ["Customers"],
			},
		},
	)

	.use(customerObjectRoutes);
