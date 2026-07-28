import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/**
 * evidence_nodes — SIRE evidence provenance table (append-only)
 *
 * Each row represents a derived artifact node in the SIRE hash chain.
 * Rows are INSERT-only; UPDATE and DELETE are revoked from app_role at DB level.
 *
 * Columns per REQ-B-001:
 * - id: UUID primary key
 * - type: "DerivedArtifact" (extensible for future node types)
 * - artifact_id: varchar reference to the source artifact
 * - period: fiscal period in "YYYY-MM" format
 * - company_id: UUID referencing companies.id
 * - hash: SHA-256 hex digest (64 chars)
 * - previous_hash: SHA-256 of previous node in chain (nullable for genesis)
 * - metadata: JSONB for extensible payload
 * - created_at: timestamp
 */
export const sireEvidenceNodes = pgTable(
	"evidence_nodes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		type: varchar("type", { length: 50 }).notNull(),
		artifactId: varchar("artifact_id", { length: 255 }),
		period: varchar("period", { length: 7 }).notNull(),
		companyId: uuid("company_id").notNull(),
		hash: varchar("hash", { length: 64 }).notNull(),
		previousHash: varchar("previous_hash", { length: 64 }),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodIdx: index("evidence_nodes_company_period_idx").on(
			table.companyId,
			table.period,
		),
	}),
);
