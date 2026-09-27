import type { DrenyraMcpAuditEvent, DrenyraMcpAuditQuery, DrenyraMcpAuditReader, DrenyraMcpAuditSink } from "@drenyra/pi";
export declare class PostgresPlatformMcpAuditSink implements DrenyraMcpAuditSink, DrenyraMcpAuditReader {
    append(event: DrenyraMcpAuditEvent): Promise<void>;
    list(query: DrenyraMcpAuditQuery): Promise<DrenyraMcpAuditEvent[]>;
}
//# sourceMappingURL=postgres-platform-mcp-audit.repository.d.ts.map