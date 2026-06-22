import type { FiscalTruthScope } from "../types";
import type { EvidenceEdgeKind } from "./shared";

/**
 * Typed relationship between evidence nodes and/or authoritative events.
 */
export interface EvidenceEdge {
	edgeId: string;
	fromNodeId: string;
	toNodeId: string;
	edgeKind: EvidenceEdgeKind;
	scope: FiscalTruthScope;
	createdAt: string;
}
