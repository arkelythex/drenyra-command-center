import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, unique, uuid, varchar, } from "drizzle-orm/pg-core";
import { companies } from "./core.schema";
export const externalReferenceSources = [
    "sunat_cdr",
    "sunat_ticket",
    "provider_api",
    "file_upload",
    "legacy_system",
    "bank_statement",
];
export const externalReferences = pgTable("external_references", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
        .references(() => companies.id)
        .notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    rawData: jsonb("raw_data"),
    importedAt: timestamp("imported_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    naturalKey: unique("uq_external_refs_scope_source_id").on(table.companyId, table.source, table.externalId),
    entityIdx: index("idx_external_refs_entity").on(table.entityType, table.entityId),
    sourceIdx: index("idx_external_refs_source").on(table.source),
}));
export const externalReferencesRelations = relations(externalReferences, ({ one }) => ({
    company: one(companies, {
        fields: [externalReferences.companyId],
        references: [companies.id],
    }),
}));
//# sourceMappingURL=external-references.schema.js.map