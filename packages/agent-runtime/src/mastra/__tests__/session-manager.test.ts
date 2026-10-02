import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import { SessionManager } from "../session-manager";

const mockContext: AgentContext = {
	tenantId: "tenant-1",
	userId: "user-1",
	organizationId: "org-1",
	companyId: "comp-1",
	ruc: "20123456789",
	sessionId: "session-1",
	traceId: "trace-1",
};

describe("SessionManager", () => {
	let manager: SessionManager;

	beforeEach(() => {
		vi.useFakeTimers();
		manager = new SessionManager(30 * 60 * 1000); // 30 min TTL
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should create a new session with active status", () => {
		const session = manager.create("Process invoice", mockContext);
		expect(session.id).toBeDefined();
		expect(session.goal).toBe("Process invoice");
		expect(session.status).toBe("active");
		expect(session.context.tenantId).toBe("tenant-1");
		expect(session.steps).toEqual([]);
	});

	it("should retrieve a session by id", () => {
		const created = manager.create("Test", mockContext);
		const retrieved = manager.get(created.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(created.id);
	});

	it("should return undefined for unknown id", () => {
		expect(manager.get("nonexistent")).toBeUndefined();
	});

	it("should return timed-out session with timeout status", () => {
		const session = manager.create("Test", mockContext);

		// Advance time past TTL
		vi.advanceTimersByTime(31 * 60 * 1000);

		const retrieved = manager.get(session.id);
		expect(retrieved?.status).toBe("timeout");
	});

	it("should update session fields", () => {
		const session = manager.create("Test", mockContext);
		manager.update(session.id, { metadata: { key: "value" } });

		const updated = manager.get(session.id);
		expect(updated?.metadata).toEqual({ key: "value" });
	});

	it("should not update non-existent session", () => {
		expect(() => manager.update("nope", { status: "completed" })).not.toThrow();
	});

	it("should add steps to a session", () => {
		const session = manager.create("Test", mockContext);
		const stepId = manager.addStep(session.id, "compliance");

		expect(stepId).toBeDefined();
		const updated = manager.get(session.id);
		expect(updated?.steps).toHaveLength(1);
		expect(updated?.steps[0].domain).toBe("compliance");
		expect(updated?.steps[0].status).toBe("pending");
	});

	it("should return undefined when adding step to non-existent session", () => {
		const stepId = manager.addStep("nope", "compliance");
		expect(stepId).toBeUndefined();
	});

	it("should update step status", () => {
		const session = manager.create("Test", mockContext);
		const stepId = manager.addStep(session.id, "compliance");

		manager.updateStep(session.id, stepId!, { status: "completed" });

		const updated = manager.get(session.id);
		expect(updated?.steps[0].status).toBe("completed");
	});

	it("should auto-mark session completed when all steps done", () => {
		const session = manager.create("Test", mockContext);
		const s1 = manager.addStep(session.id, "compliance")!;
		const s2 = manager.addStep(session.id, "finance")!;

		manager.updateStep(session.id, s1, { status: "completed" });
		manager.updateStep(session.id, s2, { status: "completed" });

		const updated = manager.get(session.id);
		expect(updated?.status).toBe("completed");
	});

	it("should auto-mark session failed when any step fails", () => {
		const session = manager.create("Test", mockContext);
		const s1 = manager.addStep(session.id, "compliance")!;
		const s2 = manager.addStep(session.id, "finance")!;

		manager.updateStep(session.id, s1, { status: "completed" });
		manager.updateStep(session.id, s2, { status: "failed" });

		const updated = manager.get(session.id);
		expect(updated?.status).toBe("failed");
	});

	it("should cleanup expired sessions", () => {
		manager.create("Session A", mockContext);
		manager.create("Session B", mockContext);

		// Advance past TTL
		vi.advanceTimersByTime(31 * 60 * 1000);

		const count = manager.cleanup();
		expect(count).toBe(2);

		const active = manager.getActiveSessions();
		expect(active).toHaveLength(0);
	});

	it("should return active sessions", () => {
		manager.create("Active", mockContext);
		const expired = manager.create("Expired", mockContext);

		// Only expire the second one
		vi.advanceTimersByTime(31 * 60 * 1000);
		manager.get(expired.id); // triggers TTL check

		const active = manager.getActiveSessions();
		expect(active).toHaveLength(1);
		expect(active[0].goal).toBe("Active");
	});
});
