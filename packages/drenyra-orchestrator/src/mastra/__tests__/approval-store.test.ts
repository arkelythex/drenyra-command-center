import { beforeEach, describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { ApprovalRequest } from "../../types/approval-gate";
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

function createRequest(
	overrides: Partial<ApprovalRequest> = {},
): ApprovalRequest {
	return {
		id: "req-1",
		toolName: "test-tool",
		input: { amount: 1000 },
		context: mockContext,
		approvalLevel: "gate",
		state: "proposed",
		proposedAt: new Date(),
		governanceResult: undefined,
		...overrides,
	};
}

describe("ApprovalStore", () => {
	let store: ApprovalStore;

	beforeEach(() => {
		store = new ApprovalStore();
	});

	it("should save and retrieve a request", () => {
		const req = createRequest();
		store.save(req);
		expect(store.get("req-1")).toEqual(req);
	});

	it("should return undefined for unknown id", () => {
		expect(store.get("nonexistent")).toBeUndefined();
	});

	it("should update an existing request", () => {
		store.save(createRequest());
		store.update("req-1", { state: "approved", reviewerId: "user-2" });

		const updated = store.get("req-1");
		expect(updated?.state).toBe("approved");
		expect(updated?.reviewerId).toBe("user-2");
	});

	it("should not update a non-existent request", () => {
		expect(() => store.update("nope", { state: "approved" })).not.toThrow();
	});

	it("should list requests by state", () => {
		store.save(createRequest({ id: "r1", state: "proposed" }));
		store.save(createRequest({ id: "r2", state: "approved" }));
		store.save(createRequest({ id: "r3", state: "proposed" }));

		const proposed = store.listByState("proposed");
		expect(proposed).toHaveLength(2);
		expect(proposed.map((r) => r.id).sort()).toEqual(["r1", "r3"]);
	});

	it("should list requests by tenant context", () => {
		const otherContext: AgentContext = {
			...mockContext,
			tenantId: "tenant-2",
		};
		store.save(createRequest({ id: "r1", context: mockContext }));
		store.save(createRequest({ id: "r2", context: otherContext }));

		const tenant1 = store.listByContext({ tenantId: "tenant-1" });
		expect(tenant1).toHaveLength(1);
		expect(tenant1[0].id).toBe("r1");
	});

	it("should return all requests", () => {
		store.save(createRequest({ id: "r1" }));
		store.save(createRequest({ id: "r2" }));
		expect(store.getAll()).toHaveLength(2);
	});
});
