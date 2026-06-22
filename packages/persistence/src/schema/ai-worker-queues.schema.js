import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar, } from "drizzle-orm/pg-core";
import { companies, users } from "./index";
export const workerTaskStatusEnum = pgEnum("worker_task_status", [
    "pending",
    "processing",
    "completed",
    "failed",
]);
export const workerTaskPriorityEnum = pgEnum("worker_task_priority", [
    "low",
    "medium",
    "high",
    "critical",
]);
export const aiWorkerQueues = pgTable("ai_worker_queues", {
    id: varchar("id", { length: 100 }).primaryKey(),
    companyId: uuid("company_id")
        .notNull()
        .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
    type: varchar("type", { length: 100 }).notNull(),
    payload: jsonb("payload").notNull().default({}),
    result: jsonb("result"),
    status: workerTaskStatusEnum("status").notNull().default("pending"),
    priority: workerTaskPriorityEnum("priority").notNull().default("medium"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    nextRetryAt: timestamp("next_retry_at"),
    error: text("error"),
    errorStack: text("error_stack"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
}, (table) => ({
    statusCreatedAtIdx: index("ai_worker_queue_status_created_idx").on(table.status, table.createdAt),
    companyStatusIdx: index("ai_worker_queue_company_status_idx").on(table.companyId, table.status),
    nextRetryAtIdx: index("ai_worker_queue_next_retry_idx").on(table.nextRetryAt),
}));
export const aiWorkerQueuesRelations = relations(aiWorkerQueues, ({ one }) => ({
    company: one(companies, {
        fields: [aiWorkerQueues.companyId],
        references: [companies.id],
    }),
    user: one(users, {
        fields: [aiWorkerQueues.userId],
        references: [users.id],
    }),
}));
//# sourceMappingURL=ai-worker-queues.schema.js.map