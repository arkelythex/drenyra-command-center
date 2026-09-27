import type { EvidenceAggregateQuery, EvidenceEdge, EvidenceGraphRepository, EvidenceNode, FiscalTruthScope } from "@drenyra/domain";
import { db } from "../client";
import type { DbTransaction } from "../unit-of-work";
export declare class PostgresEvidenceGraphRepository implements EvidenceGraphRepository {
    private readonly client;
    constructor(client?: DbTransaction | typeof db);
    appendNode(node: EvidenceNode): Promise<void>;
    appendEdge(edge: EvidenceEdge): Promise<void>;
    findNodeById(nodeId: string, scope: FiscalTruthScope): Promise<EvidenceNode | null>;
    findEdgesFromNode(nodeId: string, scope: FiscalTruthScope): Promise<EvidenceEdge[]>;
    findEdgesToNode(nodeId: string, scope: FiscalTruthScope): Promise<EvidenceEdge[]>;
    listNodesByAggregateType(query: EvidenceAggregateQuery): Promise<EvidenceNode[]>;
}
//# sourceMappingURL=postgres-evidence-graph.repository.d.ts.map