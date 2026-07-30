// ─── Notification Errors ────────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";

export class WaitTimeoutError extends Error {
	public readonly executionId: ExecutionId;
	public readonly timeoutMs: number;

	constructor(executionId: ExecutionId, timeoutMs: number) {
		super(`Wait timeout after ${timeoutMs}ms for execution ${executionId}`);
		this.name = "WaitTimeoutError";
		this.executionId = executionId;
		this.timeoutMs = timeoutMs;
	}
}

export class SubscriptionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SubscriptionError";
	}
}
