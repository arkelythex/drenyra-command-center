import { relations } from "drizzle-orm";
import {
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
import { journalEntries } from "./accounting.schema";
import { companies } from "./core.schema";

export const accountingPrStatus = [
	"DRAFT",
	"PENDING_REVIEW",
	"APPROVED",
	"REJECTED",
	"POSTED",
] as const;

export type AccountingPrStatus = (typeof accountingPrStatus)[number];

export interface PrSignature {
	signerId: string;
	signedAt: string;
	comment?: string;
}

export const accountingPrs = pgTable(
	"accounting_prs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),

		prNumber: integer("pr_number").notNull(),
		title: text("title").notNull(),
		description: text("description"),
		status: varchar("status", { length: 20 })
			.$type<AccountingPrStatus>()
			.default("DRAFT")
			.notNull(),

		entries: jsonb("entries").$type<string[]>().default([]).notNull(),
		evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),

		totalDebitCents: integer("total_debit_cents").default(0).notNull(),
		totalCreditCents: integer("total_credit_cents").default(0).notNull(),

		reviewerId: uuid("reviewer_id"),
		reviewedAt: timestamp("reviewed_at"),
		reviewComment: text("review_comment"),

		approveSignerIds: jsonb("approve_signer_ids")
			.$type<string[]>()
			.default([])
			.notNull(),
		approveSignatures: jsonb("approve_signatures")
			.$type<PrSignature[]>()
			.default([])
			.notNull(),

		createdById: uuid("created_by_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPrNumberIdx: uniqueIndex("accounting_prs_company_pr_number_idx").on(
			table.companyId,
			table.prNumber,
		),
		statusIdx: index("accounting_prs_status_idx").on(table.status),
		reviewerIdx: index("accounting_prs_reviewer_idx").on(table.reviewerId),
	}),
);

export const prApprovals = pgTable(
	"pr_approvals",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		prId: uuid("pr_id")
			.references(() => accountingPrs.id, { onDelete: "cascade" })
			.notNull(),
		signerId: uuid("signer_id").notNull(),
		signedAt: timestamp("signed_at").defaultNow().notNull(),
		comment: text("comment"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		prSignerIdx: index("pr_approvals_pr_signer_idx").on(
			table.prId,
			table.signerId,
		),
	}),
);

export const accountingPrsRelations = relations(accountingPrs, ({ one }) => ({
	company: one(companies, {
		fields: [accountingPrs.companyId],
		references: [companies.id],
	}),
}));

export const prApprovalsRelations = relations(prApprovals, ({ one }) => ({
	pr: one(accountingPrs, {
		fields: [prApprovals.prId],
		references: [accountingPrs.id],
	}),
}));
