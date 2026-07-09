import { sql } from "drizzle-orm";
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

const tsvector = customType({
	dataType() {
		return "tsvector";
	},
});
const vector = customType({
	dataType() {
		if (process.env.DISABLE_PGVECTOR === "true") {
			return "text";
		}
		return "vector(3072)";
	},
});
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
export const anomalySeverityEnum = pgEnum("anomaly_severity", [
	"low",
	"medium",
	"high",
	"critical",
]);
export const alertStatusEnum = pgEnum("alert_status", [
	"pending",
	"confirmed",
	"false_positive",
	"resolved",
]);
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
		searchVector: tsvector("search_vector").generatedAlwaysAs(
			() => sql`
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
		embedding: vector("embedding"),
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
	}),
);

