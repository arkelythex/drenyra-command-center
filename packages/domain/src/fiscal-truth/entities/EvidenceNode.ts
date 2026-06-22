import type {
	EvidenceNodeKind,
	FiscalTruthScope,
	FiscalTruthTrace,
} from "../types";

/**
 * Typed evidence artifact linked to authoritative fiscal decisions.
 */
export interface EvidenceNode {
	nodeId: string;
	nodeKind: EvidenceNodeKind;
	scope: FiscalTruthScope;
	trace: FiscalTruthTrace;
	hash: string;
	createdAt: string;
	metadata: Record<string, unknown>;
}
