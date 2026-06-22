/**
 * Retry Engine Tests
 *
 * @module __tests__/services/error-recovery
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.mock is hoisted, so declarative mock fns must use vi.hoisted()
const { mockEnqueue, mockDequeue, mockMarkResolved, mockMarkDead, mockIncrementRetry } =
	vi.hoisted(() => ({
		mockEnqueue: vi.fn(),
		mockDequeue: vi.fn(),
		mockMarkResolved: vi.fn(),
		mockMarkDead: vi.fn(),
		mockIncrementRetry: vi.fn(),
	}));

vi.mock("@arkelythex/infrastructure/services/error-recovery", () => ({
	dlqRepo: {
		enqueue: mockEnqueue,
		dequeue: mockDequeue,
		markResolved: mockMarkResolved,
		markDead: mockMarkDead,
		incrementRetry: mockIncrementRetry,
		listByStatus: vi.fn(),
		countByStatus: vi.fn(),
	},
}));

import { AgentError } from "../../../src/services/error-recovery/agent-error";
import { RetryEngine } from "../../../src/services/error-recovery/retry-engine";
import type { RetryConfig } from "../../../src/services/error-recovery/retry-engine";

describe("RetryEngine", () => {
	let engine: RetryEngine;

	beforeEach(() => {
		vi.clearAllMocks();
		engine = new RetryEngine();
	});

	// ─── executeWithRetry: Success on first try ──────────────────────

	it("returns result on first successful try", async () => {
		const fn = vi.fn().mockResolvedValue("success");

		const result = await engine.executeWithRetry(fn, {
			agentName: "reader",
			runId: "run-1",
		});

		expect(result.result).toBe("success");
		expect(result.error).toBeUndefined();
		expect(result.retries).toBe(0);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	// ─── executeWithRetry: Retry on transient error, then succeed ──────

	it("retries on transient error and succeeds", async () => {
		vi.useFakeTimers();
		const fn = vi
			.fn()
			.mockRejectedValueOnce(new Error("timeout"))
			.mockResolvedValueOnce("recovered");

		// Don't await directly — advance timers while retry sleeps
		const retryPromise = engine.executeWithRetry(fn, {
			agentName: "reader",
			runId: "run-1",
		});

		// Advance enough for 1 retry (baseDelayMs * 2^0 = 1000ms)
		await vi.advanceTimersByTimeAsync(5000);

		const result = await retryPromise;
		expect(result.result).toBe("recovered");
		expect(result.retries).toBe(1);
		expect(fn).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	// ─── executeWithRetry: Exhausts retries and enqueues to DLQ ───────

	it("exhausts retries and enqueues to DLQ", async () => {
		vi.useFakeTimers();
		const fn = vi.fn().mockRejectedValue(new Error("timeout"));

		mockEnqueue.mockResolvedValue({ id: "dlq-1" });

		const retryPromise = engine.executeWithRetry(fn, {
			agentName: "reader",
			runId: "run-1",
			workflowState: "EXTRACTING",
			input: { data: "test" },
		});

		// Advance enough for 3 retries (exponential: 1s + 2s + 4s = ~7s)
		await vi.advanceTimersByTimeAsync(30000);

		const result = await retryPromise;
		expect(result.result).toBeUndefined();
		expect(result.error).toBeDefined();
		expect(result.error?.type).toBe("TRANSIENT");
		expect(result.retries).toBe(4); // 3 retries + initial attempt = 4
		expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries

		// Should have enqueued to DLQ
		expect(mockEnqueue).toHaveBeenCalledWith(
			expect.objectContaining({
				runId: "run-1",
				agentName: "reader",
				errorType: "TRANSIENT",
				status: "pending",
				workflowState: "EXTRACTING",
			}),
		);
		vi.useRealTimers();
	});

	// ─── executeWithRetry: Does NOT retry permanent errors ─────────────

	it("does NOT retry permanent errors", async () => {
		const fn = vi.fn().mockRejectedValue(new Error("validation failed"));

		mockEnqueue.mockResolvedValue({ id: "dlq-1" });

		const result = await engine.executeWithRetry(fn, {
			agentName: "validator",
			runId: "run-1",
		});

		expect(result.error).toBeDefined();
		expect(result.error?.type).toBe("PERMANENT");
		expect(result.retries).toBe(0); // no retries attempted
		expect(fn).toHaveBeenCalledTimes(1);

		// Should NOT enqueue permanent errors to DLQ
		expect(mockEnqueue).not.toHaveBeenCalled();
	});

	// ─── executeWithRetry: Respects custom config ────────────────────

	it("respects custom retry config", async () => {
		vi.useFakeTimers();
		const fn = vi.fn().mockRejectedValue(new Error("timeout"));

		mockEnqueue.mockResolvedValue({ id: "dlq-1" });

		const retryPromise = engine.executeWithRetry(
			fn,
			{
				agentName: "reader",
				runId: "run-1",
			},
			{ maxRetries: 1, baseDelayMs: 100 },
		);

		// Advance enough for 1 retry (baseDelayMs * 2^0 = 100ms)
		await vi.advanceTimersByTimeAsync(5000);

		const result = await retryPromise;
		expect(result.retries).toBe(2); // 1 initial + 1 retry
		expect(fn).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	// ─── enqueueForRetry ─────────────────────────────────────────────

	it("enqueues an item to the DLQ with pending status", async () => {
		const error = new AgentError({
			message: "transient error",
			type: "TRANSIENT",
			agentName: "reader",
		});

		mockEnqueue.mockResolvedValue({ id: "dlq-1" });

		await engine.enqueueForRetry("run-1", "reader", error, "EXTRACTING");

		expect(mockEnqueue).toHaveBeenCalledWith(
			expect.objectContaining({
				runId: "run-1",
				agentName: "reader",
				errorType: "TRANSIENT",
				errorMessage: "transient error",
				status: "pending",
			}),
		);
	});

	it("enqueues with nextRetryAt set in the future", async () => {
		const error = new AgentError({
			message: "transient error",
			type: "TRANSIENT",
			agentName: "reader",
		});

		mockEnqueue.mockResolvedValue({ id: "dlq-1" });
		const before = Date.now();

		await engine.enqueueForRetry("run-1", "reader", error);

		expect(mockEnqueue).toHaveBeenCalledWith(
			expect.objectContaining({
				nextRetryAt: expect.any(Date),
			}),
		);

		const callArg = mockEnqueue.mock.calls[0][0];
		expect(callArg.nextRetryAt.getTime()).toBeGreaterThanOrEqual(before);
	});

	// ─── processPendingRetries / processPendingItems ──────────────────

	it("processes N pending DLQ items", async () => {
		const items = [
			{
				id: "item-1",
				runId: "run-1",
				agentName: "reader",
				errorType: "TRANSIENT" as const,
				errorMessage: "timeout",
				errorDetails: null,
				retryCount: 0,
				maxRetries: 3,
				nextRetryAt: new Date(Date.now() - 1000),
				status: "pending" as const,
			},
		];

		mockDequeue.mockResolvedValue(items);
		mockIncrementRetry.mockResolvedValue({ id: "item-1" } as any);
		mockMarkResolved.mockResolvedValue(undefined);

		const processor = vi.fn().mockResolvedValue("recovered");

		const processed = await engine.processPendingItems(10, processor);

		expect(processed).toBe(1);
		expect(mockDequeue).toHaveBeenCalledWith(10);
		expect(processor).toHaveBeenCalledWith(
			expect.objectContaining({
				id: "item-1",
				runId: "run-1",
				agentName: "reader",
			}),
		);
		expect(mockMarkResolved).toHaveBeenCalledWith("item-1");
	});

	it("marks item as dead when retries exhausted in processor", async () => {
		const items = [
			{
				id: "item-1",
				runId: "run-1",
				agentName: "reader",
				errorType: "TRANSIENT" as const,
				errorMessage: "timeout",
				errorDetails: null,
				retryCount: 2,
				maxRetries: 3,
				nextRetryAt: new Date(Date.now() - 1000),
				status: "retrying" as const,
			},
		];

		mockDequeue.mockResolvedValue(items);
		mockIncrementRetry.mockResolvedValue({ id: "item-1" } as any);
		mockMarkDead.mockResolvedValue(undefined);

		const processor = vi.fn().mockRejectedValue(new Error("still failing"));

		const processed = await engine.processPendingItems(10, processor);

		expect(processed).toBe(0);
		expect(mockMarkDead).toHaveBeenCalledWith("item-1");
	});

	it("processPendingRetries without processor returns count only", async () => {
		const items = [
			{
				id: "item-1",
				runId: "run-1",
				agentName: "reader",
				errorType: "TRANSIENT" as const,
				errorMessage: "timeout",
				errorDetails: null,
				retryCount: 0,
				maxRetries: 3,
				nextRetryAt: new Date(Date.now() - 1000),
				status: "pending" as const,
			},
		];

		mockDequeue.mockResolvedValue(items);

		const count = await engine.processPendingRetries(5);

		expect(count).toBe(1);
		expect(mockDequeue).toHaveBeenCalledWith(5);
	});

	// ─── calculateDelay ──────────────────────────────────────────────

	it("uses exponential backoff: baseDelay * 2^attempt", () => {
		const config: RetryConfig = {
			maxRetries: 3,
			baseDelayMs: 1000,
			maxDelayMs: 30000,
			useJitter: false,
			retryableErrors: ["TRANSIENT", "UNKNOWN"],
		};

		expect(engine.calculateDelay(0, config)).toBe(1000); // 1000 * 2^0
		expect(engine.calculateDelay(1, config)).toBe(2000); // 1000 * 2^1
		expect(engine.calculateDelay(2, config)).toBe(4000); // 1000 * 2^2
		expect(engine.calculateDelay(3, config)).toBe(8000); // 1000 * 2^3
	});

	it("adds jitter when useJitter is true", () => {
		const config: RetryConfig = {
			maxRetries: 3,
			baseDelayMs: 1000,
			maxDelayMs: 30000,
			useJitter: true,
			retryableErrors: ["TRANSIENT", "UNKNOWN"],
		};

		// With jitter, result is baseDelay * 2^attempt + random(0..500)
		const delay0 = engine.calculateDelay(0, config);
		expect(delay0).toBeGreaterThanOrEqual(1000);
		expect(delay0).toBeLessThan(1500); // 1000 + max 500 jitter

		const delay2 = engine.calculateDelay(2, config);
		expect(delay2).toBeGreaterThanOrEqual(4000);
		expect(delay2).toBeLessThan(4500);
	});

	it("caps delay at maxDelayMs", () => {
		const config: RetryConfig = {
			maxRetries: 3,
			baseDelayMs: 10000,
			maxDelayMs: 25000,
			useJitter: false,
			retryableErrors: ["TRANSIENT", "UNKNOWN"],
		};

		// 10000 * 2^2 = 40000, but max is 25000
		const delay = engine.calculateDelay(2, config);
		expect(delay).toBe(25000);
	});

	// ─── Edge Cases ───────────────────────────────────────────────────

	it("handles empty runId gracefully", async () => {
		const fn = vi.fn().mockResolvedValue("ok");

		const result = await engine.executeWithRetry(fn, {
			agentName: "reader",
			runId: "",
		});

		expect(result.result).toBe("ok");
	});

	it("handles zero maxRetries (no retry allowed)", async () => {
		const fn = vi.fn().mockRejectedValue(new Error("timeout"));

		mockEnqueue.mockResolvedValue({ id: "dlq-1" });

		const result = await engine.executeWithRetry(
			fn,
			{
				agentName: "reader",
				runId: "run-1",
			},
			{ maxRetries: 0 },
		);

		expect(result.retries).toBe(1);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
