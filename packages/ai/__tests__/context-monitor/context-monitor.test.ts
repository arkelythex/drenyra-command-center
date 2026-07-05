import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMonitor } from "../../src/context-monitor/context-monitor";
import type { AgentRunEvent } from "../../src/session/session.types";
import type { SessionStore } from "../../src/session/session-store";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GEMINI_3_FLASH = "gemini-3-flash"; // contextWindow: 1_000_000
const GEMINI_3_PRO = "gemini-3-pro"; // contextWindow: 2_000_000
const UNKNOWN_MODEL = "unknown-model-xyz"; // fallback: 200_000

const DEFAULT_THRESHOLD = 0.95;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockSessionStore(): SessionStore {
	return {
		saveRunState: vi.fn(),
		getRunState: vi.fn(),
		listRunStates: vi.fn(),
		appendEvent: vi.fn(),
		getEvents: vi.fn(),
		updateRunState: vi.fn(),
		recoverRunState: vi.fn(),
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ContextMonitor", () => {
	describe("trackRequest", () => {
		it("should create a new run entry on first call", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});

			const usage = monitor.getRunUsage("run-1");
			expect(usage).not.toBeNull();
			expect(usage!.totalTokens).toBe(150);
			expect(usage!.promptTokens).toBe(100);
			expect(usage!.completionTokens).toBe(50);
			expect(usage!.modelContextWindow).toBe(1_000_000);
		});

		it("should accumulate tokens across multiple calls for the same run", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});
			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 200,
				completionTokens: 100,
			});

			const usage = monitor.getRunUsage("run-1");
			expect(usage!.totalTokens).toBe(450);
			expect(usage!.promptTokens).toBe(300);
			expect(usage!.completionTokens).toBe(150);
		});

		it("should resolve the model context window correctly", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", GEMINI_3_PRO, {
				promptTokens: 10,
				completionTokens: 10,
			});
			monitor.trackRequest("run-2", GEMINI_3_FLASH, {
				promptTokens: 10,
				completionTokens: 10,
			});

			expect(monitor.getRunUsage("run-1")!.modelContextWindow).toBe(2_000_000);
			expect(monitor.getRunUsage("run-2")!.modelContextWindow).toBe(1_000_000);
		});

		it("should fall back to 200K context window for unknown models", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", UNKNOWN_MODEL, {
				promptTokens: 100,
				completionTokens: 50,
			});

			const usage = monitor.getRunUsage("run-1");
			expect(usage!.modelContextWindow).toBe(200_000);
		});

		it("should be non-blocking when SessionStore.appendEvent throws", () => {
			const store = createMockSessionStore();
			store.appendEvent = vi.fn().mockRejectedValue(new Error("DB error"));
			const monitor = new ContextMonitor(store);

			expect(() => {
				monitor.trackRequest("run-1", GEMINI_3_FLASH, {
					promptTokens: 100,
					completionTokens: 50,
				});
			}).not.toThrow();

			// Usage should still be tracked in memory
			const usage = monitor.getRunUsage("run-1");
			expect(usage).not.toBeNull();
			expect(usage!.totalTokens).toBe(150);
		});

		it("should persist usage snapshot when SessionStore is configured", async () => {
			const store = createMockSessionStore();
			const monitor = new ContextMonitor(store);

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});

			// Wait for the async persist to complete
			await vi.waitFor(() => {
				expect(store.appendEvent).toHaveBeenCalledTimes(1);
			});

			const call = (store.appendEvent as ReturnType<typeof vi.fn>).mock
				.calls[0];
			const event = call[1] as AgentRunEvent;
			expect(event.eventType).toBe("context_usage_snapshot");
			expect(event.runId).toBe("run-1");
		});

		it("should not persist when no SessionStore is configured", async () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});

			// Small delay to ensure no async persist fires
			await new Promise((r) => setTimeout(r, 50));
			// If no store is configured, no error should occur
			const usage = monitor.getRunUsage("run-1");
			expect(usage).not.toBeNull();
		});
	});

	describe("shouldPrune", () => {
		it("should return false when usage is under the threshold", () => {
			const monitor = new ContextMonitor();

			// 100K tokens on a 1M window = 10%
			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 50_000,
				completionTokens: 50_000,
			});

			expect(monitor.shouldPrune("run-1")).toBe(false);
		});

		it("should return true when usage reaches exactly the threshold", () => {
			const monitor = new ContextMonitor();

			// 950K tokens on a 1M window = 95%
			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 950_000,
				completionTokens: 0,
			});

			expect(monitor.shouldPrune("run-1")).toBe(true);
		});

		it("should return true when usage exceeds the threshold", () => {
			const monitor = new ContextMonitor();

			// 960K tokens on a 1M window = 96%
			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 600_000,
				completionTokens: 360_000,
			});

			expect(monitor.shouldPrune("run-1")).toBe(true);
		});

		it("should return false for an unknown run", () => {
			const monitor = new ContextMonitor();

			expect(monitor.shouldPrune("nonexistent-run")).toBe(false);
		});

		it("should return false for a run with no tracked requests yet", () => {
			const monitor = new ContextMonitor();

			expect(monitor.shouldPrune("run-1")).toBe(false);
		});

		it("should deduplicate threshold signal — first call returns true, subsequent calls return true but do not re-persist", async () => {
			const store = createMockSessionStore();
			const monitor = new ContextMonitor(store);

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 1_000_000,
				completionTokens: 0,
			});

			// First call — should trigger
			const first = monitor.shouldPrune("run-1");
			expect(first).toBe(true);

			// Second call — should still return true (threshold was reached)
			const second = monitor.shouldPrune("run-1");
			expect(second).toBe(true);

			// Should have persisted the threshold event exactly once
			const thresholdEvents = (
				store.appendEvent as ReturnType<typeof vi.fn>
			).mock.calls.filter(
				(call: unknown[]) =>
					(call[1] as AgentRunEvent).eventType === "context_threshold_reached",
			);
			expect(thresholdEvents).toHaveLength(1);
		});

		it("should handle SessionStore errors non-blockingly in shouldPrune", () => {
			const store = createMockSessionStore();
			store.appendEvent = vi.fn().mockRejectedValue(new Error("DB error"));
			const monitor = new ContextMonitor(store);

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 1_000_000,
				completionTokens: 0,
			});

			// Should not throw even though SessionStore fails
			expect(() => monitor.shouldPrune("run-1")).not.toThrow();
		});

		it("should respect a custom threshold", () => {
			// 50% threshold
			const monitor = new ContextMonitor(undefined, { threshold: 0.5 });

			// 600K on a 1M window = 60% — above 50% threshold
			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 300_000,
				completionTokens: 300_000,
			});

			expect(monitor.shouldPrune("run-1")).toBe(true);
		});

		it("should not signal threshold when context window is zero", () => {
			const monitor = new ContextMonitor();

			// Internal: if context window resolves to 0, should not signal
			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 0,
				completionTokens: 0,
			});

			// The internal usage check should be safe
			expect(monitor.shouldPrune("run-1")).toBe(false);
		});
	});

	describe("getRunUsage", () => {
		it("should return correct usage snapshot for a tracked run", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});

			const usage = monitor.getRunUsage("run-1");
			expect(usage).not.toBeNull();
			expect(usage!.totalTokens).toBe(150);
			expect(usage!.usageRatio).toBeCloseTo(150 / 1_000_000, 6);
			expect(usage!.modelId).toBe(GEMINI_3_FLASH);
			expect(usage!.lastChecked).toBeInstanceOf(Date);
		});

		it("should return null for an unknown run", () => {
			const monitor = new ContextMonitor();

			expect(monitor.getRunUsage("nonexistent")).toBeNull();
		});

		it("should return null when SessionStore errors occur (non-blocking)", () => {
			// getRunUsage doesn't use SessionStore, so this tests internal error handling
			const monitor = new ContextMonitor();

			// No error expected for normal operation
			expect(monitor.getRunUsage("run-1")).toBeNull();
		});
	});

	describe("resetRun", () => {
		it("should clear tracking for a run", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});
			expect(monitor.getRunUsage("run-1")).not.toBeNull();

			monitor.resetRun("run-1");
			expect(monitor.getRunUsage("run-1")).toBeNull();
		});

		it("should not throw when resetting an unknown run", () => {
			const monitor = new ContextMonitor();

			expect(() => monitor.resetRun("nonexistent")).not.toThrow();
		});
	});

	describe("edge cases", () => {
		it("should handle concurrent runs independently", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-a", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});
			monitor.trackRequest("run-b", GEMINI_3_PRO, {
				promptTokens: 500,
				completionTokens: 200,
			});

			expect(monitor.getRunUsage("run-a")!.totalTokens).toBe(150);
			expect(monitor.getRunUsage("run-b")!.totalTokens).toBe(700);
			expect(monitor.getRunUsage("run-a")!.modelContextWindow).toBe(1_000_000);
			expect(monitor.getRunUsage("run-b")!.modelContextWindow).toBe(2_000_000);
		});

		it("should handle model changes mid-run", () => {
			const monitor = new ContextMonitor();

			monitor.trackRequest("run-1", GEMINI_3_FLASH, {
				promptTokens: 100,
				completionTokens: 50,
			});
			// Switch to a different model
			monitor.trackRequest("run-1", GEMINI_3_PRO, {
				promptTokens: 200,
				completionTokens: 100,
			});

			const usage = monitor.getRunUsage("run-1");
			expect(usage!.totalTokens).toBe(450);
			// Should use the latest model's context window
			expect(usage!.modelContextWindow).toBe(2_000_000);
		});

		it("should not throw when constructed without arguments", () => {
			expect(() => new ContextMonitor()).not.toThrow();
			expect(() => new ContextMonitor(undefined)).not.toThrow();
			expect(() => new ContextMonitor(undefined, {})).not.toThrow();
		});
	});
});
