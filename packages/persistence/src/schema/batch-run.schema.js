import { index, integer, pgTable, text, timestamp, uuid, } from "drizzle-orm/pg-core";
export const batchRuns = pgTable("batch_runs", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    status: text("status", {
        enum: [
            "pending",
            "running",
            "completed",
            "failed",
            "partial",
            "cancelled",
        ],
    })
        .notNull()
        .default("pending"),
    total: integer("total").notNull().default(0),
    completed: integer("completed").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => ({
    companyIdx: index("idx_batch_runs_company").on(table.companyId),
    statusIdx: index("idx_batch_runs_status").on(table.status),
}));
export const batchRunItems = pgTable("batch_run_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batch_id")
        .notNull()
        .references(() => batchRuns.id, { onDelete: "cascade" }),
    runId: text("run_id"),
    sessionId: text("session_id"),
    status: text("status", {
        enum: ["pending", "running", "completed", "failed", "cancelled"],
    })
        .notNull()
        .default("pending"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => ({
    batchIdx: index("idx_batch_items_batch").on(table.batchId),
    statusIdx: index("idx_batch_items_status").on(table.status),
}));
//# sourceMappingURL=batch-run.schema.js.map