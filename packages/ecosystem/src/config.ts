import { z } from "zod";

/**
 * Configuration schema for all ecosystem connectors.
 * Each connector reads from environment variables prefixed by its name.
 */

export const ErpnextConfigSchema = z.object({
	url: z
		.string()
		.url()
		.describe("ERPNext server URL (e.g. https://erp.example.com)"),
	apiKey: z.string().min(1).describe("ERPNext API key"),
	apiSecret: z.string().min(1).describe("ERPNext API secret"),
	timeoutMs: z.coerce
		.number()
		.int()
		.positive()
		.default(10_000)
		.describe("Request timeout in ms"),
	pcgeMapping: z
		.record(z.string(), z.string())
		.optional()
		.describe("PCGE account code → ERPNext account name mapping"),
});

export type ErpnextConfig = z.infer<typeof ErpnextConfigSchema>;

export const DuckdbConfigSchema = z.object({
	databasePath: z
		.string()
		.default("/data/drenyra-analytics.duckdb")
		.describe("DuckDB file path"),
	pgWalConnString: z
		.string()
		.optional()
		.describe("PostgreSQL connection string for WAL replication"),
	autoRefresh: z.coerce
		.boolean()
		.default(true)
		.describe("Auto-refresh analytics views on fiscal events"),
});

export type DuckdbConfig = z.infer<typeof DuckdbConfigSchema>;

export const DoclingConfigSchema = z.object({
	endpoint: z
		.string()
		.url()
		.default("http://docling:5001")
		.describe("Docling service URL"),
	timeoutMs: z.coerce
		.number()
		.int()
		.positive()
		.default(30_000)
		.describe("Document processing timeout"),
});

export type DoclingConfig = z.infer<typeof DoclingConfigSchema>;

export const N8nConfigSchema = z.object({
	endpoint: z
		.string()
		.url()
		.default("http://n8n:5678")
		.describe("N8N webhook endpoint"),
	apiKey: z.string().optional().describe("N8N API key for workflow management"),
	webhookPrefix: z
		.string()
		.default("/webhook/")
		.describe("N8N webhook URL prefix path"),
	timeoutMs: z.coerce
		.number()
		.int()
		.positive()
		.default(30_000)
		.describe("Request timeout in ms"),
});

export type N8nConfig = z.infer<typeof N8nConfigSchema>;

export const DifyConfigSchema = z.object({
	endpoint: z
		.string()
		.url()
		.default("http://dify:5000")
		.describe("Dify API URL"),
	apiKey: z.string().min(1).describe("Dify API key"),
	timeoutMs: z.coerce
		.number()
		.int()
		.positive()
		.default(60_000)
		.describe("Agent workflow timeout"),
});

export type DifyConfig = z.infer<typeof DifyConfigSchema>;

export const Neo4jConfigSchema = z.object({
	uri: z.string().default("bolt://neo4j:7687").describe("Neo4j Bolt URI"),
	username: z.string().default("neo4j").describe("Neo4j username"),
	password: z.string().default("").describe("Neo4j password"),
});

export type Neo4jConfig = z.infer<typeof Neo4jConfigSchema>;

export const TemporalConfigSchema = z.object({
	host: z
		.string()
		.default("temporal:7233")
		.describe("Temporal server host:port"),
	namespace: z.string().default("drenyra").describe("Temporal namespace"),
	taskQueue: z
		.string()
		.default("drenyra-fiscal")
		.describe("Default task queue"),
});

export type TemporalConfig = z.infer<typeof TemporalConfigSchema>;

/**
 * Load configuration from environment variables with connector-specific prefix.
 */
export function loadConnectorConfig<T>(
	schema: z.ZodType<T>,
	prefix: string,
): T {
	const envPrefix = `DRENYRA_${prefix.toUpperCase()}_`;
	const raw: Record<string, string> = {};

	for (const key of Object.keys(process.env)) {
		if (key.startsWith(envPrefix)) {
			const configKey = key
				.slice(envPrefix.length)
				.replace(/_([a-z])/g, (_, c) => c.toLowerCase());
			raw[configKey] = process.env[key]!;
		}
	}

	return schema.parse(raw);
}
