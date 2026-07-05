/**
 * AI Control Plane Schema
 *
 * Core schema for the AI Control Plane — governance, tools, agents, and trace evidence.
 *
 * Tables:
 * - ai_tools: Registered AI tools with risk tier and approval requirements
 * - ai_agents: Registered AI agents with capabilities and scope
 * - ai_trace_evidence: Audit trail for AI decisions and policy evaluations
 */

import {
	boolean,
	index,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ============================================================================
// AI TOOLS
// ============================================================================

export const aiTools = pgTable(
	"ai_tools",
	{
		id: serial("id").primaryKey(),
		name: text("name").notNull().unique(),
		description: text("description"),
		riskTier: varchar("risk_tier", { length: 2 }).notNull(), // T0, T1, T2, T3, T4
		inputSchema: jsonb("input_schema"),
		outputSchema: jsonb("output_schema"),
		requiresApproval: boolean("requires_approval").default(false).notNull(),
		fiscalImpact: boolean("fiscal_impact").default(false).notNull(),
		approvalLevel: varchar("approval_level", { length: 20 }).default("auto"),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		riskTierIdx: index("ai_tools_risk_tier_idx").on(table.riskTier),
		nameIdx: index("ai_tools_name_idx").on(table.name),
	}),
);

// ============================================================================
// AI AGENTS
// ============================================================================

export const aiAgents = pgTable(
	"ai_agents",
	{
		agentId: text("agent_id").primaryKey(),
		purpose: text("purpose"),
		tenantId: text("tenant_id"),
		organizationId: text("organization_id"),
		companyId: text("company_id"),
		ruc: text("ruc"),
		capabilities: text("capabilities").array(),
		allowedTools: text("allowed_tools").array(),
		approvalClass: varchar("approval_class", { length: 30 }).notNull(),
		supportedSurfaces: text("supported_surfaces").array(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		scopeIdx: index("ai_agents_scope_idx").on(
			table.tenantId,
			table.organizationId,
			table.companyId,
			table.ruc,
		),
		capabilitiesIdx: index("ai_agents_capabilities_idx").on(table.capabilities),
		activeIdx: index("ai_agents_active_idx").on(table.isActive),
	}),
);

// ============================================================================
// AI TRACE EVIDENCE
// ============================================================================

export const aiTraceEvidence = pgTable(
	"ai_trace_evidence",
	{
		id: serial("id").primaryKey(),
		traceId: text("trace_id").notNull(),
		agentId: text("agent_id"),
		decision: varchar("decision", { length: 20 }).notNull(),
		policyResult: jsonb("policy_result"),
		tenantScope: jsonb("tenant_scope"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at"),
	},
	(table) => ({
		traceIdIdx: index("ai_trace_evidence_trace_id_idx").on(table.traceId),
		tenantScopeIdx: index("ai_trace_evidence_tenant_scope_idx").on(
			table.tenantScope,
		),
		createdAtIdx: index("ai_trace_evidence_created_at_idx").on(table.createdAt),
	}),
);

// ============================================================================
// AI TOOL PERMISSIONS (P5 Granular Permissions)
// ============================================================================

export const aiToolPermissions = pgTable(
	"ai_tool_permissions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		toolName: text("tool_name").notNull(),
		effect: text("effect", {
			enum: ["ALLOW", "DENY", "REQUIRE_APPROVAL"],
		}).notNull(),
		companyId: uuid("company_id"),
		organizationId: uuid("organization_id"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		toolCompanyIdx: uniqueIndex("idx_tool_permissions_tool_company").on(
			table.toolName,
			table.companyId,
		),
	}),
);

// ============================================================================
// TYPES
// ============================================================================

export type AiToolPermission = typeof aiToolPermissions.$inferSelect;
export type NewAiToolPermission = typeof aiToolPermissions.$inferInsert;

export type AiTool = typeof aiTools.$inferSelect;
export type NewAiTool = typeof aiTools.$inferInsert;
export type AiAgent = typeof aiAgents.$inferSelect;
export type NewAiAgent = typeof aiAgents.$inferInsert;
export type AiTraceEvidence = typeof aiTraceEvidence.$inferSelect;
export type NewAiTraceEvidence = typeof aiTraceEvidence.$inferInsert;
