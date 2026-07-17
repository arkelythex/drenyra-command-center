import { describe, expect, it } from "vitest";
import type {
	AgentContext,
	AgentStatus,
	AgentType,
	TaskDefinition,
	TaskPriority,
	TaskResult,
	TaskStatus,
} from "../../src/kernel/types.js";

describe("Kernel Types", () => {
	describe("AgentType", () => {
		it("accepts any string as an agent type", () => {
			const validTypes: AgentType[] = [
				"analysis",
				"compliance",
				"audit",
				"custom-domain-agent",
			];
			expect(validTypes).toContain("analysis");
			expect(validTypes).toContain("compliance");
			expect(validTypes).toContain("custom-domain-agent");
		});
	});

	describe("AgentStatus", () => {
		it("allows only valid status values", () => {
			const statuses: AgentStatus[] = [
				"idle",
				"busy",
				"error",
				"completed",
				"offline",
			];
			expect(statuses).toHaveLength(5);

			// Verify each status can be assigned
			const s1: AgentStatus = "idle";
			const s2: AgentStatus = "busy";
			const s3: AgentStatus = "error";
			const s4: AgentStatus = "completed";
			const s5: AgentStatus = "offline";
			expect([s1, s2, s3, s4, s5]).toEqual(statuses);
		});

		it("rejects invalid status values at compile time", () => {
			// @ts-expect-error — "unknown" is not a valid AgentStatus
			const invalid: AgentStatus = "unknown";
			expect(invalid).toBeDefined();
		});
	});

	describe("TaskPriority", () => {
		it("allows only valid priority values", () => {
			const priorities: TaskPriority[] = ["low", "medium", "high", "critical"];
			expect(priorities).toHaveLength(4);
		});
	});

	describe("TaskStatus", () => {
		it("allows only valid task lifecycle values", () => {
			const statuses: TaskStatus[] = [
				"pending",
				"assigned",
				"in_progress",
				"completed",
				"failed",
				"cancelled",
			];
			expect(statuses).toHaveLength(6);
		});
	});

	describe("TaskDefinition", () => {
		it("creates a valid task definition with required fields", () => {
			const task: TaskDefinition = {
				id: "task-1",
				type: "analysis",
				priority: "high",
				input: { query: "analyze this" },
			};

			expect(task.id).toBe("task-1");
			expect(task.type).toBe("analysis");
			expect(task.priority).toBe("high");
			expect(task.input).toEqual({ query: "analyze this" });
		});

		it("creates a task definition with optional fields", () => {
			const task: TaskDefinition = {
				id: "task-2",
				type: "audit",
				priority: "critical",
				input: { documentId: "doc-123" },
				metadata: { source: "webhook" },
				maxRetries: 3,
				timeout: 30000,
			};

			expect(task.id).toBe("task-2");
			expect(task.metadata).toEqual({ source: "webhook" });
			expect(task.maxRetries).toBe(3);
			expect(task.timeout).toBe(30000);
		});

		it("uses default maxRetries when not specified", () => {
			const task: TaskDefinition = {
				id: "task-3",
				type: "compliance",
				priority: "medium",
				input: {},
			};

			expect(task.maxRetries).toBeUndefined();
		});
	});

	describe("TaskResult", () => {
		it("creates a successful task result", () => {
			const result: TaskResult = {
				taskId: "task-1",
				status: "completed",
				output: { summary: "Analysis complete" },
				startedAt: "2026-01-01T00:00:00Z",
				completedAt: "2026-01-01T00:01:00Z",
				attempts: 1,
			};

			expect(result.taskId).toBe("task-1");
			expect(result.status).toBe("completed");
			expect(result.output).toEqual({ summary: "Analysis complete" });
			expect(result.completedAt).toBeDefined();
			expect(result.attempts).toBe(1);
		});

		it("creates a failed task result without output", () => {
			const result: TaskResult = {
				taskId: "task-2",
				status: "failed",
				error: "Agent not available",
				startedAt: "2026-01-01T00:00:00Z",
				attempts: 3,
			};

			expect(result.taskId).toBe("task-2");
			expect(result.status).toBe("failed");
			expect(result.error).toBe("Agent not available");
			expect(result.output).toBeUndefined();
			expect(result.completedAt).toBeUndefined();
			expect(result.attempts).toBe(3);
		});
	});

	describe("AgentContext", () => {
		it("creates an agent context with required fields", () => {
			const context: AgentContext = {
				agentId: "agent-1",
				type: "analysis",
				status: "idle",
				capabilities: ["code-review", "quality-check"],
			};

			expect(context.agentId).toBe("agent-1");
			expect(context.type).toBe("analysis");
			expect(context.status).toBe("idle");
			expect(context.capabilities).toEqual(["code-review", "quality-check"]);
		});

		it("creates an agent context with optional metadata", () => {
			const context: AgentContext = {
				agentId: "agent-2",
				type: "audit",
				status: "busy",
				capabilities: ["compliance"],
				metadata: { tenantId: "tenant-1" },
			};

			expect(context.metadata).toEqual({ tenantId: "tenant-1" });
		});

		it("initializes capabilities as empty array when empty", () => {
			const context: AgentContext = {
				agentId: "agent-3",
				type: "compliance",
				status: "offline",
				capabilities: [],
			};

			expect(context.capabilities).toHaveLength(0);
		});
	});
});
