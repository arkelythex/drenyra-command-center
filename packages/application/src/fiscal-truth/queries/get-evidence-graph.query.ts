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

/**
 * Scoped traversal of outgoing evidence edges.
 */
export class GetEvidenceGraphQuery {
	constructor(private readonly repository: EvidenceGraphRepository) {}

	async execute(
		input: GetEvidenceGraphQueryInput,
	): Promise<GetEvidenceGraphQueryOutput> {
		const edges = await this.repository.findEdgesFromNode(
			input.nodeId,
			input.scope,
		);

		return { edges };
	}
}
