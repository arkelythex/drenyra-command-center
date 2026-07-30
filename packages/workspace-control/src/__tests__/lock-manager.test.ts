import { describe, it, expect, beforeEach, vi } from "vitest";
import { InMemoryLockStore } from "../concurrency/lock-manager";
import { DEFAULT_LOCK_TTL_MS } from "../concurrency/lock-manager";
import type { LockStore } from "../concurrency/lock-manager";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeStore(): LockStore {
	return new InMemoryLockStore();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InMemoryLockStore", () => {
	let store: LockStore;

	beforeEach(() => {
		store = makeStore();
	});

	describe("acquire", () => {
		it("should acquire lock on unlocked resource", () => {
			const result = store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);

			expect(result.kind).toBe("acquired");
			if (result.kind === "acquired") {
				expect(result.lock.resourceId).toBe("res-1");
				expect(result.lock.clientId).toBe("client-a");
				expect(result.lock.ttlMs).toBe(DEFAULT_LOCK_TTL_MS);
			}
		});

		it("should re-acquire lock on resource locked by same client", () => {
			store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);
			const result = store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);

			expect(result.kind).toBe("acquired");
		});

		it("should return conflict when resource locked by different client", () => {
			store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);
			const result = store.acquire("res-1", "client-b", DEFAULT_LOCK_TTL_MS);

			expect(result.kind).toBe("conflict");
			if (result.kind === "conflict") {
				expect(result.holder).toBe("client-a");
			}
		});

		it("should auto-expire lock after TTL and grant to new client", () => {
			vi.useFakeTimers();

			store.acquire("res-1", "client-a", 100); // 100ms TTL

			// Advance past TTL
			vi.advanceTimersByTime(150);

			const result = store.acquire("res-1", "client-b", DEFAULT_LOCK_TTL_MS);

			expect(result.kind).toBe("acquired");
			if (result.kind === "acquired") {
				expect(result.lock.clientId).toBe("client-b");
			}

			vi.useRealTimers();
		});
	});

	describe("release", () => {
		it("should release lock held by same client and return true", () => {
			store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);
			const released = store.release("res-1", "client-a");

			expect(released).toBe(true);
			expect(store.isLocked("res-1")).toBe(false);
		});

		it("should return false when releasing non-existent lock", () => {
			const released = store.release("res-1", "client-a");

			expect(released).toBe(false);
		});

		it("should return false when releasing lock held by different client", () => {
			store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);
			const released = store.release("res-1", "client-b");

			expect(released).toBe(false);
			// Lock should still be held by client-a
			expect(store.isLocked("res-1")).toBe(true);
		});
	});

	describe("getLock", () => {
		it("should return the lock when resource is locked", () => {
			store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);
			const lock = store.getLock("res-1");

			expect(lock).not.toBeNull();
			expect(lock?.resourceId).toBe("res-1");
			expect(lock?.clientId).toBe("client-a");
		});

		it("should return null when resource is not locked", () => {
			const lock = store.getLock("res-1");

			expect(lock).toBeNull();
		});
	});

	describe("isLocked", () => {
		it("should return true when resource is locked", () => {
			store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);

			expect(store.isLocked("res-1")).toBe(true);
		});

		it("should return false when resource is not locked", () => {
			expect(store.isLocked("res-1")).toBe(false);
		});

		it("should return false after lock expires", () => {
			vi.useFakeTimers();

			store.acquire("res-1", "client-a", 100);

			vi.advanceTimersByTime(150);

			expect(store.isLocked("res-1")).toBe(false);

			vi.useRealTimers();
		});
	});

	describe("clear", () => {
		it("should clear all locks", () => {
			store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);
			store.acquire("res-2", "client-b", DEFAULT_LOCK_TTL_MS);

			store.clear();

			expect(store.isLocked("res-1")).toBe(false);
			expect(store.isLocked("res-2")).toBe(false);
		});
	});

	describe("multiple independent resources", () => {
		it("should not conflict across different resources", () => {
			const r1 = store.acquire("res-1", "client-a", DEFAULT_LOCK_TTL_MS);
			const r2 = store.acquire("res-2", "client-b", DEFAULT_LOCK_TTL_MS);

			expect(r1.kind).toBe("acquired");
			expect(r2.kind).toBe("acquired");

			expect(store.isLocked("res-1")).toBe(true);
			expect(store.isLocked("res-2")).toBe(true);
		});
	});
});

// ─── Property-based tests ────────────────────────────────────────────────────

describe("LockManager invariants", () => {
	it("should preserve lock-release cycle invariants", () => {
		const store = makeStore();

		// Acquire
		const result = store.acquire(
			"invariant-res",
			"client-x",
			DEFAULT_LOCK_TTL_MS,
		);
		expect(result.kind).toBe("acquired");
		expect(store.isLocked("invariant-res")).toBe(true);

		// Release
		const released = store.release("invariant-res", "client-x");
		expect(released).toBe(true);
		expect(store.isLocked("invariant-res")).toBe(false);

		// Re-acquire after release should succeed
		const reAcquire = store.acquire(
			"invariant-res",
			"client-y",
			DEFAULT_LOCK_TTL_MS,
		);
		expect(reAcquire.kind).toBe("acquired");
	});
});
