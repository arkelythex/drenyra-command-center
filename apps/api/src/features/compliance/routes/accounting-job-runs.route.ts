import { Elysia } from "elysia";
import { z } from "zod";
import { AccountingJobRunsService } from "../../../services/accounting-job-runs.service";
import { buildFiscalTruthAdvisoryTrace } from "../../fiscal/truth/trace";
import { resolveSessionContext } from "../../security/session-context";
import { fail, getErrorMessage, ok } from "../../shared/api-response";

const AccountingJobRunStatusSchema = z.union([
	z.literal("QUEUED"),
	z.literal("RUNNING"),
	z.literal("AWAITING_APPROVAL"),
	z.literal("COMPLETED"),
	z.literal("FAILED"),
	z.literal("CANCELLED"),
]);

function resolveAccountingMachineCallerAllowlist(): readonly string[] {
	return (process.env.ACCOUNTING_JOB_RUNS_MACHINE_CALLER_ALLOWLIST ?? "")
		.split(",")
		.map((serviceId) => serviceId.trim())
		.filter((serviceId) => serviceId.length > 0);
}

async function resolveStrictCallerContext(
	headers: Record<string, unknown>,
	companyId: string,
): Promise<
	| {
			ok: true;
			legacyUserId: string | null;
	  }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  }
> {
	const context = await resolveSessionContext({
		headers,
		requestedCompanyId: companyId,
		requireSession: false,
		allowHeaderFallback: false,
		allowMachineCaller: true,
		machineCallerAllowlist: resolveAccountingMachineCallerAllowlist(),
		securityProfile: "sensitive-write",
	});

	if (!context.ok) {
		return {
			ok: false,
			status: context.status,
			code: context.code,
			error: context.error,
		};
	}

	return {
		ok: true,
		legacyUserId: context.context.legacyUserId,
	};
}

/**
 * accountingJobRunsRoute const.
 *
 * @example
 * ```ts
 * console.log(accountingJobRunsRoute);
 * ```
 */
