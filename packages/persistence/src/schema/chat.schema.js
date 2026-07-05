import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies, users } from "./core.schema";
export const chatSessions = pgTable(
	"chat_sessions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("userId")
			.references(() => users.id, { onDelete: "cascade" })
			.notNull(),
		companyId: uuid("company_id").references(() => companies.id),
		title: varchar("title", { length: 255 }).default("New Chat"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: index("userId_idx").on(table.userId),
	}),
);
export const messages = pgTable(
	"messages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: uuid("sessionId")
			.references(() => chatSessions.id, { onDelete: "cascade" })
			.notNull(),
		role: varchar("role", { length: 20 }).notNull(),
		content: text("content").notNull(),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		sessionIdIdx: index("sessionId_idx").on(table.sessionId),
		createdAtIdx: index("createdAt_idx").on(table.createdAt),
	}),
);
export const chatSessionsRelations = relations(
	chatSessions,
	({ one, many }) => ({
		user: one(users, { fields: [chatSessions.userId], references: [users.id] }),
		company: one(companies, {
			fields: [chatSessions.companyId],
			references: [companies.id],
		}),
		messages: many(messages),
	}),
);
export const messagesRelations = relations(messages, ({ one }) => ({
	session: one(chatSessions, {
		fields: [messages.sessionId],
		references: [chatSessions.id],
	}),
}));
//# sourceMappingURL=chat.schema.js.map
