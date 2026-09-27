export declare const DRENYRA_MCP_CONTRACT_VERSION: "2026-05-26.mcp-surface.v1";
export declare const DRENYRA_MCP_SCOPE_HEADERS: readonly ["x-organization-id", "x-company-id", "x-company-ruc", "x-fiscal-period", "x-user-id"];
export type DrenyraMcpScopeHeader = (typeof DRENYRA_MCP_SCOPE_HEADERS)[number];
export interface DrenyraMcpScope {
    organizationId: string;
    companyId: string;
    companyRuc: string;
    period: string;
    countryCode: "PE";
    userId: string;
}
export interface DrenyraMcpToolContract {
    name: string;
    description: string;
    mode: "read_only";
    requiredScopeHeaders: readonly DrenyraMcpScopeHeader[];
    returnsSensitiveData: boolean;
    redactionRequired: boolean;
    allowedSurfaces: readonly ("claude" | "chatgpt" | "cursor" | "codex" | "api")[];
}
export interface DrenyraMcpManifest {
    version: typeof DRENYRA_MCP_CONTRACT_VERSION;
    positioning: "fiscal_intelligence_platform_mcp";
    defaultPolicy: "deny_by_default";
    requiredScopeHeaders: readonly DrenyraMcpScopeHeader[];
    tools: readonly DrenyraMcpToolContract[];
    invariants: readonly string[];
}
export interface DrenyraMcpAuthorizationInput {
    toolName: string;
    scope: DrenyraMcpScope;
    redactionStatus: "passed" | "failed" | "not_required";
}
export interface DrenyraMcpAuthorizationDecision {
    allowed: boolean;
    reason: "TOOL_NOT_REGISTERED" | "INVALID_SCOPE" | "WRITE_TOOLS_NOT_EXPOSED" | "REDACTION_FAILED" | "ALLOWED";
}
export declare function buildDrenyraMcpManifest(): DrenyraMcpManifest;
export declare function isDrenyraMcpScope(scope: DrenyraMcpScope): boolean;
export declare function authorizeDrenyraMcpTool(input: DrenyraMcpAuthorizationInput): DrenyraMcpAuthorizationDecision;
export type DrenyraMcpAuditOperation = "authorize" | "invoke";
export type DrenyraMcpAuditOutcome = "allowed" | "denied" | "failed";
export interface DrenyraMcpAuditEvent {
    operation: DrenyraMcpAuditOperation;
    outcome: DrenyraMcpAuditOutcome;
    toolName: string;
    scope: DrenyraMcpScope;
    actorId: string;
    redactionStatus: DrenyraMcpAuthorizationInput["redactionStatus"];
    reason: DrenyraMcpAuthorizationDecision["reason"] | "MCP_INVOKE_FAILED";
    occurredAt: string;
    metadata: Record<string, unknown>;
}
export interface DrenyraMcpAuditSink {
    append(event: DrenyraMcpAuditEvent): Promise<void>;
}
export interface DrenyraMcpAuditQuery {
    scope: DrenyraMcpScope;
    limit: number;
    outcome?: DrenyraMcpAuditOutcome;
    toolName?: string;
}
export interface DrenyraMcpAuditReader {
    list(query: DrenyraMcpAuditQuery): Promise<DrenyraMcpAuditEvent[]>;
}
//# sourceMappingURL=mcp-contract.d.ts.map