export declare const platformMcpAuditEvents: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "platform_mcp_audit_events";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "platform_mcp_audit_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 96;
        }>;
        operation: import("drizzle-orm/pg-core").PgColumn<{
            name: "operation";
            tableName: "platform_mcp_audit_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: import("@drenyra/pi/protocol/mcp-contract").DrenyraMcpAuditOperation;
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
            length: 24;
            $type: import("@drenyra/pi/protocol/mcp-contract").DrenyraMcpAuditOperation;
        }>;
        outcome: import("drizzle-orm/pg-core").PgColumn<{
            name: "outcome";
            tableName: "platform_mcp_audit_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: import("@drenyra/pi").DrenyraMcpAuditOutcome;
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
            length: 24;
            $type: import("@drenyra/pi").DrenyraMcpAuditOutcome;
        }>;
        toolName: import("drizzle-orm/pg-core").PgColumn<{
            name: "tool_name";
            tableName: "platform_mcp_audit_events";
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
            length: 128;
        }>;
        companyId: import("drizzle-orm/pg-core").PgColumn<{
            name: "company_id";
            tableName: "platform_mcp_audit_events";
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
            length: 128;
        }>;
        companyRuc: import("drizzle-orm/pg-core").PgColumn<{
            name: "company_ruc";
            tableName: "platform_mcp_audit_events";
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
            length: 11;
        }>;
        organizationId: import("drizzle-orm/pg-core").PgColumn<{
            name: "organization_id";
            tableName: "platform_mcp_audit_events";
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
            length: 128;
        }>;
        period: import("drizzle-orm/pg-core").PgColumn<{
            name: "period";
            tableName: "platform_mcp_audit_events";
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
            length: 7;
        }>;
        countryCode: import("drizzle-orm/pg-core").PgColumn<{
            name: "country_code";
            tableName: "platform_mcp_audit_events";
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
            length: 2;
        }>;
        actorId: import("drizzle-orm/pg-core").PgColumn<{
            name: "actor_id";
            tableName: "platform_mcp_audit_events";
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
            length: 128;
        }>;
        redactionStatus: import("drizzle-orm/pg-core").PgColumn<{
            name: "redaction_status";
            tableName: "platform_mcp_audit_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: "failed" | "passed" | "not_required";
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
            length: 24;
            $type: "failed" | "passed" | "not_required";
        }>;
        reason: import("drizzle-orm/pg-core").PgColumn<{
            name: "reason";
            tableName: "platform_mcp_audit_events";
            dataType: "string";
            columnType: "PgVarchar";
            data: "ALLOWED" | "TOOL_NOT_REGISTERED" | "INVALID_SCOPE" | "WRITE_TOOLS_NOT_EXPOSED" | "REDACTION_FAILED" | "MCP_INVOKE_FAILED";
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
            length: 64;
            $type: "ALLOWED" | "TOOL_NOT_REGISTERED" | "INVALID_SCOPE" | "WRITE_TOOLS_NOT_EXPOSED" | "REDACTION_FAILED" | "MCP_INVOKE_FAILED";
        }>;
        occurredAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "occurred_at";
            tableName: "platform_mcp_audit_events";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
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
        metadata: import("drizzle-orm/pg-core").PgColumn<{
            name: "metadata";
            tableName: "platform_mcp_audit_events";
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
        message: import("drizzle-orm/pg-core").PgColumn<{
            name: "message";
            tableName: "platform_mcp_audit_events";
            dataType: "string";
            columnType: "PgText";
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
        }, {}, {}>;
    };
    dialect: "pg";
}>;
//# sourceMappingURL=platform-mcp.schema.d.ts.map