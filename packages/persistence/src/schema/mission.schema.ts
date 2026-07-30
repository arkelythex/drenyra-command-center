/**
 * Mission schema — durable mission state machine tables.
 *
 * Four tables:
 *   accounting_missions   — core mission state
 *   mission_idempotency   — idempotency key tracking
 *   mission_events        — append-only event log
 *   mission_receipts      — immutable cryptographic receipts
 *
 * Follows existing Drizzle patterns from monthly-close.schema.ts
 * and idempotency.schema.ts.
 */

import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

// ─── accounting_missions ─────────────────────────────────────────────────────

export const accountingMissions = pgTable(
  "accounting_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    fiscalPeriod: varchar("fiscal_period", { length: 7 }).notNull(),
    intent: varchar("intent", { length: 30 }).notNull(),
    status: varchar("status", { length: 25 }).default("DRAFT").notNull(),
    version: integer("version").default(1).notNull(),
    progress: integer("progress").default(0).notNull(),
    input: jsonb("input").$type<{ instruction: string }>(),
    proposal: jsonb("proposal").$type<Record<string, unknown>>(),
    rejection: jsonb("rejection").$type<Record<string, unknown>>(),
    receiptId: uuid("receipt_id"),
    receiptHash: text("receipt_hash"),
    lastEventSequence: integer("last_event_sequence").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    companyFiscalIntentUnq: uniqueIndex(
      "acct_missions_company_period_intent_unq",
    ).on(table.companyId, table.fiscalPeriod, table.intent),
    companyStatusIdx: index("acct_missions_company_status_idx").on(
      table.companyId,
      table.status,
    ),
    statusIdx: index("acct_missions_status_idx").on(table.status),
  }),
);

// ─── mission_idempotency ──────────────────────────────────────────────────────

export const missionIdempotency = pgTable(
  "mission_idempotency",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    commandType: varchar("command_type", { length: 30 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    payloadHash: text("payload_hash").notNull(),
    missionId: uuid("mission_id"),
    executionStatus: varchar("execution_status", { length: 20 }).notNull(),
    response: jsonb("response").$type<Record<string, unknown>>(),
    responseStatusCode: integer("response_status_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    companyKeyUnq: uniqueIndex("mission_idempotency_company_key_unq").on(
      table.companyId,
      table.idempotencyKey,
    ),
    expiresAtIdx: index("mission_idempotency_expires_at_idx").on(
      table.expiresAt,
    ),
  }),
);

// ─── mission_events ───────────────────────────────────────────────────────────

export const missionEvents = pgTable(
  "mission_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id")
      .references(() => accountingMissions.id, { onDelete: "cascade" })
      .notNull(),
    sequence: integer("sequence").notNull(),
    eventType: varchar("event_type", { length: 30 }).notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    missionSequenceUnq: uniqueIndex("mission_events_mission_sequence_unq").on(
      table.missionId,
      table.sequence,
    ),
    missionSequenceIdx: index("mission_events_mission_sequence_idx").on(
      table.missionId,
      table.sequence,
    ),
  }),
);

// ─── mission_receipts ─────────────────────────────────────────────────────────

export const missionReceipts = pgTable(
  "mission_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id")
      .references(() => accountingMissions.id)
      .notNull(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    actorId: varchar("actor_id", { length: 255 }).notNull(),
    decision: varchar("decision", { length: 10 }).notNull(),
    proposalVersion: integer("proposal_version").notNull(),
    evidenceHash: text("evidence_hash").notNull(),
    previousStatus: varchar("previous_status", { length: 25 }).notNull(),
    newStatus: varchar("new_status", { length: 25 }).notNull(),
    payloadHash: text("payload_hash").notNull(),
    receiptHash: text("receipt_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    missionIdIdx: index("mission_receipts_mission_id_idx").on(table.missionId),
    companyIdIdx: index("mission_receipts_company_id_idx").on(table.companyId),
    receiptHashUnq: uniqueIndex("mission_receipts_hash_unq").on(
      table.receiptHash,
    ),
  }),
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const accountingMissionsRelations = relations(
  accountingMissions,
  ({ one, many }) => ({
    company: one(companies, {
      fields: [accountingMissions.companyId],
      references: [companies.id],
    }),
    events: many(missionEvents),
    receipts: many(missionReceipts),
  }),
);

export const missionEventsRelations = relations(missionEvents, ({ one }) => ({
  mission: one(accountingMissions, {
    fields: [missionEvents.missionId],
    references: [accountingMissions.id],
  }),
}));

export const missionReceiptsRelations = relations(
  missionReceipts,
  ({ one }) => ({
    mission: one(accountingMissions, {
      fields: [missionReceipts.missionId],
      references: [accountingMissions.id],
    }),
    company: one(companies, {
      fields: [missionReceipts.companyId],
      references: [companies.id],
    }),
  }),
);
