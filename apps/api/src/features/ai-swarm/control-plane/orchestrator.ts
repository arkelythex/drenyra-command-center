import { Elysia } from "elysia";
import {
	AgentCapabilitySchema,
	AgentRegistryEntrySchema,
	buildDeterministicHandoff,
	canHandoffToDeterministicFlow,
	createAppendOnlyTraceEvidenceStore,
	evaluateApprovalApplyGuard,
	lookupAllowedToolsForCapability,
	resolvePolicyDecision,
	type AgentCapability,
	type AgentRegistryEntry,
	type TraceEvidenceStore,
} from "@arkelythex/ai";
import { fail, ok } from "../../shared/api-response";
import {
	type ApprovalRecord,
	type AiControlPlaneModuleDependencies,
	policyPreviewBodySchema,
	capabilityLookupBodySchema,
	approvalRequestBodySchema,
	approvalScopeSchema,
	approvalDecisionBodySchema,
	traceRetrievalBodySchema,
} from "./types";
import {
	toApprovalLineage,
	syncTraceApprovalLineage,
	appendApprovalAuditEvent,
} from "./monitor";

const defaultAgentRegistry: Record<string, AgentRegistryEntry> = {
	"agent-reconciliation": AgentRegistryEntrySchema.parse({
		agentId: "agent-reconciliation",
		purpose: "Reconciliation advisory",
		tenantScope: {
			tenantId: "tenant-1",
			organizationId: "org-1",
			companyId: "company-1",
			ruc: "20123456789",
		},
		capabilities: ["advisory.review", "advisory.explain"],
		allowedTools: ["ledger.read", "sunat.lookup"],
		approvalClass: "financial-controller",
		supportedSurfaces: ["api"],
	}),
};

const createDefaultTraceEvidenceStore = (): TraceEvidenceStore =>
	createAppendOnlyTraceEvidenceStore({
		filePath:
			process.env.ARKELYTHEX_AI_CONTROL_PLANE_AUDIT_FILE ??
			"/tmp/opencode/arkelythex-ai-control-plane-trace-audit.ndjson",
	});

const parseCapability = (
	capability: string,
): { ok: true; value: AgentCapability } | { ok: false } => {
	const parsed = AgentCapabilitySchema.safeParse(capability);
	if (!parsed.success) {
		return { ok: false };
	}

	return { ok: true, value: parsed.data };
};

const toScope = (scope: {
	tenantId: string;
	organizationId: string;
	companyId: string;
	ruc: string;
}): ApprovalRecord["scope"] => ({
	tenantId: scope.tenantId,
	organizationId: scope.organizationId,
	companyId: scope.companyId,
	ruc: scope.ruc,
});

const scopeMatches = (
	left: ApprovalRecord["scope"],
	right: ApprovalRecord["scope"],
): boolean => {
	return (
		left.tenantId === right.tenantId &&
		left.organizationId === right.organizationId &&
		left.companyId === right.companyId &&
		left.ruc === right.ruc
	);
};

const toApprovalResponse = (approval: ApprovalRecord) => ({
	approvalId: approval.approvalId,
	traceId: approval.traceId,
	state: approval.state,
	requiresHumanApproval: approval.requiresHumanApproval,
	reviewerRole: approval.reviewerRole,
	canHandoffToDeterministic: canHandoffToDeterministicFlow({
		approvalState: approval.state,
		decisionAllowed: approval.allowed,
	}),
	authoritativeMutationAllowed: approval.authoritativeMutationAllowed,
});

/**
 * Creates an AI Control Plane route module with injectable runtime stores.
 *
 * @param dependencies - Optional registry, approval, and trace stores.
 * @returns Elysia route module preserving the public AI Control Plane API.
 * @example
 * ```ts
 * app.use(createAiControlPlaneModule());
 * ```
 */
