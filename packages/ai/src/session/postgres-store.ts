/**
 * Postgres Session Store
 * Drizzle-based implementation of SessionStore for PostgreSQL
 *
 * @module ai/session/postgres-store
 */

import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { agentRunEvents, agentRunInputs, agentRunStates, batchRuns, batchRunItems } from "@arkelythex/persistence/schema";
import type { SessionStore } from "./session-store";
import type {
	AgentRunEvent,
	AgentRunState,
	BatchItemData,
	BatchRunData,
	RunInput,
	RunStateFilter,
	StateSnapshot,
} from "./session.types";
import { SessionNotFoundError, SessionStoreError } from "./session.types";

/**
 * Drizzle database client shape.
 * We accept any Drizzle instance that supports standard query operations.
 */
type DrizzleClient = PgDatabase<any, any, any>;

/**
 * PostgresSessionStore class.
 * Persists agent run states and events to PostgreSQL via Drizzle ORM.
 *
 * All queries are scoped by companyId for tenant isolation.
 */
export class PostgresSessionStore implements SessionStore {
	constructor(private readonly db: DrizzleClient) {}

	/**
	 * Save or update a run state.
	 * Uses INSERT ... ON CONFLICT (run_id) DO UPDATE for idempotent upserts.
	 */
	async saveRunState(runId: string, state: Partial<AgentRunState>): Promise<void> {
		try {
			await this.db
				.insert(agentRunStates)
				.values({
					runId,
					companyId: state.companyId ?? "",
					sessionId: state.sessionId ?? null,
					workflowState: state.workflowState ?? null,
					agentMetrics: state.agentMetrics ?? null,
					context: state.context ?? null,
					status: state.status ?? "running",
					error: state.error ?? null,
					startedAt: state.startedAt ?? new Date(),
					completedAt: state.completedAt ?? null,
				})
				.onConflictDoUpdate({
					target: agentRunStates.runId,
					set: {
						workflowState: sql`COALESCE(excluded.workflow_state, ${agentRunStates.workflowState})`,
						agentMetrics: sql`CASE WHEN excluded.agent_metrics IS NOT NULL THEN excluded.agent_metrics ELSE ${agentRunStates.agentMetrics} END`,
						context: sql`CASE WHEN excluded.context IS NOT NULL THEN excluded.context ELSE ${agentRunStates.context} END`,
						status: sql`COALESCE(excluded.status, ${agentRunStates.status})`,
						error: sql`CASE WHEN excluded.error IS NOT NULL THEN excluded.error ELSE ${agentRunStates.error} END`,
						completedAt: sql`COALESCE(excluded.completed_at, ${agentRunStates.completedAt})`,
						updatedAt: new Date(),
					},
				});
		} catch (cause) {
			throw new SessionStoreError(`Failed to save run state: ${runId}`, cause);
		}
	}

	/**
	 * Get a run state by runId.
	 */
	async getRunState(runId: string): Promise<AgentRunState | null> {
		try {
			const rows = await this.db
				.select()
				.from(agentRunStates)
				.where(eq(agentRunStates.runId, runId))
				.limit(1);

			if (rows.length === 0) return null;

			return this.mapToAgentRunState(rows[0]);
		} catch (cause) {
			throw new SessionStoreError(`Failed to get run state: ${runId}`, cause);
		}
	}

	/**
	 * List run states scoped by companyId with optional filters.
	 */
	async listRunStates(filter: RunStateFilter): Promise<AgentRunState[]> {
		try {
			const conditions = [eq(agentRunStates.companyId, filter.companyId)];

			if (filter.status) {
				conditions.push(eq(agentRunStates.status, filter.status));
			}

			if (filter.sessionId) {
				conditions.push(eq(agentRunStates.sessionId, filter.sessionId));
			}

			const rows = await this.db
				.select()
				.from(agentRunStates)
				.where(and(...conditions))
				.orderBy(desc(agentRunStates.createdAt))
				.limit(filter.limit ?? 20)
				.offset(filter.offset ?? 0);

			return rows.map((row) => this.mapToAgentRunState(row));
		} catch (cause) {
			throw new SessionStoreError(
				`Failed to list run states for company: ${filter.companyId}`,
				cause,
			);
		}
	}

	/**
	 * Append an event to the run's event log.
	 */
	async appendEvent(runId: string, event: AgentRunEvent): Promise<void> {
		try {
			await this.db.insert(agentRunEvents).values({
				runId: event.runId,
				eventType: event.eventType,
				payload: (event.payload ?? null) as Record<string, unknown> | null,
				companyId: event.companyId,
			});
		} catch (cause) {
			throw new SessionStoreError(`Failed to append event for run: ${runId}`, cause);
		}
	}

