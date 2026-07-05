import { describe, expect, it } from "vitest";
import { EventBus } from "../../src/kernel/event-bus.js";

describe("EventBus", () => {
	describe("publish and subscribe", () => {
		it("delivers an event to a subscriber of that type", () => {
			const bus = new EventBus();
			const received: unknown[] = [];

			bus.on("task.completed", (event) => {
				received.push(event);
			});

			bus.emit("task.completed", { taskId: "task-1", result: "ok" });

			expect(received).toHaveLength(1);
			expect(received[0]).toEqual({
				type: "task.completed",
				payload: { taskId: "task-1", result: "ok" },
				timestamp: expect.any(String),
			});
		});

		it("does NOT deliver events to subscribers of other types", () => {
			const bus = new EventBus();
			const received: unknown[] = [];

			bus.on("agent.error", (event) => {
				received.push(event);
			});

			bus.emit("task.completed", { taskId: "task-1" });

			expect(received).toHaveLength(0);
		});

		it("supports multiple subscribers for the same event type", () => {
			const bus = new EventBus();
			const results: number[] = [];

			bus.on("task.completed", () => results.push(1));
			bus.on("task.completed", () => results.push(2));

			bus.emit("task.completed", {});

			expect(results).toHaveLength(2);
			expect(results).toContain(1);
			expect(results).toContain(2);
		});

		it("passes the correct event type and timestamp", () => {
			const bus = new EventBus();
			const received: Array<{ type: string; timestamp: string }> = [];

			bus.on("agent.registered", (event) => {
				received.push(event as { type: string; timestamp: string });
			});

			bus.emit("agent.registered", { agentId: "agent-1" });

			expect(received[0].type).toBe("agent.registered");
			expect(typeof received[0].timestamp).toBe("string");
			expect(new Date(received[0].timestamp).toISOString()).toBe(
				received[0].timestamp,
			);
		});
	});

	describe("unsubscribe", () => {
		it("stops delivering events after unsubscribing", () => {
			const bus = new EventBus();
			const received: unknown[] = [];

			const handler = (event: unknown) => {
				received.push(event);
			};

			bus.on("task.completed", handler);
			bus.off("task.completed", handler);

			bus.emit("task.completed", { taskId: "task-1" });

			expect(received).toHaveLength(0);
		});

		it("only removes the specified handler, not others", () => {
			const bus = new EventBus();
			const results: number[] = [];

			const handlerA = () => results.push(1);
			const handlerB = () => results.push(2);

			bus.on("task.completed", handlerA);
			bus.on("task.completed", handlerB);
			bus.off("task.completed", handlerA);

			bus.emit("task.completed", {});

			expect(results).toEqual([2]);
		});
	});

	describe("once", () => {
		it("fires only once and then auto-removes", () => {
			const bus = new EventBus();
			let count = 0;

			bus.once("task.completed", () => {
				count++;
			});

			bus.emit("task.completed", {});
			bus.emit("task.completed", {});

			expect(count).toBe(1);
		});
	});

	describe("wildcard subscriber", () => {
		it("delivers all events to a wildcard subscriber", () => {
			const bus = new EventBus();
			const received: string[] = [];

			bus.on("*", (event) => {
				received.push((event as { type: string }).type);
			});

			bus.emit("task.completed", {});
			bus.emit("agent.error", {});
			bus.emit("task.started", {});

			expect(received).toEqual([
				"task.completed",
				"agent.error",
				"task.started",
			]);
		});
	});

	describe("error handling", () => {
		it("does not throw when a handler throws", () => {
			const bus = new EventBus();

			bus.on("task.completed", () => {
				throw new Error("Handler error");
			});

			expect(() => {
				bus.emit("task.completed", {});
			}).not.toThrow();
		});

		it("continues delivering to other handlers after one fails", () => {
			const bus = new EventBus();
			const received: unknown[] = [];

			bus.on("task.completed", () => {
				throw new Error("Handler error");
			});

			bus.on("task.completed", (event) => {
				received.push(event);
			});

			bus.emit("task.completed", { taskId: "ok" });

			expect(received).toHaveLength(1);
		});
	});

	describe("removeAllListeners", () => {
		it("removes all handlers for a specific event type", () => {
			const bus = new EventBus();
			let count = 0;

			bus.on("task.completed", () => count++);
			bus.on("task.completed", () => count++);
			bus.removeAllListeners("task.completed");

			bus.emit("task.completed", {});

			expect(count).toBe(0);
		});

		it("does not affect handlers for other event types", () => {
			const bus = new EventBus();
			let count = 0;

			bus.on("task.completed", () => count++);
			bus.on("agent.error", () => count++);
			bus.removeAllListeners("task.completed");

			bus.emit("task.completed", {});
			bus.emit("agent.error", {});

			expect(count).toBe(1);
		});
	});
});