export const createAiControlPlaneModule = (
	dependencies: AiControlPlaneModuleDependencies = {},
) => {
	const agentRegistry = dependencies.agentRegistry ?? defaultAgentRegistry;
	const approvalStore = dependencies.approvalStore ?? new Map<string, ApprovalRecord>();
	const traceEvidenceStore =
		dependencies.traceEvidenceStore ?? createDefaultTraceEvidenceStore();

	return new Elysia({
		prefix: "/api/ai-control-plane",
	})
	.post(
		"/policy/preview",
		({ body, set }) => {
			const registryEntry = agentRegistry[body.agentId];
			if (!registryEntry) {
				set.status = 404;
				return fail("Agent registry entry not found", "AGENT_NOT_FOUND");
			}

			const capability = parseCapability(body.requestedCapability);
			if (!capability.ok) {
				set.status = 400;
				return fail("Requested capability is invalid", "VALIDATION_ERROR");
			}

			const decision = resolvePolicyDecision({
				traceId: body.traceId,
				registryEntry,
				requestedScope: {
					tenantId: body.tenantId,
					organizationId: body.organizationId,
					companyId: body.companyId,
					ruc: body.ruc,
				},
				requestedCapability: capability.value,
				requestedTool: body.requestedTool,
			});

			return ok({
				...decision,
				canHandoffToDeterministic: canHandoffToDeterministicFlow({
					approvalState: decision.approvalState,
					decisionAllowed: decision.allowed,
				}),
			});
		},
		{
			body: policyPreviewBodySchema,
			detail: {
				tags: ["AI Control Plane"],
				summary: "Preview policy decision for advisory AI request",
			},
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail("Invalid policy preview request", "VALIDATION_ERROR");
				}

				return;
			},
		},
	)
	.post(
		"/capabilities/tools",
		({ body, set }) => {
			const registryEntry = agentRegistry[body.agentId];
			if (!registryEntry) {
				set.status = 404;
				return fail("Agent registry entry not found", "AGENT_NOT_FOUND");
			}

			const capability = parseCapability(body.requestedCapability);
			if (!capability.ok) {
				set.status = 400;
				return fail("Requested capability is invalid", "VALIDATION_ERROR");
			}

			return ok({
				allowedTools: lookupAllowedToolsForCapability({
					registryEntry,
					requestedCapability: capability.value,
				}),
			});
		},
		{
			body: capabilityLookupBodySchema,
			detail: {
				tags: ["AI Control Plane"],
				summary: "Lookup least-privilege allowed tools for capability",
			},
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail("Invalid capability lookup request", "VALIDATION_ERROR");
				}

				return;
			},
		},
	)
	.post(
		"/approval/request",
		({ body, set }) => {
			const registryEntry = agentRegistry[body.agentId];
			if (!registryEntry) {
				set.status = 404;
				return fail("Agent registry entry not found", "AGENT_NOT_FOUND");
			}

			const capability = parseCapability(body.requestedCapability);
			if (!capability.ok) {
				set.status = 400;
				return fail("Requested capability is invalid", "VALIDATION_ERROR");
			}

			const decision = resolvePolicyDecision({
				traceId: body.traceId,
				registryEntry,
				requestedScope: toScope(body),
				requestedCapability: capability.value,
				requestedTool: body.requestedTool,
			});

			if (!decision.allowed) {
				set.status = 403;
				return fail("Policy blocked approval request", "POLICY_BLOCKED");
			}

			const approval: ApprovalRecord = {
				approvalId: body.approvalId,
				traceId: body.traceId,
				scope: toScope(body),
				state: body.isMaterialAction ? "proposed" : "approved",
				requiresHumanApproval: body.isMaterialAction,
				reviewerRole:
					registryEntry.approvalClass === "supervisor"
						? "supervisor"
						: "financial-controller",
				allowed: true,
				authoritativeMutationAllowed: false,
			};

			approvalStore.set(approval.approvalId, approval);
			traceEvidenceStore.save({
				traceId: approval.traceId,
				tenantScope: approval.scope,
				redactionStatus: "redacted",
				toolCalls: [body.requestedTool],
				rationale: "policy-approved advisory request",
				evidence: [
					{
						sourceRef: `policy://${approval.approvalId}`,
						hash: `hash-${approval.traceId}`,
						scope: "policy-artifact",
						isRedacted: true,
					},
				],
				approvalLineage: toApprovalLineage(approval),
				auditTrail: [
					{
						eventType: "approval.requested",
						status: "success",
						recordedAt: new Date().toISOString(),
						actorId: "system",
						actorRole: "system",
						reasonCode: "APPROVAL_REQUESTED",
					},
				],
			});
			return ok(toApprovalResponse(approval));
		},
		{
			body: approvalRequestBodySchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail("Invalid approval request", "VALIDATION_ERROR");
				}

				return;
			},
		},
	)
	.post(
		"/approval/escalate",
		({ body, set }) => {
			const approval = approvalStore.get(body.approvalId);
			if (!approval || !scopeMatches(approval.scope, toScope(body))) {
				set.status = 404;
				return fail("Approval request not found", "APPROVAL_NOT_FOUND");
			}

			if (approval.requiresHumanApproval) {
				approval.state = "validated";
				syncTraceApprovalLineage(traceEvidenceStore, approval);
			}

			return ok(toApprovalResponse(approval));
		},
		{
			body: approvalScopeSchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail(
						"Invalid approval escalation request",
						"VALIDATION_ERROR",
					);
				}

				return;
			},
		},
	)
	.post(
		"/approval/reject",
		({ body, set }) => {
			const approval = approvalStore.get(body.approvalId);
			if (!approval || !scopeMatches(approval.scope, toScope(body))) {
				set.status = 404;
				return fail("Approval request not found", "APPROVAL_NOT_FOUND");
			}

			approval.state = "rejected";
			syncTraceApprovalLineage(traceEvidenceStore, approval);
			return ok(toApprovalResponse(approval));
		},
		{
			body: approvalScopeSchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail("Invalid approval rejection request", "VALIDATION_ERROR");
				}

				return;
			},
		},
	)
	.post(
		"/approval/approve",
		({ body, set }) => {
			const approval = approvalStore.get(body.approvalId);
			if (!approval || !scopeMatches(approval.scope, toScope(body))) {
				set.status = 404;
				return fail("Approval request not found", "APPROVAL_NOT_FOUND");
			}

			if (
				approval.requiresHumanApproval &&
				(!body.authorizedForSensitiveApproval ||
					body.reviewerRole !== approval.reviewerRole)
			) {
				set.status = 403;
				return fail(
					"Reviewer is not authorized for sensitive approval",
					"REVIEWER_UNAUTHORIZED",
				);
			}

			approval.state = "approved";
			approval.approvedBy = {
				reviewerId: body.reviewerId,
				reviewerRole: body.reviewerRole,
			};
			syncTraceApprovalLineage(traceEvidenceStore, approval);
			appendApprovalAuditEvent(
				traceEvidenceStore,
				approval,
				"approval.approved",
				"success",
				"APPROVAL_APPROVED",
				{ actorId: body.reviewerId, actorRole: body.reviewerRole },
			);
			return ok(toApprovalResponse(approval));
		},
		{
			body: approvalDecisionBodySchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail("Invalid approval decision request", "VALIDATION_ERROR");
				}

				return;
			},
		},
	)
	.post(
		"/approval/apply",
		({ body, set, request }) => {
			const approval = approvalStore.get(body.approvalId);
			if (!approval || !scopeMatches(approval.scope, toScope(body))) {
				set.status = 404;
				return fail("Approval request not found", "APPROVAL_NOT_FOUND");
			}

			const applyDecision = evaluateApprovalApplyGuard({
				approvalState: approval.state,
				decisionAllowed: approval.allowed,
			});

			if (!applyDecision.allowed) {
				set.status = 403;
				const code =
					applyDecision.code === "APPROVAL_REJECTED"
						? "APPROVAL_REJECTED"
						: "APPROVAL_REQUIRED";
				const message =
					applyDecision.code === "APPROVAL_REJECTED"
						? "Rejected approvals cannot be applied"
						: "Deterministic handoff is blocked until explicit approval";
				return fail(message, code);
			}

			if (
				request.headers.get("x-arkelythex-simulate-provider-failure") === "true"
			) {
				appendApprovalAuditEvent(
					traceEvidenceStore,
					approval,
					"provider.apply.failed",
					"failure",
					"PROVIDER_FAILURE",
					{ actorId: "system", actorRole: "system" },
				);
				set.status = 502;
				return fail(
					"Provider failure blocked deterministic handoff",
					"PROVIDER_FAILURE",
				);
			}

			return ok(buildDeterministicHandoff(approval.approvalId));
		},
		{
			body: approvalScopeSchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail("Invalid apply request", "VALIDATION_ERROR");
				}

				return;
			},
		},
	)
	.post(
		"/trace/retrieve",
		({ body, set }) => {
			const lookup = traceEvidenceStore.getScoped({
				traceId: body.traceId,
				tenantScope: {
					tenantId: body.tenantId,
					organizationId: body.organizationId,
					companyId: body.companyId,
					ruc: body.ruc,
				},
			});

			if (!lookup.found) {
				set.status = 404;
				return fail("Trace bundle not found", "TRACE_NOT_FOUND");
			}

			return ok(lookup.bundle);
		},
		{
			body: traceRetrievalBodySchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 400;
					return fail("Invalid trace retrieval request", "VALIDATION_ERROR");
				}

				return;
			},
		},
	);
};

/**
 * Default production AI Control Plane route module.
 *
 * @example
 * ```ts
 * app.use(aiControlPlaneModule);
 * ```
 */
export const aiControlPlaneModule = createAiControlPlaneModule();
