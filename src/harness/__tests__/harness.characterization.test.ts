/**
 * Characterization tests for DrenyraHarness.
 *
 * These tests capture current behavior BEFORE migration to Pi SDK.
 * The harness is the primary component being replaced by PiAgentRuntimeAdapter.
 *
 * @module @drenyra/pi/harness
 */

import { describe, expect, it } from "vitest";
import { DrenyraHarness, createDefaultDelegationGraph, createDefaultApprovalWorkflow, getAgentNode, resolveRootAgentId } from "../harness";
import { DelegationGraph } from "../../harness-core/delegation";
import { ApprovalWorkflow } from "../../harness-core/approval";

describe("DrenyraHarness — characterization", () => {
	describe("resolveRootAgentId", () => {
		it('should resolve fiscal keywords to fiscal-command-orchestrator', () => {
			expect(resolveRootAgentId("submit sunat filing")).toBe("fiscal-command-orchestrator");
			expect(resolveRootAgentId("check ruc")).toBe("fiscal-command-orchestrator");
			expect(resolveRootAgentId("fiscal conciliation")).toBe("fiscal-command-orchestrator");
			expect(resolveRootAgentId("sire report")).toBe("fiscal-command-orchestrator");
		});

		it('should resolve HR keywords to drenyra-hr-orchestrator', () => {
			expect(resolveRootAgentId("payroll processing")).toBe("drenyra-hr-orchestrator");
			expect(resolveRootAgentId("employee onboarding")).toBe("drenyra-hr-orchestrator");
			expect(resolveRootAgentId("plame filing")).toBe("drenyra-hr-orchestrator");
		});

		it('should resolve swarm keywords to ai-swarm-orchestrator', () => {
			// Note: "implement" also matches "ple" fiscal keyword, so it resolves fiscal
			expect(resolveRootAgentId("code review")).toBe("ai-swarm-orchestrator");
			expect(resolveRootAgentId("codegen api")).toBe("ai-swarm-orchestrator");
		});

		it('should default to fiscal-command-orchestrator for unknown tasks', () => {
			expect(resolveRootAgentId("unknown task")).toBe("fiscal-command-orchestrator");
			expect(resolveRootAgentId("general query")).toBe("fiscal-command-orchestrator");
		});
	});

	describe("getAgentNode", () => {
		it("should return a valid agent node for known ids", () => {
			const node = getAgentNode("fiscal-sunat-agent");
			expect(node).toBeDefined();
			expect(node?.id).toBe("fiscal-sunat-agent");
			expect(node?.tier).toBe("tier3");
			expect(node?.parent).toBe("fiscal-command-orchestrator");
		});

		it("should return undefined for unknown agent ids", () => {
			expect(getAgentNode("nonexistent")).toBeUndefined();
		});

		it("should include maySpawn permissions", () => {
			const node = getAgentNode("drenyra-sdd-orchestrator");
			expect(node?.maySpawn).toContain("fiscal-command-orchestrator");
			expect(node?.maySpawn).toContain("ai-swarm-orchestrator");
			expect(node?.maySpawn).toContain("drenyra-hr-orchestrator");
		});
	});

	describe("constructor", () => {
		it("should create a harness with default delegation graph and approval workflow", () => {
			const harness = new DrenyraHarness();
			expect(harness).toBeInstanceOf(DrenyraHarness);
		});

		it("should register default handlers on construction", () => {
			const harness = new DrenyraHarness();
			const agents = harness.getRegisteredAgents();
			expect(agents.length).toBeGreaterThan(0);
		});
	});

	describe("registerHandler and getRegisteredAgents", () => {
		it("should register a custom handler", () => {
			const harness = new DrenyraHarness();
			const handler = async () => ({
				status: "done" as const,
				executiveSummary: "ok",
				artifacts: [],
				nextRecommended: "complete" as const,
				risks: [],
				delegationDepth: 0,
			});
			harness.registerHandler("custom-agent", handler);
			expect(harness.getRegisteredAgents()).toContain("custom-agent");
		});
	});

	describe("canSpawnAgent", () => {
		it("should respect delegation permissions", () => {
			const harness = new DrenyraHarness();
			expect(harness.canSpawnAgent("drenyra-orchestrator", "drenyra-sdd-orchestrator", 0)).toBe(true);
			expect(harness.canSpawnAgent("drenyra-orchestrator", "fiscal-sunat-agent", 0)).toBe(false);
		});

		it("should block spawn beyond max depth", () => {
			const harness = new DrenyraHarness({ maxDepth: 3 });
			expect(harness.canSpawnAgent("fiscal-sunat-agent", "fiscal-sunat-payload-agent", 4)).toBe(false);
		});
	});

	describe("execute", () => {
		it("should execute a task and return a result tree", async () => {
			const harness = new DrenyraHarness();
			const result = await harness.execute({
				task: "check sunat compliance",
				context: {
					tenantId: "test",
					userId: "user-1",
					organizationId: "org-1",
					companyId: "comp-1",
					ruc: "20123456789",
					traceId: "trace-1",
				},
			});

			expect(result.status).toBeDefined();
			expect(result.rootAgentId).toBe("fiscal-command-orchestrator");
			expect(result.tree).toBeDefined();
			expect(result.tree.runId).toBeDefined();
		});

		it("should use explicit rootAgentId when provided", async () => {
			const harness = new DrenyraHarness();
			const result = await harness.execute({
				task: "any task",
				rootAgentId: "drenyra-hr-orchestrator",
				context: {
					tenantId: "test",
					userId: "user-1",
					organizationId: "org-1",
					companyId: "comp-1",
					ruc: "20123456789",
					traceId: "trace-2",
				},
			});

			expect(result.rootAgentId).toBe("drenyra-hr-orchestrator");
		});

		it("should return blocked for unknown agent", async () => {
			const harness = new DrenyraHarness();
			const result = await harness.execute({
				task: "some task",
				rootAgentId: "nonexistent",
				context: {
					tenantId: "test",
					userId: "user-1",
					organizationId: "org-1",
					companyId: "comp-1",
					ruc: "20123456789",
					traceId: "trace-3",
				},
			});

			expect(result.tree.status).toBe("blocked");
		});
	});

	describe("spawn", () => {
		it("should spawn a child agent and return a run node", async () => {
			const harness = new DrenyraHarness();
			const node = await harness.spawn({
				agentId: "fiscal-sunat-agent",
				task: "validate invoice",
				context: {
					tenantId: "test",
					userId: "user-1",
					organizationId: "org-1",
					companyId: "comp-1",
					ruc: "20123456789",
					traceId: "trace-4",
				},
				depth: 1,
			});

			expect(node.agentId).toBe("fiscal-sunat-agent");
			expect(node.status).toBeDefined();
			expect(node.runId).toBeDefined();
		});
	});

	describe("createDefaultDelegationGraph", () => {
		it("should create a graph with all fiscal agents", () => {
			const graph = createDefaultDelegationGraph();
			expect(graph.getNode("fiscal-command-orchestrator")).toBeDefined();
			expect(graph.getNode("fiscal-sunat-agent")).toBeDefined();
			expect(graph.getAllNodeIds().length).toBeGreaterThan(10);
		});
	});

	describe("createDefaultApprovalWorkflow", () => {
		it("should create an approval workflow with fiscal gates", () => {
			const workflow = createDefaultApprovalWorkflow();
			const gates = workflow.getGates();
			expect(gates.length).toBeGreaterThan(0);

			// All gates should be fiscal keyword matchers without handlers
			for (const gate of gates) {
				expect(gate.handler).toBeUndefined();
			}
		});
	});

	describe("approval flow", () => {
		it("should block on approval required when onApprovalRequired returns false", async () => {
			const harness = new DrenyraHarness({
				onApprovalRequired: async () => false,
			});

			const result = await harness.execute({
				task: "submit sunat filing",
				context: {
					tenantId: "test",
					userId: "user-1",
					organizationId: "org-1",
					companyId: "comp-1",
					ruc: "20123456789",
					traceId: "trace-5",
				},
			});

			expect(result.tree.status).toBe("pending_approval");
			expect(result.tree.result.requiresApproval).toBe(true);
		});
	});
});
