/**
 * Session Persistence Types
 * Core types for agent run state and event persistence
 *
 * @module ai/session/types
 */

// ============================================================================
// Status & Workflow Types
// ============================================================================

export type AgentRunStatus = "running" | "completed" | "failed" | "manual_review" | "degraded" | "ose_submitting";
export type AgentWorkflowState =
	| "IDLE"
	| "EXTRACTING"
	| "PARSING"
	| "VALIDATING"
	| "ARBITRATING"
	| "OSE_SUBMITTING"
	| "COMPLETED"
	| "FAILED"
	| "MANUAL_REVIEW";

// ============================================================================
// Data Interfaces
// ============================================================================

export interface AgentRunState {
	id: string;
	runId: string;
	sessionId: string | null;
	workflowState: AgentWorkflowState | null;
	agentMetrics: Record<string, unknown> | null;
	context: Record<string, unknown> | null;
	status: AgentRunStatus;
	error: string | null;
	companyId: string;
	startedAt: Date;
	completedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface AgentRunEvent {
	id?: number;
	runId: string;
	eventType: string;
	payload: Record<string, unknown> | null;
	companyId: string;
	createdAt?: Date;
}

export interface RunStateFilter {
	companyId: string;
	status?: AgentRunStatus;
	sessionId?: string;
	limit?: number;
	offset?: number;
}

export interface StateSnapshot {
	state: AgentRunState;
	events: AgentRunEvent[];
}

// ============================================================================
// Error Types
// ============================================================================

/** Status of a batch run */
export type BatchStatus = "pending" | "running" | "completed" | "failed" | "partial";

/** Status of a single item within a batch */
export type BatchItemStatus = "pending" | "running" | "completed" | "failed";

/** Data persisted for a batch run (batch_runs table) */
export interface BatchRunData {
  id: string;
  companyId: string;
  status: BatchStatus;
  total: number;
  completed: number;
  failed: number;
  createdAt: Date;
  completedAt: Date | null;
  /** Optional FK to agent_run_states.sessionId for grouped queries */
  sessionId: string | null;
}

/** Data for a single item within a batch (batch_run_items table) */
export interface BatchItemData {
  id: string;
  batchId: string;
  runId: string;
  status: BatchItemStatus;
  error: string | null;
  createdAt: Date;
}

export class SessionStoreError extends Error {
	constructor(
		message: string,
		public readonly cause?: unknown,
	) {
		super(message);
		this.name = "SessionStoreError";
	}
}

export interface RunInput {
	runId: string;
	inputType: string;
	inputData: string;
	checksum: string;
	createdAt: Date;
}

export class SessionNotFoundError extends SessionStoreError {
	constructor(runId: string) {
		super(`Run state not found: ${runId}`);
		this.name = "SessionNotFoundError";
	}
}
