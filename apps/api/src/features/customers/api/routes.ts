/**
 * Customer API Routes
 *
 * RESTful endpoints for customer management.
 *
 * @module customer/api
 */

import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../../shared/plugins";
import { ok } from "../../shared/api-response";
import { CreateCustomerCommand } from "../application/commands/create-customer.command";
import { ListCustomersQuery } from "../application/queries/list-customers.query";
import { customerObjectRoutes } from "./object.routes";

/**
 * Customer routes
 * @example
 * ```ts
 * console.log(customerRoutes);
 * ```
 */

export const customerRoutes = new Elysia({ prefix: "/api/customers" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	/**
	 * POST /api/customers
	 *
	 * Create a new customer
	 */
	.post(
		"/",
		async ({ body }) => {
			const command = new CreateCustomerCommand();
			const customer = await command.execute(body);

			return ok(customer.toJSON());
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
