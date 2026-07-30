import type { OperationLock, LockResult } from "./types";

// ─── Lock Manager ────────────────────────────────────────────────────────────

export const DEFAULT_LOCK_TTL_MS = 30_000;

export interface LockStore {
	acquire(resourceId: string, clientId: string, ttlMs: number): LockResult;
	release(resourceId: string, clientId: string): boolean;
	getLock(resourceId: string): OperationLock | null;
	isLocked(resourceId: string): boolean;
	clear(): void;
}

interface LockEntry {
	readonly lock: OperationLock;
	readonly expiresAt: number;
}

export class InMemoryLockStore implements LockStore {
	private readonly locks: Map<string, LockEntry> = new Map();

	acquire(resourceId: string, clientId: string, ttlMs: number): LockResult {
		const existing = this.locks.get(resourceId);

		// No lock exists → grant
		if (existing === undefined) {
			const now = Date.now();
			const lock: OperationLock = {
				resourceId,
				clientId,
				acquiredAt: new Date(now).toISOString(),
				ttlMs,
			};
			this.locks.set(resourceId, { lock, expiresAt: now + ttlMs });
			return { kind: "acquired", lock };
		}

		// Check expiration
		const now = Date.now();
		if (now >= existing.expiresAt) {
			// Lock expired → grant to new client
			const lock: OperationLock = {
				resourceId,
				clientId,
				acquiredAt: new Date(now).toISOString(),
				ttlMs,
			};
			this.locks.set(resourceId, { lock, expiresAt: now + ttlMs });
			return { kind: "acquired", lock };
		}

		// Lock held by same client → re-acquire (refresh)
		if (existing.lock.clientId === clientId) {
			const lock: OperationLock = {
				resourceId,
				clientId,
				acquiredAt: new Date(now).toISOString(),
				ttlMs,
			};
			this.locks.set(resourceId, { lock, expiresAt: now + ttlMs });
			return { kind: "acquired", lock };
		}

		// Lock held by different client → conflict
		return {
			kind: "conflict",
			holder: existing.lock.clientId,
			remainingTtlMs: Math.max(0, existing.expiresAt - now),
		};
	}

	release(resourceId: string, clientId: string): boolean {
		const existing = this.locks.get(resourceId);

		if (existing === undefined) {
			return false;
		}

		// Check expiration
		const now = Date.now();
		if (now >= existing.expiresAt) {
			// Lock expired — remove it
			this.locks.delete(resourceId);
			return false;
		}

		// Only the holder can release
		if (existing.lock.clientId !== clientId) {
			return false;
		}

		this.locks.delete(resourceId);
		return true;
	}

	getLock(resourceId: string): OperationLock | null {
		const existing = this.locks.get(resourceId);

		if (existing === undefined) {
			return null;
		}

		// Check expiration
		if (Date.now() >= existing.expiresAt) {
			this.locks.delete(resourceId);
			return null;
		}

		return existing.lock;
	}

	isLocked(resourceId: string): boolean {
		const existing = this.locks.get(resourceId);

		if (existing === undefined) {
			return false;
		}

		// Check expiration
		if (Date.now() >= existing.expiresAt) {
			this.locks.delete(resourceId);
			return false;
		}

		return true;
	}

	clear(): void {
		this.locks.clear();
	}
}
