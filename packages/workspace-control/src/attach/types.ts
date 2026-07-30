import type { ExecutionId, OperationalState, FreshnessState } from "@drenyra/workspace-domain";

// ─── Attach Types ───────────────────────────────────────────────────────────

export interface AttachRequest {
	readonly executionId: ExecutionId;
	readonly fromSequence?: number;
	readonly clientId?: string;
}

export interface AttachResult {
	readonly executionId: ExecutionId;
	readonly currentState: OperationalState;
	readonly lastSequence: number;
	readonly caughtUpEvents: number;
	readonly attachedAt: string;
	readonly freshness: FreshnessState;
}

// ─── Detach Types ───────────────────────────────────────────────────────────

export interface DetachRequest {
	readonly executionId: ExecutionId;
	readonly clientId?: string;
	readonly reason?: string;
}

export interface DetachResult {
	readonly executionId: ExecutionId;
	readonly detachedAt: string;
	readonly executionContinues: true;
	readonly freshness: FreshnessState;
}

// ─── Resume Types ───────────────────────────────────────────────────────────

export interface ResumeRequest {
	readonly workspaceId: string;
	readonly executionIds: readonly ExecutionId[];
}

export interface ResumeResult {
	readonly workspaceId: string;
	readonly executionStates: readonly ResumeExecutionState[];
	readonly attended: number;
	readonly total: number;
	readonly resumedAt: string;
}

export interface ResumeExecutionState {
	readonly executionId: ExecutionId;
	readonly currentState: OperationalState;
	readonly lastSequence: number;
	readonly caughtUpEvents: number;
	readonly status: "live" | "stale" | "unavailable";
}
