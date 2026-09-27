import type { FiscalTruthEvent, FiscalTruthScope, ReplayRepository, ReplayResult } from "@drenyra/domain";
import { db } from "../client";
import type { DbTransaction } from "../unit-of-work";
export declare class PostgresReplayRepository implements ReplayRepository {
    private readonly client;
    constructor(client?: DbTransaction | typeof db);
    loadEventChain(aggregateId: string, scope: FiscalTruthScope): Promise<FiscalTruthEvent[]>;
    saveReplayResult(aggregateId: string, result: ReplayResult, scope: FiscalTruthScope): Promise<void>;
}
//# sourceMappingURL=postgres-replay.repository.d.ts.map