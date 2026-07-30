import type { PerformanceBudget } from "./types";

// ─── Default Budget Definitions ─────────────────────────────────────────────

export const DEFAULT_PERFORMANCE_BUDGETS: readonly PerformanceBudget[] = [
	{ operation: "startup", targetMs: 2000, warningMs: 1000, criticalMs: 3000 },
	{
		operation: "restoration",
		targetMs: 5000,
		warningMs: 2000,
		criticalMs: 8000,
	},
	{ operation: "replay", targetMs: 1000, warningMs: 500, criticalMs: 2000 },
	{ operation: "rollup", targetMs: 500, warningMs: 200, criticalMs: 1000 },
];
