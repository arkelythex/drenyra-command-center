import type { FiscalTruthEvent } from "../entities/FiscalTruthEvent";
import type { FiscalTruthScope, ReplayResult } from "../types";
export interface ReplayRepository {
    loadEventChain(aggregateId: string, scope: FiscalTruthScope): Promise<FiscalTruthEvent[]>;
    saveReplayResult(aggregateId: string, result: ReplayResult, scope: FiscalTruthScope): Promise<void>;
}
//# sourceMappingURL=replay.repository.d.ts.map