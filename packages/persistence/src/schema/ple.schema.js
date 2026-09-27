import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid, varchar, } from "drizzle-orm/pg-core";
export const pleGenerations = pgTable("ple_generations", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    bookType: varchar("book_type", { length: 20 }).notNull(),
    period: varchar("period", { length: 7 }).notNull(),
    ruc: varchar("ruc", { length: 11 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("generated"),
    fileContent: text("file_content"),
    fileSizeBytes: integer("file_size_bytes"),
    cdrHash: varchar("cdr_hash", { length: 64 }),
    sunatResponse: jsonb("sunat_response"),
    validationErrors: jsonb("validation_errors"),
    generatedBy: uuid("generated_by"),
    generatedAt: timestamp("generated_at").defaultNow().notNull(),
    validatedAt: timestamp("validated_at"),
    filedAt: timestamp("filed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    bookPeriodRucUniq: uniqueIndex("ple_generations_book_period_ruc_uniq").on(table.companyId, table.bookType, table.period),
    companyBookPeriodIdx: index("idx_ple_generations_company_book_period").on(table.companyId, table.bookType, table.period),
    statusIdx: index("idx_ple_generations_status").on(table.status),
}));
export const pleGenerationsRelations = relations(pleGenerations, () => ({}));
//# sourceMappingURL=ple.schema.js.map