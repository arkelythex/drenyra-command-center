/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type {
	GetFiscalTruthEventQuery,
	GovernanceBundleService,
	ReplayFiscalTruthQuery,
} from "@arkelythex/application";
import type {
	EvidenceGraphRepository,
	FiscalTruthRepository,
	FiscalTruthScope,
} from "@arkelythex/domain";
import { Elysia } from "elysia";
import { z } from "zod";
import { fail, ok } from "../../shared/api-response";
import { AppendFiscalTruthApiCommand } from "./commands/append-fiscal-truth.command";
import { GetFiscalTruthEventApiQuery } from "./queries/get-fiscal-truth-event.query";
import { ReplayFiscalTruthApiQuery } from "./queries/replay-fiscal-truth.query";
import { appendFiscalTruthBodySchema } from "./schemas";

interface FiscalTruthRouteDeps {
	governance: GovernanceBundleService;
	evidenceRepository: EvidenceGraphRepository;
	fiscalTruthRepository: FiscalTruthRepository;
	getEvent: GetFiscalTruthEventQuery;
	replayQuery: ReplayFiscalTruthQuery;
}

function resolveScope(
	headers: Record<string, unknown>,
): FiscalTruthScope | null {
	const companyId =
		typeof headers["x-company-id"] === "string"
			? headers["x-company-id"]
			: null;
	const companyRuc =
		typeof headers["x-company-ruc"] === "string"
			? headers["x-company-ruc"]
			: null;
	const period =
		typeof headers["x-fiscal-period"] === "string"
			? headers["x-fiscal-period"]
			: null;
	const organizationIdRaw =
		typeof headers["x-organization-id"] === "string"
			? headers["x-organization-id"]
			: null;
	if (!companyId || !companyRuc || !period) return null;
	return {
		companyId,
		companyRuc,
		organizationId: organizationIdRaw ? Number(organizationIdRaw) : null,
		period,
		countryCode: "PE",
	};
}

function assertScopeMatch(
	expected: FiscalTruthScope,
	actual: FiscalTruthScope,
): boolean {
	return (
		expected.companyId === actual.companyId &&
		expected.companyRuc === actual.companyRuc &&
		expected.organizationId === actual.organizationId &&
		expected.period === actual.period &&
		expected.countryCode === actual.countryCode
	);
}

/**
 * Registers fiscal-truth API routes with strict company/RUC scope checks.
 */
export function fiscalTruthRoutes(deps: FiscalTruthRouteDeps) {
	const appendCommand = new AppendFiscalTruthApiCommand(
		deps.governance,
		deps.evidenceRepository,
		deps.fiscalTruthRepository,
	);
	const eventQuery = new GetFiscalTruthEventApiQuery(deps.getEvent);
	const replayQuery = new ReplayFiscalTruthApiQuery(deps.replayQuery);

	return new Elysia({ prefix: "/fiscal-truth" })
		.post(
			"/append",
			async ({ body, headers, set }) => {
				const headerScope = resolveScope(headers as Record<string, unknown>);
				if (!headerScope) {
					set.status = 400;
					return fail(
						"X-Company-Id, X-Company-Ruc and X-Fiscal-Period are required",
						"COMPANY_SCOPE_REQUIRED",
					);
				}
				if (
					!assertScopeMatch(headerScope, body.event.scope) ||
					!assertScopeMatch(headerScope, body.evidence.scope)
				) {
					set.status = 403;
					return fail(
						"Requested company/RUC does not match caller tenant scope",
						"TENANT_SCOPE_VIOLATION",
					);
				}

				try {
					await appendCommand.execute({
						expectedScope: headerScope,
						evidence: {
							...body.evidence,
							nodeKind: body.evidence.nodeKind as never,
						},
						event: {
							...body.event,
							eventKind: body.event.eventKind as never,
						},
						validatorResults: body.validatorResults,
						policyDecision: body.policyDecision,
						hasRequiredApproval: body.hasRequiredApproval,
					});
					set.status = 202;
					return ok({ accepted: true, eventId: body.event.eventId });
				} catch (error: unknown) {
					if (
						error instanceof Error &&
						error.message === "FISCAL_TRUTH_GOVERNANCE_REQUIRED"
					) {
						set.status = 409;
						return fail(
							"Governance bundle approval is required for authoritative promotion",
							"FISCAL_TRUTH_GOVERNANCE_REQUIRED",
						);
					}
					set.status = 400;
					return fail(
						error instanceof Error
							? error.message
							: "Failed to append fiscal truth",
						"FISCAL_TRUTH_APPEND_ERROR",
					);
				}
			},
			{
				body: appendFiscalTruthBodySchema,
				detail: {
					tags: ["Fiscal Truth"],
					summary: "Append and promote fiscal truth event",
				},
			},
		)
		.get(
			"/events/:eventId",
			async ({ params, headers, set }) => {
				const headerScope = resolveScope(headers as Record<string, unknown>);
				if (!headerScope) {
					set.status = 400;
					return fail(
						"X-Company-Id, X-Company-Ruc and X-Fiscal-Period are required",
						"COMPANY_SCOPE_REQUIRED",
					);
				}
				const result = await eventQuery.execute(params.eventId, headerScope);
				if (!result) {
					set.status = 404;
					return fail(
						"Fiscal truth event not found for requested scope",
						"FISCAL_TRUTH_EVENT_NOT_FOUND",
					);
				}
				return ok(result);
			},
			{
				params: z.object({ eventId: z.string().min(1) }),
				detail: {
					tags: ["Fiscal Truth"],
					summary: "Read one fiscal truth event",
				},
			},
		)
		.get(
			"/replay/:aggregateId",
			async ({ params, headers, set }) => {
				const headerScope = resolveScope(headers as Record<string, unknown>);
				if (!headerScope) {
					set.status = 400;
					return fail(
						"X-Company-Id, X-Company-Ruc and X-Fiscal-Period are required",
						"COMPANY_SCOPE_REQUIRED",
					);
				}
				const result = await replayQuery.execute(
					params.aggregateId,
					headerScope,
				);
				if (!result.success) set.status = 409;
				return ok(result);
			},
			{
				params: z.object({ aggregateId: z.string().min(1) }),
				detail: {
					tags: ["Fiscal Truth"],
					summary: "Replay one authoritative aggregate",
				},
			},
		);
}
