/**
 * Persistent Circuit Breaker Tests
 *
 * @module __tests__/services/error-recovery
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock is hoisted, so declarative mock fns must use vi.hoisted()
const { mockGetState, mockUpsertState } = vi.hoisted(() => ({
	mockGetState: vi.fn(),
	mockUpsertState: vi.fn(),
}));

vi.mock("@drenyra/infrastructure/services/error-recovery", () => ({
	circuitBreakerRepo: {
		getState: mockGetState,
		upsertState: mockUpsertState,
		listOpenCircuits: vi.fn(),
		deleteState: vi.fn(),
	},
}));

import { PersistentCircuitBreaker } from "../../../src/services/error-recovery/persistent-circuit-breaker";

describe("PersistentCircuitBreaker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// ─── Initial Load ────────────────────────────────────────────────

	it("initializes from DB state on construction", async () => {
		mockGetState.mockResolvedValue({
			id: "test-id",
			agentName: "reader",
			scope: "agent",
			state: "CLOSED",
			failureCount: 0,
			successCount: 0,
			lastFailureAt: null,
			lastSuccessAt: null,
			openedAt: null,
			threshold: 5,
			timeoutMs: 60000,
			companyId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const _cb = new PersistentCircuitBreaker("reader", "agent");

		// Give the fire-and-forget sync a chance
		await vi.advanceTimersByTimeAsync(100);

		expect(mockGetState).toHaveBeenCalledWith("reader", "agent");
	});

	it("uses defaults when DB returns null", async () => {
		mockGetState.mockResolvedValue(null);

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		expect(mockGetState).toHaveBeenCalledWith("reader", "agent");
		expect(cb.getState()).toBe("CLOSED");
	});

	// ─── isAvailable ──────────────────────────────────────────────────

	it("returns true when circuit is CLOSED", async () => {
		mockGetState.mockResolvedValue(null);

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		const available = await cb.isAvailable();
		expect(available).toBe(true);
	});

	it("returns false when circuit is OPEN", async () => {
		// Mock the DB state to show OPEN
		mockGetState.mockResolvedValue({
			id: "test-id",
			agentName: "reader",
			scope: "agent",
			state: "OPEN",
			failureCount: 5,
			successCount: 0,
			lastFailureAt: new Date(),
			lastSuccessAt: null,
			openedAt: new Date(),
			threshold: 5,
			timeoutMs: 60000,
			companyId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		const available = await cb.isAvailable();
		expect(available).toBe(false);
	});

	// ─── recordSuccess ────────────────────────────────────────────────

	it("persists CLOSED state to DB on recordSuccess", async () => {
		mockGetState.mockResolvedValue(null);
		mockUpsertState.mockResolvedValue({} as any);

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		await cb.recordSuccess();

		expect(mockUpsertState).toHaveBeenCalledWith(
			expect.objectContaining({
				agentName: "reader",
				scope: "agent",
				state: "CLOSED",
				failureCount: 0,
				successCount: 1,
			}),
		);
	});

	it("resets state to CLOSED after success", async () => {
		mockGetState.mockResolvedValue(null);
		mockUpsertState.mockResolvedValue({} as any);

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		await cb.recordSuccess();

		expect(cb.getState()).toBe("CLOSED");
	});

	// ─── recordFailure ────────────────────────────────────────────────

	it("persists failure info to DB on recordFailure", async () => {
		mockGetState.mockResolvedValue(null);
		mockUpsertState.mockResolvedValue({} as any);

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		await cb.recordFailure();

		expect(mockUpsertState).toHaveBeenCalledWith(
			expect.objectContaining({
				agentName: "reader",
				scope: "agent",
				state: "CLOSED",
			}),
		);
	});

	// ─── getState (fast path) ─────────────────────────────────────────

	it("returns CLOSED by default via fast path", () => {
		mockGetState.mockResolvedValue(null);

		const cb = new PersistentCircuitBreaker("reader", "agent");

		// getState is synchronous — returns in-memory state
		expect(cb.getState()).toBe("CLOSED");
	});

	// ─── Cache TTL ────────────────────────────────────────────────────

	it("reloads from DB after CACHE_TTL expires", async () => {
		mockGetState
			.mockResolvedValueOnce({
				id: "test-id",
				agentName: "reader",
				scope: "agent",
				state: "CLOSED",
				failureCount: 0,
				successCount: 0,
				lastFailureAt: null,
				lastSuccessAt: null,
				openedAt: null,
				threshold: 5,
				timeoutMs: 60000,
				companyId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.mockResolvedValueOnce({
				id: "test-id",
				agentName: "reader",
				scope: "agent",
				state: "OPEN",
				failureCount: 5,
				successCount: 0,
				lastFailureAt: new Date(),
				lastSuccessAt: null,
				openedAt: new Date(),
				threshold: 5,
				timeoutMs: 60000,
				companyId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		// First call — loads from DB (CLOSED)
		const available1 = await cb.isAvailable();
		expect(available1).toBe(true);
		expect(mockGetState).toHaveBeenCalledTimes(1);

		// Advance past CACHE_TTL (5000ms)
		await vi.advanceTimersByTimeAsync(6000);

		// Second call — should reload from DB (now OPEN)
		const available2 = await cb.isAvailable();
		expect(available2).toBe(false);
		expect(mockGetState).toHaveBeenCalledTimes(2);
	});

	it("uses cached state within CACHE_TTL without DB call", async () => {
		mockGetState.mockResolvedValue({
			id: "test-id",
			agentName: "reader",
			scope: "agent",
			state: "CLOSED",
			failureCount: 0,
			successCount: 0,
			lastFailureAt: null,
			lastSuccessAt: null,
			openedAt: null,
			threshold: 5,
			timeoutMs: 60000,
			companyId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const cb = new PersistentCircuitBreaker("reader", "agent");

		await vi.advanceTimersByTimeAsync(100);

		// First call — DB accessed
		await cb.isAvailable();
		expect(mockGetState).toHaveBeenCalledTimes(1);

		// Second call — within CACHE_TTL, no DB access
		await cb.isAvailable();
		expect(mockGetState).toHaveBeenCalledTimes(1);
	});
});
