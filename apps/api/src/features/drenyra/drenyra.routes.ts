import {
	type DrenyraActorContext,
	DrenyraFiscalCommandCenterService,
	type DrenyraRepository,
	InMemoryDrenyraRepository,
} from "@drenyra/application/drenyra";
import { DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY } from "@drenyra/domain/drenyra";
import type { AgentContext,
	ApprovalRequest, } from "@drenyra/pi";
import { AgentEventBus,
	ApprovalGateEngine,
	ApprovalStore,
	MastraDrenyraOrchestrator as DrenyraOrchestrator,
	IntentDetector, } from "@drenyra/pi";
import { PostgresDrenyraRepository } from "@drenyra/persistence/repositories/postgres-drenyra.repository";
import { Elysia, t } from "elysia";
import { evaluateDrenyraCapability } from "../../../../../packages/domain/src/drenyra/capabilities";
import type {
	DrenyraCapabilityEvaluation,
	DrenyraCapabilityGrant,
	DrenyraToolId,
} from "../../../../../packages/domain/src/drenyra/capability-types";
import type { DrenyraAgentType } from "../../../../../packages/domain/src/drenyra/types";
import { fail, ok } from "../shared/api-response";
import { createAllAgents } from "./agents";
import { drenyraBrainModule } from "./brain";
import { createDrenyraCommandEnvelopeRoutes } from "./drenyra-command-envelope.routes";

interface DrenyraToolAuthorizationInput {
	agent: string;
	toolName: string;
	context: AgentContext & {
		fiscalPeriod?: string;
		capabilityGrant?: string;
		redactionOk?: boolean;
	};
}

const approvalStore = new ApprovalStore();
const eventBus = new AgentEventBus();
const intentDetector = new IntentDetector();
const approvalGate = new ApprovalGateEngine(approvalStore);

const drenyra = new DrenyraOrchestrator(approvalGate, eventBus, (input, ctx) =>
	intentDetector.detectIntent(input, ctx),
);
function createDrenyraRepository(): DrenyraRepository {
	const isTest =
		process.env.VITEST === "true" || process.env.NODE_ENV === "test";
	if (process.env.DATABASE_URL && !isTest) {
		return new PostgresDrenyraRepository();
	}
	return new InMemoryDrenyraRepository();
}

const commandCenter = new DrenyraFiscalCommandCenterService(
	createDrenyraRepository(),
);

for (const agent of createAllAgents()) {
	drenyra.registerAgent(
		agent as unknown as Parameters<DrenyraOrchestrator["registerAgent"]>[0],
	);
}

