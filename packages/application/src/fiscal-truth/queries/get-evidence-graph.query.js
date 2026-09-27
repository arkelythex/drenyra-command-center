export class GetEvidenceGraphQuery {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(input) {
        const edges = await this.repository.findEdgesFromNode(input.nodeId, input.scope);
        return { edges };
    }
}
//# sourceMappingURL=get-evidence-graph.query.js.map