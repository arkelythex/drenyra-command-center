/**
 * Transactions — API Routes (Canonical VSA)
 *
 * Elysia plugin wiring HTTP ↔ CQRS handlers.
 * This is the authoritative implementation. All new registrations MUST use this.
 *
 * Performance: list() filters at DB level — avoids full-table scan of legacy service.
 */

import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import {
	createTransactionSchema,
	listTransactionsQuerySchema,
	updateTransactionSchema,
} from "../../../validators/transaction.schema";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { createTransaction } from "../application/commands/create-transaction.command";
import { deleteTransaction } from "../application/commands/delete-transaction.command";
import { updateTransaction } from "../application/commands/update-transaction.command";
import { getSummary } from "../application/queries/get-summary.query";
import { getTransaction } from "../application/queries/get-transaction.query";
import { listTransactions } from "../application/queries/list-transactions.query";

/**
 * transactionsRoutes const.
 *
 * @example
 * ```ts
 * console.log(transactionsRoutes);
 * ```
 */
export const transactionsRoutes = new Elysia({ prefix: "/api/transactions" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/",
		async ({ query, companyContext, set }) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
			}
			try {
				const result = await listTransactions({
					companyId: companyContext.companyId,
					type: query.type,
					partnerId: query.partnerId,
				});
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{ query: listTransactionsQuerySchema },
	)
	.post(
		"/",
		async ({ body, companyContext, set }) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
			}
			try {
				const result = await createTransaction({
					...body,
					companyId: companyContext.companyId,
				});
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{ body: createTransactionSchema },
	)
	.get("/summary", async ({ companyContext, set }) => {
		if (!companyContext) {
			set.status = 401;
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
		}
		try {
			const result = await getSummary(companyContext.companyId);
			return ok(result);
		} catch (error: unknown) {
			set.status = 500;
			return fail(getErrorMessage(error), "INTERNAL_ERROR");
		}
	})
	.get(
		"/:id",
		async ({ params, companyContext, set }) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
			}
			try {
				const result = await getTransaction(
					params.id,
					companyContext.companyId,
				);
				if (!result) {
					set.status = 404;
					return fail("Transaction not found", "NOT_FOUND");
				}
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{ params: t.Object({ id: t.String({ minLength: 1 }) }) },
	)
	.patch(
		"/:id",
		async ({ params, body, companyContext, set }) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
			}
			try {
				const result = await updateTransaction(
					params.id,
					body,
					companyContext.companyId,
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: updateTransactionSchema,
		},
	)
	.delete(
		"/:id",
		async ({ params, companyContext, set }) => {
			if (!companyContext) {
				set.status = 401;
				return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");
			}
			try {
				const result = await deleteTransaction(
					params.id,
					companyContext.companyId,
				);
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{ params: t.Object({ id: t.String({ minLength: 1 }) }) },
	);
