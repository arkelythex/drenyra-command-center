import type {
	ActionType,
	ExecutionStatus,
	LastRunStatus,
	StepStatus,
	StepType,
	TriggerType,
	WorkflowCategory,
	WorkflowStatus,
} from "@drenyra/persistence/schema/automation-studio.schema";

export interface WorkflowResponse {
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
	steps?: StepResponse[];
	createdAt: string;
	updatedAt: string;
}

export interface StepResponse {
	id: string;
	workflowId: string;
	stepOrder: number;
	stepType: StepType;
	actionType: ActionType;
	config: Record<string, unknown>;
	status: StepStatus;
	createdAt: string;
}

export interface ExecutionResponse {
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

export interface DashboardStatsResponse {
	activeWorkflows: number;
	totalRuns: number;
	successRate: number;
	recentExecutions: ExecutionResponse[];
	workflowsByCategory: Record<string, number>;
	runsByDay: Array<{ date: string; count: number }>;
}

export interface CreateWorkflowBody {
	name: string;
	description?: string;
	category: WorkflowCategory;
	triggerType: TriggerType;
	triggerConfig: Record<string, unknown>;
}

export interface UpdateWorkflowBody {
	name?: string;
	description?: string;
	category?: WorkflowCategory;
	triggerType?: TriggerType;
	triggerConfig?: Record<string, unknown>;
}

export interface CreateStepBody {
	workflowId: string;
	stepOrder: number;
	stepType: StepType;
	actionType: ActionType;
	config: Record<string, unknown>;
}

export interface UpdateStepBody {
	stepOrder?: number;
	stepType?: StepType;
	actionType?: ActionType;
	config?: Record<string, unknown>;
	status?: StepStatus;
}

export interface ReorderStepsBody {
	workflowId: string;
	stepIds: string[];
}
