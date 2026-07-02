import { Elysia, t } from "elysia";
import { AccountingJobRunsService } from "../../../services/accounting-job-runs.service";
import { authorizeOperation } from "../../security/rbac-guard";
import { fail, ok } from "../../shared/api-response";
import { contextControlPlaneRegistry } from "../context-control-plane/context-registry";

const CompanyQuerySchema = t.Object({
	companyId: t.String({ minLength: 1 }),
});

const RunParamsSchema = t.Object({
	runId: t.String({ minLength: 1 }),
});

async function authorizeRead(
	headers: Record<string, unknown>,
	companyId: string,
	resource: string,
): Promise<
	{ ok: true } | { ok: false; status: 401 | 403; code: string; error: string }
> {
	const authz = await authorizeOperation({
		headers,
		operation: "cognitive:state:read",
		resource,
		requestedCompanyId: companyId,
	});

	if (!authz.ok) {
		return authz;
	}

	return { ok: true };
}

export const contextControlPlaneRoute = new Elysia({ prefix: "/api/ai-swarm" })
	.get(
		"/context-control-plane/registry",
		async ({ query, headers, set }) => {
			const authz = await authorizeRead(
				headers as Record<string, unknown>,
				query.companyId,
				"/api/ai-swarm/context-control-plane/registry",
			);

			if (!authz.ok) {
				set.status = authz.status;
				return fail(authz.error, authz.code);
			}

			return ok({
				companyId: query.companyId,
				count: contextControlPlaneRegistry.list().length,
				surfaces: contextControlPlaneRegistry.list(),
			});
		},
		{
			query: CompanyQuerySchema,
			detail: {
				tags: ["AI Swarm", "Compliance"],
				summary: "List supervised control-plane registry surfaces",
			},
		},
	)
	.get(
		"/context-control-plane/runs/:runId/state",
		async ({ params, query, headers, set }) => {
			const authz = await authorizeRead(
				headers as Record<string, unknown>,
				query.companyId,
				"/api/ai-swarm/context-control-plane/runs/:runId/state",
			);

			if (!authz.ok) {
				set.status = authz.status;
				return fail(authz.error, authz.code);
			}

			try {
				const state = await AccountingJobRunsService.getContextRunState({
					id: params.runId,
					companyId: query.companyId,
				});

				if (!state) {
					set.status = 404;
					return fail(
						"Accounting job run not found for this company",
						"ACCOUNTING_JOB_RUN_NOT_FOUND",
					);
				}

				return ok(state);
			} catch (error: unknown) {
				if (
					error instanceof Error &&
					error.message === "CONTEXT_TRACE_ID_REQUIRED"
				) {
					set.status = 409;
					return fail(
						"Control-plane state requires a persisted traceId for the selected run",
						"CONTEXT_TRACE_ID_REQUIRED",
					);
				}

				set.status = 500;
				return fail(
					error instanceof Error
						? error.message
						: "Unexpected context-control-plane error",
					"CONTEXT_CONTROL_PLANE_STATE_ERROR",
				);
			}
		},
		{
			params: RunParamsSchema,
			query: CompanyQuerySchema,
			detail: {
				tags: ["AI Swarm", "Compliance"],
				summary: "Read one supervised run control-plane state",
			},
		},
	)
	.get(
		"/context-control-plane/runs/:runId/trace",
		async ({ params, query, headers, set }) => {
			const authz = await authorizeRead(
				headers as Record<string, unknown>,
				query.companyId,
				"/api/ai-swarm/context-control-plane/runs/:runId/trace",
			);

			if (!authz.ok) {
				set.status = authz.status;
				return fail(authz.error, authz.code);
			}

			try {
				const trace = await AccountingJobRunsService.getContextTrace({
					id: params.runId,
					companyId: query.companyId,
				});
				return ok({ runId: params.runId, count: trace.length, events: trace });
			} catch (error: unknown) {
				if (
					error instanceof Error &&
					error.message === "ACCOUNTING_JOB_RUN_NOT_FOUND"
				) {
					set.status = 404;
					return fail(
						"Accounting job run not found for this company",
						"ACCOUNTING_JOB_RUN_NOT_FOUND",
					);
				}

				if (
					error instanceof Error &&
					error.message === "CONTEXT_TRACE_ID_REQUIRED"
				) {
					set.status = 409;
					return fail(
						"Control-plane trace requires a persisted traceId for the selected run",
						"CONTEXT_TRACE_ID_REQUIRED",
					);
				}

				set.status = 500;
				return fail(
					error instanceof Error
						? error.message
						: "Unexpected context-control-plane error",
					"CONTEXT_CONTROL_PLANE_TRACE_ERROR",
				);
			}
		},
		{
			params: RunParamsSchema,
			query: CompanyQuerySchema,
			detail: {
				tags: ["AI Swarm", "Compliance"],
				summary: "Read one supervised run control-plane trace timeline",
			},
		},
	)
	.get(
		"/context-control-plane/runs/:runId/evaluation",
		async ({ params, query, headers, set }) => {
			const authz = await authorizeRead(
				headers as Record<string, unknown>,
				query.companyId,
				"/api/ai-swarm/context-control-plane/runs/:runId/evaluation",
			);

			if (!authz.ok) {
				set.status = authz.status;
				return fail(authz.error, authz.code);
			}

			try {
				const evaluation =
					await AccountingJobRunsService.getContextEvaluationSummary({
						id: params.runId,
						companyId: query.companyId,
					});
				return ok({ runId: params.runId, evaluationSummary: evaluation });
			} catch (error: unknown) {
				if (
					error instanceof Error &&
					error.message === "ACCOUNTING_JOB_RUN_NOT_FOUND"
				) {
					set.status = 404;
					return fail(
						"Accounting job run not found for this company",
						"ACCOUNTING_JOB_RUN_NOT_FOUND",
					);
				}

				if (
					error instanceof Error &&
					error.message === "CONTEXT_TRACE_ID_REQUIRED"
				) {
					set.status = 409;
					return fail(
						"Control-plane evaluation requires a persisted traceId for the selected run",
						"CONTEXT_TRACE_ID_REQUIRED",
					);
				}

				set.status = 500;
				return fail(
					error instanceof Error
						? error.message
						: "Unexpected context-control-plane error",
					"CONTEXT_CONTROL_PLANE_EVALUATION_ERROR",
				);
			}
		},
		{
			params: RunParamsSchema,
			query: CompanyQuerySchema,
			detail: {
				tags: ["AI Swarm", "Compliance"],
				summary: "Read one supervised run evaluation summary",
			},
		},
	);
