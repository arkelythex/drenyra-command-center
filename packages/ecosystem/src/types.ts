import type { ConnectorPort } from "./connector.port";

/**
 * Discriminated union of all connector operation types.
 * Each connector's operations are scoped to its domain.
 */

export type EcosystemConnector = ConnectorPort;

export type EcosystemConnectorName =
	| "erpnext"
	| "duckdb"
	| "docling"
	| "n8n"
	| "dify"
	| "temporal"
	| "neo4j"
	| "metabase"
	| "minio"
	| "unstructured";

export const ECOSYSTEM_CONNECTOR_NAMES: readonly EcosystemConnectorName[] = [
	"erpnext",
	"duckdb",
	"docling",
	"n8n",
	"dify",
	"temporal",
	"neo4j",
	"metabase",
	"minio",
	"unstructured",
] as const;

export interface EcosystemDependency {
	/** Name of the ecosystem tool */
	tool: string;
	/** GitHub repo URL */
	repo: string;
	/** GitHub stars (approximate) */
	stars: number;
	/** What Drenyra uses it for */
	purpose: string;
	/** Required for Drenyra to function? */
	critical: boolean;
	/** Phase when integration is planned */
	plannedPhase: 1 | 2 | 3 | 4;
}

export const ECOSYSTEM_DEPENDENCIES: EcosystemDependency[] = [
	{
		tool: "ERPNext",
		repo: "https://github.com/frappe/erpnext",
		stars: 36000,
		purpose: "General ledger, AR/AP, inventory",
		critical: false,
		plannedPhase: 1,
	},
	{
		tool: "DuckDB",
		repo: "https://github.com/duckdb/duckdb",
		stars: 39000,
		purpose: "Analytics OLAP, cashflow/SIRE views",
		critical: false,
		plannedPhase: 1,
	},
	{
		tool: "Docling",
		repo: "https://github.com/DS4SD/docling",
		stars: 62000,
		purpose: "Document understanding, table extraction",
		critical: false,
		plannedPhase: 3,
	},
	{
		tool: "N8N",
		repo: "https://github.com/n8n-io/n8n",
		stars: 194000,
		purpose: "Workflow automation, webhook triggers",
		critical: false,
		plannedPhase: 3,
	},
	{
		tool: "Dify",
		repo: "https://github.com/langgenius/dify",
		stars: 146000,
		purpose: "AI agent orchestration, RAG pipeline",
		critical: false,
		plannedPhase: 2,
	},
	{
		tool: "Temporal",
		repo: "https://github.com/temporalio/temporal",
		stars: 21000,
		purpose: "Durable execution, saga patterns",
		critical: false,
		plannedPhase: 3,
	},
	{
		tool: "Neo4j",
		repo: "https://github.com/neo4j/neo4j",
		stars: 17000,
		purpose: "GraphRAG, fiscal knowledge graph",
		critical: false,
		plannedPhase: 3,
	},
	{
		tool: "Metabase",
		repo: "https://github.com/metabase/metabase",
		stars: 48000,
		purpose: "BI dashboards, ad-hoc analytics",
		critical: false,
		plannedPhase: 3,
	},
	{
		tool: "MinIO",
		repo: "https://github.com/minio/minio",
		stars: 61000,
		purpose: "Object storage, document archival (already used)",
		critical: true,
		plannedPhase: 1,
	},
	{
		tool: "Unstructured",
		repo: "https://github.com/Unstructured-IO/unstructured",
		stars: 15000,
		purpose: "Document ETL, chunking for RAG",
		critical: false,
		plannedPhase: 3,
	},
];