function toSseChunk(event: string, payload: unknown): string {
	return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

interface SseApprovalEvent {
	id: string;
	toolName: string;
	summary: string;
	module: string;
	approvalLevel: string;
	state: string;
	proposedAt: string;
	companyId: string;
	ruc: string;
}

function formatApproval(a: ApprovalRequest): SseApprovalEvent {
	return {
		id: a.id,
		toolName: a.toolName,
		summary: a.governanceResult?.reasons?.join(", ") || `Execute ${a.toolName}`,
		module: a.toolName.split("_")[0] || a.toolName,
		approvalLevel: a.approvalLevel,
		state: a.state,
		proposedAt: a.proposedAt.toISOString(),
		companyId: a.context.companyId,
		ruc: a.context.ruc,
	};
}

function isStringResult(
	result:
		| { success: boolean; data: unknown }
		| { success: boolean; error: string },
): result is { success: true; data: string } {
	return "data" in result && typeof result.data === "string";
}

/**
 * Result of resolving Drenyra tenant and user context from governance headers.
 *
 * @returns Discriminated union with either a trusted AgentContext or missing-header error.
 * @example
 * ```ts
 * const result: DrenyraAgentContextResolution = { ok: false, code: "TENANT_CONTEXT_REQUIRED", error: "missing", details: { missingHeaders: [] } };
 * console.log(result.ok);
 * ```
 */
export type DrenyraAgentContextResolution =
	| { ok: true; context: AgentContext }
	| {
			ok: false;
			code: "TENANT_CONTEXT_REQUIRED";
			error: string;
			details: { missingHeaders: string[] };
	  };

function readRequiredHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string | null {
	const value = headers[key]?.trim();
	return value ? value : null;
}

function readOptionalHeader(
	headers: Record<string, string | undefined>,
	key: string,
): string {
	return headers[key]?.trim() ?? "";
}

/**
 * Resolves Drenyra AgentContext from trusted request governance headers.
 *
 * @param headers - Elysia request headers containing tenant and user identifiers.
 * @returns Trusted AgentContext or a fail-closed missing-header result.
 * @example
 * ```ts
 * const result = resolveAgentContextFromHeaders({ "x-company-id": "cmp-1", "x-user-id": "user-1" });
 * console.log(result.ok);
 * ```
 */
export function resolveAgentContextFromHeaders(
	headers: Record<string, string | undefined>,
): DrenyraAgentContextResolution {
	const companyId = readRequiredHeader(headers, "x-company-id");
	const userId = readRequiredHeader(headers, "x-user-id");
	const missingHeaders = [
		...(companyId ? [] : ["x-company-id"]),
		...(userId ? [] : ["x-user-id"]),
	];

	if (!companyId || !userId) {
		return {
			ok: false,
			code: "TENANT_CONTEXT_REQUIRED",
			error: "Drenyra requests require tenant and user context headers",
			details: { missingHeaders },
		};
	}

	return {
		ok: true,
		context: {
			tenantId: companyId,
			userId,
			organizationId: companyId,
			companyId,
			ruc: readOptionalHeader(headers, "x-company-ruc"),
			fiscalPeriod: readOptionalHeader(headers, "x-fiscal-period") || undefined,
			capabilityGrant:
				readOptionalHeader(headers, "x-drenyra-capability-grant") || undefined,
			redactionOk:
				readOptionalHeader(headers, "x-drenyra-redaction-ok") === "true",
			traceId: `trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
		} as AgentContext,
	};
}

function resolveFiscalAgentContextFromHeaders(
	headers: Record<string, string | undefined>,
): DrenyraAgentContextResolution {
	const base = resolveAgentContextFromHeaders(headers);
	if (!base.ok) return base;
	const companyRuc = readRequiredHeader(headers, "x-company-ruc");
	const period = readRequiredHeader(headers, "x-fiscal-period");
	const missingHeaders = [
		...(companyRuc ? [] : ["x-company-ruc"]),
		...(period ? [] : ["x-fiscal-period"]),
	];
	if (!companyRuc || !period) {
		return {
			ok: false,
			code: "TENANT_CONTEXT_REQUIRED",
			error: "Drenyra chat requests require company RUC and fiscal period",
			details: { missingHeaders },
		};
	}
	return base;
}

function resolveDrenyraActorContext(
	headers: Record<string, string | undefined>,
):
	| { ok: true; context: DrenyraActorContext }
	| { ok: false; missingHeaders: string[] } {
	const companyId = readRequiredHeader(headers, "x-company-id");
	const userId = readRequiredHeader(headers, "x-user-id");
	const companyRuc = readRequiredHeader(headers, "x-company-ruc");
	const period = readRequiredHeader(headers, "x-fiscal-period");
	const missingHeaders = [
		...(companyId ? [] : ["x-company-id"]),
		...(userId ? [] : ["x-user-id"]),
		...(companyRuc ? [] : ["x-company-ruc"]),
		...(period ? [] : ["x-fiscal-period"]),
	];
	if (!companyId || !userId || !companyRuc || !period)
		return { ok: false, missingHeaders };
	return {
		ok: true,
		context: {
			companyId,
			companyRuc,
			organizationId:
				readOptionalHeader(headers, "x-organization-id") || companyId,
			period,
			userId,
		},
	};
}

function drenyraActorContextFailure(missingHeaders: string[]) {
	return fail(
		"Drenyra command center requests require company, RUC, fiscal period and user headers",
		"TENANT_CONTEXT_REQUIRED",
		{
			details: { missingHeaders },
		},
	);
}

function capabilityDenied(evaluation: DrenyraCapabilityEvaluation) {
	return fail("Drenyra capability denied", "DRENYRA_CAPABILITY_DENIED", {
		details: {
			reason: evaluation.reason,
			auditEventType: evaluation.auditEventType,
			policy: evaluation.policy,
		},
	});
}

function resolveDrenyraCapabilityGrant(
	headers: Record<string, string | undefined>,
	context: DrenyraActorContext,
	agentType: DrenyraAgentType,
	toolId: DrenyraToolId,
): DrenyraCapabilityGrant[] {
	if (readOptionalHeader(headers, "x-drenyra-capability-grant") !== "scoped") {
		return [];
	}
	return [
		{
			agentType,
			toolId,
			scope: {
				companyId: context.companyId,
				companyRuc: context.companyRuc,
				organizationId: context.organizationId,
				period: context.period,
				countryCode: "PE",
			},
			grantedBy: context.userId,
			grantedAt: new Date(0).toISOString(),
		},
	];
}

function evaluateRouteCapability(input: {
	headers: Record<string, string | undefined>;
	context: DrenyraActorContext;
	agentType: DrenyraAgentType;
	toolId: DrenyraToolId;
	approvalId?: string;
}): DrenyraCapabilityEvaluation {
	return evaluateDrenyraCapability({
		request: {
			agentType: input.agentType,
			toolId: input.toolId,
			scope: {
				companyId: input.context.companyId,
				companyRuc: input.context.companyRuc,
				organizationId: input.context.organizationId,
				period: input.context.period,
				countryCode: "PE",
			},
			redactionOk:
				readOptionalHeader(input.headers, "x-drenyra-redaction-ok") === "true",
			approvalId: input.approvalId,
		},
		grants: resolveDrenyraCapabilityGrant(
			input.headers,
			input.context,
			input.agentType,
			input.toolId,
		),
	});
}

function assertRouteCapability(
	set: { status?: number | string },
	input: {
		headers: Record<string, string | undefined>;
		context: DrenyraActorContext;
		agentType: DrenyraAgentType;
		toolId: DrenyraToolId;
		approvalId?: string;
	},
): { ok: true } | { ok: false; response: ReturnType<typeof capabilityDenied> } {
	const evaluation = evaluateRouteCapability(input);
	if (evaluation.decision === "allowed") {
		return { ok: true };
	}
	set.status = 403;
	return { ok: false, response: capabilityDenied(evaluation) };
}

function mapChatToolCapability(input: {
	agent: string;
	toolName: string;
}): { agentType: DrenyraAgentType; toolId: DrenyraToolId } | null {
	if (input.agent !== "compliance") return null;
	if (input.toolName === "calculate_igv") {
		return { agentType: "FISCAL_REVIEWER_AGENT", toolId: "calculate_igv" };
	}
	if (input.toolName === "validate_cpe") {
		return { agentType: "CPE_AGENT", toolId: "validate_cpe" };
	}
	if (input.toolName === "get_tax_calendar") {
		return { agentType: "FISCAL_REVIEWER_AGENT", toolId: "get_tax_calendar" };
	}
	if (input.toolName === "submit_sire") {
		return { agentType: "SIRE_AGENT", toolId: "submit_sunat_sire" };
	}
	return { agentType: "FISCAL_REVIEWER_AGENT", toolId: "promote_fiscal_truth" };
}

function authorizeDrenyraChatTool(input: DrenyraToolAuthorizationInput) {
	const capability = mapChatToolCapability({
		agent: input.agent,
		toolName: input.toolName,
	});
	if (!capability) return { ok: true as const, data: undefined };
	const period = input.context.fiscalPeriod;
	if (!input.context.ruc || !period) {
		return {
			ok: false as const,
			error: "Drenyra chat fiscal tools require RUC and fiscal period",
			code: "TENANT_CONTEXT_REQUIRED",
		};
	}
	const evaluation = evaluateDrenyraCapability({
		request: {
			agentType: capability.agentType,
			toolId: capability.toolId,
			scope: {
				companyId: input.context.companyId,
				companyRuc: input.context.ruc,
				organizationId: input.context.organizationId,
				period,
				countryCode: "PE",
			},
			redactionOk: input.context.redactionOk === true,
		},
		grants:
			input.context.capabilityGrant === "scoped"
				? [
						{
							agentType: capability.agentType,
							toolId: capability.toolId,
							scope: {
								companyId: input.context.companyId,
								companyRuc: input.context.ruc,
								organizationId: input.context.organizationId,
								period,
								countryCode: "PE",
							},
							grantedBy: input.context.userId,
							grantedAt: new Date(0).toISOString(),
						},
					]
				: [],
	});
	if (evaluation.decision === "allowed")
		return { ok: true as const, data: undefined };
	return {
		ok: false as const,
		error: "Drenyra capability denied",
		code: "DRENYRA_CAPABILITY_DENIED",
		details: {
			reason: evaluation.reason,
			auditEventType: evaluation.auditEventType,
			policy: evaluation.policy,
		},
	};
}

function commandCenterError(error: unknown) {
	if (error instanceof Error) {
		if (error.message.endsWith("_NOT_FOUND"))
			return fail(error.message, "NOT_FOUND");
		if (
			error.message === "APPROVAL_ALREADY_DECIDED" ||
			error.message === "FISCAL_CASE_STATUS_UNCHANGED"
		)
			return fail(error.message, "CONFLICT");
		return fail(error.message, "DRENYRA_COMMAND_CENTER_ERROR");
	}
	return fail(
		"Unknown Drenyra command center error",
		"DRENYRA_COMMAND_CENTER_ERROR",
	);
}

const fiscalCaseTypeSchema = t.Union([
	t.Literal("MONTHLY_CLOSE"),
	t.Literal("CPE_REVIEW"),
	t.Literal("SIRE_REVIEW"),
	t.Literal("LEDGER_REVIEW"),
	t.Literal("CONCILIATION"),
	t.Literal("EVIDENCE_REVIEW"),
]);
const manualFiscalCaseStatusSchema = t.Union([
	t.Literal("OPEN"),
	t.Literal("IN_REVIEW"),
	t.Literal("RESOLVED"),
	t.Literal("ARCHIVED"),
]);
const fiscalRiskLevelSchema = t.Union([
	t.Literal("LOW"),
	t.Literal("MEDIUM"),
	t.Literal("HIGH"),
	t.Literal("CRITICAL"),
]);
const autonomyLevelSchema = t.Union([
	t.Literal("ADVISORY"),
	t.Literal("DRAFT_ONLY"),
	t.Literal("PREPARE_WITH_APPROVAL"),
	t.Literal("EXECUTE_AFTER_APPROVAL"),
]);
const evidenceTypeSchema = t.Union([
	t.Literal("DOCUMENT"),
	t.Literal("SUNAT_RECORD"),
	t.Literal("LEDGER_ENTRY"),
	t.Literal("BANK_STATEMENT"),
	t.Literal("USER_NOTE"),
	t.Literal("AGENT_OUTPUT"),
]);
const drenyraAgentTypeSchema = t.Union([
	t.Literal("CPE_AGENT"),
	t.Literal("SIRE_AGENT"),
	t.Literal("LEDGER_AGENT"),
	t.Literal("CONCILIATION_AGENT"),
	t.Literal("FISCAL_REVIEWER_AGENT"),
	t.Literal("EVIDENCE_AGENT"),
]);
const metadataSchema = t.Optional(t.Record(t.String(), t.Unknown()));

function drenyraContextFailure(
	resolution: Extract<DrenyraAgentContextResolution, { ok: false }>,
) {
	return fail(resolution.error, resolution.code, {
		details: resolution.details,
	});
}

function approvalMatchesContext(
	approval: ApprovalRequest,
	context: AgentContext,
): boolean {
	return (
		approval.context.tenantId === context.tenantId &&
		approval.context.companyId === context.companyId
	);
}

function approvalNotFound() {
	return {
		ok: false as const,
		error: "Approval request not found",
		code: "NOT_FOUND",
	};
}

function readReviewerRole(
	headers: Record<string, string | undefined>,
): string | null {
	const role = headers["x-user-role"]?.trim();
	return role ? role : null;
}

/**
 * drenyraModule const.
 *
 * @example
 * ```ts
 * console.log(drenyraModule);
 * ```
 */
/** Simple prefix-based idempotency cache for create-case requests. */
const idempotencyCache = new Map<string, { id: string; status: number }>();

export const drenyraModule = new Elysia({
	prefix: "/api/drenyra",
	name: "drenyra",
})
	.use(drenyraBrainModule)
	.get(
		"/contract",
		async () => {
			return {
				ok: true,
				data: {
					version: "dual-surface-v1",
					requiredScopeHeaders: [
						"x-company-ruc",
						"x-fiscal-period",
						"x-drenyra-capability-grant",
					],
					idempotencyHeader: "x-idempotency-key",
					platformCategory: "ai_augmented_fiscal_sovereignty_platform",
					fiscalOntologyVersion: "2026-05.fiscal-ontology.v1",
					agentGovernance: {
						denyByDefault: true,
						capabilityManifestFields: ["redactionRequired", "approvalRequired"],
						materialFiscalActionsRequireHumanApproval: true,
					},
				},
			};
		},
		{
			detail: {
				tags: ["Drenyra"],
				summary: "Expose the Drenyra dual-surface contract",
			},
		},
	)
	.get(
		"/cases",
		async ({ headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const capability = assertRouteCapability(set, {
				headers,
				context: contextResolution.context,
				agentType: "FISCAL_REVIEWER_AGENT",
				toolId: "list_fiscal_cases",
			});
			if (!capability.ok) return capability.response;
			const cases = await commandCenter.listFiscalCases(
				contextResolution.context,
			);
			return ok(cases);
		},
		{ detail: { tags: ["Drenyra"], summary: "List Drenyra fiscal cases" } },
	)
	.post(
		"/cases",
		async ({ body, headers, set }) => {
			const idempotencyKey = readOptionalHeader(headers, "x-idempotency-key");
			if (idempotencyKey) {
				const cached = idempotencyCache.get(idempotencyKey);
				if (cached) {
					set.status = cached.status;
					return ok({ id: cached.id });
				}
			}
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			try {
				const fiscalCase = await commandCenter.createFiscalCase(
					contextResolution.context,
					body,
				);
				set.status = 201;
				if (idempotencyKey) {
					idempotencyCache.set(idempotencyKey, {
						id: fiscalCase.id,
						status: 201,
					});
				}
				return ok(fiscalCase);
			} catch (error) {
				set.status = 400;
				return commandCenterError(error);
			}
		},
		{
			body: t.Object({
				type: fiscalCaseTypeSchema,
				title: t.String({ minLength: 3 }),
				description: t.String({ minLength: 3 }),
				riskLevel: t.Optional(fiscalRiskLevelSchema),
				riskScore: t.Optional(t.Integer({ minimum: 0, maximum: 100 })),
				autonomyLevel: t.Optional(autonomyLevelSchema),
				metadata: metadataSchema,
			}),
			detail: { tags: ["Drenyra"], summary: "Create Drenyra fiscal case" },
		},
	)
	.post(
		"/missions/from-document",
		async ({ body, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const capability = assertRouteCapability(set, {
				headers,
				context: contextResolution.context,
				agentType: "SIRE_AGENT",
				toolId: "run_agent_review",
			});
			if (!capability.ok) return capability.response;
			try {
				const mission = await commandCenter.bootstrapDocumentMission(
					contextResolution.context,
					body,
				);
				set.status = 201;
				return ok(mission);
			} catch (error) {
				set.status = 400;
				return commandCenterError(error);
			}
		},
		{
			body: t.Object({
				documentId: t.String({ minLength: 3 }),
				filename: t.String({ minLength: 1 }),
				mimeType: t.Optional(t.String({ minLength: 3 })),
			}),
			detail: {
				tags: ["Drenyra"],
				summary: "Bootstrap fiscal mission from uploaded document",
			},
		},
	)
	.use(createDrenyraCommandEnvelopeRoutes(commandCenter))
	.get(
		"/fiscal-work/:id/inspect",
		async ({ params, headers, set }) => {
			const traceId =
				readOptionalHeader(headers, "x-trace-id") ||
				`trace-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
			const sourceSurface = ((
				v: string,
			): "cli" | "web" | "api" | "automation" =>
				v === "cli" || v === "web" || v === "automation" ? v : "api")(
				readOptionalHeader(headers, "x-drenyra-source-surface"),
			);
			const capabilityGrant = readOptionalHeader(
				headers,
				"x-drenyra-capability-grant",
			);
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return {
					status: "validation_failed",
					reasonCode: "TENANT_CONTEXT_REQUIRED",
					traceId,
					capabilityId: capabilityGrant,
					sourceSurface,
					data: undefined,
					evidenceRefs: undefined,
					summary: "Missing tenant context",
					redactedDetail: contextResolution.missingHeaders.join(", "),
				};
			}
			if (capabilityGrant !== DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY) {
				set.status = 403;
				return {
					status: "denied",
					reasonCode: "DRENYRA_CAPABILITY_DENIED",
					traceId,
					capabilityId: capabilityGrant,
					sourceSurface,
					data: undefined,
					evidenceRefs: undefined,
					summary: "Fiscal work inspect requires explicit capability grant",
				};
			}
			const envelope = await commandCenter.inspectFiscalWorkItem(
				contextResolution.context,
				{
					workItemId: params.id,
					capabilityGranted: true,
					traceId,
					sourceSurface,
				},
			);
			if (envelope.status === "not_found") {
				set.status = 404;
			}
			return {
				status: envelope.status,
				reasonCode:
					envelope.status === "success"
						? "OK"
						: envelope.status === "denied"
							? "DRENYRA_CAPABILITY_DENIED"
							: "NOT_FOUND",
				traceId,
				capabilityId: capabilityGrant,
				sourceSurface,
				data: envelope.data,
				evidenceRefs: envelope.evidenceRefs,
				summary: envelope.summary,
				redactedDetail: envelope.redactedDetail,
			};
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			detail: {
				tags: ["Drenyra"],
				summary: "Inspect scoped Drenyra fiscal work item",
			},
		},
	)
	.get(
		"/cases/:id",
		async ({ params, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const capability = assertRouteCapability(set, {
				headers,
				context: contextResolution.context,
				agentType: "FISCAL_REVIEWER_AGENT",
				toolId: "list_fiscal_cases",
			});
			if (!capability.ok) return capability.response;
			const details = await commandCenter.getFiscalCaseDetails(
				contextResolution.context,
				params.id,
			);
			if (!details) {
				set.status = 404;
				return fail("Fiscal case not found", "NOT_FOUND");
			}
			return ok(details);
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			detail: { tags: ["Drenyra"], summary: "Get Drenyra fiscal case details" },
		},
	)
	.patch(
		"/cases/:id/status",
		async ({ params, body, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			try {
				const fiscalCase = await commandCenter.updateFiscalCaseStatus(
					contextResolution.context,
					params.id,
					body,
				);
				return ok(fiscalCase);
			} catch (error) {
				set.status =
					error instanceof Error && error.message.endsWith("_NOT_FOUND")
						? 404
						: error instanceof Error &&
								error.message === "FISCAL_CASE_STATUS_UNCHANGED"
							? 409
							: 400;
				return commandCenterError(error);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: t.Object({
				status: manualFiscalCaseStatusSchema,
				reason: t.Optional(t.String({ maxLength: 500 })),
			}),
			detail: {
				tags: ["Drenyra"],
				summary: "Update Drenyra fiscal case status",
			},
		},
	)
	.post(
		"/cases/:id/evidence",
		async ({ params, body, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const capability = assertRouteCapability(set, {
				headers,
				context: contextResolution.context,
				agentType: "EVIDENCE_AGENT",
				toolId: "explain_evidence",
			});
			if (!capability.ok) return capability.response;
			try {
				const evidence = await commandCenter.addEvidenceItem(
					contextResolution.context,
					params.id,
					body,
				);
				set.status = 201;
				return ok(evidence);
			} catch (error) {
				set.status =
					error instanceof Error && error.message.endsWith("_NOT_FOUND")
						? 404
						: 400;
				return commandCenterError(error);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: t.Object({
				type: evidenceTypeSchema,
				title: t.String({ minLength: 2 }),
				summary: t.String({ minLength: 2 }),
				source: t.String({ minLength: 2 }),
				sourceRef: t.Optional(t.String()),
				contentHash: t.Optional(t.String()),
				metadata: metadataSchema,
			}),
			detail: {
				tags: ["Drenyra"],
				summary: "Add evidence to Drenyra fiscal case",
			},
		},
	)
	.post(
		"/cases/:id/agent-runs",
		async ({ params, body, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const capability = assertRouteCapability(set, {
				headers,
				context: contextResolution.context,
				agentType: body.agentType,
				toolId: "run_agent_review",
			});
			if (!capability.ok) return capability.response;
			try {
				const run = await commandCenter.startAndCompleteMockAgentRun(
					contextResolution.context,
					params.id,
					body.agentType,
				);
				set.status = 201;
				return ok(run);
			} catch (error) {
				set.status =
					error instanceof Error && error.message.endsWith("_NOT_FOUND")
						? 404
						: 400;
				return commandCenterError(error);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: t.Object({ agentType: drenyraAgentTypeSchema }),
			detail: {
				tags: ["Drenyra"],
				summary: "Start deterministic mock Drenyra agent run",
			},
		},
	)
	.get(
		"/cases/:id/agent-runs",
		async ({ params, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const capability = assertRouteCapability(set, {
				headers,
				context: contextResolution.context,
				agentType: "SIRE_AGENT",
				toolId: "run_agent_review",
			});
			if (!capability.ok) return capability.response;
			try {
				const runs = await commandCenter.listAgentRuns(
					contextResolution.context,
					params.id,
				);
				return ok(runs);
			} catch (error) {
				set.status = 404;
				return commandCenterError(error);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			detail: { tags: ["Drenyra"], summary: "List Drenyra agent runs" },
		},
	)
	.post(
		"/cases/:id/approvals",
		async ({ params, body, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			const capability = assertRouteCapability(set, {
				headers,
				context: contextResolution.context,
				agentType: "FISCAL_REVIEWER_AGENT",
				toolId: "request_approval",
			});
			if (!capability.ok) return capability.response;
			try {
				const approval = await commandCenter.requestApproval(
					contextResolution.context,
					params.id,
					body,
				);
				set.status = 201;
				return ok(approval);
			} catch (error) {
				set.status =
					error instanceof Error && error.message.endsWith("_NOT_FOUND")
						? 404
						: 400;
				return commandCenterError(error);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: t.Object({
				title: t.String({ minLength: 2 }),
				description: t.String({ minLength: 2 }),
				autonomyLevel: t.Optional(autonomyLevelSchema),
				diff: t.Object({
					before: t.Record(t.String(), t.Unknown()),
					after: t.Record(t.String(), t.Unknown()),
					summary: t.String({ minLength: 2 }),
				}),
				metadata: metadataSchema,
			}),
			detail: { tags: ["Drenyra"], summary: "Request Drenyra approval" },
		},
	)
	.post(
		"/approvals/:id/approve",
		async ({ params, body, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			try {
				const approval = await commandCenter.approveApprovalRequest(
					contextResolution.context,
					params.id,
					body,
				);
				return ok(approval);
			} catch (error) {
				set.status =
					error instanceof Error && error.message === "APPROVAL_ALREADY_DECIDED"
						? 409
						: 404;
				return commandCenterError(error);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: t.Object({ decisionReason: t.Optional(t.String()) }),
			detail: {
				tags: ["Drenyra"],
				summary: "Approve Drenyra approval request",
			},
		},
	)
	.post(
		"/approvals/:id/reject",
		async ({ params, body, headers, set }) => {
			const contextResolution = resolveDrenyraActorContext(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraActorContextFailure(contextResolution.missingHeaders);
			}
			try {
				const approval = await commandCenter.rejectApprovalRequest(
					contextResolution.context,
					params.id,
					body,
				);
				return ok(approval);
			} catch (error) {
				set.status =
					error instanceof Error && error.message === "APPROVAL_ALREADY_DECIDED"
						? 409
						: 404;
				return commandCenterError(error);
			}
		},
		{
			params: t.Object({ id: t.String({ minLength: 1 }) }),
			body: t.Object({ decisionReason: t.Optional(t.String()) }),
			detail: { tags: ["Drenyra"], summary: "Reject Drenyra approval request" },
		},
	)
	.post(
		"/chat",
		async ({ body, headers, set }) => {
			const contextResolution = resolveFiscalAgentContextFromHeaders(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraContextFailure(contextResolution);
			}

			const result = await drenyra.handleInput(
				body.message,
				contextResolution.context,
				body.sessionId,
			);
			return {
				ok: true,
				sessionId: result.sessionId,
				agent: result.agent,
				intent: {
					agent: result.intent.agent,
					tool: result.intent.tool,
					confidence: result.intent.confidence,
				},
				result: result.result,
			};
		},
		{
			body: t.Object({
				message: t.String({ minLength: 1 }),
				sessionId: t.Optional(t.String()),
			}),
		},
	)
	.get(
		"/chat/stream",
		async ({ query, headers, request }) => {
			const contextResolution = resolveFiscalAgentContextFromHeaders(headers);
			if (!contextResolution.ok) {
				return Response.json(drenyraContextFailure(contextResolution), {
					status: 400,
				});
			}

			const context = contextResolution.context;
			const encoder = new TextEncoder();

			const stream = new ReadableStream<Uint8Array>({
				async start(controller) {
					let isClosed = false;

					const emit = (event: string, payload: unknown) => {
						if (isClosed) return;
						controller.enqueue(encoder.encode(toSseChunk(event, payload)));
					};

					const close = () => {
						if (isClosed) return;
						isClosed = true;
						try {
							controller.close();
						} catch {
							/* already closed */
						}
					};

					request.signal.addEventListener("abort", close, {
						once: true,
					});

					try {
						const intent = await intentDetector.detectIntent(
							query.message,
							context,
						);

						emit("intent", {
							agent: intent.agent,
							tool: intent.tool,
							confidence: intent.confidence,
						});

						const result = await drenyra.handleInput(
							query.message,
							context,
							query.sessionId,
						);

						if (isStringResult(result.result)) {
							const CHUNK_SIZE = 50;
							const text = result.result.data;
							for (let i = 0; i < text.length; i += CHUNK_SIZE) {
								emit("token", {
									token: text.slice(i, i + CHUNK_SIZE),
								});
							}
						}

						emit("result", {
							ok: result.result.success,
							data: "data" in result.result ? result.result.data : undefined,
							error: "error" in result.result ? result.result.error : undefined,
							sessionId: result.sessionId,
							agent: result.agent,
						});
					} catch (error) {
						emit("error", {
							error: error instanceof Error ? error.message : "Unknown error",
						});
					} finally {
						emit("done", {});
						close();
					}
				},
			});

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache, no-transform",
					Connection: "keep-alive",
					"X-Accel-Buffering": "no",
				},
			});
		},
		{
			query: t.Object({
				message: t.String({ minLength: 1 }),
				sessionId: t.Optional(t.String()),
			}),
		},
	)
	.get(
		"/approvals/stream",
		async ({ query, request }) => {
			const encoder = new TextEncoder();
			const companyId = query.companyId.trim();
			if (!companyId) {
				return Response.json(
					fail(
						"Drenyra approvals stream requires a non-empty companyId",
						"TENANT_CONTEXT_REQUIRED",
						{
							field: "companyId",
						},
					),
					{ status: 400 },
				);
			}
			const context: AgentContext = {
				tenantId: companyId,
				userId: "sse-client",
				organizationId: companyId,
				companyId,
				ruc: "",
				traceId: `sse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
			};

			const stream = new ReadableStream<Uint8Array>({
				async start(controller) {
					let isClosed = false;

					const emit = (event: string, payload: unknown) => {
						if (isClosed) return;
						controller.enqueue(encoder.encode(toSseChunk(event, payload)));
					};

					const close = () => {
						if (isClosed) return;
						isClosed = true;
						try {
							controller.close();
						} catch {
							/* already closed */
						}
					};

					request.signal.addEventListener("abort", close, {
						once: true,
					});

					const seen = new Map<string, string>();

					emit("connected", {
						status: "connected",
						companyId: context.companyId,
					});

					const emitSnapshot = () => {
						const pending = approvalGate.getPendingApprovals(context);
						const data = pending.map(formatApproval);
						for (const a of pending) {
							seen.set(a.id, a.state);
						}
						emit("snapshot", data);
					};

					emitSnapshot();

					const pollTimer = setInterval(() => {
						if (isClosed) {
							clearInterval(pollTimer);
							return;
						}

						const current = approvalGate.getPendingApprovals(context);
						const currentIds = new Set(current.map((a) => a.id));

						for (const approval of current) {
							const prevState = seen.get(approval.id);
							if (!prevState) {
								seen.set(approval.id, approval.state);
								emit("approval.new", formatApproval(approval));
							} else if (prevState !== approval.state) {
								seen.set(approval.id, approval.state);
								emit("approval.updated", formatApproval(approval));
							}
						}

						for (const [id] of seen) {
							if (!currentIds.has(id)) {
								seen.delete(id);
								emit("approval.resolved", { id });
							}
						}
					}, 5000);

					const heartbeatTimer = setInterval(() => {
						if (isClosed) {
							clearInterval(heartbeatTimer);
							return;
						}
						emit("heartbeat", { time: new Date().toISOString() });
					}, 30000);

					request.signal.addEventListener(
						"abort",
						() => {
							isClosed = true;
							clearInterval(pollTimer);
							clearInterval(heartbeatTimer);
							close();
						},
						{ once: true },
					);
				},
			});

			return new Response(stream, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache, no-transform",
					Connection: "keep-alive",
					"X-Accel-Buffering": "no",
				},
			});
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
			}),
		},
	)
	.get(
		"/approvals",
		async ({ headers, set }) => {
			const contextResolution = resolveAgentContextFromHeaders(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraContextFailure(contextResolution);
			}

			const allApprovals = approvalStore.listByContext(
				contextResolution.context,
			);
			return {
				ok: true,
				approvals: allApprovals
					.sort((a, b) => b.proposedAt.getTime() - a.proposedAt.getTime())
					.map((a) => ({
						id: a.id,
						toolName: a.toolName,
						summary:
							a.governanceResult?.reasons?.join(", ") ||
							`Execute ${a.toolName}`,
						module: a.toolName.split("_")[0] || a.toolName,
						approvalLevel: a.approvalLevel,
						state: a.state,
						proposedAt: a.proposedAt.toISOString(),
						decidedAt: a.decidedAt?.toISOString(),
						companyId: a.context.companyId,
						ruc: a.context.ruc,
						reviewerId: a.reviewerId,
						rationale: a.rationale,
						reviewerRole: a.reviewerRole,
					})),
			};
		},
		{
			query: t.Optional(t.Object({ companyId: t.Optional(t.String()) })),
		},
	)
	.post(
		"/approve",
		async ({ body, headers, set }) => {
			const contextResolution = resolveAgentContextFromHeaders(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraContextFailure(contextResolution);
			}

			const reviewerRole = readReviewerRole(headers);
			if (!reviewerRole) {
				set.status = 400;
				return fail(
					"Drenyra approval decisions require x-user-role",
					"TENANT_CONTEXT_REQUIRED",
					{
						details: { missingHeaders: ["x-user-role"] },
					},
				);
			}

			const approval = approvalStore.get(body.approvalId);
			if (
				!approval ||
				!approvalMatchesContext(approval, contextResolution.context)
			) {
				set.status = 404;
				return approvalNotFound();
			}

			const result = await approvalGate.approve(
				body.approvalId,
				contextResolution.context.userId,
				reviewerRole,
			);
			return result;
		},
		{
			body: t.Object({
				approvalId: t.String(),
				reviewerId: t.String(),
				role: t.String(),
			}),
		},
	)
	.post(
		"/reject",
		async ({ body, headers, set }) => {
			const contextResolution = resolveAgentContextFromHeaders(headers);
			if (!contextResolution.ok) {
				set.status = 400;
				return drenyraContextFailure(contextResolution);
			}

			const approval = approvalStore.get(body.approvalId);
			if (
				!approval ||
				!approvalMatchesContext(approval, contextResolution.context)
			) {
				set.status = 404;
				return approvalNotFound();
			}

			const result = await approvalGate.reject(
				body.approvalId,
				contextResolution.context.userId,
				body.rationale,
			);
			return result;
		},
		{
			body: t.Object({
				approvalId: t.String(),
				reviewerId: t.String(),
				rationale: t.Optional(t.String()),
			}),
		},
	);
