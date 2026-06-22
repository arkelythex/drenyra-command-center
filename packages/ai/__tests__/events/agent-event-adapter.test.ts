/**
 * EventAdapter tests — vitest mocks for EventBus.
 *
 * Covers: subscribe, event mapping accuracy, unique ID generation,
 * non-blocking error handling, and unsubscribe lifecycle.
 */

import { describe, it, expect, vi } from "vitest";
import { createEventAdapter } from "../../src/events/adapter";
import type { EventBus, EventSubscription } from "../../src/agents/types/workflow.types";
import type { AgentEventType as WorkflowEventType } from "../../src/agents/types/workflow.types";
import type { AgentEvent as CanonicalEvent } from "@arkelythex/shared";

// ============================================================================
// Helpers
// ============================================================================

interface RegisteredHandler {
	type: WorkflowEventType;
	handler: (event: unknown) => void;
	subscription: EventSubscription;
}

function createMockEventBus(): {
	bus: EventBus;
	handlers: RegisteredHandler[];
} {
	const handlers: RegisteredHandler[] = [];

	const bus: EventBus = {
		on: vi.fn((eventType: unknown, handler: unknown) => {
			const sub: EventSubscription = {
				id: crypto.randomUUID(),
				eventType,
				handler,
			};
			handlers.push({ type: eventType, handler, subscription: sub });
			return sub;
		}) as unknown as EventBus["on"],
		off: vi.fn(),
		emit: vi.fn(),
		once: vi.fn(),
	};

	return { bus, handlers };
}

function createWorkflowEvent(
	type: WorkflowEventType,
	overrides: Record<string, unknown> = {},
) {
	return {
		type,
		processId: "proc-123",
		timestamp: new Date("2026-06-15T10:00:00Z"),
		...overrides,
	};
}

// ============================================================================
// Tests
// ============================================================================

