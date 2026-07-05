import type {
	EvidenceEdge,
	EvidenceGraphRepository,
	FiscalTruthScope,
} from "@drenyra/domain";
export interface GetEvidenceGraphQueryInput {
	nodeId: string;
	scope: FiscalTruthScope;
}
export interface GetEvidenceGraphQueryOutput {
	edges: EvidenceEdge[];
}
export declare class GetEvidenceGraphQuery {
	private readonly repository;
	constructor(repository: EvidenceGraphRepository);
	execute(
		input: GetEvidenceGraphQueryInput,
	): Promise<GetEvidenceGraphQueryOutput>;
}
//# sourceMappingURL=get-evidence-graph.query.d.ts.map
