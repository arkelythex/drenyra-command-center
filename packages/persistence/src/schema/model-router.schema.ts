import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const modelRegistrations = pgTable(
	"model_registrations",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		providerName: varchar("provider_name", { length: 50 }).notNull(),
		modelName: varchar("model_name", { length: 200 }).notNull(),
		displayName: varchar("display_name", { length: 200 }).notNull(),
		capabilities: varchar("capabilities", { length: 50 }).array().notNull(),
		status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
		priority: integer("priority").notNull().default(100),
		costPer1KInput: integer("cost_per_1k_input").notNull(),
		costPer1KOutput: integer("cost_per_1k_output").notNull(),
		maxTokens: integer("max_tokens").notNull().default(8192),
		avgLatencyMs: integer("avg_latency_ms"),
		reliability: real("reliability"),
		metadata: jsonb("metadata"),
		healthProbeUrl: varchar("health_probe_url", { length: 500 }),
		tags: varchar("tags", { length: 50 }).array(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		providerModelUnique: unique("uq_model_registrations_provider_model").on(
			table.providerName,
			table.modelName,
		),
		capabilitiesIdx: index("idx_model_registrations_capabilities").using(
			"gin",
			table.capabilities,
		),
	}),
);

export const capabilityRoutingRules = pgTable(
	"capability_routing_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		capability: varchar("capability", { length: 50 }).notNull(),
		strategy: varchar("strategy", { length: 50 })
			.notNull()
			.default("capability_match"),
		allowedModelIds: uuid("allowed_model_ids").array(),
		excludedModelIds: uuid("excluded_model_ids").array(),
		maxRetries: integer("max_retries").notNull().default(2),
		costCapCents: integer("cost_cap_cents"),
		latencyCapMs: integer("latency_cap_ms"),
		minReliability: real("min_reliability"),
		requiresAudit: boolean("requires_audit").notNull().default(false),
		fallbackStrategy: varchar("fallback_strategy", { length: 50 }).default(
			"fallback_chain",
		),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		capabilityUnique: unique("uq_capability_routing_rules_capability").on(
			table.capability,
		),
	}),
);

export const routingAuditLog = pgTable(
	"routing_audit_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		requestId: varchar("request_id", { length: 100 }).notNull(),
		capability: varchar("capability", { length: 50 }).notNull(),
		selectedModelId: uuid("selected_model_id").references(
			() => modelRegistrations.id,
		),
		providerName: varchar("provider_name", { length: 50 }).notNull(),
		modelName: varchar("model_name", { length: 200 }).notNull(),
		strategyUsed: varchar("strategy_used", { length: 50 }).notNull(),
		latencyMs: integer("latency_ms"),
		costCents: integer("cost_cents"),
		success: boolean("success").notNull(),
		fallbackAttempted: boolean("fallback_attempted").default(false),
		attemptNumber: integer("attempt_number").default(1),
		errorMessage: text("error_message"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		requestIdIdx: index("idx_routing_audit_request_id").on(table.requestId),
		capabilityCreatedAtIdx: index("idx_routing_audit_capability_created_at").on(
			table.capability,
			table.createdAt.desc(),
		),
		modelIdIdx: index("idx_routing_audit_selected_model").on(
			table.selectedModelId,
		),
	}),
);

export const routingAuditLogRelations = relations(
	routingAuditLog,
	({ one }) => ({
		selectedModel: one(modelRegistrations, {
			fields: [routingAuditLog.selectedModelId],
			references: [modelRegistrations.id],
		}),
	}),
);
