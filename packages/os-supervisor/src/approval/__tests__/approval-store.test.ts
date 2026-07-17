import { beforeEach, describe, expect, it } from "vitest";
import type { OSAgentContext } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import type { OSApprovalRequest } from "../approval.types.js";
import { InMemoryApprovalStore } from "../approval-store.js";

const mockContext: OSAgentContext = {
	tenantId: "t1",
	userId: "u1",
	organizationId: "o1",
	companyId: "c1",
	ruc: "20123456789",
	traceId: "trace-1",
	vertical: VerticalType.DRENYRA,
};

describe("InMemoryApprovalStore", () => {
	let store: InMemoryApprovalStore;

	beforeEach(() => {
		store = new InMemoryApprovalStore();
	});

	it("should propose a new approval request", async () => {
		const request: OSApprovalRequest = {
			id: "req-1",
			toolName: "drone:launch",
			input: { command: "takeoff" },
			context: mockContext,
			approvalLevel: "gate",
			state: "proposed",
			proposedAt: new Date(),
		};
		await store.propose(request);
		const retrieved = await store.get("req-1");
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe("req-1");
		expect(retrieved?.state).toBe("proposed");
	});

	it("should approve a proposed request", async () => {
		await store.propose({
			id: "req-2",
			toolName: "drone:launch",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
			state: "proposed",
			proposedAt: new Date(),
		});
		await store.approve("req-2", "reviewer-1");
		const retrieved = await store.get("req-2");
		expect(retrieved?.state).toBe("approved");
		expect(retrieved?.reviewerId).toBe("reviewer-1");
		expect(retrieved?.decidedAt).toBeInstanceOf(Date);
	});

	it("should reject a proposed request", async () => {
		await store.propose({
			id: "req-3",
			toolName: "sire:submit",
			input: {},
			context: mockContext,
			approvalLevel: "policy_gate",
			state: "proposed",
			proposedAt: new Date(),
		});
		await store.reject("req-3", "reviewer-2", "Incomplete data");
		const retrieved = await store.get("req-3");
		expect(retrieved?.state).toBe("rejected");
		expect(retrieved?.rationale).toBe("Incomplete data");
	});

	it("should list pending approvals", async () => {
		await store.propose({
			id: "req-4",
			toolName: "drone:launch",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
			state: "proposed",
			proposedAt: new Date(),
		});
		await store.propose({
			id: "req-5",
			toolName: "employee:terminate",
			input: {},
			context: mockContext,
			approvalLevel: "policy_gate",
			state: "proposed",
			proposedAt: new Date(),
		});
		await store.approve("req-4", "reviewer-1");
		const pending = await store.getPending();
		expect(pending).toHaveLength(1);
		expect(pending[0]?.id).toBe("req-5");
	});

	it("should cancel a proposed request", async () => {
		await store.propose({
			id: "req-6",
			toolName: "drone:launch",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
			state: "proposed",
			proposedAt: new Date(),
		});
		await store.cancel("req-6");
		const retrieved = await store.get("req-6");
		expect(retrieved?.state).toBe("cancelled");
	});

	it("should throw on double approve", async () => {
		await store.propose({
			id: "req-7",
			toolName: "drone:launch",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
			state: "proposed",
			proposedAt: new Date(),
		});
		await store.approve("req-7", "reviewer-1");
		await expect(store.approve("req-7", "reviewer-2")).rejects.toThrow();
	});

	it("should throw on approving non-existent request", async () => {
		await expect(store.approve("no-such", "reviewer-1")).rejects.toThrow();
	});
});
