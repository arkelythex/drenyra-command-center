/**
 * Bank Providers Schema
 *
 * External bank data provider connections.
 * Stores encrypted API credentials and connection state per bank account.
 */

import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const bankProviders = pgTable("bank_providers", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	bankAccountId: uuid("bank_account_id").notNull(),

	// Provider identity
	providerCode: varchar("provider_code", { length: 20 }).notNull(), // PROMETEO, MOCK

	// Credentials (AES-256-GCM encrypted at rest)
	apiCredentials: jsonb("api_credentials"),

	// Connection state
	connectionStatus: varchar("connection_status", { length: 20 })
		.default("DISCONNECTED"), // DISCONNECTED, CONNECTING, CONNECTED, ERROR

	// Feature flags (per-account granularity)
	featureFlags: jsonb("feature_flags"),

	// Sync tracking
	lastSyncAt: timestamp("last_sync_at"),
	syncError: text("sync_error"),

	// Metadata
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
