export type TemporalOperation =
	| {
			type: "workflow.start";
			workflowType: string;
			taskQueue: string;
			args: unknown[];
			workflowId?: string;
	  }
	| { type: "workflow.status"; workflowId: string }
	| { type: "workflow.result"; workflowId: string }
	| {
			type: "schedule.create";
			scheduleId: string;
			workflowType: string;
			cronSchedule: string;
			args: unknown[];
	  }
	| { type: "health" };

export interface TemporalWorkflowExecution {
	workflowId: string;
	runId: string;
	type: string;
	taskQueue: string;
	status:
		| "RUNNING"
		| "COMPLETED"
		| "FAILED"
		| "CANCELED"
		| "TERMINATED"
		| "TIMED_OUT";
	startTime: string;
	endTime?: string;
}

export interface TemporalWorkflowResult {
	workflowId: string;
	runId: string;
	result: unknown;
}
export interface TemporalSchedule {
	scheduleId: string;
	workflowType: string;
	cronSchedule: string;
	state: "ACTIVE" | "PAUSED" | "DELETED";
	nextRunTime?: string;
}
export interface TemporalApiResponse<T> {
	data: T;
}
