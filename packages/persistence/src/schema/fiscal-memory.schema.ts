import { index, jsonb, pgTable, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import type {
	FiscalMemoryCategory,
	FiscalMemoryProps,
	FiscalMemorySeverity,
	FiscalMemoryStatus,
} from "@drenyra/domain/fiscal-memory";

export const fiscalMemories = pgTable(
	"fiscal_memories",
	{
		id: text("id").primaryKey(),
		tenantId: text("tenant_id").notNull(),
		companyId: text("company_id").notNull(),
		ruc: text("ruc").notNull(),
		period: text("period").notNull(),
		category: text("category").$type<FiscalMemoryCategory>().notNull(),
		severity: text("severity").$type<FiscalMemorySeverity>().notNull(),
		status: text("status").$type<FiscalMemoryStatus>().notNull(),
		title: text("title").notNull(),
		summary: text("summary").notNull(),
		evidenceRefs: jsonb("evidence_refs").$type<readonly string[]>().notNull(),
		tags: jsonb("tags").$type<readonly string[]>().notNull(),
		createdBy: text("created_by").notNull(),
		approvedBy: text("approved_by"),
		sourceAgentId: text("source_agent_id"),
		relatedMemoryIds: jsonb("related_memory_ids").$type<readonly string[]>().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodIdx: index("fiscal_memories_company_period_idx").on(table.companyId, table.period),
		companyCategoryIdx: index("fiscal_memories_company_category_idx").on(table.companyId, table.category),
		companySeverityIdx: index("fiscal_memories_company_severity_idx").on(table.companyId, table.severity),
		rucPeriodIdx: index("fiscal_memories_ruc_period_idx").on(table.ruc, table.period),
		statusIdx: index("fiscal_memories_status_idx").on(table.status),
		scopeIdx: index("fiscal_memories_scope_idx").on(table.tenantId, table.companyId, table.ruc),
	}),
);

export const fiscalMemoryRevisions = pgTable(
	"fiscal_memory_revisions",
	{
		id: text("id").primaryKey(),
		memoryId: text("memory_id").notNull().references(() => fiscalMemories.id),
		revisionNumber: integer("revision_number").notNull(),
		changedBy: text("changed_by").notNull(),
		changeReason: text("change_reason").notNull(),
		previousValue: jsonb("previous_value").$type<FiscalMemoryProps>().notNull(),
		nextValue: jsonb("next_value").$type<FiscalMemoryProps>().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		memoryRevisionIdx: uniqueIndex("fiscal_memory_revisions_memory_revision_idx").on(
			table.memoryId,
			table.revisionNumber,
		),
		memoryIdx: index("fiscal_memory_revisions_memory_idx").on(table.memoryId),
	}),
);

export type FiscalMemoryRow = typeof fiscalMemories.$inferSelect;
export type NewFiscalMemoryRow = typeof fiscalMemories.$inferInsert;
export type FiscalMemoryRevisionRow = typeof fiscalMemoryRevisions.$inferSelect;
export type NewFiscalMemoryRevisionRow = typeof fiscalMemoryRevisions.$inferInsert;
