import type { FiscalTruthScope, ReplayResult } from "@drenyra/domain";
import { ReplayFiscalTruthService } from "../services/replay-fiscal-truth.service";
export interface ReplayFiscalTruthQueryInput {
    aggregateId: string;
    scope: FiscalTruthScope;
}
export declare class ReplayFiscalTruthQuery {
    private readonly replayService;
    constructor(replayService: ReplayFiscalTruthService);
    execute(input: ReplayFiscalTruthQueryInput): Promise<ReplayResult>;
}
//# sourceMappingURL=replay-fiscal-truth.query.d.ts.map