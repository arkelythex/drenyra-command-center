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
export const elections = pgTable("civic_elections", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	date: timestamp("date").notNull(),
	region: varchar("region", { length: 100 }).notNull(),
	status: varchar("status", { length: 30 }).notNull().default("DRAFT"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
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
export const electoralActs = pgTable("civic_electoral_acts", {
	id: uuid("id").primaryKey().defaultRandom(),
	stationId: uuid("station_id")
		.references(() => pollingStations.id)
		.notNull(),
	urnNumber: integer("urn_number").notNull(),
	voteTallies: jsonb("vote_tallies").$type().notNull().default({}),
	validationStatus: varchar("validation_status", { length: 20 })
		.notNull()
		.default("PENDING"),
	validatedAt: timestamp("validated_at"),
	validatedBy: varchar("validated_by", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const auditTrails = pgTable("civic_audit_trails", {
	id: uuid("id").primaryKey().defaultRandom(),
	actId: uuid("act_id")
		.references(() => electoralActs.id)
		.notNull(),
	action: varchar("action", { length: 100 }).notNull(),
	actor: varchar("actor", { length: 255 }).notNull(),
	timestamp: timestamp("timestamp").notNull(),
	evidence: jsonb("evidence").$type().notNull().default([]),
	metadata: jsonb("metadata").$type().notNull().default({}),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const fraudIndicators = pgTable("civic_fraud_indicators", {
	id: uuid("id").primaryKey().defaultRandom(),
	electionId: uuid("election_id").references(() => elections.id),
	actId: uuid("act_id").references(() => electoralActs.id),
	type: varchar("type", { length: 50 }).notNull(),
	severity: varchar("severity", { length: 20 }).notNull(),
	description: text("description").notNull(),
	evidence: jsonb("evidence").$type().notNull().default([]),
	detectedAt: timestamp("detected_at").notNull(),
});
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
//# sourceMappingURL=civic.schema.js.map
