import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import {
	AgentEventBus,
	type FiscalEvent,
	type FiscalEventType,
} from "../event-bus";

const mockContext: AgentContext = {
	tenantId: "tenant-1",
	userId: "user-1",
	organizationId: "org-1",
	companyId: "comp-1",
	ruc: "20123456789",
	sessionId: "session-1",
	traceId: "trace-1",
};

describe("AgentEventBus", () => {
	let bus: AgentEventBus;

	beforeEach(() => {
		bus = new AgentEventBus();
	});

	afterEach(async () => {
		await bus.disconnect();
	});

	it("should publish and receive events via subscription", async () => {
		const handler = vi.fn();
		await bus.subscribe("fiscal.cpe.received", handler);

		await bus.publish(
			"fiscal.cpe.received",
			{ invoiceId: "INV-001" },
			mockContext,
		);

		expect(handler).toHaveBeenCalledTimes(1);
		const event = handler.mock.calls[0][0] as FiscalEvent;
		expect(event.type).toBe("fiscal.cpe.received");
		expect(event.payload).toEqual({ invoiceId: "INV-001" });
		expect(event.context.tenantId).toBe("tenant-1");
		expect(event.id).toBeDefined();
		expect(event.correlationId).toBeDefined();
		expect(event.source).toBe("drenyra-orchestrator");
	});

	it("should not receive unsubscribed event types", async () => {
		const handler = vi.fn();
		await bus.subscribe("fiscal.cpe.received", handler);

		await bus.publish("fiscal.igv.calculated", { amount: 180 }, mockContext);

		expect(handler).not.toHaveBeenCalled();
	});

	it("should unsubscribe a handler", async () => {
		const handler = vi.fn();
		const unsub = await bus.subscribe("fiscal.cpe.received", handler);
		unsub();

		await bus.publish("fiscal.cpe.received", {}, mockContext);
		expect(handler).not.toHaveBeenCalled();
	});

	it("should call wildcard handlers for all events", async () => {
		const wildcardHandler = vi.fn();
		bus.subscribeAll(wildcardHandler);

		await bus.publish("fiscal.cpe.received", {}, mockContext);
		await bus.publish("agent.task.completed", {}, mockContext);

		expect(wildcardHandler).toHaveBeenCalledTimes(2);
	});

	it("should handle multiple subscribers for same event", async () => {
		const h1 = vi.fn();
		const h2 = vi.fn();
		await bus.subscribe("fiscal.cpe.received", h1);
		await bus.subscribe("fiscal.cpe.received", h2);

		await bus.publish("fiscal.cpe.received", {}, mockContext);
		expect(h1).toHaveBeenCalledTimes(1);
		expect(h2).toHaveBeenCalledTimes(1);
	});

	it("should subscribe to multiple event types at once", async () => {
		const handler = vi.fn();
		const unsub = await bus.subscribeMultiple(
			["fiscal.cpe.received", "fiscal.igv.calculated"],
			handler,
		);

		await bus.publish("fiscal.cpe.received", {}, mockContext);
		await bus.publish("fiscal.igv.calculated", {}, mockContext);

		expect(handler).toHaveBeenCalledTimes(2);

		unsub();
		await bus.publish("fiscal.cpe.received", {}, mockContext);
		expect(handler).toHaveBeenCalledTimes(2); // no increase after unsub
	});

	it("should handle async handlers without blocking", async () => {
		const slowHandler = vi
			.fn()
			.mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 50)),
			);
		await bus.subscribe("fiscal.cpe.received", slowHandler);

		// Should not throw even if handler is slow
		await expect(
			bus.publish("fiscal.cpe.received", {}, mockContext),
		).resolves.toBeUndefined();

		expect(slowHandler).toHaveBeenCalledTimes(1);
	});

	it("should propagate causationId and correlationId", async () => {
		const handler = vi.fn();
		await bus.subscribe("fiscal.cpe.received", handler);

		await bus.publish("fiscal.cpe.received", {}, mockContext, {
			correlationId: "corr-1",
			causationId: "cause-1",
			source: "test",
		});

		const event = handler.mock.calls[0][0] as FiscalEvent;
		expect(event.correlationId).toBe("corr-1");
		expect(event.causationId).toBe("cause-1");
		expect(event.source).toBe("test");
	});

	it("should report healthy status", () => {
		expect(bus.isHealthy()).toBe(true);
	});

	it("should return registered event types", async () => {
		const h = vi.fn();
		await bus.subscribe("fiscal.cpe.received", h);
		await bus.subscribe("fiscal.igv.calculated", h);

		const types = bus.getEventTypes();
		expect(types).toContain("fiscal.cpe.received");
		expect(types).toContain("fiscal.igv.calculated");
	});

	it("should connect and disconnect without errors", async () => {
		await expect(bus.connect()).resolves.toBeUndefined();
		await expect(bus.disconnect()).resolves.toBeUndefined();
		// After disconnect, handlers should be cleared
		const handler = vi.fn();
		await bus.subscribe("fiscal.cpe.received", handler);
		expect(bus.getEventTypes()).toHaveLength(1);
	});
});
