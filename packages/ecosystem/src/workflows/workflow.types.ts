export type WorkflowStepStatus =
	| "pending"
	| "running"
	| "completed"
	| "failed"
	| "skipped";
export type WorkflowRunStatus =
	| "running"
	| "completed"
	| "failed"
	| "cancelled";

export interface WorkflowStep {
	id: string;
	name: string;
	description: string;
	order: number;
	timeoutMs?: number;
	execute(context: Record<string, unknown>): Promise<WorkflowStepResult>;
}

export interface WorkflowStepResult {
	status: WorkflowStepStatus;
	output?: Record<string, unknown>;
	error?: string;
	durationMs?: number;
}

export interface WorkflowPipeline {
	id: string;
	name: string;
	description: string;
	steps: WorkflowStep[];
}

export interface WorkflowOutcome {
	runId: string;
	pipelineId: string;
	status: WorkflowRunStatus;
	stepResults: WorkflowStepResult[];
	error?: string;
	totalDurationMs: number;
	completedAt?: string;
}

export interface WorkflowEngine {
	registerPipeline(pipeline: WorkflowPipeline): void;
	getPipeline(id: string): WorkflowPipeline | undefined;
	listPipelines(): WorkflowPipeline[];
	run(
		pipelineId: string,
		initialState?: Record<string, unknown>,
	): Promise<WorkflowOutcome>;
	cancel(runId: string): Promise<void>;
	getRun(runId: string): WorkflowOutcome | undefined;
	listRuns(): WorkflowOutcome[];
	setApprovalManager(manager: {
		requiresApproval(action: { type: string }): boolean;
		requestApproval(
			action: { type: string },
			level: string,
			reason: string,
		): { id: string };
		waitForDecision(id: string): Promise<{ status: string }>;
	}): void;
}
