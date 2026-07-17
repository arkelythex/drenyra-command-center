import { describe, expect, it } from "vitest";
import type { TaskDefinition } from "../../src/kernel/types.js";
import { TaskRouter } from "../../src/swarm/router.js";

describe("TaskRouter", () => {
	describe("agent registration and routing", () => {
		it("routes a task to an agent with matching capabilities", () => {
			const router = new TaskRouter();

			router.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review", "quality-check"],
			});
			router.registerAgent({
				id: "agent-b",
				type: "compliance",
				capabilities: ["audit"],
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "high",
				input: { query: "review this code" },
			};

			const agentIds = router.route(task);
			expect(agentIds).toContain("agent-a");
			expect(agentIds).not.toContain("agent-b");
		});

		it("returns multiple agents when multiple match", () => {
			const router = new TaskRouter();

			router.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review"],
			});
			router.registerAgent({
				id: "agent-b",
				type: "analysis",
				capabilities: ["quality-check"],
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "medium",
				input: {},
			};

			const agentIds = router.route(task);
			expect(agentIds).toHaveLength(2);
			expect(agentIds).toContain("agent-a");
			expect(agentIds).toContain("agent-b");
		});

		it("throws when no agents match the task type", () => {
			const router = new TaskRouter();

			router.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review"],
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "unknown-type",
				priority: "low",
				input: {},
			};

			expect(() => router.route(task)).toThrow(
				"No agents registered for task type: unknown-type",
			);
		});
	});

	describe("DORA metrics-based routing", () => {
		it("routes to the fastest agent based on historical MTTR", () => {
			const router = new TaskRouter({
				enableDoraRouting: true,
			});

			router.registerAgent({
				id: "fast-agent",
				type: "analysis",
				capabilities: ["code-review"],
			});
			router.registerAgent({
				id: "slow-agent",
				type: "analysis",
				capabilities: ["code-review"],
			});

			// Record results: fast agent is faster
			router.recordResult("fast-agent", 500);
			router.recordResult("fast-agent", 300);
			router.recordResult("slow-agent", 5000);
			router.recordResult("slow-agent", 8000);

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "high",
				input: {},
			};

			const agentIds = router.route(task);
			expect(agentIds).toContain("fast-agent");
		});

		it("prefers agents with higher success rate", () => {
			const router = new TaskRouter({
				enableDoraRouting: true,
			});

			router.registerAgent({
				id: "reliable-agent",
				type: "analysis",
				capabilities: ["code-review"],
			});
			router.registerAgent({
				id: "unreliable-agent",
				type: "analysis",
				capabilities: ["code-review"],
			});

			// Record results: reliable agent always succeeds
			router.recordResult("reliable-agent", 200);
			router.recordResult("reliable-agent", 150);
			router.recordResult("unreliable-agent", 300);
			// Record failures for unreliable agent by negative duration
			router.recordFailure("unreliable-agent");

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "medium",
				input: {},
			};

			const agentIds = router.route(task);
			expect(agentIds).toContain("reliable-agent");
		});
	});

	describe("custom routing patterns", () => {
		it("supports adding custom classification patterns", () => {
			const router = new TaskRouter();

			router.addPattern("security", [/vulnerability|exploit|security/i]);

			router.registerAgent({
				id: "security-agent",
				type: "security",
				capabilities: ["vulnerability-scan"],
			});
			router.registerAgent({
				id: "analysis-agent",
				type: "analysis",
				capabilities: ["code-review"],
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "security",
				priority: "high",
				input: { query: "Check for SQL injection vulnerability" },
			};

			const agentIds = router.route(task);
			expect(agentIds).toContain("security-agent");
		});

		it("matches task type directly without pattern classification", () => {
			const router = new TaskRouter();

			router.registerAgent({
				id: "audit-agent",
				type: "audit",
				capabilities: ["compliance"],
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "audit",
				priority: "critical",
				input: {},
			};

			const agentIds = router.route(task);
			expect(agentIds).toEqual(["audit-agent"]);
		});
	});

	describe("unregisterAgent", () => {
		it("removes an agent from routing consideration", () => {
			const router = new TaskRouter();

			router.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review"],
			});
			router.unregisterAgent("agent-a");

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "medium",
				input: {},
			};

			expect(() => router.route(task)).toThrow(
				"No agents registered for task type: analysis",
			);
		});
	});

	describe("router stats", () => {
		it("returns routing statistics", () => {
			const router = new TaskRouter();

			const stats = router.getStats();
			expect(stats).toHaveProperty("totalAgents");
			expect(stats).toHaveProperty("totalTasksRouted");
			expect(typeof stats.totalAgents).toBe("number");
		});

		it("reflects registered agents in stats", () => {
			const router = new TaskRouter();

			router.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: [],
			});
			router.registerAgent({
				id: "agent-b",
				type: "compliance",
				capabilities: [],
			});

			const stats = router.getStats();
			expect(stats.totalAgents).toBe(2);
		});
	});
});