	/**
	 * Get events for a run, ordered by createdAt ASC.
	 */
	async getEvents(runId: string, limit?: number): Promise<AgentRunEvent[]> {
		try {
			const rows = await this.db
				.select()
				.from(agentRunEvents)
				.where(eq(agentRunEvents.runId, runId))
				.orderBy(asc(agentRunEvents.createdAt))
				.limit(limit ?? 100);

			return rows.map((row) => ({
				id: row.id,
				runId: row.runId,
				eventType: row.eventType,
				payload: row.payload as Record<string, unknown> | null,
				companyId: row.companyId,
				createdAt: row.createdAt,
			}));
		} catch (cause) {
			throw new SessionStoreError(`Failed to get events for run: ${runId}`, cause);
		}
	}

	/**
	 * Partial update of a run state.
	 */
	async updateRunState(runId: string, partial: Partial<AgentRunState>): Promise<void> {
		try {
			const updateData: Record<string, unknown> = {
				updatedAt: new Date(),
			};

			if (partial.workflowState !== undefined) updateData.workflowState = partial.workflowState;
			if (partial.agentMetrics !== undefined) updateData.agentMetrics = partial.agentMetrics;
			if (partial.context !== undefined) updateData.context = partial.context;
			if (partial.status !== undefined) updateData.status = partial.status;
			if (partial.error !== undefined) updateData.error = partial.error;
			if (partial.completedAt !== undefined) updateData.completedAt = partial.completedAt;
			if (partial.sessionId !== undefined) updateData.sessionId = partial.sessionId;

			const result = await this.db
				.update(agentRunStates)
				.set(updateData)
				.where(eq(agentRunStates.runId, runId));

			if (!result) {
				throw new SessionNotFoundError(runId);
			}
		} catch (cause) {
			if (cause instanceof SessionNotFoundError) throw cause;
			throw new SessionStoreError(`Failed to update run state: ${runId}`, cause);
		}
	}

	/**
	 * Load a complete state snapshot for recovery.
	 * Fetches the current state and last 50 events in parallel.
	 */
	async recoverRunState(runId: string): Promise<StateSnapshot | null> {
		try {
			const [state, events] = await Promise.all([
				this.getRunState(runId),
				this.getEvents(runId, 50),
			]);

			if (!state) return null;

			return { state, events };
		} catch (cause) {
			throw new SessionStoreError(`Failed to recover run state: ${runId}`, cause);
		}
	}

	// ============================================================================
	// Run Input Persistence
	// ============================================================================

	/**
	 * Persist input data for a run (upsert by runId).
	 * Compression for inputs > 1MB is handled transparently.
	 */
	async saveInput(runId: string, inputType: string, inputData: string, checksum: string): Promise<void> {
		try {
			await this.db
				.insert(agentRunInputs)
				.values({
					runId,
					inputType,
					inputData,
					checksum,
				})
				.onConflictDoUpdate({
					target: agentRunInputs.runId,
					set: {
						inputType: sql`EXCLUDED.input_type`,
						inputData: sql`EXCLUDED.input_data`,
						checksum: sql`EXCLUDED.checksum`,
					},
				});
		} catch (cause) {
			throw new SessionStoreError(`Failed to save input for run: ${runId}`, cause);
		}
	}

	/**
	 * Retrieve persisted input data for a run.
	 * Returns null if no input is found for the given runId.
	 */
	async getInput(runId: string): Promise<RunInput | null> {
		try {
			const rows = await this.db
				.select()
				.from(agentRunInputs)
				.where(eq(agentRunInputs.runId, runId))
				.limit(1);

			if (rows.length === 0) return null;

			const row = rows[0];
			return {
				runId: row.runId,
				inputType: row.inputType,
				inputData: row.inputData,
				checksum: row.checksum,
				createdAt: row.createdAt,
			};
		} catch (cause) {
			throw new SessionStoreError(`Failed to get input for run: ${runId}`, cause);
		}
	}

	// ============================================================================
	// Batch Operations
	// ============================================================================

	/**
	 * Create a new batch run record.
	 */
	async createBatch(data: {
		id?: string;
		companyId: string;
		total: number;
	}): Promise<BatchRunData> {
		try {
			const [row] = await this.db.insert(batchRuns).values({
				id: data.id ?? crypto.randomUUID(),
				companyId: data.companyId,
				status: "pending",
				total: data.total,
				completed: 0,
				failed: 0,
			}).returning();
			if (!row) throw new Error("Insert returned no row");
			return this.mapBatchRun(row);
		} catch (error) {
			throw new SessionStoreError("Failed to create batch", { cause: error });
		}
	}

