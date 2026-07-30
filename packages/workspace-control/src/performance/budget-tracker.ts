import {
	BUDGET_STATUS,
	type BudgetMeasurement,
	type BudgetStatus,
	type PerformanceBudget,
} from "./types";
import { DEFAULT_PERFORMANCE_BUDGETS } from "./budgets";

// ─── Budget Tracker ─────────────────────────────────────────────────────────

export interface BudgetTracker {
	start(operation: string): void;
	end(operation: string): BudgetMeasurement | null;
	getMeasurement(operation: string): BudgetMeasurement | null;
	getAllMeasurements(): BudgetMeasurement[];
	reset(): void;
}

function computeStatus(
	elapsedMs: number,
	budget: PerformanceBudget,
): BudgetStatus {
	if (elapsedMs >= budget.criticalMs) {
		return BUDGET_STATUS.CRITICAL;
	}
	if (elapsedMs >= budget.targetMs) {
		return BUDGET_STATUS.EXCEEDED;
	}
	if (elapsedMs >= budget.warningMs) {
		return BUDGET_STATUS.WARNING;
	}
	return BUDGET_STATUS.OK;
}

export class InMemoryBudgetTracker implements BudgetTracker {
	private readonly budgets: Map<string, PerformanceBudget>;
	private readonly activeTimers: Map<string, number>;
	private readonly completed: Map<string, BudgetMeasurement>;

	constructor(defaultBudgets?: PerformanceBudget[]) {
		this.budgets = new Map();
		this.activeTimers = new Map();
		this.completed = new Map();

		const budgetsToLoad = defaultBudgets ?? DEFAULT_PERFORMANCE_BUDGETS;
		for (const budget of budgetsToLoad) {
			this.budgets.set(budget.operation, budget);
		}
	}

	start(operation: string): void {
		this.activeTimers.set(operation, Date.now());
	}

	end(operation: string): BudgetMeasurement | null {
		const startTime = this.activeTimers.get(operation);

		if (startTime === undefined) {
			return null;
		}

		this.activeTimers.delete(operation);

		const now = Date.now();
		const elapsedMs = now - startTime;
		const budget = this.budgets.get(operation);

		let status: BudgetStatus;
		if (budget !== undefined) {
			status = computeStatus(elapsedMs, budget);
		} else {
			// No budget defined → mark as ok by default
			status = BUDGET_STATUS.OK;
		}

		const measurement: BudgetMeasurement = {
			operation,
			elapsedMs,
			status,
			measuredAt: new Date(now).toISOString(),
		};

		this.completed.set(operation, measurement);
		return measurement;
	}

	getMeasurement(operation: string): BudgetMeasurement | null {
		return this.completed.get(operation) ?? null;
	}

	getAllMeasurements(): BudgetMeasurement[] {
		return Array.from(this.completed.values());
	}

	reset(): void {
		this.activeTimers.clear();
		this.completed.clear();
	}
}
