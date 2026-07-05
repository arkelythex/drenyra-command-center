/**
 * Types for AI Control Plane Observability
 *
 * Mirrors the API response shapes from the agent_run_states/events tables.
 */

export type RunStatus =
	| "running"
	| "completed"
	| "failed"
	| "manual_review"
	| "degraded";

export type WorkflowState =
	| "IDLE"
	| "EXTRACTING"
	| "PARSING"
	| "VALIDATING"
	| "ARBITRATING"
	| "COMPLETED"
	| "FAILED";

export interface AgentRunState {
	id: string;
	runId: string;
	sessionId?: string | null;
	workflowState?: WorkflowState | null;
	status: RunStatus;
	context?: Record<string, unknown> | null;
	agentMetrics?: Record<string, unknown> | null;
	error?: string | null;
	startedAt?: string | null;
	completedAt?: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AgentRunEvent {
	id: number;
	runId: string;
	eventType: string;
	payload?: Record<string, unknown> | null;
	createdAt: string;
}

export interface RunSummary {
	total: number;
	running: number;
	completed: number;
	failed: number;
	manualReview: number;
	degraded: number;
}

// --- Batch types ---

export type BatchStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "partial"
	| "cancelled";
export type BatchItemStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

export interface BatchRun {
	id: string;
	companyId: string;
	status: BatchStatus;
	total: number;
	completed: number;
	failed: number;
	createdAt: string;
	completedAt: string | null;
}

export interface BatchRunItem {
	id: string;
	batchId: string;
	runId: string;
	status: BatchItemStatus;
	error: string | null;
	createdAt: string;
}

export interface BatchDetail extends BatchRun {
	items: BatchRunItem[];
}

export interface BatchRunDetail extends BatchDetail {
	error: string | null;
}

export interface CreateBatchPayload {
	invoices: Array<{
		type: "image" | "pdf" | "xml";
		data: string;
		metadata?: Record<string, unknown>;
	}>;
	maxConcurrent?: number;
}

export interface SubmitBatchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (batchId: string) => void;
}

// ─── Latency monitoring types ────────────────────────────────────────────

export interface LatencySummary {
	avgLatencyMs: number;
	p50LatencyMs: number;
	p95LatencyMs: number;
	p99LatencyMs: number;
	totalCalls: number;
	errorRate: number;
	byAgent: Array<{
		agentType: string;
		avgLatencyMs: number;
		p95LatencyMs: number;
		callCount: number;
	}>;
}

export interface LatencyTrendItem {
	date: string;
	avgLatencyMs: number;
	p95LatencyMs: number;
	callCount: number;
}

export interface LatencyRecentEvent {
	id: string;
	agentType: string;
	modelUsed: string;
	latencyMs: number;
	status: "success" | "failure";
	createdAt: string;
}

// ─── Agent Memory types ──────────────────────────────────────────────────────

export interface MemoryEntry {
	runId: string;
	memorySummary: string;
	workflowState: string;
	status: string;
	startedAt: string;
	completedAt: string;
}

export interface MemoryProfile {
	summary: string | null;
	recentRuns: number;
	companyId: string;
}
