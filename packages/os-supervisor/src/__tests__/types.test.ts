import { describe, expect, it } from "vitest";
import type {
	OSAgentContext,
	OSAgentPort,
	OSAgentResult,
	OSAgentTool,
	OSApprovalLevel,
} from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

describe("VerticalType", () => {
	it("should have Drenyra vertical", () => {
		expect(VerticalType.DRENYRA).toBe("drenyra");
	});
	it("should have Andino vertical", () => {
		expect(VerticalType.ANDINO).toBe("andino");
	});
	it("should have Admin vertical", () => {
		expect(VerticalType.ADMIN).toBe("admin");
	});
	it("should have EdgeTrazAgro vertical", () => {
		expect(VerticalType.EDGE_TRAZ_AGRO).toBe("edge-traz-agro");
	});
	it("should have Kuse vertical", () => {
		expect(VerticalType.KUSE).toBe("kuse");
	});
});

describe("OSAgentContext", () => {
	it("should extend AgentContext with vertical field", () => {
		const ctx: OSAgentContext = {
			tenantId: "t1",
			userId: "u1",
			organizationId: "o1",
			companyId: "c1",
			ruc: "20123456789",
			traceId: "trace-1",
			vertical: VerticalType.DRENYRA,
		};
		expect(ctx.vertical).toBe("drenyra");
		expect(ctx.tenantId).toBe("t1");
	});
});

describe("OSAgentPort", () => {
	it("should satisfy the interface contract", () => {
		const agent: OSAgentPort = {
			id: "test-agent",
			name: "Test Agent",
			description: "Test agent for type checking",
			vertical: VerticalType.DRENYRA,
			capabilities: ["test:run"],
			execute: async (_task, _context) => ({
				success: true,
				data: { done: true },
				metrics: { duration: 0, tokensUsed: 0, cost: 0 },
			}),
		};
		expect(agent.id).toBe("test-agent");
		expect(typeof agent.execute).toBe("function");
	});
});

describe("OSAgentTool", () => {
	it("should have approvalLevel field", () => {
		const tool: OSAgentTool<{ input: string }, { output: string }> = {
			name: "test-tool",
			description: "A test tool",
			inputSchema: null as never,
			outputSchema: null as never,
			approvalLevel: "auto",
			execute: async (input) => ({ output: input.input }),
		};
		expect(tool.approvalLevel).toBe("auto");
	});
});

describe("OSApprovalLevel", () => {
	it("should order correctly", () => {
		const order: Record<OSApprovalLevel, number> = {
			auto: 0,
			notify: 1,
			gate: 2,
			policy_gate: 3,
		};
		expect(order.auto).toBeLessThan(order.notify);
		expect(order.notify).toBeLessThan(order.gate);
		expect(order.gate).toBeLessThan(order.policy_gate);
	});
});

describe("OSAgentResult", () => {
	it("should carry success status", () => {
		const result: OSAgentResult<string> = {
			success: true,
			data: "hello",
			metrics: { duration: 100, tokensUsed: 50, cost: 0.002 },
		};
		expect(result.success).toBe(true);
	});
	it("should carry error info on failure", () => {
		const result: OSAgentResult<null> = {
			success: false,
			data: null,
			errors: ["Something went wrong"],
			metrics: { duration: 50, tokensUsed: 10, cost: 0.001 },
		};
		expect(result.errors).toContain("Something went wrong");
	});
});
