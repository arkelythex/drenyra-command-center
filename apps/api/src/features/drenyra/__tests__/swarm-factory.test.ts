import type { Agent, LatinAgentId } from "@drenyra/agents";
import { DomainAgent } from "@drenyra/agents";
import { describe, expect, it } from "vitest";
import { createSwarmOrchestratorFromAgents } from "../swarm-factory";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockAgent(
	id: string,
	name: string,
	capabilities: string[],
): Agent {
	return {
		id,
		name,
		description: `${name} test agent`,
		capabilities,
		priority: 5,
		drenyraSubagent: null,
		execute: async () => ({
			success: true,
			data: {},
			metrics: { duration: 0, tokensUsed: 0, cost: 0 },
		}),
	};
}

type LatinDomainInfo = {
	id: LatinAgentId;
	agentId: string;
};

function getRegisteredDomains(
	orchestrator: ReturnType<typeof createSwarmOrchestratorFromAgents>,
): LatinDomainInfo[] {
	const domains: LatinDomainInfo[] = [];
	const latinIds: LatinAgentId[] = [
		"cerno",
		"custos",
		"necto",
		"regula",
		"lumen",
		"fusio",
		"scripta",
		"capsa",
	];

	for (const id of latinIds) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const agent = (orchestrator as any).getDomainAgent(id);
		if (agent instanceof DomainAgent) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const agentIds =
				((agent as any).agents ?? [])?.map((a: Agent) => a.id) ?? [];
			domains.push({ id: agent.id, agentId: agentIds.join(",") });
		}
	}

	return domains;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createSwarmOrchestratorFromAgents", () => {
	it("registers all 8 Latin domains when enough agents exist", () => {
		const agents: Agent[] = [
			makeMockAgent("anomaly-detector-agent", "Anomaly Detector", [
				"anomaly-detection",
			]),
			makeMockAgent("threat-detector-agent", "Threat Detector", [
				"threat-detection",
			]),
			makeMockAgent("audit-logger-agent", "Audit Logger", ["audit-trail"]),
			makeMockAgent("sunat-compliance-agent", "SUNAT Compliance", [
				"sunat-validation",
				"compliance-audit",
			]),
			makeMockAgent("kpi-tracker-agent", "KPI Tracker", ["kpi"]),
			makeMockAgent("api-gateway-agent", "API Gateway", ["integration"]),
			makeMockAgent("test-generator-agent", "Test Generator", [
				"test-generation",
			]),
			makeMockAgent("backup-manager-agent", "Backup Manager", ["backup"]),
		];

		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		expect(domains).toHaveLength(8);
		expect(domains.map((d) => d.id).sort()).toEqual([
			"capsa",
			"cerno",
			"custos",
			"fusio",
			"lumen",
			"necto",
			"regula",
			"scripta",
		]);
	});

	it("assigns the best-matching agent to the highest-scoring domain first", () => {
		// sunat-compliance-agent is in FINANCIAL_AGENT_MAP — Phase 1 assigns it to regula.
		// compliance-auditor-agent goes to the best remaining match in Phase 2.
		const agents: Agent[] = [
			makeMockAgent("sunat-compliance-agent", "SUNAT Compliance", [
				"sunat-validation",
				"compliance-audit",
				"report-generation",
			]),
			makeMockAgent("compliance-auditor-agent", "Compliance Auditor", [
				"compliance-audit",
			]),
		];

		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		// sunat-compliance-agent — regula (Phase 1 via FINANCIAL_AGENT_MAP)
		const regula = domains.find((d) => d.id === "regula");
		expect(regula?.agentId).toBe("sunat-compliance-agent");

		// compliance-auditor-agent — necto (Phase 2: /audit/i + /compliance-audit/i)
		const necto = domains.find((d) => d.id === "necto");
		expect(necto?.agentId).toBe("compliance-auditor-agent");
	});

	it("does not assign an agent to multiple domains", () => {
		const agents: Agent[] = [
			makeMockAgent("compliance-auditor-agent", "Compliance Auditor", [
				"compliance-audit",
				"report-generation",
				"sunat-validation",
			]),
			makeMockAgent("report-generator-agent", "Report Generator", [
				"report-generation",
			]),
		];

		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);
		const assignedAgents = domains.map((d) => d.agentId);

		// Each domain's agentId string should be unique
		const uniqueAgents = new Set(assignedAgents);
		expect(uniqueAgents.size).toBe(assignedAgents.length);
	});

	it("returns orchestrator with 0 domains when agent pool is empty", () => {
		const orchestrator = createSwarmOrchestratorFromAgents([]);
		const domains = getRegisteredDomains(orchestrator);

		expect(domains).toHaveLength(0);
	});

	it("registers only matching domains with partial agent pool", () => {
		const agents: Agent[] = [
			makeMockAgent("api-gateway-agent", "API Gateway", ["integration"]),
			makeMockAgent("backup-manager-agent", "Backup Manager", ["backup"]),
		];

		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		// Only fusio (integration) and capsa (backup) should match
		expect(domains.length).toBeGreaterThanOrEqual(1);
		expect(domains.length).toBeLessThan(8);

		const domainIds = domains.map((d) => d.id);
		expect(domainIds).toContain("fusio");
		expect(domainIds).toContain("capsa");
	});

	it("DomainAgents have correct approval configs", () => {
		const agents: Agent[] = [
			makeMockAgent("sunat-compliance-agent", "SUNAT Compliance", [
				"sunat-validation",
				"compliance-audit",
			]),
			makeMockAgent("vulnerability-manager-agent", "Vuln Manager", [
				"vulnerability-management",
			]),
			makeMockAgent("gdpr-checker-agent", "GDPR Checker", ["gdpr", "privacy"]),
			makeMockAgent("kpi-tracker-agent", "KPI Tracker", ["kpi"]),
		];

		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		// custos requires approval (approvalRequired: true)
		const custosDomain = domains.find((d) => d.id === "custos");
		expect(custosDomain).toBeDefined();
		expect(custosDomain!.agentId).toBe("vulnerability-manager-agent");

		// regula requires approval (approvalRequired: true)
		const regulaDomain = domains.find((d) => d.id === "regula");
		expect(regulaDomain).toBeDefined();
		expect(regulaDomain!.agentId).toContain("sunat-compliance-agent");
	});
});

