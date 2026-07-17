export interface FiscalQueryRequest {
	query: string;
	companyRuc?: string;
	documentType?: string;
	period?: string;
	conversationId?: string;
}

export interface GraphRagContext {
	fiscalEntities: Array<{
		id: string;
		labels: string[];
		properties: Record<string, unknown>;
		score?: number;
	}>;
	relationships: Array<{
		source: string;
		target: string;
		type: string;
		properties: Record<string, unknown>;
	}>;
	queryTimeMs: number;
}

export interface DifyNeo4jResult {
	query: string;
	graphContext: GraphRagContext;
	difyResponse: {
		answer: string;
		conversationId: string;
		messageId: string;
		confidence?: number;
	};
	totalTimeMs: number;
}

export interface OrchestratorConfig {
	neo4jMaxResults: number;
	difyDatasetId?: string;
	includeRelationships: boolean;
	minGraphConfidence: number;
}

export const ORCHESTRATOR_DEFAULTS: OrchestratorConfig = {
	neo4jMaxResults: 10,
	includeRelationships: true,
	minGraphConfidence: 0.5,
};

/** Internal shape after processing Neo4j results into graph context */
export interface GraphRagSearchParams {
	query: string;
	companyRuc?: string;
	maxResults: number;
}

/** Shape of the dify chat.message response we extract */
export interface DifyResponse {
	answer: string;
	conversationId: string;
	messageId: string;
}
