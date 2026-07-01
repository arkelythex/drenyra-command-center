/**
 * Civic schema — Elections, polling stations, electoral acts, audit trails, fraud indicators.
 *
 * Supports the Civic vertical consolidation for election validation, fraud detection,
 * and auditability.
 *
 * Multi-tenant scoping: All entities carry district_id for tenant isolation.
 */

import { relations } from "drizzle-orm";
import {
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ─── Elections ────────────────────────────────────────────────────

export const elections = pgTable("civic_elections", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	date: timestamp("date").notNull(),
	region: varchar("region", { length: 100 }).notNull(),
	status: varchar("status", { length: 30 }).notNull().default("DRAFT"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Polling Stations ─────────────────────────────────────────────

export const pollingStations = pgTable("civic_polling_stations", {
	id: uuid("id").primaryKey().defaultRandom(),
	code: varchar("code", { length: 50 }).notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	location: text("location").notNull(),
	urnCount: integer("urn_count").notNull(),
	registeredVoters: integer("registered_voters").notNull(),
	electionId: uuid("election_id").references(() => elections.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Electoral Acts ───────────────────────────────────────────────

export const electoralActs = pgTable("civic_electoral_acts", {
	id: uuid("id").primaryKey().defaultRandom(),
	stationId: uuid("station_id")
		.references(() => pollingStations.id)
		.notNull(),
	urnNumber: integer("urn_number").notNull(),
	voteTallies: jsonb("vote_tallies")
		.$type<Record<string, number>>()
		.notNull()
		.default({}),
	validationStatus: varchar("validation_status", { length: 20 })
		.notNull()
		.default("PENDING"),
	validatedAt: timestamp("validated_at"),
	validatedBy: varchar("validated_by", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Audit Trails ─────────────────────────────────────────────────

export const auditTrails = pgTable("civic_audit_trails", {
	id: uuid("id").primaryKey().defaultRandom(),
	actId: uuid("act_id")
		.references(() => electoralActs.id)
		.notNull(),
	action: varchar("action", { length: 100 }).notNull(),
	actor: varchar("actor", { length: 255 }).notNull(),
	timestamp: timestamp("timestamp").notNull(),
	evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
	metadata: jsonb("metadata")
		.$type<Record<string, unknown>>()
		.notNull()
		.default({}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Fraud Indicators ─────────────────────────────────────────────

export const fraudIndicators = pgTable("civic_fraud_indicators", {
	id: uuid("id").primaryKey().defaultRandom(),
	electionId: uuid("election_id").references(() => elections.id),
	actId: uuid("act_id").references(() => electoralActs.id),
	type: varchar("type", { length: 50 }).notNull(),
	severity: varchar("severity", { length: 20 }).notNull(),
	description: text("description").notNull(),
	evidence: jsonb("evidence").$type<string[]>().notNull().default([]),
	detectedAt: timestamp("detected_at").notNull(),
});

// ─── Civic Cases ──────────────────────────────────────────────────

export const civicCases = pgTable("civic_cases", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	electionIds: jsonb("election_ids").$type<string[]>().notNull().default([]),
	fraudIndicators: jsonb("fraud_indicators")
		.$type<
			Array<{
				type: string;
				severity: string;
				description: string;
				evidence: string[];
				detectedAt: string;
			}>
		>()
		.notNull()
		.default([]),
	timeline: jsonb("timeline").$type<string[]>().notNull().default([]),
	status: varchar("status", { length: 30 }).notNull().default("DRAFT"),
	escalationReason: varchar("escalation_reason", { length: 500 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────────

export const electionsRelations = relations(elections, ({ many }) => ({
	pollingStations: many(pollingStations),
	fraudIndicators: many(fraudIndicators),
}));

export const pollingStationsRelations = relations(
	pollingStations,
	({ one, many }) => ({
		election: one(elections, {
			fields: [pollingStations.electionId],
			references: [elections.id],
		}),
		electoralActs: many(electoralActs),
	}),
);

export const electoralActsRelations = relations(
	electoralActs,
	({ one, many }) => ({
		station: one(pollingStations, {
			fields: [electoralActs.stationId],
			references: [pollingStations.id],
		}),
		auditTrails: many(auditTrails),
		fraudIndicators: many(fraudIndicators),
	}),
);

export const auditTrailsRelations = relations(auditTrails, ({ one }) => ({
	act: one(electoralActs, {
		fields: [auditTrails.actId],
		references: [electoralActs.id],
	}),
}));

export const fraudIndicatorsRelations = relations(
	fraudIndicators,
	({ one }) => ({
		election: one(elections, {
			fields: [fraudIndicators.electionId],
			references: [elections.id],
		}),
		act: one(electoralActs, {
			fields: [fraudIndicators.actId],
			references: [electoralActs.id],
		}),
	}),
);
