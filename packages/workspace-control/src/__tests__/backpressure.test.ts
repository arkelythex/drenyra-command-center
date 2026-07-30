import { describe, it, expect, beforeEach } from "vitest";
import { SimpleBackpressureManager } from "../performance/backpressure";
import type { BackpressureManager } from "../performance/backpressure";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeManager(maxQueueSize?: number): BackpressureManager {
	return new SimpleBackpressureManager(maxQueueSize);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("SimpleBackpressureManager", () => {
	let manager: BackpressureManager;

	beforeEach(() => {
		manager = makeManager(10);
	});

	describe("enqueue", () => {
		it("should return true when under limit", () => {
			const result = manager.enqueue();

			expect(result).toBe(true);
			expect(manager.state.eventsQueued).toBe(1);
			expect(manager.state.isThrottled).toBe(false);
		});

		it("should return true when at limit (exactly maxQueueSize)", () => {
			// Fill to limit
			for (let i = 0; i < 10; i++) {
				manager.enqueue();
			}

			expect(manager.state.eventsQueued).toBe(10);
			expect(manager.state.isThrottled).toBe(false);

			// One more should exceed and throttle
			const result = manager.enqueue();
			expect(result).toBe(false);
			expect(manager.state.isThrottled).toBe(true);
		});

		it("should return false and throttle when over limit", () => {
			// Fill to limit
			for (let i = 0; i < 10; i++) {
				manager.enqueue();
			}
			// Exceed
			manager.enqueue();

			expect(manager.state.isThrottled).toBe(true);
			expect(manager.state.droppedSinceReset).toBeGreaterThan(0);

			// Next enqueue should also fail
			const result = manager.enqueue();
			expect(result).toBe(false);
		});
	});

	describe("dequeue", () => {
		it("should reduce queue count", () => {
			manager.enqueue();
			manager.enqueue();

			expect(manager.state.eventsQueued).toBe(2);

			manager.dequeue();
			expect(manager.state.eventsQueued).toBe(1);

			manager.dequeue();
			expect(manager.state.eventsQueued).toBe(0);
		});

		it("should unthrottle when queue drops below max", () => {
			// Fill to max
			for (let i = 0; i < 10; i++) {
				manager.enqueue();
			}
			// Exceed and throttle
			manager.enqueue();
			expect(manager.state.isThrottled).toBe(true);

			// Dequeue to go below max
			manager.dequeue();
			expect(manager.state.isThrottled).toBe(false);
		});

		it("should not go below zero on dequeue", () => {
			manager.dequeue();

			expect(manager.state.eventsQueued).toBe(0);
		});
	});

	describe("reset", () => {
		it("should clear dropped count on reset", () => {
			// Fill to exceed and drop
			for (let i = 0; i < 11; i++) {
				manager.enqueue();
			}

			expect(manager.state.droppedSinceReset).toBeGreaterThan(0);

			manager.reset();

			expect(manager.state.droppedSinceReset).toBe(0);
			expect(manager.state.eventsQueued).toBe(0);
			expect(manager.state.isThrottled).toBe(false);
		});
	});

	describe("default max queue size", () => {
		it("should default to 1000", () => {
			const defaultManager = makeManager();

			expect(defaultManager.state.maxQueueSize).toBe(1000);
		});
	});
});

// ─── Property-based test ─────────────────────────────────────────────────────

describe("Backpressure invariants", () => {
	it("should decrease queue count after dequeue following enqueue", () => {
		const manager = makeManager(10);

		manager.enqueue();
		const before = manager.state.eventsQueued;

		manager.dequeue();
		const after = manager.state.eventsQueued;

		expect(after).toBeLessThan(before);
	});

	it("should never have queue below zero", () => {
		const manager = makeManager(10);

		// Dequeue multiple times on empty
		manager.dequeue();
		manager.dequeue();
		manager.dequeue();

		expect(manager.state.eventsQueued).toBe(0);
	});
});
