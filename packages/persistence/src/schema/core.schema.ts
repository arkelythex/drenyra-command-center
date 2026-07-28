/**
 * Core schema: users, companies, sessions, organizations, accounting job runs.
 * These are the foundational tables that other schemas reference.
 */

import type {
	OrganizationSettings,
	OrganizationStatus,
} from "@drenyra/domain/entities/organization";
import {
	boolean,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { accountingJobRunStatusEnum } from "./enums";

// --- ORGANIZATIONS ---
export const organizations = pgTable(
	"organizations",
	{
		id: integer("id").primaryKey(),
		name: varchar("name", { length: 255 }).notNull(),
		ruc: varchar("ruc", { length: 11 }).notNull().unique(),
		slug: varchar("slug", { length: 255 }).notNull().unique(),
		status: varchar("status", { length: 20 })
			.$type<OrganizationStatus>()
			.default("ACTIVE")
			.notNull(),
		healthScore: integer("health_score").default(0),
		settings: jsonb("settings")
			.$type<OrganizationSettings>()
			.default({})
			.notNull(),
		businessName: text("business_name"),
		isActive: boolean("is_active").default(true),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		slugIdx: index("organizations_slug_idx").on(table.slug),
		rucIdx: index("organizations_ruc_idx").on(table.ruc),
		statusIdx: index("organizations_status_idx").on(table.status),
	}),
);

// --- ORGANIZATION METRICS ---
export const organizationMetrics = pgTable(
	"organization_metrics",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		organizationId: integer("organization_id")
			.notNull()
			.references(() => organizations.id),
		periodStart: timestamp("period_start").notNull(),
		periodEnd: timestamp("period_end").notNull(),
		totalCompanies: integer("total_companies").default(0).notNull(),
		activeCompanies: integer("active_companies").default(0).notNull(),
		pendingReconciliations: integer("pending_reconciliations")
			.default(0)
			.notNull(),
		overdueDocuments: integer("overdue_documents").default(0).notNull(),
		healthPercentage: integer("health_percentage").default(0).notNull(),
		computedAt: timestamp("computed_at").defaultNow().notNull(),
	},
	(table) => ({
		orgPeriodIdx: index("org_metrics_org_period_idx").on(
			table.organizationId,
			table.periodStart,
		),
	}),
);

// --- USERS ---
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: varchar("password", { length: 255 }).notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	role: varchar("role", { length: 50 }).notNull().default("USER"),
	companyId: uuid("company_id"),
	avatarUrl: text("avatar_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- COMPANIES ---
export const companies = pgTable("companies", {
	id: uuid("id").primaryKey().defaultRandom(),
	ownerId: uuid("owner_id")
		.references(() => users.id)
		.notNull(),

	// Multi-RUC Feature: Link to Economic Group
	economicGroupId: uuid("economic_group_id"),
	isPrimary: boolean("is_primary").default(false),

	ruc: varchar("ruc", { length: 11 }).notNull().unique(),
	countryCode: varchar("country_code", { length: 2 }).default("pe").notNull(),
	businessName: varchar("business_name", { length: 255 }).notNull(),
	tradeName: varchar("trade_name", { length: 255 }),
	address: text("address"),
	logoUrl: text("logo_url"),
	isActive: boolean("is_active").default(true),

	// Settings / Preferences
	settingsLanguage: varchar("settings_language", { length: 10 }).default("es"),
	settingsTimezone: varchar("settings_timezone", { length: 50 }).default(
		"America/Lima",
	),
	settingsCurrency: varchar("settings_currency", { length: 3 }).default("PEN"),
	settingsAutoClosePeriod: boolean("settings_auto_close_period").default(true),
	settingsShowAmountsInWords: boolean("settings_show_amounts_in_words").default(
		false,
	),

	// CAP-SIRE-01 Phase C: Trust Layer — per-company SIRE configuration
	sireMaterialityThresholdPen: numeric("sire_materiality_threshold_pen", {
		precision: 18,
		scale: 2,
	}),
	sireReversibilityWindowHours: integer("sire_reversibility_window_hours")
		.default(24),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- SESSIONS ---
export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	token: varchar("token", { length: 500 }).notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

// --- ACCOUNTING JOB RUNS ---
export const accountingJobRuns = pgTable(
	"accounting_job_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		countryCode: varchar("country_code", { length: 2 }).default("pe").notNull(),
		jobId: varchar("job_id", { length: 100 }).notNull(),
		jobTitle: varchar("job_title", { length: 160 }).notNull(),
		jobCategory: varchar("job_category", { length: 50 }).notNull(),
		status: accountingJobRunStatusEnum("status").default("QUEUED").notNull(),
		approvalRequired: boolean("approval_required").default(false).notNull(),
		requestedBy: uuid("requested_by").references(() => users.id),
		approvedBy: uuid("approved_by").references(() => users.id),
		prompt: text("prompt").notNull(),
		summary: text("summary"),
		inputPayload: jsonb("input_payload")
			.$type<Record<string, unknown>>()
			.default({})
			.notNull(),
		resultPayload: jsonb("result_payload").$type<Record<string, unknown>>(),
		evidencePayload: jsonb("evidence_payload").$type<Record<string, unknown>>(),
		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyStatusIdx: index("accounting_job_runs_company_status_idx").on(
			table.companyId,
			table.status,
		),
		jobLookupIdx: index("accounting_job_runs_job_lookup_idx").on(
			table.companyId,
			table.countryCode,
			table.jobId,
		),
		createdAtIdx: index("accounting_job_runs_created_at_idx").on(
			table.createdAt,
		),
	}),
);
