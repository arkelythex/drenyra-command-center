import type { FiscalTruthEvent } from "../entities/FiscalTruthEvent";
import type { FiscalTruthScope, ReplayResult } from "../types";

/**
 * Repository contract for replay dependency loading and replay result storage.
 */
export interface ReplayRepository {
	loadEventChain(
		aggregateId: string,
		scope: FiscalTruthScope,
	): Promise<FiscalTruthEvent[]>;
	saveReplayResult(
		aggregateId: string,
		result: ReplayResult,
		scope: FiscalTruthScope,
	): Promise<void>;
}
