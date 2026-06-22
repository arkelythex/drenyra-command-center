import { describe, expect, it } from "vitest";
import {
	AgentRegistryEntrySchema,
	ApprovalEnvelopeSchema,
	ApprovalLeaseSchema,
	PolicyDecisionSchema,
	ProposedActionSchema,
	SuggestionEnvelopeSchema,
	ToolPolicyInputSchema,
	ToolRiskTierSchema,
	TraceBundleSchema,
} from "../../src/control-plane/contracts";

describe("AI control-plane foundation contracts", () => {
	const scope = {
		tenantId: "tenant-1",
		organizationId: "org-1",
		companyId: "company-1",
		ruc: "20123456789",
	};

	it("classifies canonical tool risk tiers", () => {
		expect(ToolRiskTierSchema.parse("T0_READ_SAFE")).toBe("T0_READ_SAFE");
		expect(ToolRiskTierSchema.parse("T3_MATERIAL_APPROVAL_REQUIRED")).toBe(
			"T3_MATERIAL_APPROVAL_REQUIRED",
		);
		expect(() => ToolRiskTierSchema.parse("T5_AUTONOMOUS_MUTATION")).toThrow();
	});

	it("accepts scoped policy inputs with minor-unit money", () => {
		const parsed = ToolPolicyInputSchema.parse({
			traceId: "trace-1",
			tenantScope: scope,
			userId: "user-1",
			role: "financial-controller",
			tool: "sunat.lookup",
			action: "validate-cpe",
			documentType: "01",
			amountMinorUnits: 11800,
			currency: "PEN",
			sunatImpact: "none",
			evidenceRefs: ["evidence://cpe/F001-1"],
			modelId: "openai/gpt-5.5",
		});

		expect(parsed.tenantScope.ruc).toBe("20123456789");
		expect(parsed.amountMinorUnits).toBe(11800);
	});

	it("keeps proposed actions advisory-only", () => {
		const parsed = ProposedActionSchema.parse({
			actionId: "action-1",
			traceId: "trace-1",
			tenantScope: scope,
			tool: "sunat.lookup",
			action: "validate-cpe",
			riskTier: "T0_READ_SAFE",
			payloadHash:
				"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			evidenceRefs: ["evidence://cpe/F001-1"],
			advisoryOnly: true,
			authoritativeMutationAllowed: false,
		});

		expect(parsed.advisoryOnly).toBe(true);
		expect(parsed.authoritativeMutationAllowed).toBe(false);
	});

	it("binds approval leases to scope, role, risk tier, and payload hash", () => {
		const parsed = ApprovalLeaseSchema.parse({
			approvalId: "approval-1",
			traceId: "trace-1",
			tenantScope: scope,
			userId: "user-1",
			reviewerId: "reviewer-1",
			reviewerRole: "financial-controller",
			tool: "invoice.emit",
			action: "emit-invoice",
			payloadHash:
				"sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			evidenceRefs: ["evidence://draft/F001-1"],
			validatorResults: [
				{
					validatorId: "ruc-check",
					status: "pass",
					evidenceRef: "validator://ruc/1",
				},
			],
			riskTier: "T3_MATERIAL_APPROVAL_REQUIRED",
			expiresAt: "2026-05-04T23:59:59.000Z",
		});

		expect(parsed.riskTier).toBe("T3_MATERIAL_APPROVAL_REQUIRED");
	});

	it("enforces tenant/company/RUC scope as required", () => {
		const result = AgentRegistryEntrySchema.safeParse({
			agentId: "agent-reconciler",
			purpose: "reconciliation-review",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "",
				ruc: "20123456789",
			},
			capabilities: ["advisory.review"],
			allowedTools: ["ledger.read"],
			approvalClass: "not-required",
			supportedSurfaces: ["api"],
		});

		expect(result.success).toBe(false);
	});

	it("enforces deny-by-default semantics for tool permissions", () => {
		const result = AgentRegistryEntrySchema.safeParse({
			agentId: "agent-reconciler",
			purpose: "reconciliation-review",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			capabilities: ["advisory.review"],
			allowedTools: ["*"],
			approvalClass: "not-required",
			supportedSurfaces: ["api"],
		});

		expect(result.success).toBe(false);
	});

	it("rejects suggestions that claim direct fiscal mutation authority", () => {
		const result = SuggestionEnvelopeSchema.safeParse({
			suggestionId: "sug-1",
			traceId: "trace-1",
			advisoryOnly: false,
			authoritativeMutationProhibited: false,
			summary: "post this journal now",
			recommendedAction: "request-approval",
		});

		expect(result.success).toBe(false);
	});

	it("requires trace bundles to flag redaction", () => {
		const result = TraceBundleSchema.safeParse({
			traceId: "trace-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			toolCalls: [],
			sourceRefs: [],
			outputHash: "hash-1",
			redactionApplied: false,
			containsRawPii: false,
		});

		expect(result.success).toBe(false);
	});

	it("requires approved state for apply intent", () => {
		const result = ApprovalEnvelopeSchema.safeParse({
			approvalId: "appr-1",
			traceId: "trace-1",
			state: "proposed",
			requiresHumanApproval: true,
			reviewerRole: "financial-controller",
			requestedAction: "apply-deterministic-command",
		});

		expect(result.success).toBe(false);
	});

	it("keeps policy decisions non-authoritative by default", () => {
		const result = PolicyDecisionSchema.safeParse({
			traceId: "trace-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			allowed: true,
			fallbackMode: "deterministic-required",
			violations: [],
			approvalState: "approved",
			authoritativeMutationAllowed: true,
		});

		expect(result.success).toBe(false);
	});
});
