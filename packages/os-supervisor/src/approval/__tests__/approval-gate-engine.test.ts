import { PlatformEventBus, PlatformEventTypes } from "@arkelythex/core/events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OPAPolicyEngine } from "../../policy/opa-policy-engine.js";
import type { OSAgentContext } from "../../types/agent.types.js";
import { VerticalType } from "../../types/vertical.types.js";
import { OSApprovalGateEngine } from "../approval-gate-engine.js";
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

function createMockOPA(
	decision: "allow" | "gate" | "deny",
	reason?: string,
): OPAPolicyEngine {
	return {
		evaluate: vi.fn().mockResolvedValue({
			decision,
			reason,
			opaQueried: true,
		}),
	} as unknown as OPAPolicyEngine;
}

function createFailingMockOPA(): OPAPolicyEngine {
	return {
		evaluate: vi.fn().mockRejectedValue(new Error("OPA network error")),
	} as unknown as OPAPolicyEngine;
}

describe("OSApprovalGateEngine", () => {
	let engine: OSApprovalGateEngine;
	let store: InMemoryApprovalStore;

	beforeEach(() => {
		store = new InMemoryApprovalStore();
		engine = new OSApprovalGateEngine(store);
	});

	it("should auto-allow 'auto' level without creating request", async () => {
		const result = await engine.evaluate({
			toolName: "invoice:list",
			input: {},
			context: mockContext,
			approvalLevel: "auto",
		});
		expect(result.allowed).toBe(true);
		expect(result.requiresAction).toBe(false);
		expect(result.requestId).toBeUndefined();
		expect(result.actionType).toBe("auto");
	});

	it("should allow 'notify' level and not require action", async () => {
		const result = await engine.evaluate({
			toolName: "invoice:create",
			input: {},
			context: mockContext,
			approvalLevel: "notify",
		});
		expect(result.allowed).toBe(true);
		expect(result.requiresAction).toBe(false);
		expect(result.actionType).toBe("notify");
	});

	it("should block 'gate' level and create approval request", async () => {
		const result = await engine.evaluate({
			toolName: "drone:launch",
			input: { command: "takeoff" },
			context: mockContext,
			approvalLevel: "gate",
		});
		expect(result.allowed).toBe(false);
		expect(result.requiresAction).toBe(true);
		expect(result.requestId).toBeDefined();
	});

	it("should block 'policy_gate' level and create approval request", async () => {
		const result = await engine.evaluate({
			toolName: "sire:submit",
			input: { period: "2026-05" },
			context: mockContext,
			approvalLevel: "policy_gate",
		});
		expect(result.allowed).toBe(false);
		expect(result.requiresAction).toBe(true);
		expect(result.requestId).toBeDefined();
	});

	it("should approve a pending request through the gate", async () => {
		const evalResult = await engine.evaluate({
			toolName: "drone:launch",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
		});
		expect(evalResult.allowed).toBe(false);

		const requestId = evalResult.requestId;
		expect(requestId).toBeDefined();
		await engine.approve(requestId as string, "reviewer-1");
		const pending = await engine.getPending();
		expect(pending).toHaveLength(0);
	});

	it("should reject a pending request through the gate", async () => {
		const evalResult = await engine.evaluate({
			toolName: "employee:terminate",
			input: { employeeId: "e1" },
			context: mockContext,
			approvalLevel: "gate",
		});

		const requestId = evalResult.requestId;
		expect(requestId).toBeDefined();
		await engine.reject(requestId as string, "reviewer-2", "Not authorized");
		const pending = await engine.getPending();
		expect(pending).toHaveLength(0);

		const rejected = await engine.getRejected();
		expect(rejected).toHaveLength(1);
		expect(rejected[0]?.rationale).toBe("Not authorized");
	});

	it("should list pending approvals from the gate", async () => {
		await engine.evaluate({
			toolName: "tool-a",
			input: {},
			context: mockContext,
			approvalLevel: "gate",
		});
		await engine.evaluate({
			toolName: "tool-b",
			input: {},
			context: mockContext,
			approvalLevel: "policy_gate",
		});
		const pending = await engine.getPending();
		expect(pending).toHaveLength(2);
	});

	describe("with OPAPolicyEngine", () => {
		it("should allow gate-level when OPA returns allow", async () => {
			const opa = createMockOPA("allow");
			const e = new OSApprovalGateEngine(store, opa);

			const result = await e.evaluate({
				toolName: "drone:launch",
				input: {},
				context: mockContext,
				approvalLevel: "gate",
			});

			expect(result.allowed).toBe(true);
			expect(result.requiresAction).toBe(false);
			expect(result.requestId).toBeUndefined();
			expect(opa.evaluate).toHaveBeenCalledOnce();
		});

		it("should allow policy_gate-level when OPA returns allow", async () => {
			const opa = createMockOPA("allow");
			const e = new OSApprovalGateEngine(store, opa);

			const result = await e.evaluate({
				toolName: "sire:submit",
				input: {},
				context: mockContext,
				approvalLevel: "policy_gate",
			});

			expect(result.allowed).toBe(true);
			expect(result.requiresAction).toBe(false);
			expect(opa.evaluate).toHaveBeenCalledOnce();
		});

		it("should reject when OPA returns deny and create rejected request", async () => {
			const opa = createMockOPA("deny", "RUC not in approved list");
			const e = new OSApprovalGateEngine(store, opa);

			const result = await e.evaluate({
				toolName: "employee:terminate",
				input: { employeeId: "e1" },
				context: mockContext,
				approvalLevel: "gate",
			});

			expect(result.allowed).toBe(false);
			expect(result.requiresAction).toBe(false);
			expect(result.reason).toBe("RUC not in approved list");
			expect(result.requestId).toBeDefined();
			expect(opa.evaluate).toHaveBeenCalledOnce();

			const rejected = await e.getRejected();
			expect(rejected).toHaveLength(1);
			expect(rejected[0]?.rationale).toBe("RUC not in approved list");
		});

		it("should gate when OPA returns gate and create proposed request", async () => {
			const opa = createMockOPA("gate");
			const e = new OSApprovalGateEngine(store, opa);

			const result = await e.evaluate({
				toolName: "drone:launch",
				input: { command: "takeoff" },
				context: mockContext,
				approvalLevel: "gate",
			});

			expect(result.allowed).toBe(false);
			expect(result.requiresAction).toBe(true);
			expect(result.requestId).toBeDefined();
			expect(opa.evaluate).toHaveBeenCalledOnce();

			const pending = await e.getPending();
			expect(pending).toHaveLength(1);
		});

		it("should fall through to human approval when OPA throws error", async () => {
			const opa = createFailingMockOPA();
			const e = new OSApprovalGateEngine(store, opa);

			const result = await e.evaluate({
				toolName: "drone:launch",
				input: { command: "takeoff" },
				context: mockContext,
				approvalLevel: "gate",
			});

			expect(result.allowed).toBe(false);
			expect(result.requiresAction).toBe(true);
			expect(result.requestId).toBeDefined();
			expect(opa.evaluate).toHaveBeenCalledOnce();

			const pending = await e.getPending();
			expect(pending).toHaveLength(1);
		});

		it("should not query OPA for auto level", async () => {
			const opa = createMockOPA("allow");
			const e = new OSApprovalGateEngine(store, opa);

			const result = await e.evaluate({
				toolName: "invoice:list",
				input: {},
				context: mockContext,
				approvalLevel: "auto",
			});

			expect(result.allowed).toBe(true);
			expect(opa.evaluate).not.toHaveBeenCalled();
		});

		it("should not query OPA for notify level", async () => {
			const opa = createMockOPA("allow");
			const e = new OSApprovalGateEngine(store, opa);

			const result = await e.evaluate({
				toolName: "invoice:create",
				input: {},
				context: mockContext,
				approvalLevel: "notify",
			});

			expect(result.allowed).toBe(true);
			expect(opa.evaluate).not.toHaveBeenCalled();
		});
	});
});

