import type { FiscalTruthScope, FiscalTruthTrace } from "../types";
import type { TruthEventKind } from "./shared";
export interface FiscalTruthEvent {
    eventId: string;
    aggregateId: string;
    aggregateType: string;
    eventKind: TruthEventKind;
    scope: FiscalTruthScope;
    trace: FiscalTruthTrace;
    validatorSetVersion: string;
    policyVersion: string;
    evidenceRootNodeId: string;
    evidenceBundleHash: string;
    approvalId: string | null;
    occurredAt: string;
    payload: Record<string, unknown>;
    prevHash?: string;
    chainHash?: string;
}
//# sourceMappingURL=FiscalTruthEvent.d.ts.map