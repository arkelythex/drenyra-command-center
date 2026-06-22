// ─── Worker Task Types ─────────────────────────────────────────────
// Snapshot from @arkelythex/agent-swarm/src/types/worker-task.ts

export type WorkerTaskStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed";

export type WorkerTaskPriority = "low" | "medium" | "high" | "critical";

export interface AIWorkerTask {
	id: string;
	companyId: string;
	userId: string;
	type: string;
	payload: Record<string, unknown>;
	result?: Record<string, unknown>;
	status: WorkerTaskStatus;
	priority: WorkerTaskPriority;
	retryCount: number;
	maxRetries: number;
	nextRetryAt?: Date;
	error?: string;
	errorStack?: string;
	createdAt: Date;
	updatedAt: Date;
	startedAt?: Date;
	completedAt?: Date;
}

export interface CreateTaskDTO {
	companyId: string;
	userId: string;
	type: string;
	payload: Record<string, unknown>;
	priority?: WorkerTaskPriority;
	maxRetries?: number;
}

export interface TaskStatusDTO {
	id: string;
	status: WorkerTaskStatus;
	progress?: number;
	result?: unknown;
	error?: string;
	createdAt: Date;
	updatedAt: Date;
	startedAt?: Date;
	completedAt?: Date;
	retryCount: number;
	maxRetries: number;
}
export type TaskHandlerResult = unknown;
export type TaskHandlerFunction = (task: AIWorkerTask) => Promise<TaskHandlerResult>;
export type TaskHandlerRegistry = Map<string, TaskHandlerFunction>;

export interface QueueStatsDTO {
	pending: number;
	processing: number;
	completed: number;
	failed: number;
	total: number;
}
