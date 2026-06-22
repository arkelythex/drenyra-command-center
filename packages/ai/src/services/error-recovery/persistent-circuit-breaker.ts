/**
 * Persistent Circuit Breaker
 *
 * DB-backed circuit breaker that wraps the existing in-memory CircuitBreaker.
 *
 * ARCHITECTURE:
 * - The in-memory CircuitBreaker is the HOT PATH (synchronous, no DB call for getState).
 * - DB persistence happens asynchronously via fire-and-forget for recordSuccess/recordFailure.
 * - On construction, state is loaded from DB to initialize memory.
 * - After each state transition, state is persisted to DB asynchronously.
 * - State is reloaded from DB every CACHE_TTL (5s) per isAvailable() call.
 *
 * IMPORTANT: The persisted state from DB is tracked separately because the
 * in-memory CircuitBreaker class from steps.ts does not expose state mutation.
 * When a sync finds the DB circuit OPEN, we honour that via the persisted state
 * even if the in-memory instance is still CLOSED.
 *
 * @module ai/services/error-recovery
 */

import { circuitBreakerRepo } from "@arkelythex/infrastructure/services/error-recovery";
import { CircuitBreaker } from "../../agents/orchestrator/workflow-v2/steps";

/**
 * Circuit breaker state snapshot.
 */
export type CBState = "CLOSED" | "OPEN" | "HALF_OPEN";

/**
 * PersistentCircuitBreaker — DB-backed circuit breaker with async persistence.
 *
 * @example
 * ```ts
 * const cb = new PersistentCircuitBreaker("reader", "agent");
 * const available = await cb.isAvailable();
 * if (available) {
 *   try {
 *     const result = await someOperation();
 *     await cb.recordSuccess();
 *   } catch (err) {
 *     await cb.recordFailure();
 *   }
 * }
 * ```
 */
export class PersistentCircuitBreaker {
	private memory: CircuitBreaker;
	private state: { agentName: string; scope: "agent" | "provider" };
	private cacheTimestamp: number;
	private persistedState: CBState | null;
	private readonly CACHE_TTL = 5000; // reload from DB every 5s max

	constructor(
		agentName: string,
		scope: "agent" | "provider",
		threshold?: number,
		timeoutMs?: number,
	) {
		this.state = { agentName, scope };
		this.memory = new CircuitBreaker(threshold ?? 5, timeoutMs ?? 60000);
		this.cacheTimestamp = 0;
		this.persistedState = null;

		// Trigger initial load from DB (fire-and-forget)
		this.syncFromDb().catch(() => {
			// If DB is unavailable, use defaults — no-op
		});
	}

	/**
	 * Check if the circuit is available for use.
	 * Returns true when state is CLOSED or HALF_OPEN.
	 */
	async isAvailable(): Promise<boolean> {
		await this.syncFromDb();
		return this.resolveState() !== "OPEN";
	}

	/**
	 * Record a successful execution.
	 * Resets to CLOSED and persists to DB asynchronously.
	 */
	async recordSuccess(): Promise<void> {
		this.memory = new CircuitBreaker(5, 60000);
		this.cacheTimestamp = Date.now();
		this.persistedState = "CLOSED";
		await this.persistToDb("CLOSED", 0, 1);
	}

	/**
	 * Record a failed execution.
	 * Persists to DB asynchronously.
	 */
	async recordFailure(): Promise<void> {
		this.cacheTimestamp = 0; // force reload on next access
		await this.persistToDb("CLOSED", 1, 0);
	}

	/**
	 * Get the current state (fast path, no DB call).
	 * Returns the latest known state from memory or DB sync.
	 */
	getState(): CBState {
		return this.resolveState();
	}

	/**
	 * Resolve the effective state by combining in-memory and persisted states.
	 * The persisted state from DB takes precedence when it indicates OPEN,
	 * because the DB is the source of truth for distributed state.
	 */
	private resolveState(): CBState {
		if (this.persistedState === "OPEN") {
			return "OPEN";
		}
		if (this.persistedState === "HALF_OPEN") {
			return "HALF_OPEN";
		}
		return this.memory.getState();
	}

	/**
	 * Load state from DB and merge with in-memory circuit breaker.
	 * Respects CACHE_TTL — only reloads if cache is stale.
	 */
	private async syncFromDb(): Promise<void> {
		const now = Date.now();
		if (now - this.cacheTimestamp < this.CACHE_TTL) {
			return; // cache is fresh
		}

		try {
			const dbState = await circuitBreakerRepo.getState(
				this.state.agentName,
				this.state.scope,
			);

			if (dbState) {
				// Track the persisted state separately — the in-memory CB class
				// doesn't expose state mutation, so we overlay the DB state
				this.persistedState = dbState.state as CBState;

				// Rebuild in-memory circuit breaker with persisted configuration
				this.memory = new CircuitBreaker(
					dbState.threshold,
					dbState.timeoutMs,
				);
			}

			this.cacheTimestamp = now;
		} catch {
			// DB unavailable — use in-memory state as-is
		}
	}

	/**
	 * Persist current state to DB (fire-and-forget safe).
	 * Never throws — errors are caught.
	 */
	private async persistToDb(
		state: "CLOSED" | "OPEN" | "HALF_OPEN",
		failureCount: number,
		successCount: number,
	): Promise<void> {
		try {
			await circuitBreakerRepo.upsertState({
				agentName: this.state.agentName,
				scope: this.state.scope,
				state,
				failureCount,
				successCount,
				threshold: 5,
				timeoutMs: 60000,
			});
		} catch {
			// Fire-and-forget: DB persistence failures are non-blocking
		}
	}
}
