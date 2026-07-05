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

// ─── ENUMS ───

export const skillCategoryEnum = [
	"fiscal",
	"finance",
	"operations",
	"audit",
] as const;
export type SkillCategory = (typeof skillCategoryEnum)[number];

export const skillStatusEnum = [
	"active",
	"deprecated",
	"experimental",
] as const;
export type SkillStatus = (typeof skillStatusEnum)[number];

export const installationStatusEnum = ["installed", "disabled"] as const;
export type InstallationStatus = (typeof installationStatusEnum)[number];

// ─── TABLES ───

/**
 * skills — global catalog of available skills
 */
export const skills = pgTable(
	"skills",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description").notNull(),
		category: varchar("category", { length: 20 })
			.$type<SkillCategory>()
			.notNull(),
		version: varchar("version", { length: 20 }).notNull().default("1.0.0"),
		author: varchar("author", { length: 255 }).notNull().default("ARKELYTHEX"),
		status: varchar("status", { length: 20 })
			.$type<SkillStatus>()
			.notNull()
			.default("active"),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		categoryIdx: index("skills_category_idx").on(table.category),
		statusIdx: index("skills_status_idx").on(table.status),
	}),
);

/**
 * skill_capabilities — individual capabilities within a skill
 */
export const skillCapabilities = pgTable(
	"skill_capabilities",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		skillId: uuid("skill_id")
			.notNull()
			.references(() => skills.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description").notNull(),
		actionType: varchar("action_type", { length: 100 }).notNull(),
		sortOrder: integer("sort_order").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		skillIdIdx: index("skill_capabilities_skill_id_idx").on(table.skillId),
	}),
);

/**
 * company_skills — per-company skill installations
 */
export const companySkills = pgTable(
	"company_skills",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.notNull()
			.references(() => companies.id, { onDelete: "cascade" }),
		skillId: uuid("skill_id")
			.notNull()
			.references(() => skills.id, { onDelete: "cascade" }),
		status: varchar("status", { length: 20 })
			.$type<InstallationStatus>()
			.notNull()
			.default("installed"),
		config: jsonb("config").$type<Record<string, unknown>>().default({}),
		installedBy: text("installed_by").notNull(),
		installedAt: timestamp("installed_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		companyIdIdx: index("company_skills_company_id_idx").on(table.companyId),
		skillIdIdx: index("company_skills_skill_id_idx").on(table.skillId),
		companySkillUnique: index("company_skills_company_skill_unique").on(
			table.companyId,
			table.skillId,
		),
	}),
);

// ─── RELATIONS ───

export const skillsRelations = relations(skills, ({ many }) => ({
	capabilities: many(skillCapabilities),
	installations: many(companySkills),
}));

export const skillCapabilitiesRelations = relations(
	skillCapabilities,
	({ one }) => ({
		skill: one(skills, {
			fields: [skillCapabilities.skillId],
			references: [skills.id],
		}),
	}),
);

export const companySkillsRelations = relations(companySkills, ({ one }) => ({
	skill: one(skills, {
		fields: [companySkills.skillId],
		references: [skills.id],
	}),
	company: one(companies, {
		fields: [companySkills.companyId],
		references: [companies.id],
	}),
}));
