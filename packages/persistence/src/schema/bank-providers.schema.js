import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
export const bankProviders = pgTable("bank_providers", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    bankAccountId: uuid("bank_account_id").notNull(),
    providerCode: varchar("provider_code", { length: 20 }).notNull(),
    apiCredentials: jsonb("api_credentials"),
    connectionStatus: varchar("connection_status", { length: 20 })
        .default("DISCONNECTED"),
    featureFlags: jsonb("feature_flags"),
    lastSyncAt: timestamp("last_sync_at"),
    syncError: text("sync_error"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
//# sourceMappingURL=bank-providers.schema.js.map