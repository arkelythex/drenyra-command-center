import { type SQL, sql } from "drizzle-orm";
import {
	boolean,
	customType,
	date,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

/**
 * Custom type for pgvector embedding column.
 * Uses vector(3072) for text-embedding-3-large model.
 * Fallback to text for environments without pgvector (e.g., dev without extension).
 */
const vector = customType<{ data: number[] }>({
	dataType() {
		if (process.env.DISABLE_PGVECTOR === "true") {
			return "text";
		}
		return "vector(3072)";
	},
});

/**
 * Auxiliary operational tables that still back cross-cutting services.
 *
 * These definitions are exposed through the modular schema barrel so callers
 * no longer need to reach into the legacy schema module directly.
 *
 * `organizationId` remains an integer here because the persisted table was
 * introduced in the legacy schema with that shape. We intentionally avoid
 * adding a foreign-key reference in this declaration to keep the type surface
 * compatible while we phase out the old organization model.
 * @example
 * ```ts
 * console.log(aiCostEvents);
 * ```
 */

export const aiCostEvents = pgTable(
	"ai_cost_events",
	{
		id: text("id").primaryKey(),
		organizationId: integer("organization_id"),
		agentType: varchar("agent_type", { length: 100 }).notNull(),
		modelUsed: varchar("model_used", { length: 100 }).notNull(),
		taskId: varchar("task_id", { length: 100 }),
		promptTokens: integer("prompt_tokens").notNull().default(0),
		completionTokens: integer("completion_tokens").notNull().default(0),
		totalTokens: integer("total_tokens").notNull().default(0),
		costUsd: decimal("cost_usd", { precision: 12, scale: 8 }).notNull(),
		wasBlocked: boolean("was_blocked").notNull().default(false),
		blockReason: text("block_reason"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		createdAtIdx: index("ai_cost_events_created_at_idx").on(table.createdAt),
		agentTypeIdx: index("ai_cost_events_agent_type_idx").on(table.agentType),
		orgIdIdx: index("ai_cost_events_org_id_idx").on(table.organizationId),
	}),
);

/**
 * AiCostEvent type.
 *
 * @example
 * ```ts
 * const value: AiCostEvent = {} as AiCostEvent;
 * console.log(value);
 * ```
 */
export type AiCostEvent = typeof aiCostEvents.$inferSelect;
/**
 * NewAiCostEvent type.
 *
 * @example
 * ```ts
 * const value: NewAiCostEvent = {} as NewAiCostEvent;
 * console.log(value);
 * ```
 */
export type NewAiCostEvent = typeof aiCostEvents.$inferInsert;

/**
 * anomalySeverityEnum const.
 *
 * @example
 * ```ts
 * console.log(anomalySeverityEnum);
 * ```
 */
export const anomalySeverityEnum = pgEnum("anomaly_severity", [
	"low",
	"medium",
	"high",
	"critical",
]);

/**
 * alertStatusEnum const.
 *
 * @example
 * ```ts
 * console.log(alertStatusEnum);
 * ```
 */
export const alertStatusEnum = pgEnum("alert_status", [
	"pending",
	"confirmed",
	"false_positive",
	"resolved",
]);

/**
 * anomalyAlerts const.
 *
 * @example
 * ```ts
 * console.log(anomalyAlerts);
 * ```
 */
export const anomalyAlerts = pgTable("anomaly_alerts", {
	id: text("id").primaryKey(),
	organizationId: integer("organization_id").notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: text("entity_id").notNull(),
	alertType: varchar("alert_type", { length: 100 }).notNull(),
	severity: anomalySeverityEnum("severity").notNull(),
	status: alertStatusEnum("status").notNull().default("pending"),
	detectorAgentId: varchar("detector_agent_id", { length: 50 }).notNull(),
	detectorConfidence: decimal("detector_confidence", {
		precision: 3,
		scale: 2,
	}).notNull(),
	lectorConfidence: decimal("lector_confidence", { precision: 3, scale: 2 }),
	lectorReasoning: text("lector_reasoning"),
	validadorConfidence: decimal("validador_confidence", {
		precision: 3,
		scale: 2,
	}),
	validadorReasoning: text("validador_reasoning"),
	swarmConsensusThreshold: decimal("swarm_consensus_threshold", {
		precision: 3,
		scale: 2,
	})
		.notNull()
		.default("0.82"),
	swarmConsensusScore: decimal("swarm_consensus_score", {
		precision: 3,
		scale: 2,
	}),
	isFalsePositive: boolean("is_false_positive").default(false),
	falsePositiveReason: text("false_positive_reason"),
	resolvedBy: text("resolved_by"),
	resolvedAt: timestamp("resolved_at"),
	alertReasoning: text("alert_reasoning").notNull(),
	alertContext: jsonb("alert_context"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * AnomalyAlert type.
 *
 * @example
 * ```ts
 * const value: AnomalyAlert = {} as AnomalyAlert;
 * console.log(value);
 * ```
 */
export type AnomalyAlert = typeof anomalyAlerts.$inferSelect;
/**
 * NewAnomalyAlert type.
 *
 * @example
 * ```ts
 * const value: NewAnomalyAlert = {} as NewAnomalyAlert;
 * console.log(value);
 * ```
 */
export type NewAnomalyAlert = typeof anomalyAlerts.$inferInsert;

/**
 * sunatKnowledgeChunks const.
 *
 * @example
 * ```ts
 * console.log(sunatKnowledgeChunks);
 * ```
 */
export const sunatKnowledgeChunks = pgTable(
	"sunat_knowledge_chunks",
	{
		id: text("id").primaryKey(),
		source: text("source").notNull(),
		documentType: text("document_type").notNull(),
		title: text("title").notNull(),
		content: text("content").notNull(),
		category: text("category").notNull(),
		section: text("section"),
		effectiveDate: date("effective_date"),
		// Public SUNAT knowledge has no tenant/company/RUC owner; this generated SQL builds search text only.
		searchVector: tsvector("search_vector").generatedAlwaysAs(
			(): SQL => sql`
        to_tsvector(
          'spanish',
          coalesce(${sunatKnowledgeChunks.title}, '') || ' ' ||
          coalesce(${sunatKnowledgeChunks.content}, '') || ' ' ||
          coalesce(${sunatKnowledgeChunks.category}, '') || ' ' ||
          coalesce(${sunatKnowledgeChunks.source}, '') || ' ' ||
          coalesce(${sunatKnowledgeChunks.section}, '')
        )
      `,
		),
		// Vector embedding for semantic search (text-embedding-3-large = 3072 dimensions)
		embedding: vector("embedding"),
		// Model used to generate the embedding
		embeddingModel: varchar("embedding_model", { length: 100 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		categoryIdx: index("sunat_knowledge_category_idx").on(table.category),
		categoryDateIdx: index("sunat_knowledge_category_date_idx").on(
			table.category,
			table.effectiveDate.desc().nullsLast(),
		),
		ftsGinIdx: index("sunat_knowledge_fts_gin_idx").using(
			"gin",
			table.searchVector,
		),
		sourceIdx: index("sunat_knowledge_source_idx").on(table.source),
		// HNSW index temporarily disabled - requires pgvector 0.8+ with hnsw operator class
		// embeddingIdx: index("sunat_knowledge_embedding_idx")
		// 	.using("hnsw", table.embedding),
	}),
);

/**
 * SunatKnowledgeChunk type.
 *
 * @example
 * ```ts
 * const value: SunatKnowledgeChunk = {} as SunatKnowledgeChunk;
 * console.log(value);
 * ```
 */
export type SunatKnowledgeChunk = typeof sunatKnowledgeChunks.$inferSelect;
/**
 * NewSunatKnowledgeChunk type.
 *
 * @example
 * ```ts
 * const value: NewSunatKnowledgeChunk = {} as NewSunatKnowledgeChunk;
 * console.log(value);
 * ```
 */
export type NewSunatKnowledgeChunk = typeof sunatKnowledgeChunks.$inferInsert;
