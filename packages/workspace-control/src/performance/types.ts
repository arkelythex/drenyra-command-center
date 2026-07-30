// ─── Performance Types ──────────────────────────────────────────────────────

// Performance budget for workspace operations
export interface PerformanceBudget {
	readonly operation: string;
	readonly targetMs: number;
	readonly warningMs: number;
	readonly criticalMs: number;
}

// Budget measurement status
export const BUDGET_STATUS = {
	OK: "ok",
	WARNING: "warning",
	CRITICAL: "critical",
	EXCEEDED: "exceeded",
} as const;

export type BudgetStatus = (typeof BUDGET_STATUS)[keyof typeof BUDGET_STATUS];

// Budget measurement result
export interface BudgetMeasurement {
	readonly operation: string;
	readonly elapsedMs: number;
	readonly status: BudgetStatus;
	readonly measuredAt: string;
}

// Event backpressure state
export interface BackpressureState {
	readonly eventsQueued: number;
	readonly maxQueueSize: number;
	readonly isThrottled: boolean;
	readonly droppedSinceReset: number;
}
