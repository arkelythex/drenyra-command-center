import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const evidenceNodes = pgTable(
	"fiscal_evidence_nodes",
	{
		nodeId: uuid("node_id").primaryKey(),
		nodeKind: varchar("node_kind", { length: 64 }).notNull(),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 64 }),
		period: varchar("period", { length: 7 }).notNull(),
		countryCode: varchar("country_code", { length: 8 }).notNull(),
		traceId: varchar("trace_id", { length: 128 }).notNull(),
		correlationId: varchar("correlation_id", { length: 128 }).notNull(),
		causationId: varchar("causation_id", { length: 128 }),
		hash: varchar("hash", { length: 256 }).notNull(),
		createdAt: timestamp("created_at").notNull(),
		metadata: jsonb("metadata").notNull(),
	},
	(table) => ({
		scopeNodeIdx: index("fen_scope_node_idx").on(
			table.nodeId,
			table.companyId,
			table.companyRuc,
			table.period,
		),
	}),
);

export const fiscalTruthEvents = pgTable(
	"fiscal_truth_events",
	{
		eventId: uuid("event_id").primaryKey(),
		aggregateId: varchar("aggregate_id", { length: 128 }).notNull(),
		aggregateType: varchar("aggregate_type", { length: 64 }).notNull(),
		eventKind: varchar("event_kind", { length: 64 }).notNull(),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 64 }),
		period: varchar("period", { length: 7 }).notNull(),
		countryCode: varchar("country_code", { length: 8 }).notNull(),
		traceId: varchar("trace_id", { length: 128 }).notNull(),
		correlationId: varchar("correlation_id", { length: 128 }).notNull(),
		causationId: varchar("causation_id", { length: 128 }),
		validatorSetVersion: varchar("validator_set_version", {
			length: 64,
		}).notNull(),
		policyVersion: varchar("policy_version", { length: 64 }).notNull(),
		evidenceRootNodeId: uuid("evidence_root_node_id")
			.notNull()
			.references(() => evidenceNodes.nodeId),
		evidenceBundleHash: varchar("evidence_bundle_hash", {
			length: 256,
		}).notNull(),
		prevHash: varchar("prev_hash", { length: 64 }),
		chainHash: varchar("chain_hash", { length: 64 }).notNull().default(""),
		approvalId: varchar("approval_id", { length: 128 }),
		occurredAt: timestamp("occurred_at").notNull(),
		payload: jsonb("payload").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		aggregateScopeIdx: index("fte_aggregate_scope_idx").on(
			table.aggregateId,
			table.companyId,
			table.companyRuc,
			table.period,
		),
	}),
);

export const evidenceEdges = pgTable(
	"fiscal_evidence_edges",
	{
		edgeId: uuid("edge_id").primaryKey(),
		fromNodeId: uuid("from_node_id")
			.notNull()
			.references(() => evidenceNodes.nodeId),
		toNodeId: uuid("to_node_id")
			.notNull()
			.references(() => evidenceNodes.nodeId),
		edgeKind: varchar("edge_kind", { length: 64 }).notNull(),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 64 }),
		period: varchar("period", { length: 7 }).notNull(),
		countryCode: varchar("country_code", { length: 8 }).notNull(),
		createdAt: timestamp("created_at").notNull(),
	},
	(table) => ({
		fromScopeIdx: index("fee_from_scope_idx").on(
			table.fromNodeId,
			table.companyId,
			table.companyRuc,
			table.period,
		),
		toScopeIdx: index("fee_to_scope_idx").on(
			table.toNodeId,
			table.companyId,
			table.companyRuc,
			table.period,
		),
	}),
);

export const fiscalReplayCheckpoints = pgTable(
	"fiscal_replay_checkpoints",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		aggregateId: varchar("aggregate_id", { length: 128 }).notNull(),
		companyId: varchar("company_id", { length: 128 }).notNull(),
		companyRuc: varchar("company_ruc", { length: 11 }).notNull(),
		organizationId: varchar("organization_id", { length: 64 }),
		period: varchar("period", { length: 7 }).notNull(),
		countryCode: varchar("country_code", { length: 8 }).notNull(),
		success: boolean("success").notNull(),
		reproducedEventId: varchar("reproduced_event_id", { length: 128 }),
		reproducedOutcomeHash: varchar("reproduced_outcome_hash", { length: 256 }),
		failureCode: varchar("failure_code", { length: 64 }),
		message: text("message").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		aggregateScopeIdx: index("frc_aggregate_scope_idx").on(
			table.aggregateId,
			table.companyId,
			table.companyRuc,
			table.period,
		),
	}),
);

export const fiscalTruthEventsRelations = relations(
	fiscalTruthEvents,
	({ one }) => ({
		evidenceRoot: one(evidenceNodes, {
			fields: [fiscalTruthEvents.evidenceRootNodeId],
			references: [evidenceNodes.nodeId],
		}),
	}),
);

export const evidenceEdgesRelations = relations(evidenceEdges, ({ one }) => ({
	fromNode: one(evidenceNodes, {
		fields: [evidenceEdges.fromNodeId],
		references: [evidenceNodes.nodeId],
	}),
	toNode: one(evidenceNodes, {
		fields: [evidenceEdges.toNodeId],
		references: [evidenceNodes.nodeId],
	}),
}));
