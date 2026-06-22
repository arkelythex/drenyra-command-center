import type { FiscalMemory, FiscalMemorySeverity, FiscalMemoryScope } from "@arkelythex/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@arkelythex/domain/repositories/fiscal-memory.repository";

/**
 * Query used to evaluate whether the same fiscal error recurs across periods.
 *
 * @remarks The scope prevents recurrence checks from crossing tenant/company/RUC boundaries.
 * @example
 * const input: EvaluateRecurringErrorInput = { scope, periods: ["2026-03", "2026-04"], errorCode: "SIRE_MISSING_EVIDENCE" };
 */
export interface EvaluateRecurringErrorInput {
	readonly scope: FiscalMemoryScope;
	readonly periods: readonly string[];
	readonly errorCode: string;
}

/**
 * Deterministic recurrence evaluation result.
 *
 * @returns Count, periods, severity, and the recommended compliance action.
 * @example
 * const action = result.recommendedAction === "escalate" ? "notify-controller" : "monitor";
 */
export interface RecurringErrorResult {
	readonly errorCode: string;
	readonly recurrenceCount: number;
	readonly periods: readonly string[];
	readonly severity: FiscalMemorySeverity;
	readonly recommendedAction: "monitor" | "review" | "escalate";
}

const SEVERITY_RANK: Record<FiscalMemorySeverity, number> = {
	info: 0,
	low: 1,
	medium: 2,
	high: 3,
	critical: 4,
};

const severityFromRank = (rank: number): FiscalMemorySeverity => {
	if (rank >= SEVERITY_RANK.critical) return "critical";
	if (rank >= SEVERITY_RANK.high) return "high";
	if (rank >= SEVERITY_RANK.medium) return "medium";
	if (rank >= SEVERITY_RANK.low) return "low";
	return "info";
};

const memoryMatchesError = (memory: FiscalMemory, errorCode: string): boolean => {
	const normalized = errorCode.trim();
	return memory.tags.some(
		(tag) =>
			tag === normalized ||
			tag === `error:${normalized}` ||
			tag === `errorCode:${normalized}`,
	);
};

/**
 * Detects recurring fiscal errors from persisted fiscal memories.
 *
 * @remarks Matching is deterministic and based on explicit tags or error-code tags.
 * @example
 * const result = await recurringErrorService.evaluate(input);
 */
export class RecurringErrorService {
	constructor(private readonly repository: FiscalMemoryRepository) {}

	/**
	 * Evaluates recurrence for an error code across fiscal periods.
	 *
	 * @param input - Scoped periods and deterministic error code.
	 * @returns Recurrence count, affected periods, severity, and action recommendation.
	 * @throws Error when the repository implementation fails to enforce scope.
	 */
	async evaluate(input: EvaluateRecurringErrorInput): Promise<RecurringErrorResult> {
		const matching: FiscalMemory[] = [];

		for (const period of input.periods) {
			const memories = await this.repository.findByPeriod(input.scope, period);
			matching.push(...memories.filter((memory) => memoryMatchesError(memory, input.errorCode)));
		}

		const periods = [...new Set(matching.map((memory) => memory.period))].sort();
		const maxSeverityRank = matching.reduce(
			(max, memory) => Math.max(max, SEVERITY_RANK[memory.severity]),
			SEVERITY_RANK.info,
		);
		const recurrenceCount = periods.length;

		return {
			errorCode: input.errorCode,
			recurrenceCount,
			periods,
			severity: recurrenceCount >= 3 ? "high" : severityFromRank(maxSeverityRank),
			recommendedAction:
				recurrenceCount >= 3 ? "escalate" : recurrenceCount > 0 ? "review" : "monitor",
		};
	}
}
