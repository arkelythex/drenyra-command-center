/**
 * Automation Studio — DTO types for frontend consumption.
 *
 * @module application/features/automation-studio
 */

// ─── String literal unions matching persistence schema enums ────

export type WorkflowCategory = string;
export type TriggerType = string;
export type WorkflowStatus = string;
export type LastRunStatus = string;
export type StepType = string;
export type ActionType = string;
export type StepStatus = string;
export type ExecutionStatus = string;

// ─── DTOs ───────────────────────────────────────────────────────

export interface WorkflowDTO {
	id: string;
	companyId: string;
	name: string;
	description?: string;
	category: WorkflowCategory;
	triggerType: TriggerType;
	triggerConfig: Record<string, unknown>;
	status: WorkflowStatus;
	lastRunAt?: string;
	lastRunStatus?: LastRunStatus;
	runCount: number;
	errorCount: number;
	steps?: StepDTO[];
	createdAt: string;
	updatedAt: string;
}

export interface StepDTO {
	id: string;
	workflowId: string;
	stepOrder: number;
	stepType: StepType;
	actionType: ActionType;
	config: Record<string, unknown>;
	status: StepStatus;
	createdAt: string;
}

export interface ExecutionDTO {
	id: string;
	workflowId: string;
	stepId?: string;
	triggeredBy: string;
	status: ExecutionStatus;
	startedAt: string;
	completedAt?: string;
	resultSummary?: string;
	error?: string;
	log?: string;
}

export interface DashboardStatsDTO {
	activeWorkflows: number;
	totalRuns: number;
	successRate: number;
	recentExecutions: ExecutionDTO[];
	workflowsByCategory: Record<string, number>;
	runsByDay: Array<{ date: string; count: number }>;
}

export interface CreateWorkflowRequest {
	name: string;
	description?: string;
	category: WorkflowCategory;
	triggerType: TriggerType;
	triggerConfig: Record<string, unknown>;
}

export interface UpdateWorkflowRequest {
	name?: string;
	description?: string;
	category?: WorkflowCategory;
	triggerType?: TriggerType;
	triggerConfig?: Record<string, unknown>;
}

export interface CreateStepRequest {
	workflowId: string;
	stepOrder: number;
	stepType: StepType;
	actionType: ActionType;
	config: Record<string, unknown>;
}

export interface UpdateStepRequest {
	stepOrder?: number;
	stepType?: StepType;
	actionType?: ActionType;
	config?: Record<string, unknown>;
	status?: StepStatus;
}

export interface ReorderStepsRequest {
	workflowId: string;
	stepIds: string[];
}
