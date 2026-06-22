import type { AgentRegistryEntry, TraceEvidenceStore } from "@arkelythex/ai";
import { t } from "elysia";

export const policyPreviewBodySchema = t.Object({
	traceId: t.String({ minLength: 1 }),
	agentId: t.String({ minLength: 1 }),
	tenantId: t.String({ minLength: 1 }),
	organizationId: t.String({ minLength: 1 }),
	companyId: t.String({ minLength: 1 }),
	ruc: t.String({ pattern: "^[0-9]{11}$" }),
	requestedCapability: t.String({ minLength: 1 }),
	requestedTool: t.String({ minLength: 1 }),
});

export const capabilityLookupBodySchema = t.Object({
	agentId: t.String({ minLength: 1 }),
	requestedCapability: t.String({ minLength: 1 }),
});

export const approvalScopeSchema = t.Object({
	approvalId: t.String({ minLength: 1 }),
	agentId: t.String({ minLength: 1 }),
	tenantId: t.String({ minLength: 1 }),
	organizationId: t.String({ minLength: 1 }),
	companyId: t.String({ minLength: 1 }),
	ruc: t.String({ pattern: "^[0-9]{11}$" }),
});

export const approvalRequestBodySchema = t.Object({
	...approvalScopeSchema.properties,
	traceId: t.String({ minLength: 1 }),
	requestedCapability: t.String({ minLength: 1 }),
	requestedTool: t.String({ minLength: 1 }),
	isMaterialAction: t.Boolean(),
});

export const traceRetrievalBodySchema = t.Object({
	traceId: t.String({ minLength: 1 }),
	tenantId: t.String({ minLength: 1 }),
	organizationId: t.String({ minLength: 1 }),
	companyId: t.String({ minLength: 1 }),
	ruc: t.String({ pattern: "^[0-9]{11}$" }),
});

export const approvalDecisionBodySchema = t.Object({
	...approvalScopeSchema.properties,
	reviewerId: t.String({ minLength: 1 }),
	reviewerRole: t.Union([
		t.Literal("supervisor"),
		t.Literal("financial-controller"),
	]),
	authorizedForSensitiveApproval: t.Boolean(),
});

export type ApprovalRecord = {
	approvalId: string;
	traceId: string;
	scope: {
		tenantId: string;
		organizationId: string;
		companyId: string;
		ruc: string;
	};
	state: "proposed" | "validated" | "approved" | "rejected";
	requiresHumanApproval: boolean;
	reviewerRole: "supervisor" | "financial-controller";
	allowed: boolean;
	authoritativeMutationAllowed: false;
	approvedBy?: {
		reviewerId: string;
		reviewerRole: "supervisor" | "financial-controller";
	};
};

/**
 * Dependencies accepted by `createAiControlPlaneModule`.
 *
 * @param agentRegistry - Optional scoped AI agent registry override for tests or adapters.
 * @param approvalStore - Optional in-memory approval state map scoped to one module instance.
 * @param traceEvidenceStore - Optional trace evidence store used for redacted audit bundles.
 * @example
 * ```ts
 * createAiControlPlaneModule({ approvalStore: new Map() });
 * ```
 */
export interface AiControlPlaneModuleDependencies {
	agentRegistry?: Record<string, AgentRegistryEntry>;
	approvalStore?: Map<string, ApprovalRecord>;
	traceEvidenceStore?: TraceEvidenceStore;
}
