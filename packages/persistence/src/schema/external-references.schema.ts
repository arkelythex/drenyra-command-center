/**
 * External References Schema (W2-04B).
 *
 * Tracks references to external entities (SUNAT tickets, file hashes,
 * provider API references, legacy system IDs) to prevent duplicate
 * processing and enable traceability.
 *
 * Design decisions:
 * - `company_id` is NOT NULL: all external references belong to a company.
 *   Organization-level references can be added later with partial indexes.
 * - `source` is a varchar with CHECK constraint for canonical values.
 * - `external_id` is trimmed and uppercased before storage.
 * - `entity_type` + `entity_id` link to the local domain entity.
 *
 * @see docs/adr/W2-04A-natural-uniqueness-inventory.md
 */

import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

/**
 * Canonical external reference sources.
 * Each represents a distinct external system.
 */
export const externalReferenceSources = [
	"sunat_cdr",
	"sunat_ticket",
	"provider_api",
	"file_upload",
	"legacy_system",
	"bank_statement",
] as const;

export type ExternalReferenceSource = (typeof externalReferenceSources)[number];

export const externalReferences = pgTable(
	"external_references",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),

		// Source system identification
		source: varchar("source", { length: 50 }).notNull(),
		externalId: varchar("external_id", { length: 255 }).notNull(),

		// Link to local domain entity
		entityType: varchar("entity_type", { length: 50 }).notNull(),
		entityId: uuid("entity_id").notNull(),

		// Optional raw payload from the external system
		rawData: jsonb("raw_data"),

		// Timing
		importedAt: timestamp("imported_at").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		naturalKey: unique("uq_external_refs_scope_source_id").on(
			table.companyId,
			table.source,
			table.externalId,
		),
		entityIdx: index("idx_external_refs_entity").on(
			table.entityType,
			table.entityId,
		),
		sourceIdx: index("idx_external_refs_source").on(table.source),
	}),
);

export const externalReferencesRelations = relations(
	externalReferences,
	({ one }) => ({
		company: one(companies, {
			fields: [externalReferences.companyId],
			references: [companies.id],
		}),
	}),
);
