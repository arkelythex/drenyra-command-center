import { Elysia } from "elysia";
import { z } from "zod";
import { logger } from "../../../lib/logger";
import { ComplianceRoadmapService } from "../../../services/compliance-roadmap.service";
import { resolveTrustedMachineCallerAllowlist } from "../../security/authenticated-caller";
import { resolveSessionContext } from "../../security/session-context";
import { fail, getErrorMessage, ok } from "../../shared/api-response";

const ACTION_ID_SCHEMA = z.union([
	z.literal("prepare-sire"),
	z.literal("collect-overdue-invoices"),
	z.literal("stabilize-cashflow"),
	z.literal("resolve-ledger-repro-mismatch"),
]);

async function resolveOptionalLegacyUserId(
	headers: Record<string, unknown>,
	companyId: string,
): Promise<string | null> {
	const context = await resolveSessionContext({
		headers,
		requestedCompanyId: companyId,
		requireSession: false,
		allowHeaderFallback: false,
	});

	if (!context.ok) return null;
	return context.context.legacyUserId;
}

function resolveRoadmapMachineCallerAllowlist(): readonly string[] {
	return resolveTrustedMachineCallerAllowlist({
		envVarName: "ROADMAP_MVP_MACHINE_CALLER_ALLOWLIST",
	});
}

async function resolveStrictCallerContext(
	headers: Record<string, unknown>,
	companyId: string,
): Promise<
	| {
			ok: true;
	  }
	| {
			ok: false;
			status: 401 | 403;
			code: string;
			error: string;
	  }
> {
	try {
		const context = await resolveSessionContext({
			headers,
			requestedCompanyId: companyId,
			requireSession: false,
			allowHeaderFallback: false,
			allowMachineCaller: true,
			machineCallerAllowlist: resolveRoadmapMachineCallerAllowlist(),
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

		return { ok: true };
	} catch (error: unknown) {
		logger.warn(
			{
				feature: "compliance",
				route: "/compliance/roadmap-mvp/actions/:actionId/run",
				companyId,
				error: getErrorMessage(error),
			},
			"Roadmap action run caller resolution failed (fail-closed)",
		);

		return {
			ok: false,
			status: 401,
			code: "AUTH_RESOLUTION_FAILED",
			error: "Failed to resolve authenticated caller context",
		};
	}
}

function handleRoadmapError(error: unknown, set: { status?: number | string }) {
	const errorMessage = error instanceof Error ? error.message : "";

	if (errorMessage === "ROADMAP_ACTION_NOT_AVAILABLE") {
		set.status = 404;
		return fail(
			"Roadmap action is not available for the selected period",
			"ROADMAP_ACTION_NOT_AVAILABLE",
		);
	}
	if (errorMessage === "ROADMAP_TRACE_MISMATCH") {
		set.status = 409;
		return fail(
			"Trace identifier does not match the current recommendation payload",
			"ROADMAP_TRACE_MISMATCH",
		);
	}
	if (errorMessage === "ACCOUNTING_JOB_NOT_SUPPORTED") {
		set.status = 409;
		return fail(
			"Automation action is not available in this country pack",
			"ACCOUNTING_JOB_NOT_SUPPORTED",
		);
	}

	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

/**
 * roadmapMvpRoute const.
 *
 * @example
 * ```ts
 * console.log(roadmapMvpRoute);
 * ```
 */
export const roadmapMvpRoute = new Elysia({ prefix: "/roadmap-mvp" })
	.get(
		"",
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

				const result = await ComplianceRoadmapService.getRoadmapMvpSnapshot({
					companyId: query.companyId,
					year: query.year,
					month: query.month,
				});
				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
				year: z.coerce.number().min(2026).max(2100),
				month: z.coerce.number().min(1).max(12),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "Roadmap MVP snapshot (Phase 1 + Phase 2)",
			},
		},
	)
	.post(
		"/actions/:actionId/run",
		async ({ params, body, headers, set }) => {
			try {
				const callerContext = await resolveStrictCallerContext(
					headers as Record<string, unknown>,
					body.companyId,
				);
				if (!callerContext.ok) {
					set.status = callerContext.status;
					return fail(callerContext.error, callerContext.code);
				}

				const result = await ComplianceRoadmapService.runRoadmapAction({
					companyId: body.companyId,
					year: body.year,
					month: body.month,
					actionId: params.actionId,
					traceId: body.traceId,
					...(body.countryCode !== undefined
						? { countryCode: body.countryCode }
						: {}),
				});
				return ok(result);
			} catch (error: unknown) {
				return handleRoadmapError(error, set);
			}
		},
		{
			params: z.object({
				actionId: ACTION_ID_SCHEMA,
			}),
			body: z.object({
				companyId: z.string().min(1),
				year: z.number().min(2026).max(2100),
				month: z.number().min(1).max(12),
				traceId: z.string().min(8),
				countryCode: z.string().min(2).max(2).optional(),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "Run one roadmap copilot action",
			},
		},
	)
	.post(
		"/decisions",
		async ({ body, headers, set }) => {
			try {
				const fallbackDecidedBy = await resolveOptionalLegacyUserId(
					headers as Record<string, unknown>,
					body.companyId,
				);
				const result = await ComplianceRoadmapService.decideRoadmapAction({
					companyId: body.companyId,
					year: body.year,
					month: body.month,
					actionId: body.actionId,
					traceId: body.traceId,
					decision: body.decision,
					reason: body.reason,
					...(body.countryCode !== undefined
						? { countryCode: body.countryCode }
						: {}),
					...(body.decidedBy != null
						? { decidedBy: body.decidedBy }
						: fallbackDecidedBy != null
							? { decidedBy: fallbackDecidedBy }
							: {}),
				});
				return ok(result);
			} catch (error: unknown) {
				return handleRoadmapError(error, set);
			}
		},
		{
			body: z.object({
				companyId: z.string().min(1),
				year: z.number().min(2026).max(2100),
				month: z.number().min(1).max(12),
				actionId: ACTION_ID_SCHEMA,
				traceId: z.string().min(8),
				decision: z.union([
					z.literal("APPROVE"),
					z.literal("REJECT"),
					z.literal("ESCALATE"),
				]),
				reason: z.string().min(3),
				countryCode: z.string().min(2).max(2).optional(),
				decidedBy: z.string().min(1).optional(),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "Register HITL decision for roadmap recommendation",
			},
		},
	)
	.get(
		"/timeline/:actionId",
		async ({ params, query, set, headers }) => {
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

				const result = await ComplianceRoadmapService.getRoadmapActionTimeline({
					companyId: query.companyId,
					year: query.year,
					month: query.month,
					actionId: params.actionId,
					traceId: query.traceId,
				});
				return ok(result);
			} catch (error: unknown) {
				return handleRoadmapError(error, set);
			}
		},
		{
			params: z.object({
				actionId: ACTION_ID_SCHEMA,
			}),
			query: z.object({
				companyId: z.string().min(1),
				year: z.coerce.number().min(2026).max(2100),
				month: z.coerce.number().min(1).max(12),
				traceId: z.string().min(8),
			}),
			detail: {
				tags: ["Compliance", "Assistant"],
				summary: "Retrieve roadmap recommendation decision/effect timeline",
			},
		},
	);
