import type { ChainVerificationResult, FiscalTruthEvent, FiscalTruthRepository, FiscalTruthScope } from "@drenyra/domain";
import { db } from "../client";
import type { DbTransaction } from "../unit-of-work";
export declare class PostgresFiscalTruthRepository implements FiscalTruthRepository {
    private readonly client;
    constructor(client?: DbTransaction | typeof db);
    append(event: FiscalTruthEvent): Promise<void>;
    findByEventId(eventId: string, scope: FiscalTruthScope): Promise<FiscalTruthEvent | null>;
    findByAggregateId(aggregateId: string, scope: FiscalTruthScope): Promise<FiscalTruthEvent[]>;
    verifyChain(scope: FiscalTruthScope): Promise<ChainVerificationResult>;
}
//# sourceMappingURL=postgres-fiscal-truth.repository.d.ts.map