export declare const reportStatusEnum: readonly ["QUEUED", "GENERATING", "READY", "FAILED"];
export type ReportStatus = (typeof reportStatusEnum)[number];
export declare const reportTypeEnum: readonly ["financial", "tax", "client", "custom"];
export type ReportType = (typeof reportTypeEnum)[number];
export declare const widgetTypeEnum: readonly ["kpi_card", "trend_chart", "bar_chart", "pie_chart", "table"];
export type WidgetType = (typeof widgetTypeEnum)[number];
export declare const analyticsDashboards: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "analytics_dashboards";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "analytics_dashboards";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        companyId: import("drizzle-orm/pg-core").PgColumn<{
            name: "company_id";
            tableName: "analytics_dashboards";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core").PgColumn<{
            name: "name";
            tableName: "analytics_dashboards";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 255;
        }>;
        config: import("drizzle-orm/pg-core").PgColumn<{
            name: "config";
            tableName: "analytics_dashboards";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                widgets: Array<{
                    widgetId: string;
                    position: {
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                    };
                }>;
                layout: string;
            };
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: {
                widgets: Array<{
                    widgetId: string;
                    position: {
                        x: number;
                        y: number;
                        w: number;
                        h: number;
                    };
                }>;
                layout: string;
            };
        }>;
        createdById: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by_id";
            tableName: "analytics_dashboards";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "analytics_dashboards";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "analytics_dashboards";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const analyticsReports: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "analytics_reports";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "analytics_reports";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        companyId: import("drizzle-orm/pg-core").PgColumn<{
            name: "company_id";
            tableName: "analytics_reports";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: import("drizzle-orm/pg-core").PgColumn<{
            name: "type";
            tableName: "analytics_reports";
            dataType: "string";
            columnType: "PgVarchar";
            data: "custom" | "tax" | "financial" | "client";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 20;
            $type: "custom" | "tax" | "financial" | "client";
        }>;
        parameters: import("drizzle-orm/pg-core").PgColumn<{
            name: "parameters";
            tableName: "analytics_reports";
            dataType: "json";
            columnType: "PgJsonb";
            data: Record<string, unknown>;
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: Record<string, unknown>;
        }>;
        status: import("drizzle-orm/pg-core").PgColumn<{
            name: "status";
            tableName: "analytics_reports";
            dataType: "string";
            columnType: "PgVarchar";
            data: "QUEUED" | "FAILED" | "GENERATING" | "READY";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 20;
            $type: "QUEUED" | "FAILED" | "GENERATING" | "READY";
        }>;
        fileUrl: import("drizzle-orm/pg-core").PgColumn<{
            name: "file_url";
            tableName: "analytics_reports";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        period: import("drizzle-orm/pg-core").PgColumn<{
            name: "period";
            tableName: "analytics_reports";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 7;
        }>;
        generatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "generated_at";
            tableName: "analytics_reports";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdById: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_by_id";
            tableName: "analytics_reports";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "analytics_reports";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "analytics_reports";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const analyticsWidgets: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "analytics_widgets";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "analytics_widgets";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        dashboardId: import("drizzle-orm/pg-core").PgColumn<{
            name: "dashboard_id";
            tableName: "analytics_widgets";
            dataType: "string";
            columnType: "PgUUID";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: import("drizzle-orm/pg-core").PgColumn<{
            name: "type";
            tableName: "analytics_widgets";
            dataType: "string";
            columnType: "PgVarchar";
            data: "table" | "kpi_card" | "trend_chart" | "bar_chart" | "pie_chart";
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 20;
            $type: "table" | "kpi_card" | "trend_chart" | "bar_chart" | "pie_chart";
        }>;
        config: import("drizzle-orm/pg-core").PgColumn<{
            name: "config";
            tableName: "analytics_widgets";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                metrics: string[];
                filters: Record<string, unknown>;
                timeRange: "month" | "quarter" | "year";
                comparison: "none" | "previous_period" | "same_period_last_year";
            };
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: {
                metrics: string[];
                filters: Record<string, unknown>;
                timeRange: "month" | "quarter" | "year";
                comparison: "none" | "previous_period" | "same_period_last_year";
            };
        }>;
        size: import("drizzle-orm/pg-core").PgColumn<{
            name: "size";
            tableName: "analytics_widgets";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 10;
        }>;
        position: import("drizzle-orm/pg-core").PgColumn<{
            name: "position";
            tableName: "analytics_widgets";
            dataType: "json";
            columnType: "PgJsonb";
            data: {
                x: number;
                y: number;
            };
            driverParam: unknown;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            $type: {
                x: number;
                y: number;
            };
        }>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "analytics_widgets";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "updated_at";
            tableName: "analytics_widgets";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const analyticsDashboardsRelations: import("drizzle-orm").Relations<"analytics_dashboards", {
    company: import("drizzle-orm").One<"companies", true>;
    widgets: import("drizzle-orm").Many<"analytics_widgets">;
}>;
export declare const analyticsReportsRelations: import("drizzle-orm").Relations<"analytics_reports", {
    company: import("drizzle-orm").One<"companies", true>;
}>;
export declare const analyticsWidgetsRelations: import("drizzle-orm").Relations<"analytics_widgets", {
    dashboard: import("drizzle-orm").One<"analytics_dashboards", true>;
}>;
//# sourceMappingURL=cfo-analytics.schema.d.ts.map