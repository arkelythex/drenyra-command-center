export type N8nOperation =
	| {
			type: "workflow.trigger";
			workflowId: string;
			payload: Record<string, unknown>;
	  }
	| { type: "workflow.status"; executionId: string }
	| { type: "workflow.list" }
	| { type: "health" };

export interface N8nExecutionStatus {
	id: string;
	workflowId: string;
	status: "running" | "success" | "error" | "waiting";
	startedAt: string;
	finishedAt?: string;
	retryOf?: string;
	data?: Record<string, unknown>;
}

export interface N8nWorkflow {
	id: string;
	name: string;
	active: boolean;
	webhookIds?: string[];
}

export interface N8nApiResponse<T> {
	data: T;
}
