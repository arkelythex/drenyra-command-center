import type { FiscalTruthEvent } from "../entities/FiscalTruthEvent";
import type { ChainVerificationResult, FiscalTruthScope } from "../types";
export interface FiscalTruthRepository {
    append(event: FiscalTruthEvent): Promise<void>;
    findByEventId(eventId: string, scope: FiscalTruthScope): Promise<FiscalTruthEvent | null>;
    findByAggregateId(aggregateId: string, scope: FiscalTruthScope): Promise<FiscalTruthEvent[]>;
    verifyChain(scope: FiscalTruthScope): Promise<ChainVerificationResult>;
}
//# sourceMappingURL=fiscal-truth.repository.d.ts.map