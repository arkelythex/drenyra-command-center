import type {
	FiscalMemoryScope,
	FiscalMemorySeverity,
} from "@drenyra/domain/fiscal-memory";
import type { FiscalMemoryRepository } from "@drenyra/domain/repositories/fiscal-memory.repository";
export interface EvaluateRecurringErrorInput {
	readonly scope: FiscalMemoryScope;
	readonly periods: readonly string[];
	readonly errorCode: string;
}
export interface RecurringErrorResult {
	readonly errorCode: string;
	readonly recurrenceCount: number;
	readonly periods: readonly string[];
	readonly severity: FiscalMemorySeverity;
	readonly recommendedAction: "monitor" | "review" | "escalate";
}
export declare class RecurringErrorService {
	private readonly repository;
	constructor(repository: FiscalMemoryRepository);
	evaluate(input: EvaluateRecurringErrorInput): Promise<RecurringErrorResult>;
}
//# sourceMappingURL=recurring-error.service.d.ts.map
