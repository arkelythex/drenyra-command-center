import { describe, expect, it } from "vitest";
import { createArkelythexHarness, resolveRootAgentId } from "../index.js";

const baseContext = {
	sessionId: "sess-1",
	organizationId: "org-1",
	companyId: "co-1",
	companyRuc: "20601234567",
	period: "2024-01",
	traceId: "trace-1",
};

describe("resolveRootAgentId", () => {
	it("routes SUNAT tasks to fiscal orchestrator", () => {
		expect(resolveRootAgentId("Validar SIRE del periodo")).toBe(
			"fiscal-command-orchestrator",
		);
	});

	it("routes HR tasks to hr orchestrator", () => {
		expect(resolveRootAgentId("Calcular payroll PLAME")).toBe(
			"drenyra-hr-orchestrator",
		);
	});
});

describe("ArkelythexHarness", () => {
	it("spawns nested fiscal chain sunat → payload", async () => {
		const harness = createArkelythexHarness({
			onApprovalRequired: async () => true,
		});

		const response = await harness.execute({
			task: "Preparar borrador SUNAT SIRE",
			context: baseContext,
			rootAgentId: "fiscal-command-orchestrator",
			autoSpawn: true,
		});

		expect(response.rootAgentId).toBe("fiscal-command-orchestrator");
		expect(response.tree.children.length).toBeGreaterThan(0);

		const sunat = response.tree.children.find(
			(c) => c.agentId === "fiscal-sunat-agent",
		);
		expect(sunat).toBeDefined();
		expect(
			sunat?.children.some((c) => c.agentId === "fiscal-sunat-payload-agent"),
		).toBe(true);
	});

	it("blocks spawn when max depth exceeded", async () => {
		const harness = createArkelythexHarness({ maxDepth: 1 });
		const response = await harness.execute({
			task: "SUNAT",
			context: baseContext,
			rootAgentId: "fiscal-command-orchestrator",
			autoSpawn: true,
		});
		expect(response.tree.children.every((c) => c.depth <= 1)).toBe(true);
	});

	it("returns pending_approval without approver callback on sensitive leaf", async () => {
		const harness = createArkelythexHarness();
		const node = await harness.spawn({
			agentId: "fiscal-sunat-payload-agent",
			task: "submit SUNAT filing",
			context: baseContext,
			depth: 2,
		});
		expect(node.status).toBe("pending_approval");
	});
});
