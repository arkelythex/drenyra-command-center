export enum OSKnowledgeNamespace {
	SUNAT = "sunat",
	DRONE = "drone",
	LABOR = "labor",
	POLICIES = "policies",
	PROCEDURES = "procedures",
	CATALOG = "catalog",
}

export const ALL_OS_NAMESPACES: OSKnowledgeNamespace[] = Object.values(
	OSKnowledgeNamespace,
) as OSKnowledgeNamespace[];

export const OS_NAMESPACE_LABELS: Record<OSKnowledgeNamespace, string> = {
	[OSKnowledgeNamespace.SUNAT]: "Normas SUNAT y códigos tributarios",
	[OSKnowledgeNamespace.DRONE]: "Regulaciones aéreas DGAC",
	[OSKnowledgeNamespace.LABOR]: "Leyes laborales peruanas",
	[OSKnowledgeNamespace.POLICIES]: "Políticas internas de cliente",
	[OSKnowledgeNamespace.PROCEDURES]: "Procedimientos operativos",
	[OSKnowledgeNamespace.CATALOG]: "Catálogo de productos/servicios",
};

export interface OSRagDocument {
	id?: string;
	namespace: OSKnowledgeNamespace;
	source: string;
	title: string;
	content: string;
	category?: string;
	vertical?: string;
	metadata?: Record<string, unknown>;
}

export interface OSRagQuery {
	namespace?: OSKnowledgeNamespace;
	query: string;
	limit?: number;
	minScore?: number;
}

export interface OSRagSearchResult {
	id: string;
	namespace: OSKnowledgeNamespace;
	source: string;
	title: string;
	content: string;
	category: string | null;
	score: number;
}

// TODO(phase-4): implement OSRagResult formatter
export interface OSRagResult {
	formatted: string;
	results: OSRagSearchResult[];
	totalFound: number;
	namespaces: OSKnowledgeNamespace[];
}
