import { beforeEach, describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import { ApprovalGateEngine } from "../approval-gate";
import { ApprovalStore } from "../approval-store";
import { DomainAgent, type DomainAgentConfig } from "../domain-agent";

const mockContext: AgentContext = {
	tenantId: "tenant-1",
	userId: "user-1",
	organizationId: "org-1",
	companyId: "comp-1",
	ruc: "20123456789",
	sessionId: "session-1",
	traceId: "trace-1",
};

function createDomainAgent(
	configOverrides: Partial<DomainAgentConfig> = {},
): DomainAgent {
	const store = new ApprovalStore();
	const gate = new ApprovalGateEngine(store);
	const config: DomainAgentConfig = {
		id: "cerno",
		name: "Cerno",
		description: "Vision and overview agent",
		capabilities: ["classify", "vision", "overview"],
		approvalRequired: false,
		maxRetries: 3,
		...configOverrides,
	};
	return new DomainAgent(
		[
			{ id: "cerno-v1", name: "Cerno Primary" },
			{ id: "cerno-v2", name: "Cerno Fallback" },
		],
		config,
		gate,
	);
}

describe("DomainAgent", () => {
	it("should have correct identity from config", () => {
		const agent = createDomainAgent({ id: "custos" });
		expect(agent.id).toBe("custos");
		expect(agent.name).toBe("Cerno"); // name comes from config
		expect(agent.capabilities).toContain("classify");
	});

	it("should select primary agent by default", () => {
		const agent = createDomainAgent();
		const selected = agent.selectBestAgent({});
		expect(selected.id).toBe("cerno-v1");
	});

	it("should select matched agent based on tools", () => {
		const agent = createDomainAgent();
		const selected = agent.selectBestAgent({ tools: ["fallback"] });
		expect(selected.id).toBe("cerno-v2");
	});

	it("should select primary agent when no tools match", () => {
		const agent = createDomainAgent();
		const selected = agent.selectBestAgent({ tools: ["nonexistent"] });
		expect(selected.id).toBe("cerno-v1");
	});

	it("should receive and process a task", async () => {
		const agent = createDomainAgent();
		const result = await agent.receiveTask({
			id: "task-1",
			goal: "classify document",
			context: mockContext,
			tools: ["classify"],
		});

		expect(result.domainId).toBe("cerno");
		expect(result.taskId).toBe("task-1");
		expect(result.status).toBe("completed");
		expect(result.confidence).toBe(0.85);
	});

	it("should spawn a sub-agent", async () => {
		const agent = createDomainAgent();
		const result = await agent.spawnSubAgent({
			id: "sub-task-1",
			goal: "analyze subset",
			context: mockContext,
			domain: "lumen",
		});

		expect(result.status).toBe("completed");
		expect(result.confidence).toBe(0.8);
		expect(result.subTaskId).toContain("sub-task-1");
	});

	describe("checkApproval", () => {
		it("should not require approval when config disables it", async () => {
			const agent = createDomainAgent({ approvalRequired: false });
			const result = await agent.checkApproval({
				type: "financial",
				amount: 10000,
				description: "big payment",
				toolName: "pay",
			});
			expect(result.required).toBe(false);
		});

		it("should require approval for financial actions", async () => {
			const agent = createDomainAgent({ approvalRequired: true });
			const result = await agent.checkApproval({
				type: "financial",
				amount: 10000,
				description: "big payment",
				toolName: "pay",
			});
			expect(result.required).toBe(true);
			expect(result.reason).toContain("financial");
		});

		it("should require approval for compliance actions", async () => {
			const agent = createDomainAgent({ approvalRequired: true });
			const result = await agent.checkApproval({
				type: "compliance",
				description: "submit SUNAT",
				toolName: "submit-sunat",
			});
			expect(result.required).toBe(true);
		});

		it("should not require approval for admin actions", async () => {
			const agent = createDomainAgent({ approvalRequired: true });
			const result = await agent.checkApproval({
				type: "admin",
				description: "update profile",
				toolName: "update-profile",
			});
			expect(result.required).toBe(false);
		});

		it("should not require approval for zero-amount financial actions", async () => {
			const agent = createDomainAgent({ approvalRequired: true });
			const result = await agent.checkApproval({
				type: "financial",
				amount: 0,
				description: "zero payment",
				toolName: "pay",
			});
			expect(result.required).toBe(false);
		});
	});

	describe("escalate", () => {
		it("should retry when under max retries", async () => {
			const agent = createDomainAgent({ maxRetries: 3 });
			const result = await agent.escalate({
				taskId: "task-1",
				domain: "cerno",
				reason: "timeout",
				attempts: 1,
			});

			expect(result.action).toBe("retry");
			expect(result.message).toContain("attempt 2/3");
		});

		it("should escalate to human when max retries exceeded", async () => {
			const agent = createDomainAgent({ maxRetries: 3 });
			const result = await agent.escalate({
				taskId: "task-1",
				domain: "cerno",
				reason: "timeout",
				attempts: 3,
			});

			expect(result.action).toBe("human");
			expect(result.message).toContain("Human intervention");
			expect(result.assignedTo).toBe("domain-supervisor");
		});
	});
});
