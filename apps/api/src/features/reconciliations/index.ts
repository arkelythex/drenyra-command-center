import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { checkWorkerHealth } from "./application/commands/check-worker-health";
import { externalReconcile } from "./application/commands/external-reconcile";
import { reconcile } from "./application/commands/reconcile";
import { unreconcile } from "./application/commands/unreconcile";
import { findMatches } from "./application/queries/find-matches";
import { getPending } from "./application/queries/get-pending";
import { getReconciled } from "./application/queries/get-reconciled";
import { getStats } from "./application/queries/get-stats";

/**
 * Elysia module exposing reconciliation endpoints for pending, completed, and audit flows.
 *
 * @example
 * ```ts
 * app.use(reconciliationsModule);
 * ```
 */
export const reconciliationsModule = new Elysia({
	prefix: "/api/reconciliations",
})
	.use(companyScopeGuard())
	.get(
		"/pending",
		async ({ query, set }) => {
			try {
				const limit = query.limit ?? 10;
				const pendingReconciliations = await getPending(query.companyId, limit);
				return ok(pendingReconciliations);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
			}),
		},
	)
	.get(
		"/reconciled",
		async ({ query, set }) => {
			try {
				const limit = query.limit ?? 50;
				const reconciled = await getReconciled(query.companyId, limit);
				return ok(reconciled);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
				limit: t.Optional(t.Numeric({ minimum: 1, maximum: 200 })),
			}),
		},
	)
	.post(
		"/:id/reconcile",
		async ({ params, body, set }) => {
			try {
				const reconciled = await reconcile(body.companyId, params.id, body);
				if (!reconciled) {
					set.status = 404;
					return fail("Transacción no encontrada", "TRANSACTION_NOT_FOUND");
				}
				return ok(reconciled);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({
				id: t.String({ minLength: 1 }),
			}),
			body: t.Object({
				companyId: t.String({ minLength: 1 }),
				bankReference: t.Optional(t.String()),
				reconciledAmount: t.Optional(t.String()),
				notes: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/:id/unreconcile",
		async ({ params, body, set }) => {
			try {
				const unreconciled = await unreconcile(body.companyId, params.id);
				if (!unreconciled) {
					set.status = 404;
					return fail("Transacción no encontrada", "TRANSACTION_NOT_FOUND");
				}
				return ok(unreconciled);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({
				id: t.String({ minLength: 1 }),
			}),
			body: t.Object({
				companyId: t.String({ minLength: 1 }),
			}),
		},
	)
	.get(
		"/stats",
		async ({ query, set }) => {
			try {
				const stats = await getStats(query.companyId);
				return ok(stats);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
			}),
		},
	)
	.get(
		"/:id/matches",
		async ({ params, query, set }) => {
			try {
				const matches = await findMatches(query.companyId, params.id);
				if (!matches) {
					set.status = 404;
					return fail("Transacción no encontrada", "TRANSACTION_NOT_FOUND");
				}
				return ok(matches);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: t.Object({
				id: t.String({ minLength: 1 }),
			}),
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
			}),
		},
	)
	.post(
		"/external/reconcile",
		async ({ body, set }) => {
			try {
				const workerHealth = await checkWorkerHealth();
				if (workerHealth.status !== "ok") {
					set.status = 503;
					return fail(
						"Go reconciliation worker unavailable. Start services/go/reconciliation-worker first.",
						"RECONCILIATION_WORKER_UNAVAILABLE",
					);
				}

				const result = await externalReconcile({
					sourceA: body.sourceA,
					sourceB: body.sourceB,
					toleranceCents: body.toleranceCents,
				});

				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: t.Object({
				sourceA: t.Array(
					t.Object({
						reference: t.String({ minLength: 1 }),
						amountCents: t.Integer(),
					}),
				),
				sourceB: t.Array(
					t.Object({
						reference: t.String({ minLength: 1 }),
						amountCents: t.Integer(),
					}),
				),
				toleranceCents: t.Optional(t.Integer({ minimum: 0 })),
			}),
		},
	);
