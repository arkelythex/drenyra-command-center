import type { FiscalTruthScope } from "../types";
import type { EvidenceEdgeKind } from "./shared";
export interface EvidenceEdge {
    edgeId: string;
    fromNodeId: string;
    toNodeId: string;
    edgeKind: EvidenceEdgeKind;
    scope: FiscalTruthScope;
    createdAt: string;
}
//# sourceMappingURL=EvidenceEdge.d.ts.map