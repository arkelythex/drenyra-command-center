import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { accountingJobRunStatusEnum } from "./enums";
export const organizations = pgTable("organizations", {
	id: integer("id").primaryKey(),
	ruc: varchar("ruc", { length: 11 }).notNull(),
	businessName: text("business_name").notNull(),
});
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
export const companies = pgTable("companies", {
	id: uuid("id").primaryKey().defaultRandom(),
	ownerId: uuid("owner_id")
		.references(() => users.id)
		.notNull(),
	economicGroupId: uuid("economic_group_id"),
	isPrimary: boolean("is_primary").default(false),
	ruc: varchar("ruc", { length: 11 }).notNull().unique(),
	countryCode: varchar("country_code", { length: 2 }).default("pe").notNull(),
	businessName: varchar("business_name", { length: 255 }).notNull(),
	tradeName: varchar("trade_name", { length: 255 }),
	address: text("address"),
	logoUrl: text("logo_url"),
	isActive: boolean("is_active").default(true),
	settingsLanguage: varchar("settings_language", { length: 10 }).default("es"),
	settingsTimezone: varchar("settings_timezone", { length: 50 }).default(
		"America/Lima",
	),
	settingsCurrency: varchar("settings_currency", { length: 3 }).default("PEN"),
	settingsAutoClosePeriod: boolean("settings_auto_close_period").default(true),
	settingsShowAmountsInWords: boolean("settings_show_amounts_in_words").default(
		false,
	),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: uuid("user_id")
		.references(() => users.id)
		.notNull(),
	token: varchar("token", { length: 500 }).notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});
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
		inputPayload: jsonb("input_payload").$type().default({}).notNull(),
		resultPayload: jsonb("result_payload").$type(),
		evidencePayload: jsonb("evidence_payload").$type(),
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
//# sourceMappingURL=core.schema.js.map
