import { describe, expect, it } from "vitest";
import type { TaskDefinition } from "../../src/kernel/types.js";
import { Orchestrator } from "../../src/swarm/orchestrator.js";

describe("Orchestrator", () => {
	describe("agent registration", () => {
		it("registers an agent and finds it by type", () => {
			const orchestrator = new Orchestrator();

			orchestrator.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review"],
				execute: async () => ({
					taskId: "task-1",
					status: "completed" as const,
					output: { reviewed: true },
					startedAt: new Date().toISOString(),
					completedAt: new Date().toISOString(),
					attempts: 1,
				}),
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "high",
				input: { query: "review this" },
			};

			const result = orchestrator.execute(task);

			expect(result).toBeDefined();
		});
	});

	describe("execute single task", () => {
		it("executes a task and returns a TaskResult", async () => {
			const orchestrator = new Orchestrator();

			orchestrator.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review"],
				execute: async () => ({
					taskId: "task-1",
					status: "completed" as const,
					output: { analyzed: true },
					startedAt: new Date().toISOString(),
					completedAt: new Date().toISOString(),
					attempts: 1,
				}),
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "high",
				input: { query: "analyze" },
			};

			const result = await orchestrator.execute(task);
			expect(result.status).toBe("completed");
			expect(result.taskId).toBe("task-1");
			expect(result.output).toEqual({ analyzed: true });
		});

		it("returns a failed TaskResult when no agent matches", async () => {
			const orchestrator = new Orchestrator();

			const task: TaskDefinition = {
				id: "task-1",
				type: "unknown-type",
				priority: "low",
				input: {},
			};

			const result = await orchestrator.execute(task);
			expect(result.status).toBe("failed");
			expect(result.error).toContain(
				"No agent registered for type: unknown-type",
			);
		});
	});

	describe("executeParallel", () => {
		it("executes a task across multiple agents in parallel", async () => {
			const orchestrator = new Orchestrator();

			orchestrator.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review"],
				execute: async () => ({
					taskId: "task-1",
					status: "completed" as const,
					output: { agent: "a" },
					startedAt: new Date().toISOString(),
					completedAt: new Date().toISOString(),
					attempts: 1,
				}),
			});

			orchestrator.registerAgent({
				id: "agent-b",
				type: "analysis",
				capabilities: ["quality-check"],
				execute: async () => ({
					taskId: "task-1",
					status: "completed" as const,
					output: { agent: "b" },
					startedAt: new Date().toISOString(),
					completedAt: new Date().toISOString(),
					attempts: 1,
				}),
			});

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "medium",
				input: {},
			};

			const results = await orchestrator.executeParallel(
				task,
				["agent-a", "agent-b"],
				"all-results",
			);
			expect(results).toHaveLength(2);
		});

		it("returns empty array when no agents are specified", async () => {
			const orchestrator = new Orchestrator();

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "low",
				input: {},
			};

			const results = await orchestrator.executeParallel(
				task,
				[],
				"all-results",
			);
			expect(results).toEqual([]);
		});
	});

	describe("shutdown", () => {
		it("shuts down and prevents further execution", async () => {
			const orchestrator = new Orchestrator();

			orchestrator.shutdown();

			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "low",
				input: {},
			};

			const result = await orchestrator.execute(task);
			expect(result.status).toBe("failed");
			expect(result.error).toContain("Orchestrator is shut down");
		});
	});

	describe("health metrics", () => {
		it("returns health metrics", () => {
			const orchestrator = new Orchestrator();

			const metrics = orchestrator.getHealthMetrics();
			expect(metrics).toHaveProperty("totalAgents");
			expect(metrics).toHaveProperty("tasksExecuted");
			expect(metrics).toHaveProperty("tasksFailed");
		});

		it("reflects registered agents in metrics", () => {
			const orchestrator = new Orchestrator();

			orchestrator.registerAgent({
				id: "agent-a",
				type: "analysis",
				capabilities: ["code-review"],
				execute: async () => ({
					taskId: "t1",
					status: "completed" as const,
					startedAt: new Date().toISOString(),
					completedAt: new Date().toISOString(),
					attempts: 1,
				}),
			});

			const metrics = orchestrator.getHealthMetrics();
			expect(metrics.totalAgents).toBe(1);
		});
	});
});
