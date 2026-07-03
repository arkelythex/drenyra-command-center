import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { evidence } from "./evidence.schema";

/**
 * evidence_links — polymorphic links between evidence and business entities
 *
 * Links evidence to journal entries, threads, diffs, or agent runs.
 */
export const evidenceLinks = pgTable(
	"evidence_links",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		evidenceId: uuid("evidence_id")
			.notNull()
			.references(() => evidence.id, { onDelete: "cascade" }),
		entityType: varchar("entity_type", { length: 30 }).notNull(),
		entityId: text("entity_id").notNull(),
		relationship: varchar("relationship", { length: 20 })
			.notNull()
			.default("supporting"),
		linkedBy: text("linked_by").notNull(),
		linkedAt: timestamp("linked_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
	},
	(table) => ({
		evidenceIdIdx: index("evidence_links_evidence_id_idx").on(table.evidenceId),
		entityIdx: index("evidence_links_entity_idx").on(
			table.entityType,
			table.entityId,
		),
		uniqueLink: uniqueIndex("evidence_links_unique").on(
			table.evidenceId,
			table.entityType,
			table.entityId,
			table.relationship,
		),
	}),
);

export const evidenceLinksRelations = relations(evidenceLinks, ({ one }) => ({
	evidence: one(evidence, {
		fields: [evidenceLinks.evidenceId],
		references: [evidence.id],
	}),
}));
