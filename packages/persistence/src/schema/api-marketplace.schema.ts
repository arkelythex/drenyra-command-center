import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

export const integrationProviderEnum = [
	"stripe",
	"sunat",
	"banco",
	"tributar",
] as const;
export type IntegrationProvider = (typeof integrationProviderEnum)[number];

export const integrationCategoryEnum = [
	"payments",
	"tax",
	"banking",
	"accounting",
	"other",
] as const;
export type IntegrationCategory = (typeof integrationCategoryEnum)[number];

export const connectionStatusEnum = ["active", "error", "expired"] as const;
export type ConnectionStatus = (typeof connectionStatusEnum)[number];

export interface IntegrationConfigSchema {
	type: "object";
	properties: Record<
		string,
		{
			type: string;
			title: string;
			description?: string;
			format?: string;
			secret?: boolean;
		}
	>;
	required: string[];
}

export const marketplaceIntegrations = pgTable(
	"marketplace_integrations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		provider: varchar("provider", { length: 50 })
			.$type<IntegrationProvider>()
			.notNull(),
		category: varchar("category", { length: 50 })
			.$type<IntegrationCategory>()
			.notNull(),
		description: text("description"),
		logo: varchar("logo", { length: 500 }),
		isInstalled: boolean("is_installed").default(false).notNull(),
		installedAt: timestamp("installed_at"),
		configSchema: jsonb("config_schema").$type<IntegrationConfigSchema>(),
		version: varchar("version", { length: 20 }).default("1.0.0").notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		providerNameIdx: uniqueIndex("mkt_integrations_provider_name_idx").on(
			table.provider,
			table.name,
		),
		categoryIdx: index("mkt_integrations_category_idx").on(table.category),
		isInstalledIdx: index("mkt_integrations_installed_idx").on(
			table.isInstalled,
		),
	}),
);

export const integrationConnections = pgTable(
	"integration_connections",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		integrationId: uuid("integration_id")
			.references(() => marketplaceIntegrations.id)
			.notNull(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		config: jsonb("config").$type<Record<string, unknown>>(),
		status: varchar("status", { length: 20 })
			.$type<ConnectionStatus>()
			.default("active")
			.notNull(),
		lastTestedAt: timestamp("last_tested_at"),
		lastError: text("last_error"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyIntegrationIdx: index("mkt_connections_company_integration_idx").on(
			table.companyId,
			table.integrationId,
		),
		statusIdx: index("mkt_connections_status_idx").on(table.status),
	}),
);

export const integrationWebhooks = pgTable(
	"integration_webhooks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		connectionId: uuid("connection_id")
			.references(() => integrationConnections.id, {
				onDelete: "cascade",
			})
			.notNull(),
		eventType: varchar("event_type", { length: 100 }).notNull(),
		endpointUrl: varchar("endpoint_url", { length: 1000 }).notNull(),
		secret: varchar("secret", { length: 500 }),
		isActive: boolean("is_active").default(true).notNull(),
		lastTriggeredAt: timestamp("last_triggered_at"),
		lastResponseStatus: varchar("last_response_status", { length: 20 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		connectionIdx: index("mkt_webhooks_connection_idx").on(table.connectionId),
		eventTypeIdx: index("mkt_webhooks_event_type_idx").on(table.eventType),
	}),
);

export const marketplaceIntegrationsRelations = relations(
	marketplaceIntegrations,
	({ many }) => ({
		connections: many(integrationConnections),
	}),
);

export const integrationConnectionsRelations = relations(
	integrationConnections,
	({ one, many }) => ({
		integration: one(marketplaceIntegrations, {
			fields: [integrationConnections.integrationId],
			references: [marketplaceIntegrations.id],
		}),
		company: one(companies, {
			fields: [integrationConnections.companyId],
			references: [companies.id],
		}),
		webhooks: many(integrationWebhooks),
	}),
);

export const integrationWebhooksRelations = relations(
	integrationWebhooks,
	({ one }) => ({
		connection: one(integrationConnections, {
			fields: [integrationWebhooks.connectionId],
			references: [integrationConnections.id],
		}),
	}),
);
