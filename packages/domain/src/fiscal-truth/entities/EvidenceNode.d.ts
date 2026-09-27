import type { EvidenceNodeKind, FiscalTruthScope, FiscalTruthTrace } from "../types";
export interface EvidenceNode {
    nodeId: string;
    nodeKind: EvidenceNodeKind;
    scope: FiscalTruthScope;
    trace: FiscalTruthTrace;
    hash: string;
    createdAt: string;
    metadata: Record<string, unknown>;
}
//# sourceMappingURL=EvidenceNode.d.ts.map