export type Neo4jOperation =
	| { type: "graph.query"; cypher: string; params?: Record<string, unknown> }
	| { type: "graph.store_fiscal_entity"; entity: FiscalGraphEntity }
	| {
			type: "graph.graphrag_search";
			query: string;
			embedding: number[];
			topK?: number;
	  }
	| { type: "graph.create_constraints" }
	| { type: "health" };

export interface FiscalGraphEntity {
	label: string;
	properties: Record<string, unknown>;
	relationships?: Array<{
		targetLabel: string;
		targetProperties: Record<string, unknown>;
		relationType: string;
		relationProperties?: Record<string, unknown>;
	}>;
}

export interface GraphRAGResult {
	nodes: Array<Record<string, unknown>>;
	relationships: Array<Record<string, unknown>>;
	score: number;
}

export interface Neo4jQueryResult {
	records: Array<Record<string, unknown>>;
	summary: {
		containsUpdates: boolean;
		nodesCreated: number;
		nodesDeleted: number;
		relationshipsCreated: number;
		propertiesSet: number;
	};
}
