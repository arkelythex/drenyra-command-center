import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

export const closeStatusEnum = [
	"PENDING",
	"IN_PROGRESS",
	"COMPLETED",
	"VERIFIED",
	"LOCKED",
] as const;
export type CloseStatus = (typeof closeStatusEnum)[number];

export const closeItemStatusEnum = [
	"PENDING",
	"IN_PROGRESS",
	"COMPLETED",
	"WAIVED",
] as const;
export type CloseItemStatus = (typeof closeItemStatusEnum)[number];

export const checklistCategoryEnum = [
	"bank_reconciliation",
	"depreciation",
	"tax_provision",
	"accrual",
	"deferral",
	"inventory",
	"intercompany",
	"other",
] as const;
export type ChecklistCategory = (typeof checklistCategoryEnum)[number];

export const gateTypeEnum = [
	"open_prs",
	"unverified_evidence",
	"bank_not_reconciled",
	"missing_depreciation",
	"pending_tax",
	"prior_period_unlocked",
] as const;
export type GateType = (typeof gateTypeEnum)[number];

export const gateStatusEnum = ["OPEN", "PASSED", "FAILED", "WAIVED"] as const;
export type GateStatus = (typeof gateStatusEnum)[number];

export const closeChecklists = pgTable(
	"close_checklists",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		period: varchar("period", { length: 7 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		status: varchar("status", { length: 20 })
			.$type<CloseStatus>()
			.default("PENDING")
			.notNull(),
		assignedToId: uuid("assigned_to_id"),
		progress: integer("progress").default(0).notNull(),
		dueDate: timestamp("due_date"),
		completedAt: timestamp("completed_at"),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodNameIdx: uniqueIndex(
			"close_checklists_company_period_name_unq",
		).on(table.companyId, table.period, table.name),
		companyPeriodIdx: index("close_checklists_company_period_idx").on(
			table.companyId,
			table.period,
		),
		statusIdx: index("close_checklists_status_idx").on(table.status),
		assignedToIdx: index("close_checklists_assigned_to_idx").on(
			table.assignedToId,
		),
	}),
);

export const closeChecklistItems = pgTable(
	"close_checklist_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		checklistId: uuid("checklist_id")
			.references(() => closeChecklists.id, { onDelete: "cascade" })
			.notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		category: varchar("category", { length: 30 })
			.$type<ChecklistCategory>()
			.notNull(),
		status: varchar("status", { length: 20 })
			.$type<CloseItemStatus>()
			.default("PENDING")
			.notNull(),
		assignedToId: uuid("assigned_to_id"),
		completedAt: timestamp("completed_at"),
		completedById: uuid("completed_by_id"),
		notes: text("notes"),
		evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]),
		sortOrder: integer("sort_order").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		checklistOrderIdx: index("close_checklist_items_checklist_order_idx").on(
			table.checklistId,
			table.sortOrder,
		),
		checklistIdIdx: index("close_checklist_items_checklist_id_idx").on(
			table.checklistId,
		),
		statusIdx: index("close_checklist_items_status_idx").on(table.status),
		categoryIdx: index("close_checklist_items_category_idx").on(table.category),
	}),
);

export const closeGates = pgTable(
	"close_gates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		period: varchar("period", { length: 7 }).notNull(),
		gateType: varchar("gate_type", { length: 30 }).$type<GateType>().notNull(),
		status: varchar("status", { length: 20 })
			.$type<GateStatus>()
			.default("OPEN")
			.notNull(),
		description: text("description"),
		resolution: text("resolution"),
		overrideById: uuid("override_by_id"),
		overriddenAt: timestamp("overridden_at"),
		readOnly: boolean("read_only").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodGateIdx: uniqueIndex("close_gates_company_period_gate_unq").on(
			table.companyId,
			table.period,
			table.gateType,
		),
		companyPeriodIdx: index("close_gates_company_period_idx").on(
			table.companyId,
			table.period,
		),
		statusIdx: index("close_gates_status_idx").on(table.status),
	}),
);

export const closeChecklistsRelations = relations(
	closeChecklists,
	({ one, many }) => ({
		company: one(companies, {
			fields: [closeChecklists.companyId],
			references: [companies.id],
		}),
		items: many(closeChecklistItems),
	}),
);

export const closeChecklistItemsRelations = relations(
	closeChecklistItems,
	({ one }) => ({
		checklist: one(closeChecklists, {
			fields: [closeChecklistItems.checklistId],
			references: [closeChecklists.id],
		}),
	}),
);

export const closeGatesRelations = relations(closeGates, ({ one }) => ({
	company: one(companies, {
		fields: [closeGates.companyId],
		references: [companies.id],
	}),
}));
