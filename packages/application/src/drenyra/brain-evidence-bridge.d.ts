import {
	type EvidenceGraphRepository,
	type EvidenceNode,
	type FiscalTruthScope,
} from "@drenyra/domain";
import type {
	DrenyraBrainEvent,
	DrenyraFiscalScope,
} from "@drenyra/domain/drenyra";
export interface DrenyraBrainEvidenceBridgeDeps {
	appendNode: EvidenceGraphRepository["appendNode"];
	appendEdge: EvidenceGraphRepository["appendEdge"];
	digest: (value: string) => Promise<string>;
}
export interface DrenyraBrainEvidenceBridge {
	appendEvent(event: DrenyraBrainEvent): Promise<EvidenceNode>;
}
export declare function toFiscalTruthScope(
	scope: DrenyraFiscalScope,
): FiscalTruthScope;
export declare function createDrenyraBrainEvidenceBridge(
	deps: DrenyraBrainEvidenceBridgeDeps,
): DrenyraBrainEvidenceBridge;
//# sourceMappingURL=brain-evidence-bridge.d.ts.map
