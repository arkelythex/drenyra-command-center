import {
	boolean,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";
export const userAISettings = pgTable(
	"user_ai_settings",
	{
		id: serial("id").primaryKey(),
		userId: varchar("user_id", { length: 255 }).notNull(),
		customSystemIndicator: text("custom_system_indicator"),
		isEnabled: boolean("is_enabled").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		userIdIdx: uniqueIndex("user_ai_settings_user_id_idx").on(table.userId),
	}),
);
//# sourceMappingURL=ai-settings.schema.js.map
