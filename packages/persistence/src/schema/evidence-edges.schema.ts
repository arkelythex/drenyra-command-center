import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sireEvidenceNodes } from "./evidence-nodes.schema";

/**
 * evidence_edges — SIRE evidence provenance edge table (append-only)
 *
 * Each row represents a directed edge between two evidence nodes.
 * Rows are INSERT-only; UPDATE and DELETE are revoked from app_role at DB level.
 *
 * Columns per REQ-B-002:
 * - id: UUID primary key
 * - from_node_id: UUID FK → evidence_nodes.id
 * - to_node_id: UUID FK → evidence_nodes.id
 * - edge_type: "derived_from" | "supersedes"
 * - metadata: JSONB for extensible payload
 * - created_at: timestamp
 */
export const sireEvidenceEdges = pgTable(
	"evidence_edges",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		fromNodeId: uuid("from_node_id")
			.notNull()
			.references(() => sireEvidenceNodes.id),
		toNodeId: uuid("to_node_id")
			.notNull()
			.references(() => sireEvidenceNodes.id),
		edgeType: varchar("edge_type", { length: 50 }).notNull(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		edgeTypeIdx: index("evidence_edges_edge_type_idx").on(table.edgeType),
	}),
);
