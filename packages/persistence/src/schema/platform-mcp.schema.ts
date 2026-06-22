import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import type { ArkelythexMcpAuditEvent } from "@arkelythex/domain";

export const platformMcpAuditEvents = pgTable(
	"platform_mcp_audit_events",
	{
		id: varchar("id", { length: 96 }).primaryKey(),
		operation: varchar("operation", { length: 24 })
			.$type<ArkelythexMcpAuditEvent["operation"]>()
			.notNull(),
		outcome: varchar("outcome", { length: 24 })
			.$type<ArkelythexMcpAuditEvent["outcome"]>()
			.notNull(),
		toolName: varchar("tool_name", { length: 128 }).notNull(),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 128 }).notNull(),
		period: varchar("period", { length: 7 }).notNull(),
		countryCode: varchar("country_code", { length: 2 }).default("PE").notNull(),
		actorId: varchar("actor_id", { length: 128 }).notNull(),
		redactionStatus: varchar("redaction_status", { length: 24 })
			.$type<ArkelythexMcpAuditEvent["redactionStatus"]>()
			.notNull(),
		reason: varchar("reason", { length: 64 })
			.$type<ArkelythexMcpAuditEvent["reason"]>()
			.notNull(),
		occurredAt: timestamp("occurred_at").notNull(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
		message: text("message").notNull(),
	},
	(table) => ({
		scopeIdx: index("pmcp_audit_scope_idx").on(
			table.companyId,
			table.companyRuc,
			table.period,
		),
		toolOutcomeIdx: index("pmcp_audit_tool_outcome_idx").on(
			table.toolName,
			table.outcome,
		),
	}),
);
