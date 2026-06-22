import type { EvidenceEdge } from "../entities/EvidenceEdge";
import type { EvidenceNode } from "../entities/EvidenceNode";
import type { FiscalTruthScope } from "../types";

/**
 * Repository contract for fiscal evidence graph persistence and traversal.
 */
export interface EvidenceGraphRepository {
	appendNode(node: EvidenceNode): Promise<void>;
	appendEdge(edge: EvidenceEdge): Promise<void>;
	findNodeById(
		nodeId: string,
		scope: FiscalTruthScope,
	): Promise<EvidenceNode | null>;
	findEdgesFromNode(
		nodeId: string,
		scope: FiscalTruthScope,
	): Promise<EvidenceEdge[]>;
	findEdgesToNode(
		nodeId: string,
		scope: FiscalTruthScope,
	): Promise<EvidenceEdge[]>;
}
