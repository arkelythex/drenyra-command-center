import {
	boolean,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

export const commTemplates = pgTable("comm_templates", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id")
		.notNull()
		.references(() => companies.id),
	name: varchar("name", { length: 255 }).notNull(),
	channel: varchar("channel", { length: 50 }).notNull(),
	subject: text("subject"),
	body: text("body").notNull(),
	variables: jsonb("variables").default([]),
	category: varchar("category", { length: 100 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commHistory = pgTable("comm_history", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id")
		.notNull()
		.references(() => companies.id),
	templateId: uuid("template_id"),
	clientId: uuid("client_id"),
	channel: varchar("channel", { length: 50 }).notNull(),
	recipient: varchar("recipient", { length: 255 }).notNull(),
	subject: text("subject"),
	body: text("body").notNull(),
	status: varchar("status", { length: 50 }).notNull().default("queued"),
	sentAt: timestamp("sent_at"),
	deliveredAt: timestamp("delivered_at"),
	readAt: timestamp("read_at"),
	errorMessage: text("error_message"),
	metadata: jsonb("metadata").default({}),
	createdById: uuid("created_by_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commAutomations = pgTable("comm_automations", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id")
		.notNull()
		.references(() => companies.id),
	name: varchar("name", { length: 255 }).notNull(),
	trigger: varchar("trigger", { length: 100 }).notNull(),
	config: jsonb("config").default({}),
	enabled: boolean("enabled").default(true),
	lastRunAt: timestamp("last_run_at"),
	nextRunAt: timestamp("next_run_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