describe("approval gate engine event bus", () => {
	it("should publish os.approval.requested when a gate request is created", async () => {
		const store = new InMemoryApprovalStore();
		const bus = new PlatformEventBus();
		const engine = new OSApprovalGateEngine(store, undefined, bus);

		const received: Array<{ type: string; payload: unknown }> = [];
		await bus.subscribe(PlatformEventTypes.OsApprovalRequested, (event) => {
			received.push({ type: event.type, payload: event.payload });
		});

		const result = await engine.evaluate({
			toolName: "test-tool",
			input: "test",
			context: mockContext,
			approvalLevel: "gate",
		});

		expect(result.allowed).toBe(false);
		expect(received.length).toBe(1);
		expect(received[0]?.type).toBe(PlatformEventTypes.OsApprovalRequested);
	});

	it("should NOT publish approval events for auto level", async () => {
		const store = new InMemoryApprovalStore();
		const bus = new PlatformEventBus();
		const engine = new OSApprovalGateEngine(store, undefined, bus);

		const received: Array<{ type: string }> = [];
		await bus.subscribe(PlatformEventTypes.OsApprovalRequested, (event) => {
			received.push({ type: event.type });
		});

		const result = await engine.evaluate({
			toolName: "test-tool",
			input: "test",
			context: mockContext,
			approvalLevel: "auto",
		});

		expect(result.allowed).toBe(true);
		expect(received.length).toBe(0);
	});

	it("should publish os.approval.resolved when approved", async () => {
		const store = new InMemoryApprovalStore();
		const bus = new PlatformEventBus();
		const engine = new OSApprovalGateEngine(store, undefined, bus);

		const received: Array<{ type: string; payload: unknown }> = [];
		await bus.subscribe(PlatformEventTypes.OsApprovalResolved, (event) => {
			received.push({ type: event.type, payload: event.payload });
		});

		const evalResult = await engine.evaluate({
			toolName: "test-tool",
			input: "test",
			context: mockContext,
			approvalLevel: "gate",
		});

		const approveId = evalResult.requestId;
		expect(approveId).toBeDefined();
		await engine.approve(approveId, "reviewer-1", "Looks good");

		expect(received.length).toBe(1);
		expect(received[0]?.type).toBe(PlatformEventTypes.OsApprovalResolved);
		const p = received[0]?.payload as Record<string, unknown>;
		expect(p.resolution).toBe("approved");
		expect(p.requestId).toBe(evalResult.requestId);
	});

	it("should publish os.approval.resolved when rejected", async () => {
		const store = new InMemoryApprovalStore();
		const bus = new PlatformEventBus();
		const engine = new OSApprovalGateEngine(store, undefined, bus);

		const received: Array<{ type: string; payload: unknown }> = [];
		await bus.subscribe(PlatformEventTypes.OsApprovalResolved, (event) => {
			received.push({ type: event.type, payload: event.payload });
		});

		const evalResult = await engine.evaluate({
			toolName: "test-tool",
			input: "test",
			context: mockContext,
			approvalLevel: "gate",
		});

		const rejectId = evalResult.requestId;
		expect(rejectId).toBeDefined();
		await engine.reject(rejectId, "reviewer-1", "Not approved");

		expect(received.length).toBe(1);
		expect(received[0]?.type).toBe(PlatformEventTypes.OsApprovalResolved);
		const p = received[0]?.payload as Record<string, unknown>;
		expect(p.resolution).toBe("rejected");
		expect(p.requestId).toBe(evalResult.requestId);
	});
});
