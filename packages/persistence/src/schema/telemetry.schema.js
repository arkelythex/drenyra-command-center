import { decimal, index, jsonb, pgTable, text, timestamp, uuid, varchar, } from "drizzle-orm/pg-core";
export const frontendTelemetryEvents = pgTable("frontend_telemetry_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: varchar("kind", { length: 32 }).notNull(),
    name: varchar("name", { length: 120 }),
    path: varchar("path", { length: 300 }),
    value: decimal("value", { precision: 14, scale: 4 }),
    rating: varchar("rating", { length: 20 }),
    message: text("message"),
    stack: text("stack"),
    context: jsonb("context"),
    eventTimestamp: timestamp("event_timestamp").notNull(),
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 120 }),
}, (t) => ({
    kindIdx: index("frontend_telemetry_kind_idx").on(t.kind),
    eventTimestampIdx: index("frontend_telemetry_event_ts_idx").on(t.eventTimestamp),
    receivedAtIdx: index("frontend_telemetry_received_at_idx").on(t.receivedAt),
    pathIdx: index("frontend_telemetry_path_idx").on(t.path),
}));
//# sourceMappingURL=telemetry.schema.js.map