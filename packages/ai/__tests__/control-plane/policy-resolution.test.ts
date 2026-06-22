import { describe, expect, it } from "vitest";
import type {
	AgentRegistryEntry,
	TenantCompanyRucScope,
} from "../../src/control-plane/contracts";
import {
	canHandoffToDeterministicFlow,
	lookupAllowedToolsForCapability,
	resolvePolicyDecision,
} from "../../src/control-plane/policy-resolution";

const scope: TenantCompanyRucScope = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

const registryEntry: AgentRegistryEntry = {
	agentId: "agent-reconciliation",
	purpose: "Reconciliation advisory",
	tenantScope: scope,
	capabilities: ["advisory.review", "advisory.explain"],
	allowedTools: ["ledger.read", "sunat.lookup"],
	approvalClass: "financial-controller",
	supportedSurfaces: ["api"],
};

describe("control-plane policy resolution", () => {
	it("denies when capability is not explicitly registered", () => {
		const decision = resolvePolicyDecision({
			traceId: "trace-1",
			registryEntry,
			requestedScope: scope,
			requestedCapability: "advisory.route",
			requestedTool: "ledger.read",
		});

		expect(decision.allowed).toBe(false);
		expect(decision.fallbackMode).toBe("deterministic-required");
		expect(decision.violations).toContain("capability-not-allowed");
	});

	it("denies wildcard and unlisted tools", () => {
		const wildcardDecision = resolvePolicyDecision({
			traceId: "trace-2",
			registryEntry,
			requestedScope: scope,
			requestedCapability: "advisory.review",
			requestedTool: "*",
		});

		expect(wildcardDecision.allowed).toBe(false);
		expect(wildcardDecision.violations).toContain("tool-wildcard-blocked");

		const unknownToolDecision = resolvePolicyDecision({
			traceId: "trace-3",
			registryEntry,
			requestedScope: scope,
			requestedCapability: "advisory.review",
			requestedTool: "journal.post",
		});

		expect(unknownToolDecision.allowed).toBe(false);
		expect(unknownToolDecision.violations).toContain("tool-not-allowed");
	});

	it("falls back to deterministic-required when tenant/company/RUC scope mismatches", () => {
		const decision = resolvePolicyDecision({
			traceId: "trace-4",
			registryEntry,
			requestedScope: {
				...scope,
				ruc: "20999999999",
			},
			requestedCapability: "advisory.review",
			requestedTool: "ledger.read",
		});

		expect(decision.allowed).toBe(false);
		expect(decision.fallbackMode).toBe("deterministic-required");
		expect(decision.violations).toContain("scope-mismatch");
	});

	it("returns least-privilege tool list for a registered capability", () => {
		const tools = lookupAllowedToolsForCapability({
			registryEntry,
			requestedCapability: "advisory.review",
		});

		expect(tools).toEqual(["ledger.read", "sunat.lookup"]);
	});

	it("keeps deterministic handoff blocked until approval", () => {
		const blocked = canHandoffToDeterministicFlow({
			approvalState: "validated",
			decisionAllowed: true,
		});

		expect(blocked).toBe(false);

		const allowed = canHandoffToDeterministicFlow({
			approvalState: "approved",
			decisionAllowed: true,
		});

		expect(allowed).toBe(true);
	});
});