	/**
	 * Get a batch by ID.
	 */
	async getBatch(batchId: string): Promise<BatchRunData | null> {
		try {
			const rows = await this.db
				.select()
				.from(batchRuns)
				.where(eq(batchRuns.id, batchId))
				.limit(1);
			return rows[0] ? this.mapBatchRun(rows[0]) : null;
		} catch (error) {
			throw new SessionStoreError(`Failed to get batch ${batchId}`, { cause: error });
		}
	}

	/**
	 * List batches for a company, newest first.
	 */
	async listBatches(companyId: string, limit = 20, offset = 0): Promise<BatchRunData[]> {
		try {
			const rows = await this.db
				.select()
				.from(batchRuns)
				.where(eq(batchRuns.companyId, companyId))
				.orderBy(desc(batchRuns.createdAt))
				.limit(limit)
				.offset(offset);
			return rows.map(this.mapBatchRun);
		} catch (error) {
			throw new SessionStoreError(`Failed to list batches for ${companyId}`, { cause: error });
		}
	}

	/**
	 * Update batch status and counters.
	 */
	async updateBatch(
		batchId: string,
		data: Partial<Pick<BatchRunData, "status" | "completed" | "failed" | "completedAt">>,
	): Promise<BatchRunData> {
		try {
			const [row] = await this.db.update(batchRuns)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(batchRuns.id, batchId))
				.returning();
			if (!row) throw new Error("Batch not found");
			return this.mapBatchRun(row);
		} catch (error) {
			throw new SessionStoreError(`Failed to update batch ${batchId}`, { cause: error });
		}
	}

	/**
	 * Add an item to a batch.
	 */
	async createBatchItem(batchId: string, runId: string): Promise<BatchItemData> {
		try {
			const [row] = await this.db.insert(batchRunItems).values({
				batchId,
				runId,
				status: "pending",
			}).returning();
			if (!row) throw new Error("Insert returned no row");
			return this.mapBatchItem(row);
		} catch (error) {
			throw new SessionStoreError(`Failed to create batch item for ${runId}`, { cause: error });
		}
	}

	/**
	 * Update a batch item's status.
	 */
	async updateBatchItem(
		itemId: string,
		data: Partial<Pick<BatchItemData, "status" | "error">>,
	): Promise<BatchItemData> {
		try {
			const [row] = await this.db.update(batchRunItems)
				.set(data)
				.where(eq(batchRunItems.id, itemId))
				.returning();
			if (!row) throw new Error("Batch item not found");
			return this.mapBatchItem(row);
		} catch (error) {
			throw new SessionStoreError(`Failed to update batch item ${itemId}`, { cause: error });
		}
	}

	/**
	 * Get all items for a batch.
	 */
	async getBatchItems(batchId: string): Promise<BatchItemData[]> {
		try {
			const rows = await this.db
				.select()
				.from(batchRunItems)
				.where(eq(batchRunItems.batchId, batchId))
				.orderBy(batchRunItems.createdAt);
			return rows.map(this.mapBatchItem);
		} catch (error) {
			throw new SessionStoreError(`Failed to get items for batch ${batchId}`, { cause: error });
		}
	}

	// ============================================================================
	// Helpers
	// ============================================================================

	/**
	 * Map a raw DB row to an AgentRunState.
	 */
	private mapToAgentRunState(row: Record<string, unknown>): AgentRunState {
		return {
			id: row.id as string,
			runId: row.runId as string,
			sessionId: (row.sessionId as string) ?? null,
			workflowState: (row.workflowState as AgentRunState["workflowState"]) ?? null,
			agentMetrics: (row.agentMetrics as Record<string, unknown>) ?? null,
			context: (row.context as Record<string, unknown>) ?? null,
			status: row.status as AgentRunState["status"],
			error: (row.error as string) ?? null,
			companyId: row.companyId as string,
			startedAt: row.startedAt as Date,
			completedAt: (row.completedAt as Date) ?? null,
			createdAt: row.createdAt as Date,
			updatedAt: row.updatedAt as Date,
		};
	}

	/**
	 * Map a raw batch run row to BatchRunData.
	 */
	private mapBatchRun(row: typeof batchRuns.$inferSelect): BatchRunData {
		return {
			id: row.id,
			companyId: row.companyId,
			status: row.status as BatchRunData["status"],
			total: row.total,
			completed: row.completed,
			failed: row.failed,
			createdAt: row.createdAt,
			completedAt: row.completedAt,
			sessionId: null,
		};
	}

	/**
	 * Map a raw batch item row to BatchItemData.
	 */
	private mapBatchItem(row: typeof batchRunItems.$inferSelect): BatchItemData {
		return {
			id: row.id,
			batchId: row.batchId,
			runId: row.runId ?? "",
			status: row.status as BatchItemData["status"],
			error: row.error,
			createdAt: row.createdAt,
		};
	}
}