describe("EventAdapter", () => {
	describe("subscribe", () => {
		it("should register handlers for all mapped event types", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);

			expect(bus.on).toHaveBeenCalled();
			expect(handlers.length).toBeGreaterThan(0);
		});

		it("should map INVOICE_RECEIVED to run_started", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "INVOICE_RECEIVED");
			expect(entry).toBeDefined();

			entry!.handler(createWorkflowEvent("INVOICE_RECEIVED", { payload: {} }));

			expect(onEvent).toHaveBeenCalledTimes(1);
			const event = onEvent.mock.calls[0][0] as CanonicalEvent;
			expect(event.type).toBe("run_started");
			if (event.type === "run_started") {
				expect(event.payload.runId).toBe("proc-123");
			}
		});

		it("should map EXTRACTION_STARTED to progress (status text)", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "EXTRACTION_STARTED");
			expect(entry).toBeDefined();

			entry!.handler(
				createWorkflowEvent("EXTRACTION_STARTED", { agent: "reader" }),
			);

			expect(onEvent).toHaveBeenCalledTimes(1);
			const event = onEvent.mock.calls[0][0] as CanonicalEvent;
			expect(event.type).toBe("progress");
			if (event.type === "progress") {
				expect(event.payload.status).toContain("Extracting");
				expect(event.payload.progress).toBeGreaterThan(0);
			}
		});

		it("should map VALIDATION_STARTED to progress", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "VALIDATION_STARTED");
			expect(entry).toBeDefined();

			entry!.handler(
				createWorkflowEvent("VALIDATION_STARTED", { agent: "validator" }),
			);

			expect(onEvent).toHaveBeenCalledTimes(1);
			const event = onEvent.mock.calls[0][0] as CanonicalEvent;
			expect(event.type).toBe("progress");
		});

		it("should map PROCESS_COMPLETED to complete", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "PROCESS_COMPLETED");
			expect(entry).toBeDefined();

			entry!.handler(
				createWorkflowEvent("PROCESS_COMPLETED", {
					invoiceNumber: "F001-123",
					duration: 4500,
				}),
			);

			expect(onEvent).toHaveBeenCalledTimes(1);
			const event = onEvent.mock.calls[0][0] as CanonicalEvent;
			expect(event.type).toBe("complete");
			if (event.type === "complete") {
				expect(event.payload.duration).toBe(4500);
			}
		});

		it("should map PROCESS_FAILED to error", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "PROCESS_FAILED");
			expect(entry).toBeDefined();

			entry!.handler(
				createWorkflowEvent("PROCESS_FAILED", {
					error: "Reader agent crashed",
				}),
			);

			expect(onEvent).toHaveBeenCalledTimes(1);
			const event = onEvent.mock.calls[0][0] as CanonicalEvent;
			expect(event.type).toBe("error");
			if (event.type === "error") {
				expect(event.payload.message).toBe("Reader agent crashed");
			}
		});

		it("should map OSE_FAILED to tool_error", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "OSE_FAILED");
			expect(entry).toBeDefined();

			entry!.handler(
				createWorkflowEvent("OSE_FAILED", {
					error: "Connection timeout",
					retryCount: 3,
				}),
			);

			expect(onEvent).toHaveBeenCalledTimes(1);
			const event = onEvent.mock.calls[0][0] as CanonicalEvent;
			expect(event.type).toBe("tool_error");
			if (event.type === "tool_error") {
				expect(event.payload.toolName).toBe("ose_submit");
				expect(event.payload.error).toBe("Connection timeout");
			}
		});

		it("should map MANUAL_REVIEW_REQUIRED to approval_required", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "MANUAL_REVIEW_REQUIRED");
			expect(entry).toBeDefined();

			entry!.handler(
				createWorkflowEvent("MANUAL_REVIEW_REQUIRED", {
					reason: "Unusual discrepancy detected",
					conflicts: [],
				}),
			);

			expect(onEvent).toHaveBeenCalledTimes(1);
			const event = onEvent.mock.calls[0][0] as CanonicalEvent;
			expect(event.type).toBe("approval_required");
			if (event.type === "approval_required") {
				expect(event.payload.reason).toBe("Unusual discrepancy detected");
			}
		});

		it("should ignore PRUNE_REQUESTED (return null)", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "PRUNE_REQUESTED");
			expect(entry).toBeDefined();

			entry!.handler(
				createWorkflowEvent("PRUNE_REQUESTED", {
					usage: { totalTokens: 500000, contextWindow: 1000000, usagePercent: 50 },
					threshold: 0.95,
				}),
			);

			// No canonical event should be emitted
			expect(onEvent).not.toHaveBeenCalled();
		});
	});

	describe("unique IDs", () => {
		it("should generate unique event IDs for each mapped event", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);

			const ids = new Set<string>();
			for (const entry of handlers) {
				if (entry.type === "PRUNE_REQUESTED") continue; // skipped
				entry.handler(
					createWorkflowEvent(entry.type as unknown, { payload: {} }),
				);
			}

			const emittedIds = onEvent.mock.calls.map(
				(call: unknown[]) => (call[0] as CanonicalEvent).id,
			);
			for (const id of emittedIds) {
				expect(ids.has(id)).toBe(false);
				ids.add(id);
			}
		});
	});

	describe("non-blocking behavior", () => {
		it("should not throw when callback throws", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn().mockImplementation(() => {
				throw new Error("Callback failure");
			});

			adapter.subscribe(bus, onEvent);
			const entry = handlers.find((h) => h.type === "EXTRACTION_STARTED");
			expect(entry).toBeDefined();

			// Should not throw even though onEvent throws
			expect(() => {
				entry!.handler(
					createWorkflowEvent("EXTRACTION_STARTED", { agent: "reader" }),
				);
			}).not.toThrow();
		});

		it("should continue handling subsequent events after a callback error", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			let callCount = 0;
			const onEvent = vi.fn(() => {
				callCount++;
				if (callCount === 1) throw new Error("First call fails");
			});

			adapter.subscribe(bus, onEvent);

			const extractEntry = handlers.find((h) => h.type === "EXTRACTION_STARTED");
			const parseEntry = handlers.find((h) => h.type === "PARSING_STARTED");
			expect(extractEntry).toBeDefined();
			expect(parseEntry).toBeDefined();

			// First call: throws
			extractEntry!.handler(
				createWorkflowEvent("EXTRACTION_STARTED", { agent: "reader" }),
			);
			// Second call: should still work
			parseEntry!.handler(
				createWorkflowEvent("PARSING_STARTED", { agent: "parser" }),
			);

			expect(onEvent).toHaveBeenCalledTimes(2);
		});
	});

	describe("unsubscribe", () => {
		it("should call off for all registered subscriptions", () => {
			const { bus, handlers } = createMockEventBus();
			const adapter = createEventAdapter();
			const onEvent = vi.fn();

			adapter.subscribe(bus, onEvent);
			const initialCount = handlers.length;
			expect(initialCount).toBeGreaterThan(0);

			adapter.unsubscribe();

			expect(bus.off).toHaveBeenCalledTimes(initialCount);
		});
	});
});
