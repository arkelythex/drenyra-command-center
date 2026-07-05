import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { AgentTool } from "../../types/agent-tool";
import { ApprovalGateEngine } from "../approval-gate";
import { ApprovalStore } from "../approval-store";

const mockContext: AgentContext = {
	tenantId: "tenant-1",
	userId: "user-1",
	organizationId: "org-1",
	companyId: "comp-1",
	ruc: "20123456789",
	sessionId: "session-1",
	traceId: "trace-1",
};

function createTool(
	overrides: Partial<AgentTool<{ amount: number }, { result: string }>> = {},
): AgentTool<{ amount: number }, { result: string }> {
	return {
		name: "test-tool",
		description: "A test tool",
		execute: vi.fn().mockResolvedValue({ result: "done" }),
		approvalLevel: "auto",
		needsApproval: undefined,
		inputSchema: undefined,
		outputSchema: undefined,
		...overrides,
	};
}

describe("ApprovalGateEngine", () => {
	let store: ApprovalStore;
	let engine: ApprovalGateEngine;

	beforeEach(() => {
		store = new ApprovalStore();
		engine = new ApprovalGateEngine(store);
	});

	describe("auto level", () => {
		it("should execute tool directly when approvalLevel is auto", async () => {
			const tool = createTool({ approvalLevel: "auto" });
			const result = await engine.executeTool(
				tool,
				{ amount: 100 },
				mockContext,
			);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({ result: "done" });
			}
			expect(tool.execute).toHaveBeenCalledWith({ amount: 100 }, mockContext);
		});

		it("should return error when tool execution fails", async () => {
			const tool = createTool({
				approvalLevel: "auto",
				execute: vi.fn().mockRejectedValue(new Error("tool failed")),
			});

			const result = await engine.executeTool(
				tool,
				{ amount: 100 },
				mockContext,
			);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBe("tool failed");
			}
		});
	});

	describe("gate level", () => {
		it("should require approval for gate-level tools", async () => {
			const tool = createTool({ approvalLevel: "gate" });
			const result = await engine.executeTool(
				tool,
				{ amount: 100 },
				mockContext,
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("Approval required");
			}
			expect(tool.execute).not.toHaveBeenCalled();
		});

		it("should save approval request to store", async () => {
			const tool = createTool({ approvalLevel: "gate" });
			await engine.executeTool(tool, { amount: 100 }, mockContext);

			const allRequests = store.getAll();
			expect(allRequests).toHaveLength(1);
			expect(allRequests[0].toolName).toBe("test-tool");
			expect(allRequests[0].state).toBe("proposed");
		});
	});

	describe("fiscal_gate level", () => {
		it("should require governance bundle and approval", async () => {
			const governanceValidator = vi.fn().mockResolvedValue({
				passed: true,
				evidence: [{ id: "ev-1", description: "Evidence check" }],
			});
			engine = new ApprovalGateEngine(store, governanceValidator);

			const tool = createTool({ approvalLevel: "fiscal_gate" });
			const result = await engine.executeTool(
				tool,
				{ amount: 5000 },
				mockContext,
			);

			expect(result.success).toBe(false);
			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("Approval required"),
			});
			expect(governanceValidator).toHaveBeenCalledWith(
				"test-tool",
				{ amount: 5000 },
				mockContext,
			);
		});
	});

	describe("notify level", () => {
		it("should execute and notify when needsApproval is true", async () => {
			const notifyCb = vi.fn();
			engine = new ApprovalGateEngine(store, undefined, notifyCb);

			const tool = createTool({
				approvalLevel: "notify",
				needsApproval: vi.fn().mockReturnValue(true),
			});
			const result = await engine.executeTool(
				tool,
				{ amount: 100 },
				mockContext,
			);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({ result: "done" });
			}
			expect(notifyCb).toHaveBeenCalledTimes(1);
		});
	});

	describe("needsApproval callback", () => {
		it("should execute and notify when needsApproval returns true with auto level", async () => {
			const notifyCb = vi.fn();
			engine = new ApprovalGateEngine(store, undefined, notifyCb);

			const tool = createTool({
				approvalLevel: "auto",
				needsApproval: vi.fn().mockReturnValue(true),
			});

			const result = await engine.executeTool(
				tool,
				{ amount: 10000 },
				mockContext,
			);
			expect(result.success).toBe(true);
			expect(tool.needsApproval).toHaveBeenCalledWith(
				{ amount: 10000 },
				mockContext,
			);
		});

		it("should allow execution when needsApproval returns false", async () => {
			const tool = createTool({
				approvalLevel: "auto",
				needsApproval: vi.fn().mockReturnValue(false),
			});

			const result = await engine.executeTool(
				tool,
				{ amount: 100 },
				mockContext,
			);
			expect(result.success).toBe(true);
		});
	});

	describe("approve / reject flow", () => {
		it("should approve a pending request", async () => {
			const tool = createTool({ approvalLevel: "gate" });
			await engine.executeTool(tool, { amount: 100 }, mockContext);

			const allReqs = store.getAll();
			const approvalId = allReqs[0].id;

			const result = await engine.approve(
				approvalId,
				"reviewer-1",
				"compliance-officer",
			);
			expect(result.success).toBe(true);

			const updated = store.get(approvalId);
			expect(updated?.state).toBe("approved");
			expect(updated?.reviewerId).toBe("reviewer-1");
		});

		it("should reject a pending request", async () => {
			const tool = createTool({ approvalLevel: "gate" });
			await engine.executeTool(tool, { amount: 100 }, mockContext);

			const approvalId = store.getAll()[0].id;
			const result = await engine.reject(
				approvalId,
				"reviewer-1",
				"Not compliant",
			);

			expect(result.success).toBe(true);
			const updated = store.get(approvalId);
			expect(updated?.state).toBe("rejected");
			expect(updated?.rationale).toBe("Not compliant");
		});

		it("should fail to approve non-existent request", async () => {
			const result = await engine.approve("nonexistent", "reviewer-1", "admin");
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toContain("not found");
			}
		});

		it("should fail to approve already approved request", async () => {
			const tool = createTool({ approvalLevel: "gate" });
			await engine.executeTool(tool, { amount: 100 }, mockContext);
			const approvalId = store.getAll()[0].id;

			await engine.approve(approvalId, "reviewer-1", "admin");
			const result = await engine.approve(approvalId, "reviewer-2", "admin");

			expect(result.success).toBe(false);
			expect(result).toEqual({
				success: false,
				error: expect.stringContaining("cannot approve"),
			});
		});
	});

	describe("getPendingApprovals", () => {
		it("should return all pending requests without context filter", async () => {
			const tool = createTool({ approvalLevel: "gate" });
			await engine.executeTool(tool, { amount: 100 }, mockContext);
			await engine.executeTool(
				tool,
				{ amount: 200 },
				{ ...mockContext, tenantId: "tenant-2" },
			);

			const pending = engine.getPendingApprovals();
			expect(pending).toHaveLength(2);
		});

		it("should filter by tenant when context provided", async () => {
			const tool = createTool({ approvalLevel: "gate" });
			await engine.executeTool(tool, { amount: 100 }, mockContext);
			await engine.executeTool(
				tool,
				{ amount: 200 },
				{ ...mockContext, tenantId: "tenant-2" },
			);

			const tenant1Pending = engine.getPendingApprovals(mockContext);
			expect(tenant1Pending).toHaveLength(1);
			expect(tenant1Pending[0].context.tenantId).toBe("tenant-1");
		});
	});
});
