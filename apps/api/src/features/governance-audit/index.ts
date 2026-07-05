import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	getGovernancePolicyDecisionMetrics,
	getGovernancePolicyDecisionPrometheusText,
} from "../shared/governance.metrics";
import {
	resolveGovernanceAuditAccess,
	resolveGovernanceMetricsAccess,
} from "../shared/request-access";
import { ArtifactEventAuditService } from "./artifact-event-audit.service";
import { ArtifactEventQueryService } from "./artifact-event-query.service";
import { readHeader } from "./governance-audit.headers";
import { GovernanceAuditService } from "./governance-audit.service";

/**
 * governanceAuditModule const.
 *
 * @example
 * ```ts
 * console.log(governanceAuditModule);
 * ```
 */
export const governanceAuditModule = new Elysia({
	prefix: "/api/governance-audit",
})
	.use(companyScopeGuard())
	.get(
		"/decisions",
		async ({ query, headers, set }) => {
			const access = await resolveGovernanceAuditAccess(
				headers as Record<string, unknown>,
				query.companyId,
			);
			if (!access.ok) {
				set.status = access.status;
				return fail(access.error, access.code);
			}

			try {
				const result = await GovernanceAuditService.listDecisions(query);
				return ok({
					...result,
					access: access.context,
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(
					getErrorMessage(
						error,
						"Unable to retrieve governance audit decisions",
					),
					"GOVERNANCE_AUDIT_ERROR",
				);
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
				feature: z
					.union([
						z.literal("all"),
						z.literal("sire"),
						z.literal("electronic-invoicing"),
					])
					.optional(),
				decision: z.union([z.literal("ALLOW"), z.literal("BLOCK")]).optional(),
				limit: z.coerce.number().min(1).max(200).optional(),
				offset: z.coerce.number().min(0).optional(),
			}),
			detail: {
				tags: ["Governance Audit"],
				summary: "List governance decisions",
				description:
					"Consolidates governance decisions across SIRE submissions and electronic invoicing trail for a company.",
			},
		},
	)
	.post(
		"/events",
		async ({ body, headers, set }) => {
			const access = await resolveGovernanceAuditAccess(
				headers as Record<string, unknown>,
				body.companyId,
			);
			if (!access.ok) {
				set.status = access.status;
				return fail(access.error, access.code);
			}

			try {
				const result = await ArtifactEventAuditService.record({
					companyId: body.companyId,
					actorUserId: access.context.authUserId,
					actionId: body.event.actionId,
					createdAt: body.event.createdAt,
					artifactId: body.event.artifactId,
					artifactType: body.event.artifactType,
					traceId: body.event.traceId,
					message: body.event.message,
					nextStatus: body.event.nextStatus,
					payload: body.event.payload,
					source: "workspace-artifact",
					ipAddress: readHeader(
						headers as Record<string, unknown>,
						"x-forwarded-for",
					),
					userAgent: readHeader(
						headers as Record<string, unknown>,
						"user-agent",
					),
				});

				return ok({
					...result,
					access: access.context,
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(
					getErrorMessage(error, "Unable to persist governance artifact event"),
					"GOVERNANCE_AUDIT_EVENT_ERROR",
				);
			}
		},
		{
			body: z.object({
				companyId: z.string().min(1),
				event: z.object({
					artifactId: z.string().min(1),
					artifactType: z.string().min(1),
					traceId: z.string().min(1),
					actionId: z.string().min(1),
					message: z.string().min(1),
					nextStatus: z.string().optional(),
					createdAt: z.string().min(1),
					payload: z.record(z.string(), z.unknown()).optional(),
				}),
			}),
			detail: {
				tags: ["Governance Audit"],
				summary: "Persist artifact governance event",
				description:
					"Stores policy-gated artifact interactions for audit-first workspace traceability.",
			},
		},
	)
	.get(
		"/events",
		async ({ query, headers, set }) => {
			const access = await resolveGovernanceAuditAccess(
				headers as Record<string, unknown>,
				query.companyId,
			);
			if (!access.ok) {
				set.status = access.status;
				return fail(access.error, access.code);
			}

			try {
				const result = await ArtifactEventQueryService.list(query);
				return ok({
					...result,
					access: access.context,
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(
					getErrorMessage(
						error,
						"Unable to retrieve governance artifact events",
					),
					"GOVERNANCE_AUDIT_EVENTS_ERROR",
				);
			}
		},
		{
			query: z.object({
				companyId: z.string().min(1),
				traceId: z.string().min(1).optional(),
				artifactType: z.string().min(1).optional(),
				actionId: z.string().min(1).optional(),
				limit: z.coerce.number().min(1).max(100).optional(),
				offset: z.coerce.number().min(0).optional(),
			}),
			detail: {
				tags: ["Governance Audit"],
				summary: "List artifact governance events",
				description:
					"Returns persisted policy-gated artifact interaction events for workspace traceability.",
			},
		},
	)
	.get(
		"/metrics",
		async ({ headers, set }) => {
			const access = await resolveGovernanceMetricsAccess(
				headers as Record<string, unknown>,
			);
			if (!access.ok) {
				set.status = access.status;
				return fail(access.error, access.code);
			}

			try {
				const metrics = await getGovernancePolicyDecisionMetrics();
				return ok({
					metric: "drenyra_api_governance_policy_decisions_total",
					values: metrics,
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(
					getErrorMessage(error, "Unable to retrieve governance metrics"),
					"GOVERNANCE_METRICS_ERROR",
				);
			}
		},
		{
			detail: {
				tags: ["Governance Audit"],
				summary: "Get governance decision metrics",
				description:
					"Returns governance policy decision counters grouped by action/decision/reason code.",
			},
		},
	)
	.get(
		"/metrics/prometheus",
		async ({ headers, set }) => {
			const access = await resolveGovernanceMetricsAccess(
				headers as Record<string, unknown>,
			);
			if (!access.ok) {
				set.status = access.status;
				return fail(access.error, access.code);
			}

			try {
				const payload = await getGovernancePolicyDecisionPrometheusText();
				return new Response(payload, {
					headers: {
						"Content-Type": "text/plain; version=0.0.4",
					},
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(
					getErrorMessage(
						error,
						"Unable to retrieve governance metrics payload",
					),
					"GOVERNANCE_PROM_METRICS_ERROR",
				);
			}
		},
		{
			detail: {
				tags: ["Governance Audit"],
				summary: "Get governance metrics in Prometheus format",
				description:
					"Exposes drenyra_api_governance_policy_decisions_total in Prometheus text format.",
			},
		},
	);