export const accountingJobRunsRoute = new Elysia()
	.get(
		"/accounting-job-runs",
		async ({ query, set, headers }) => {
			try {
				const context = await resolveSessionContext({
					headers: headers as Record<string, unknown>,
					requestedCompanyId: query.companyId,
					requireSession: true,
				});
				if (!context.ok) {
					set.status = context.status;
					return fail(context.error, context.code);
				}

				const runs = await AccountingJobRunsService.listRuns({
					companyId: query.companyId,
					countryCode: query.countryCode,
					status: query.status,
					limit: query.limit,
				});

				return ok({
					companyId: query.companyId,
					count: runs.length,
					runs,
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "ACCOUNTING_JOB_RUNS_LIST_ERROR");
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
				countryCode: z.string().min(2).max(2).optional(),
				status: AccountingJobRunStatusSchema.optional(),
				limit: z.coerce.number().min(1).max(50).optional(),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "List recent accounting job runs",
			},
		},
	)
	.post(
		"/accounting-job-runs",
		async ({ body, headers, set }) => {
			try {
				const callerContext = await resolveStrictCallerContext(
					headers as Record<string, unknown>,
					body.companyId,
				);
				if (!callerContext.ok) {
					set.status = callerContext.status;
					return fail(callerContext.error, callerContext.code);
				}

				const run = await AccountingJobRunsService.createRun({
					...body,
					traceId:
						body.traceId ??
						buildFiscalTruthAdvisoryTrace({
							traceId: crypto.randomUUID(),
							source: "compliance",
							aggregateId: body.jobId,
							companyId: body.companyId,
						}).traceId,
					requestedBy: body.requestedBy ?? callerContext.legacyUserId,
				});
				set.status = 201;
				return ok(run);
			} catch (error: unknown) {
				if (
					error instanceof Error &&
					error.message === "ACCOUNTING_JOB_NOT_SUPPORTED"
				) {
					set.status = 404;
					return fail(
						"Accounting job not supported for this country",
						"ACCOUNTING_JOB_NOT_SUPPORTED",
					);
				}

				if (
					error instanceof Error &&
					error.message === "CONTEXT_POLICY_VIOLATION"
				) {
					set.status = 409;
					return fail(
						"Requested control-plane context violates the supervised surface policy",
						"CONTEXT_POLICY_VIOLATION",
					);
				}

				set.status = 500;
				return fail(getErrorMessage(error), "ACCOUNTING_JOB_RUNS_CREATE_ERROR");
			}
		},
		{
			body: z.object({
				companyId: z.string().min(1),
				countryCode: z.string().min(2).max(2).optional(),
				jobId: z.string().min(1),
				requestedBy: z.string().min(1).optional(),
				prompt: z.string().min(1).optional(),
				summary: z.string().min(1).optional(),
				inputPayload: z.record(z.string(), z.unknown()).optional(),
				traceId: z.string().min(1).optional(),
				requestedTools: z.array(z.string().min(1)).optional(),
				requestedCorpora: z.array(z.string().min(1)).optional(),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "Create one accounting job run",
			},
		},
	)
	.patch(
		"/accounting-job-runs/:id/status",
		async ({ body, params, headers, set }) => {
			try {
				const callerContext = await resolveStrictCallerContext(
					headers as Record<string, unknown>,
					body.companyId,
				);
				if (!callerContext.ok) {
					set.status = callerContext.status;
					return fail(callerContext.error, callerContext.code);
				}

				const run = await AccountingJobRunsService.updateRunStatus({
					id: params.id,
					companyId: body.companyId,
					status: body.status,
					summary: body.summary,
					approvedBy: body.approvedBy ?? callerContext.legacyUserId,
					resultPayload: body.resultPayload,
					evidencePayload: body.evidencePayload,
				});

				return ok(run);
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
					error.message === "ACCOUNTING_JOB_RUN_INVALID_TRANSITION"
				) {
					set.status = 409;
					return fail(
						"Accounting job run transition is not allowed",
						"ACCOUNTING_JOB_RUN_INVALID_TRANSITION",
					);
				}

				set.status = 500;
				return fail(getErrorMessage(error), "ACCOUNTING_JOB_RUNS_UPDATE_ERROR");
			}
		},
		{
			params: z.object({
				id: z.string().min(1),
			}),
			body: z.object({
				companyId: z.string().min(1),
				status: AccountingJobRunStatusSchema,
				summary: z.string().min(1).optional(),
				approvedBy: z.string().min(1).optional(),
				resultPayload: z.record(z.string(), z.unknown()).optional(),
				evidencePayload: z.record(z.string(), z.unknown()).optional(),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "Update one accounting job run status",
			},
		},
	)
	.post(
		"/accounting-job-runs/:id/execute",
		async ({ body, params, headers, set }) => {
			try {
				const callerContext = await resolveStrictCallerContext(
					headers as Record<string, unknown>,
					body.companyId,
				);
				if (!callerContext.ok) {
					set.status = callerContext.status;
					return fail(callerContext.error, callerContext.code);
				}

				const updated =
					await AccountingJobRunsService.executeRepresentativeSupervisedRun({
						id: params.id,
						companyId: body.companyId,
						period: body.period,
						approvedBy: callerContext.legacyUserId,
					});

				return ok(updated);
			} catch (error: unknown) {
				if (
					error instanceof Error &&
					error.message === "ACCOUNTING_JOB_RUN_INVALID_TRANSITION"
				) {
					set.status = 409;
					return fail(
						"Accounting job run transition is not allowed",
						"ACCOUNTING_JOB_RUN_INVALID_TRANSITION",
					);
				}

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
					error.message === "ACCOUNTING_JOB_RUN_EXECUTION_NOT_SUPPORTED"
				) {
					set.status = 409;
					return fail(
						"This accounting job does not have an automated executor yet",
						"ACCOUNTING_JOB_RUN_EXECUTION_NOT_SUPPORTED",
					);
				}

				if (
					error instanceof Error &&
					error.message === "ACCOUNTING_JOB_RUN_REQUIRES_APPROVAL"
				) {
					set.status = 409;
					return fail(
						"Accounting job run still requires approval before execution",
						"ACCOUNTING_JOB_RUN_REQUIRES_APPROVAL",
					);
				}

				if (
					error instanceof Error &&
					error.message === "CONTEXT_TRACE_ID_REQUIRED"
				) {
					set.status = 409;
					return fail(
						"Representative supervised runs require a control-plane traceId before execution",
						"CONTEXT_TRACE_ID_REQUIRED",
					);
				}

				if (
					error instanceof Error &&
					error.message === "SIRE_PERIOD_REQUIRED"
				) {
					set.status = 400;
					return fail(
						"A valid SIRE period is required to execute this run",
						"SIRE_PERIOD_REQUIRED",
					);
				}

				set.status = 500;
				return fail(
					getErrorMessage(error),
					"ACCOUNTING_JOB_RUNS_EXECUTION_ERROR",
				);
			}
		},
		{
			params: z.object({
				id: z.string().min(1),
			}),
			body: z.object({
				companyId: z.string().min(1),
				period: z
					.string()
					.regex(/^\d{4}-(0[1-9]|1[0-2])$/)
					.optional(),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "Execute one supported accounting job run",
			},
		},
	);
