import { describe, expect, it } from "vitest";
import type {
	AgentRegistryEntry,
	FiscalPolicyResult,
	TenantCompanyRucScope,
	ToolDefinition,
} from "../../src/control-plane";
import type { AgentRegistry } from "../../src/control-plane/agent-registry";
import { PolicyEngine } from "../../src/control-plane/policy-engine";
import type { ToolRegistry } from "../../src/control-plane/tool-registry";
import { createInMemoryTraceEvidenceStore } from "../../src/control-plane/trace-evidence";

const tenantScope: TenantCompanyRucScope = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

const agent: AgentRegistryEntry = {
	agentId: "fiscal-agent",
	purpose: "Fiscal policy integration test agent",
	tenantScope,
	capabilities: ["advisory.review"],
	allowedTools: [
		"cpe.issue",
		"sire.export",
		"tax.calculate-igv",
		"report.view",
	],
	approvalClass: "not-required",
	supportedSurfaces: ["api"],
};

const makeTool = (name: string): ToolDefinition => ({
	id: 1,
	name,
	description: null,
	riskTier: "T0",
	inputSchema: null,
	outputSchema: null,
	requiresApproval: false,
	fiscalImpact: name !== "report.view",
	approvalLevel: "auto",
	metadata: {},
	createdAt: new Date(),
	updatedAt: new Date(),
});

const createEngine = () => {
	const agentRegistry = {
		getAgent: async () => agent,
	} as AgentRegistry;
	const toolRegistry = {
		getTool: async (name: string) => makeTool(name),
	} as ToolRegistry;
	const evidenceStore = createInMemoryTraceEvidenceStore();

	return {
		engine: new PolicyEngine(agentRegistry, toolRegistry, evidenceStore),
		evidenceStore,
	};
};

describe("PolicyEngine fiscal policy integration", () => {
	it("merges fiscal violations into policy results and persists fiscal decision", async () => {
		const { engine, evidenceStore } = createEngine();
		const result = await engine.evaluate({
			traceId: "trace-sire-1",
			agentId: agent.agentId,
			requestedScope: tenantScope,
			requestedCapability: "advisory.review",
			requestedTool: "sire.export",
			action: "execute",
			fiscalPolicy: { evidenceRefs: [] },
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("EVIDENCE_REQUIRED");
		expect((result.fiscalPolicy as FiscalPolicyResult).approvalLevel).toBe(
			"fiscal_gate",
		);

		const trace = evidenceStore.getScoped({
			traceId: "trace-sire-1",
			tenantScope,
		});
		expect(trace.found).toBe(true);
		if (trace.found) {
			expect(trace.bundle.rationale).toContain("fiscalPolicy");
			expect(trace.bundle.rationale).toContain("EVIDENCE_REQUIRED");
		}
	});

	it("requires fiscal gate for high-impact CPE actions", async () => {
		const { engine } = createEngine();
		const result = await engine.evaluate({
			traceId: "trace-cpe-1",
			agentId: agent.agentId,
			requestedScope: tenantScope,
			requestedCapability: "advisory.review",
			requestedTool: "cpe.issue",
			action: "execute",
		});

		expect(result.allowed).toBe(true);
		expect(result.requiresApproval).toBe(true);
		expect(result.approvalState).toBe("proposed");
		expect((result.fiscalPolicy as FiscalPolicyResult).approvalLevel).toBe(
			"fiscal_gate",
		);
	});

	it("keeps existing non-fiscal tools working", async () => {
		const { engine } = createEngine();
		const result = await engine.evaluate({
			traceId: "trace-report-1",
			agentId: agent.agentId,
			requestedScope: tenantScope,
			requestedCapability: "advisory.review",
			requestedTool: "report.view",
			action: "read",
		});

		expect(result.allowed).toBe(true);
		expect(result.requiresApproval).toBe(false);
		expect(result.approvalState).toBe("validated");
		expect((result.fiscalPolicy as FiscalPolicyResult).sunatImpact).toBe(
			"none",
		);
	});
});
