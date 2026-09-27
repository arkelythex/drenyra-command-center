import { index, integer, pgTable, text, timestamp, uuid, } from "drizzle-orm/pg-core";
export const aiLatencyEvents = pgTable("ai_latency_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    agentType: text("agent_type").notNull(),
    modelUsed: text("model_used").notNull(),
    latencyMs: integer("latency_ms").notNull(),
    promptTokens: integer("prompt_tokens"),
    completionTokens: integer("completion_tokens"),
    status: text("status", { enum: ["success", "failure"] }).notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    companyId: uuid("company_id"),
    batchId: text("batch_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    agentTypeIdx: index("idx_latency_agent_type").on(table.agentType),
    modelIdx: index("idx_latency_model").on(table.modelUsed),
    createdAtIdx: index("idx_latency_created_at").on(table.createdAt),
    companyIdx: index("idx_latency_company").on(table.companyId),
}));
//# sourceMappingURL=ai-latency.schema.js.map