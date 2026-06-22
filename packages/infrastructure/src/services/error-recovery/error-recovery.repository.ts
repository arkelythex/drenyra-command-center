/**
 * Error Recovery Repository
 *
 * Persistent storage for circuit breaker states and dead letter queue.
 * Replaces in-memory CircuitBreaker with DB-backed persistence for distributed recovery.
 *
 * @module infrastructure/services/error-recovery
 */

import { and, lte, sql } from "drizzle-orm";
import { db } from "@arkelythex/persistence/client";
import {
	circuitBreakerStates,
	failedAgentItems,
	type CircuitBreakerState,
	type FailedAgentItem,
	type NewCircuitBreakerState,
	type NewFailedAgentItem,
} from "@arkelythex/persistence/schema";

// ─── Circuit Breaker Repository ───────────────────────────────────────────────

/**
 * circuitBreakerRepo const.
 *
 * Provides read/write access to persistent circuit breaker states.
 * Uses upsert semantics so concurrent orchestrators share a single source of truth.
 */
export const circuitBreakerRepo = {
	/**
	 * Fetch the current state for a given agent/scope combination.
	 * Returns null if no state has been persisted yet (first run).
	 */
	async getState(
		agentName: string,
		scope: "agent" | "provider",
	): Promise<CircuitBreakerState | null> {
		const [row] = await db
			.select()
			.from(circuitBreakerStates)
			.where(
				and(
					sql`${circuitBreakerStates.agentName} = ${agentName}`,
					sql`${circuitBreakerStates.scope} = ${scope}`,
				),
			)
			.limit(1);

		return row ?? null;
	},

	/**
	 * Insert or update a circuit breaker state.
	 * Uses INSERT ON CONFLICT (agent_name, scope) DO UPDATE.
	 * Returns the full row after upsert.
	 */
	async upsertState(
		data: NewCircuitBreakerState,
	): Promise<CircuitBreakerState> {
		const [row] = await db
			.insert(circuitBreakerStates)
			.values(data)
			.onConflictDoUpdate({
				target: [
					circuitBreakerStates.agentName,
					circuitBreakerStates.scope,
				],
				set: {
					state: data.state,
					failureCount: data.failureCount ?? 0,
					successCount: data.successCount ?? 0,
					lastFailureAt: data.lastFailureAt ?? null,
					lastSuccessAt: data.lastSuccessAt ?? null,
					openedAt: data.openedAt ?? null,
					threshold: data.threshold ?? 5,
					timeoutMs: data.timeoutMs ?? 60000,
					companyId: data.companyId ?? null,
					updatedAt: sql`now()`,
				},
			})
			.returning();

		return row;
	},

	/**
	 * List all circuits currently in OPEN state.
	 * Used by the scheduled recovery job to detect circuits that may need
	 * automatic half-open transition after the configured timeout.
	 */
	async listOpenCircuits(): Promise<CircuitBreakerState[]> {
		return db
			.select()
			.from(circuitBreakerStates)
			.where(sql`${circuitBreakerStates.state} = 'OPEN'`);
	},

	/**
	 * Delete a circuit breaker state.
	 * Intended for cleanup when an agent/provider is decommissioned.
	 */
	async deleteState(
		agentName: string,
		scope: "agent" | "provider",
	): Promise<void> {
		await db
			.delete(circuitBreakerStates)
			.where(
				and(
					sql`${circuitBreakerStates.agentName} = ${agentName}`,
					sql`${circuitBreakerStates.scope} = ${scope}`,
				),
			);
	},
};

// ─── Dead Letter Queue Repository ─────────────────────────────────────────────

/**
 * dlqRepo const.
 *
 * Provides read/write access to the Dead Letter Queue for failed agent items.
 * Supports scheduled retry via nextRetryAt + status state machine.
 */
export const dlqRepo = {
	/**
	 * Enqueue a failed agent item with status='pending'.
	 * Fire-and-forget safe — errors are logged but not thrown.
	 */
	async enqueue(item: NewFailedAgentItem): Promise<FailedAgentItem> {
		const [row] = await db
			.insert(failedAgentItems)
			.values({ ...item, status: "pending" })
			.returning();

		return row;
	},

	/**
	 * Dequeue up to `limit` items that are pending or retrying
	 * and whose nextRetryAt is <= now(). Ordered by createdAt (FIFO).
	 *
	 * Does NOT update status — caller marks resolved/dead after processing.
	 */
	async dequeue(limit: number = 10): Promise<FailedAgentItem[]> {
		return db
			.select()
			.from(failedAgentItems)
			.where(
				and(
					sql`${failedAgentItems.status} IN ('pending', 'retrying')`,
					sql`(${failedAgentItems.nextRetryAt} IS NULL OR ${failedAgentItems.nextRetryAt} <= now())`,
				),
			)
			.orderBy(failedAgentItems.createdAt)
			.limit(limit);
	},

	/**
	 * Mark a DLQ item as resolved (successfully processed after retry).
	 */
	async markResolved(id: string): Promise<void> {
		await db
			.update(failedAgentItems)
			.set({
				status: "resolved",
				updatedAt: sql`now()`,
			})
			.where(sql`${failedAgentItems.id} = ${id}`);
	},

	/**
	 * Mark a DLQ item as dead (all retries exhausted).
	 */
	async markDead(id: string): Promise<void> {
		await db
			.update(failedAgentItems)
			.set({
				status: "dead",
				updatedAt: sql`now()`,
			})
			.where(sql`${failedAgentItems.id} = ${id}`);
	},

	/**
	 * Increment retry count and set next retry timestamp.
	 * Transitions status to 'retrying'.
	 */
	async incrementRetry(id: string, nextRetryAt: Date): Promise<void> {
		await db
			.update(failedAgentItems)
			.set({
				retryCount: sql`${failedAgentItems.retryCount} + 1`,
				lastRetryAt: sql`now()`,
				nextRetryAt,
				status: "retrying",
				updatedAt: sql`now()`,
			})
			.where(sql`${failedAgentItems.id} = ${id}`);
	},

	/**
	 * List DLQ items by status, with optional limit.
	 */
	async listByStatus(
		status: "pending" | "retrying" | "resolved" | "dead",
		limit: number = 100,
	): Promise<FailedAgentItem[]> {
		return db
			.select()
			.from(failedAgentItems)
			.where(sql`${failedAgentItems.status} = ${status}`)
			.orderBy(failedAgentItems.createdAt)
			.limit(limit);
	},

	/**
	 * Count DLQ items grouped by status.
	 * Useful for dashboards and alerting.
	 */
	async countByStatus(): Promise<Record<string, number>> {
		const rows = await db.execute<{
			status: string;
			count: string;
		}>(sql`
			SELECT status, COUNT(*)::text AS count
			FROM ${failedAgentItems}
			GROUP BY status
		`);

		const result: Record<string, number> = {
			pending: 0,
			retrying: 0,
			resolved: 0,
			dead: 0,
		};

		for (const row of rows) {
			result[row.status] = parseInt(row.count, 10);
		}

		return result;
	},
};