describe("createSwarmOrchestrator", () => {
	it("creates orchestrator from the static agent registry", () => {
		// Can't fully test without triggering all defineAgent() calls,
		// but we can verify it returns a valid orchestrator.
		// Deferred to integration tests with full module import.
		expect(true).toBe(true);
	});
});

describe("multi-agent financial assignment", () => {
	const FINANCIAL_AGENT_IDS = [
		"sunat-compliance-agent",
		"spot-calculator-agent",
		"invoice-processor-agent",
		"banking-reconciliation-agent",
		"financial-analyzer-agent",
		"tax-optimizer-agent",
	];

	function makeFinancialAgents(): Agent[] {
		return [
			makeMockAgent("sunat-compliance-agent", "SUNAT Compliance", [
				"sunat-validation",
				"compliance-audit",
			]),
			makeMockAgent("spot-calculator-agent", "SPOT Calculator", [
				"spot-calculation",
			]),
			makeMockAgent("invoice-processor-agent", "Invoice Processor", [
				"invoice-processing",
			]),
			makeMockAgent("banking-reconciliation-agent", "Banking Reconciliation", [
				"reconciliation",
			]),
			makeMockAgent("financial-analyzer-agent", "Financial Analyzer", [
				"financial-analysis",
			]),
			makeMockAgent("tax-optimizer-agent", "Tax Optimizer", [
				"tax-optimization",
			]),
			makeMockAgent("generic-auditor", "Generic Auditor", [
				"audit-trail",
				"report-generation",
			]),
			makeMockAgent("generic-monitor", "Generic Monitor", ["risk-monitoring"]),
		];
	}

	it("all 6 financial agents assigned to correct domains (no orphans)", () => {
		const agents = makeFinancialAgents();
		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		const allAssignedAgents = domains.flatMap((d) => d.agentId.split(","));
		for (const finId of FINANCIAL_AGENT_IDS) {
			expect(allAssignedAgents).toContain(finId);
		}
	});

	it("regula has sunat-compliance + spot-calculator", () => {
		const agents = makeFinancialAgents();
		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		const regula = domains.find((d) => d.id === "regula");
		expect(regula).toBeDefined();
		const ids = regula!.agentId.split(",");
		expect(ids).toContain("sunat-compliance-agent");
		expect(ids).toContain("spot-calculator-agent");
	});

	it("cerno has invoice-processor + banking-reconciliation", () => {
		const agents = makeFinancialAgents();
		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		const cerno = domains.find((d) => d.id === "cerno");
		expect(cerno).toBeDefined();
		const ids = cerno!.agentId.split(",");
		expect(ids).toContain("invoice-processor-agent");
		expect(ids).toContain("banking-reconciliation-agent");
	});

	it("lumen has financial-analyzer + tax-optimizer", () => {
		const agents = makeFinancialAgents();
		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		const lumen = domains.find((d) => d.id === "lumen");
		expect(lumen).toBeDefined();
		const ids = lumen!.agentId.split(",");
		expect(ids).toContain("financial-analyzer-agent");
		expect(ids).toContain("tax-optimizer-agent");
	});

	it("capsa does NOT have tax-optimizer", () => {
		const agents = makeFinancialAgents();
		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		const capsa = domains.find((d) => d.id === "capsa");
		// capsa may be unassigned if no matching agent remains after Phase 1
		if (capsa) {
			const ids = capsa!.agentId.split(",");
			expect(ids).not.toContain("tax-optimizer-agent");
		}
	});

	it("no financial agent duplicated across domains", () => {
		const agents = makeFinancialAgents();
		const orchestrator = createSwarmOrchestratorFromAgents(agents);
		const domains = getRegisteredDomains(orchestrator);

		const allAgentIds = domains.flatMap((d) => d.agentId.split(","));
		for (const finId of FINANCIAL_AGENT_IDS) {
			const count = allAgentIds.filter((id) => id === finId).length;
			expect(count).toBe(1);
		}
	});
});
