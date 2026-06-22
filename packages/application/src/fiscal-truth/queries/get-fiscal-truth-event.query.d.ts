import type { FiscalTruthEvent, FiscalTruthRepository, FiscalTruthScope } from "@arkelythex/domain";
export interface GetFiscalTruthEventQueryInput {
    eventId: string;
    scope: FiscalTruthScope;
}
export declare class GetFiscalTruthEventQuery {
    private readonly repository;
    constructor(repository: FiscalTruthRepository);
    execute(input: GetFiscalTruthEventQueryInput): Promise<FiscalTruthEvent | null>;
}
//# sourceMappingURL=get-fiscal-truth-event.query.d.ts.map