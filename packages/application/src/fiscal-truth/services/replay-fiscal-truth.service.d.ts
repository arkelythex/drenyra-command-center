import type { EvidenceGraphRepository, FiscalTruthScope, ReplayRepository, ReplayResult } from "@drenyra/domain";
export interface ReplayFiscalTruthInput {
    aggregateId: string;
    scope: FiscalTruthScope;
}
export interface ReplayFiscalTruthServiceDependencies {
    loadEventChain: ReplayRepository["loadEventChain"];
    findNodeById: EvidenceGraphRepository["findNodeById"];
    saveReplayResult: ReplayRepository["saveReplayResult"];
}
export declare class ReplayFiscalTruthService {
    private readonly deps;
    constructor(deps: ReplayFiscalTruthServiceDependencies);
    execute(input: ReplayFiscalTruthInput): Promise<ReplayResult>;
}
//# sourceMappingURL=replay-fiscal-truth.service.d.ts.map