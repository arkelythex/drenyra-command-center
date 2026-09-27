import type { Timestamp } from "./types";
export type BudgetCategory = "perception" | "loading" | "rendering" | "agent" | "network";
export interface PerfBudget {
    name: string;
    category: BudgetCategory;
    targetMs: number;
    warningMs: number;
    description: string;
}
export declare const DRENYRA_PERF_BUDGETS: PerfBudget[];
export interface PerfMeasurement {
    budgetName: string;
    measuredMs: number;
    passed: boolean;
    timestamp: Timestamp;
    metadata?: Record<string, unknown>;
}
export declare class PerfBudgetTracker {
    private measurements;
    measure(name: string, measuredMs: number): PerfMeasurement;
    getHistory(name?: string): PerfMeasurement[];
    getPassRate(name: string): {
        passed: number;
        total: number;
        rate: number;
    };
    getViolations(): PerfBudget[];
}
//# sourceMappingURL=performance-budget.d.ts.map