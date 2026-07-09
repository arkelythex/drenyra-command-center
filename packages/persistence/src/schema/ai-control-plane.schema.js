import {
	boolean,
	index,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
export const aiTools = pgTable(
	"ai_tools",
	{
		id: serial("id").primaryKey(),
		name: text("name").notNull().unique(),
		description: text("description"),
		riskTier: varchar("risk_tier", { length: 2 }).notNull(),
		inputSchema: jsonb("input_schema"),
		outputSchema: jsonb("output_schema"),
		requiresApproval: boolean("requires_approval").default(false).notNull(),
		fiscalImpact: boolean("fiscal_impact").default(false).notNull(),
		approvalLevel: varchar("approval_level", { length: 20 }).default("auto"),
		metadata: jsonb("metadata").$type().default({}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		riskTierIdx: index("ai_tools_risk_tier_idx").on(table.riskTier),
		nameIdx: index("ai_tools_name_idx").on(table.name),
	}),
);
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
		metadata: jsonb("metadata").$type().default({}),
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

