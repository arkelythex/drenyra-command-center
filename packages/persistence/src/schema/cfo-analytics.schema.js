import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid, varchar, } from "drizzle-orm/pg-core";
import { companies } from "./core.schema";
export const reportStatusEnum = [
    "QUEUED",
    "GENERATING",
    "READY",
    "FAILED",
];
export const reportTypeEnum = ["financial", "tax", "client", "custom"];
export const widgetTypeEnum = [
    "kpi_card",
    "trend_chart",
    "bar_chart",
    "pie_chart",
    "table",
];
export const analyticsDashboards = pgTable("analytics_dashboards", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
        .references(() => companies.id)
        .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    config: jsonb("config")
        .$type()
        .default({ widgets: [], layout: "grid" })
        .notNull(),
    createdById: uuid("created_by_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    companyIdx: index("analytics_dashboards_company_idx").on(table.companyId),
}));
export const analyticsReports = pgTable("analytics_reports", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
        .references(() => companies.id)
        .notNull(),
    type: varchar("type", { length: 20 }).$type().notNull(),
    parameters: jsonb("parameters")
        .$type()
        .default({})
        .notNull(),
    status: varchar("status", { length: 20 })
        .$type()
        .default("QUEUED")
        .notNull(),
    fileUrl: text("file_url"),
    period: varchar("period", { length: 7 }),
    generatedAt: timestamp("generated_at"),
    createdById: uuid("created_by_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    companyIdx: index("analytics_reports_company_idx").on(table.companyId),
    companyTypeIdx: index("analytics_reports_company_type_idx").on(table.companyId, table.type),
    statusIdx: index("analytics_reports_status_idx").on(table.status),
}));
export const analyticsWidgets = pgTable("analytics_widgets", {
    id: uuid("id").primaryKey().defaultRandom(),
    dashboardId: uuid("dashboard_id")
        .references(() => analyticsDashboards.id, { onDelete: "cascade" })
        .notNull(),
    type: varchar("type", { length: 20 }).$type().notNull(),
    config: jsonb("config")
        .$type()
        .default({
        metrics: [],
        filters: {},
        timeRange: "month",
        comparison: "none",
    })
        .notNull(),
    size: varchar("size", { length: 10 }).default("medium").notNull(),
    position: jsonb("position")
        .$type()
        .default({ x: 0, y: 0 })
        .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
    dashboardIdx: index("analytics_widgets_dashboard_idx").on(table.dashboardId),
}));
export const analyticsDashboardsRelations = relations(analyticsDashboards, ({ one, many }) => ({
    company: one(companies, {
        fields: [analyticsDashboards.companyId],
        references: [companies.id],
    }),
    widgets: many(analyticsWidgets),
}));
export const analyticsReportsRelations = relations(analyticsReports, ({ one }) => ({
    company: one(companies, {
        fields: [analyticsReports.companyId],
        references: [companies.id],
    }),
}));
export const analyticsWidgetsRelations = relations(analyticsWidgets, ({ one }) => ({
    dashboard: one(analyticsDashboards, {
        fields: [analyticsWidgets.dashboardId],
        references: [analyticsDashboards.id],
    }),
}));
//# sourceMappingURL=cfo-analytics.schema.js.map