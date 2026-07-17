/**
 * @arkelythex/ecosystem — Drenyra Ecosystem Integration Connector Framework
 *
 * Provides:
 * - ConnectorPort interface for all ecosystem integrations
 * - ConnectorRegistry for lifecycle management
 * - BaseConnector with circuit breaker, health checks, and metrics
 * - ERPNext adapter (GL, AR/AP, trial balance)
 * - DuckDB adapter (analytics views, cashflow/SIRE/IGV)
 * - Docling adapter (document understanding, table extraction)
 * - N8N adapter (workflow automation, webhook triggers)
 * - Neo4j adapter (fiscal knowledge graph, GraphRAG)
 *
 * See docs/01-architecture/ecosystem-integration-strategy-2026.md for full strategy.
 */

// Dify
export type {
	DifyChatResponse,
	DifyConversation,
	DifyKnowledgeRetrievalResponse,
	DifyOperation,
	DifyWorkflowRunResponse,
} from "./adapters/dify";
export { DifyConnector } from "./adapters/dify";
// Docling
export type {
	DoclingClassificationResult,
	DoclingExtractionResult,
	DoclingOperation,
	DocumentInput,
	ExtractionOptions,
} from "./adapters/docling";
export { DoclingConnector } from "./adapters/docling";
export type {
	DuckdbOperation,
	DuckdbQueryResult,
	DuckdbRefreshEvent,
} from "./adapters/duckdb";
export { ANALYTICS_QUERIES, DuckdbConnector } from "./adapters/duckdb";
export type {
	ErpnextOperation,
	JournalAccount,
	JournalEntryInput,
	PartyInput,
	TrialBalanceFilter,
} from "./adapters/erpnext";
export {
	ErpnextConnector,
	mapPurchaseInvoiceToJournalEntry,
	mapSalesInvoiceToJournalEntry,
} from "./adapters/erpnext";
// N8N
export type {
	N8nExecutionStatus,
	N8nOperation,
	N8nWorkflow,
} from "./adapters/n8n";
export { N8nConnector } from "./adapters/n8n";
// Neo4j
export type {
	FiscalGraphEntity,
	GraphRAGResult,
	Neo4jOperation,
	Neo4jQueryResult,
} from "./adapters/neo4j";
export { Neo4jConnector } from "./adapters/neo4j";
export { BaseConnector, CircuitBreakerOpenError } from "./base.connector";
export type {
	DifyConfig,
	DoclingConfig,
	DuckdbConfig,
	ErpnextConfig,
	N8nConfig,
	Neo4jConfig,
	TemporalConfig,
} from "./config";
// Config
export {
	DifyConfigSchema,
	DoclingConfigSchema,
	DuckdbConfigSchema,
	ErpnextConfigSchema,
	loadConnectorConfig,
	N8nConfigSchema,
	Neo4jConfigSchema,
	TemporalConfigSchema,
} from "./config";
// Core framework
export type {
	ConnectorHealth,
	ConnectorMetrics,
	ConnectorPort,
} from "./connector.port";
export type { ConnectorHealthResult } from "./connector.registry";
export {
	ConnectorRegistry,
	getConnectorRegistry,
	resetConnectorRegistry,
} from "./connector.registry";
// Errors
export {
	ConnectorAuthError,
	ConnectorError,
	ConnectorRateLimitError,
	ConnectorTimeoutError,
	ConnectorUnavailableError,
} from "./errors";
// Health
export { aggregateHealth } from "./health";
export type {
	DifyNeo4jResult,
	FiscalQueryRequest,
	GraphRagContext,
	OrchestratorConfig,
} from "./orchestrators/dify-neo4j";
// Orchestrators
export {
	DifyNeo4jOrchestrator,
	ORCHESTRATOR_DEFAULTS,
} from "./orchestrators/dify-neo4j";
// Types
export type {
	EcosystemConnector,
	EcosystemConnectorName,
	EcosystemDependency,
} from "./types";
export { ECOSYSTEM_CONNECTOR_NAMES, ECOSYSTEM_DEPENDENCIES } from "./types";
