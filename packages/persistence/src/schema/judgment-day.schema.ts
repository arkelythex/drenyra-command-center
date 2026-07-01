import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

export const auditReviewStatuses = [
	"PENDING",
	"IN_PROGRESS",
	"PASSED",
	"FAILED",
	"NEEDS_REVIEW",
] as const;

export type AuditReviewStatus = (typeof auditReviewStatuses)[number];

export const findingSeverities = [
	"CRITICAL",
	"HIGH",
	"MEDIUM",
	"LOW",
	"INFO",
] as const;

export type FindingSeverity = (typeof findingSeverities)[number];

export const findingCategories = [
	"COMPLIANCE",
	"DUPLICATE",
	"AMOUNT_MISMATCH",
	"MISSING_EVIDENCE",
	"TIMING",
	"CLASSIFICATION",
] as const;

export type FindingCategory = (typeof findingCategories)[number];

export const findingStatuses = [
	"OPEN",
	"ACKNOWLEDGED",
	"RESOLVED",
	"WAIVED",
] as const;

export type FindingStatus = (typeof findingStatuses)[number];

export const auditReviews = pgTable(
	"audit_reviews",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),

		targetType: varchar("target_type", { length: 30 }).notNull(),
		targetId: uuid("target_id").notNull(),
		status: varchar("status", { length: 20 })
			.$type<AuditReviewStatus>()
			.default("PENDING")
			.notNull(),

		riskScore: integer("risk_score").default(0).notNull(),

		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
		reviewedById: uuid("reviewed_by_id"),
		notes: text("notes"),

		createdById: uuid("created_by_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyTargetIdx: index("audit_reviews_company_target_idx").on(
			table.companyId,
			table.targetType,
			table.targetId,
		),
		statusIdx: index("audit_reviews_status_idx").on(table.status),
	}),
);

export const auditFindings = pgTable(
	"audit_findings",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		reviewId: uuid("review_id")
			.references(() => auditReviews.id, { onDelete: "cascade" })
			.notNull(),

		severity: varchar("severity", { length: 10 })
			.$type<FindingSeverity>()
			.notNull(),
		category: varchar("category", { length: 20 })
			.$type<FindingCategory>()
			.notNull(),

		description: text("description").notNull(),
		details: jsonb("details").$type<Record<string, unknown>>().default({}),

		ruleId: uuid("rule_id"),
		automated: integer("automated").default(1).notNull(),

		status: varchar("status", { length: 15 })
			.$type<FindingStatus>()
			.default("OPEN")
			.notNull(),

		resolvedById: uuid("resolved_by_id"),
		resolvedAt: timestamp("resolved_at"),
		resolutionComment: text("resolution_comment"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		reviewIdx: index("audit_findings_review_idx").on(table.reviewId),
		severityIdx: index("audit_findings_severity_idx").on(table.severity),
		statusIdx: index("audit_findings_status_idx").on(table.status),
	}),
);

export const auditRules = pgTable(
	"audit_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),

		name: varchar("name", { length: 100 }).notNull(),
		category: varchar("category", { length: 20 })
			.$type<FindingCategory>()
			.notNull(),
		severity: varchar("severity", { length: 10 })
			.$type<FindingSeverity>()
			.notNull(),
		condition: jsonb("condition").$type<Record<string, unknown>>().notNull(),

		enabled: integer("enabled").default(1).notNull(),

		createdById: uuid("created_by_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyCategoryIdx: index("audit_rules_company_category_idx").on(
			table.companyId,
			table.category,
		),
	}),
);

export const auditReviewsRelations = relations(
	auditReviews,
	({ one, many }) => ({
		company: one(companies, {
			fields: [auditReviews.companyId],
			references: [companies.id],
		}),
		findings: many(auditFindings),
	}),
);

export const auditFindingsRelations = relations(auditFindings, ({ one }) => ({
	review: one(auditReviews, {
		fields: [auditFindings.reviewId],
		references: [auditReviews.id],
	}),
}));

export const auditRulesRelations = relations(auditRules, ({ one }) => ({
	company: one(companies, {
		fields: [auditRules.companyId],
		references: [companies.id],
	}),
}));
