import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
export const drenyraFiscalCases = pgTable(
	"drenyra_fiscal_cases",
	{
		id: varchar("id", { length: 96 }).primaryKey(),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 128 }),
		period: varchar("period", { length: 16 }).notNull(),
		countryCode: varchar("country_code", { length: 2 }).default("PE").notNull(),
		type: varchar("type", { length: 48 }).$type().notNull(),
		status: varchar("status", { length: 32 }).$type().notNull(),
		title: varchar("title", { length: 180 }).notNull(),
		description: text("description").notNull(),
		riskLevel: varchar("risk_level", { length: 16 }).$type().notNull(),
		riskScore: integer("risk_score").notNull(),
		autonomyLevel: varchar("autonomy_level", { length: 40 }).$type().notNull(),
		createdBy: varchar("created_by", { length: 128 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		metadata: jsonb("metadata").$type().default({}).notNull(),
	},
	(table) => ({
		scopePeriodIdx: index("drenyra_cases_scope_period_idx").on(
			table.companyId,
			table.companyRuc,
			table.period,
		),
		statusIdx: index("drenyra_cases_status_idx").on(
			table.companyId,
			table.status,
		),
	}),
);
export const drenyraEvidenceItems = pgTable(
	"drenyra_evidence_items",
	{
		id: varchar("id", { length: 96 }).primaryKey(),
		caseId: varchar("case_id", { length: 96 })
			.notNull()
			.references(() => drenyraFiscalCases.id),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 128 }),
		period: varchar("period", { length: 16 }).notNull(),
		countryCode: varchar("country_code", { length: 2 }).default("PE").notNull(),
		type: varchar("type", { length: 40 }).$type().notNull(),
		title: varchar("title", { length: 180 }).notNull(),
		summary: text("summary").notNull(),
		source: varchar("source", { length: 128 }).notNull(),
		sourceRef: varchar("source_ref", { length: 256 }),
		contentHash: varchar("content_hash", { length: 128 }).notNull(),
		addedBy: varchar("added_by", { length: 128 }).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		metadata: jsonb("metadata").$type().default({}).notNull(),
	},
	(table) => ({
		caseIdx: index("drenyra_evidence_case_idx").on(
			table.caseId,
			table.companyId,
			table.companyRuc,
		),
	}),
);
export const drenyraAgentRuns = pgTable(
	"drenyra_agent_runs",
	{
		id: varchar("id", { length: 96 }).primaryKey(),
		caseId: varchar("case_id", { length: 96 })
			.notNull()
			.references(() => drenyraFiscalCases.id),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 128 }),
		period: varchar("period", { length: 16 }).notNull(),
		countryCode: varchar("country_code", { length: 2 }).default("PE").notNull(),
		agentType: varchar("agent_type", { length: 48 }).$type().notNull(),
		status: varchar("status", { length: 20 }).$type().notNull(),
		startedBy: varchar("started_by", { length: 128 }).notNull(),
		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
		output: jsonb("output").$type(),
		metadata: jsonb("metadata").$type().default({}).notNull(),
	},
	(table) => ({
		caseIdx: index("drenyra_agent_runs_case_idx").on(
			table.caseId,
			table.companyId,
			table.companyRuc,
		),
	}),
);
export const drenyraApprovalRequests = pgTable(
	"drenyra_approval_requests",
	{
		id: varchar("id", { length: 96 }).primaryKey(),
		caseId: varchar("case_id", { length: 96 })
			.notNull()
			.references(() => drenyraFiscalCases.id),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 128 }),
		period: varchar("period", { length: 16 }).notNull(),
		countryCode: varchar("country_code", { length: 2 }).default("PE").notNull(),
		status: varchar("status", { length: 20 }).$type().notNull(),
		title: varchar("title", { length: 180 }).notNull(),
		description: text("description").notNull(),
		autonomyLevel: varchar("autonomy_level", { length: 40 }).$type().notNull(),
		requestedBy: varchar("requested_by", { length: 128 }).notNull(),
		requestedAt: timestamp("requested_at").defaultNow().notNull(),
		decidedBy: varchar("decided_by", { length: 128 }),
		decidedAt: timestamp("decided_at"),
		decisionReason: text("decision_reason"),
		diff: jsonb("diff").$type().notNull(),
		metadata: jsonb("metadata").$type().default({}).notNull(),
	},
	(table) => ({
		caseIdx: index("drenyra_approvals_case_idx").on(
			table.caseId,
			table.companyId,
			table.companyRuc,
		),
		statusIdx: index("drenyra_approvals_status_idx").on(
			table.companyId,
			table.status,
		),
	}),
);
export const drenyraAuditEvents = pgTable(
	"drenyra_audit_events",
	{
		id: varchar("id", { length: 96 }).primaryKey(),
		caseId: varchar("case_id", { length: 96 }).references(
			() => drenyraFiscalCases.id,
		),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 128 }),
		period: varchar("period", { length: 16 }).notNull(),
		countryCode: varchar("country_code", { length: 2 }).default("PE").notNull(),
		eventType: varchar("event_type", { length: 48 }).$type().notNull(),
		actorId: varchar("actor_id", { length: 128 }).notNull(),
		message: text("message").notNull(),
		occurredAt: timestamp("occurred_at").defaultNow().notNull(),
		metadata: jsonb("metadata").$type().default({}).notNull(),
	},
	(table) => ({
		caseIdx: index("drenyra_audit_events_case_idx").on(
			table.caseId,
			table.companyId,
			table.companyRuc,
		),
		typeIdx: index("drenyra_audit_events_type_idx").on(
			table.companyId,
			table.eventType,
		),
	}),
);
//# sourceMappingURL=drenyra-command-center.schema.js.map
