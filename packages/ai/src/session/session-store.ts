/**
 * Session Store Interface
 * Defines the contract for agent run state and event persistence
 *
 * @module ai/session/store
 */

import type {
	AgentRunEvent,
	AgentRunState,
	BatchItemData,
	BatchRunData,
	RunInput,
	RunStateFilter,
	StateSnapshot,
} from "./session.types";

/**
 * SessionStore interface.
 * Abstract persistence layer for agent run states and events.
 * Implementations can use PostgreSQL, in-memory, or other backends.
 */
export interface SessionStore {
	/** Save or update run state (upsert by runId) */
	saveRunState(runId: string, state: Partial<AgentRunState>): Promise<void>;

	/** Get run state by runId */
	getRunState(runId: string): Promise<AgentRunState | null>;

	/** List run states with optional filters */
	listRunStates(filter: RunStateFilter): Promise<AgentRunState[]>;

	/** Append an event to the run's event log */
	appendEvent(runId: string, event: AgentRunEvent): Promise<void>;

	/** Get events for a run, ordered by createdAt ASC */
	getEvents(runId: string, limit?: number): Promise<AgentRunEvent[]>;

	/** Partial update of run state */
	updateRunState(runId: string, partial: Partial<AgentRunState>): Promise<void>;

	/** Load a complete state snapshot (state + last N events) for recovery */
	recoverRunState(runId: string): Promise<StateSnapshot | null>;

	/** Persist input data for a run (upsert by runId) */
	saveInput(
		runId: string,
		inputType: string,
		inputData: string,
		checksum: string,
	): Promise<void>;

	/** Retrieve persisted input data for a run */
	getInput(runId: string): Promise<RunInput | null>;

	// --- Batch Operations ---

	/** Create a new batch run record */
	createBatch(data: {
		id?: string;
		companyId: string;
		total: number;
		sessionId?: string;
	}): Promise<BatchRunData>;

	/** Get a batch by ID */
	getBatch(batchId: string): Promise<BatchRunData | null>;

	/** List batches for a company, newest first */
	listBatches(
		companyId: string,
		limit?: number,
		offset?: number,
	): Promise<BatchRunData[]>;

	/** Update batch status and counters */
	updateBatch(
		batchId: string,
		data: Partial<
			Pick<BatchRunData, "status" | "completed" | "failed" | "completedAt">
		>,
	): Promise<BatchRunData>;

	/** Add an item to a batch */
	createBatchItem(batchId: string, runId: string): Promise<BatchItemData>;

	/** Update a batch item's status */
	updateBatchItem(
		itemId: string,
		data: Partial<Pick<BatchItemData, "status" | "error">>,
	): Promise<BatchItemData>;

	/** Get all items for a batch */
	getBatchItems(batchId: string): Promise<BatchItemData[]>;
}
