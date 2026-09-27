import { integer, jsonb, pgEnum, pgTable, timestamp, unique, uuid, varchar, } from "drizzle-orm/pg-core";
export const idempotencyStatusEnum = pgEnum("idempotency_status", [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);
export const failureClassEnum = pgEnum("failure_class", [
    "RETRYABLE",
    "TERMINAL",
]);
export const idempotencyRecords = pgTable("idempotency_records", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    companyId: uuid("company_id").notNull(),
    operation: varchar("operation", { length: 100 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    status: idempotencyStatusEnum("status").notNull().default("PENDING"),
    failureCode: varchar("failure_code", { length: 100 }),
    failureClass: failureClassEnum("failure_class"),
    attemptCount: integer("attempt_count").default(1).notNull(),
    lockedAt: timestamp("locked_at"),
    processingToken: uuid("processing_token"),
    completedAt: timestamp("completed_at"),
    failedAt: timestamp("failed_at"),
    responseStatus: integer("response_status"),
    responseBody: jsonb("response_body"),
    responseHeaders: jsonb("response_headers"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    unique("uq_idempotency_scope_key").on(table.organizationId, table.companyId, table.operation, table.idempotencyKey),
]);
//# sourceMappingURL=idempotency.schema.js.map