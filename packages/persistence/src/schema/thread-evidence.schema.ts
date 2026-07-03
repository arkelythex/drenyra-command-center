import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { evidence } from "./evidence.schema";
import { threads } from "./threads.schema";

export const threadEvidence = pgTable(
	"thread_evidence",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		threadId: uuid("thread_id")
			.references(() => threads.id, { onDelete: "cascade" })
			.notNull(),
		evidenceId: uuid("evidence_id")
			.references(() => evidence.id)
			.notNull(),

		linkedBy: uuid("linked_by"),
		linkedAt: timestamp("linked_at").defaultNow().notNull(),
		note: text("note"),
	},
	(table) => ({
		threadEvidenceUniqueIdx: uniqueIndex(
			"idx_thread_evidence_thread_evidence_unique",
		).on(table.threadId, table.evidenceId),
		threadIdIdx: index("idx_thread_evidence_thread_id").on(table.threadId),
		evidenceIdIdx: index("idx_thread_evidence_evidence_id").on(
			table.evidenceId,
		),
	}),
);

export const threadEvidenceRelations = relations(threadEvidence, ({ one }) => ({
	thread: one(threads, {
		fields: [threadEvidence.threadId],
		references: [threads.id],
	}),
	evidence: one(evidence, {
		fields: [threadEvidence.evidenceId],
		references: [evidence.id],
	}),
}));
