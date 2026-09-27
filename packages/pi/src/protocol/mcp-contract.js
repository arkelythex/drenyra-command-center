import { RUC } from "../_domain-types/ruc";
export const DRENYRA_MCP_CONTRACT_VERSION = "2026-05-26.mcp-surface.v1";
export const DRENYRA_MCP_SCOPE_HEADERS = [
    "x-organization-id",
    "x-company-id",
    "x-company-ruc",
    "x-fiscal-period",
    "x-user-id",
];
const mcpTools = [
    {
        name: "drenyra.contract.read",
        description: "Read the Drenyra dual-surface API/Web/CLI contract.",
        mode: "read_only",
        requiredScopeHeaders: DRENYRA_MCP_SCOPE_HEADERS,
        returnsSensitiveData: false,
        redactionRequired: false,
        allowedSurfaces: ["claude", "chatgpt", "cursor", "codex", "api"],
    },
    {
        name: "drenyra.brain.list_threads",
        description: "List Drenyra Brain threads in the caller's fiscal scope.",
        mode: "read_only",
        requiredScopeHeaders: DRENYRA_MCP_SCOPE_HEADERS,
        returnsSensitiveData: true,
        redactionRequired: true,
        allowedSurfaces: ["claude", "chatgpt", "cursor", "codex", "api"],
    },
    {
        name: "fiscal_truth.evidence.read_graph",
        description: "Read Fiscal Truth evidence graph metadata in scope.",
        mode: "read_only",
        requiredScopeHeaders: DRENYRA_MCP_SCOPE_HEADERS,
        returnsSensitiveData: true,
        redactionRequired: true,
        allowedSurfaces: ["claude", "chatgpt", "cursor", "codex", "api"],
    },
];
export function buildDrenyraMcpManifest() {
    return {
        version: DRENYRA_MCP_CONTRACT_VERSION,
        positioning: "fiscal_intelligence_platform_mcp",
        defaultPolicy: "deny_by_default",
        requiredScopeHeaders: DRENYRA_MCP_SCOPE_HEADERS,
        tools: mcpTools,
        invariants: [
            "Public MCP is read-only by default; material fiscal writes stay behind API governance and human approval.",
            "Every tool requires organization, company, SUNAT RUC, fiscal period and user scope.",
            "Sensitive fiscal data requires redaction before leaving ARKELYTHEX surfaces.",
            "AI clients receive evidence and explanations, never direct fiscal authority.",
        ],
    };
}
export function isDrenyraMcpScope(scope) {
    return (scope.organizationId.trim().length > 0 &&
        scope.companyId.trim().length > 0 &&
        RUC.isValid(scope.companyRuc) &&
        /^\d{4}-(0[1-9]|1[0-2])$/.test(scope.period) &&
        scope.countryCode === "PE" &&
        scope.userId.trim().length > 0);
}
export function authorizeDrenyraMcpTool(input) {
    const tool = mcpTools.find((candidate) => candidate.name === input.toolName);
    if (!tool)
        return { allowed: false, reason: "TOOL_NOT_REGISTERED" };
    if (!isDrenyraMcpScope(input.scope))
        return { allowed: false, reason: "INVALID_SCOPE" };
    if (tool.mode !== "read_only")
        return { allowed: false, reason: "WRITE_TOOLS_NOT_EXPOSED" };
    if (tool.redactionRequired && input.redactionStatus !== "passed") {
        return { allowed: false, reason: "REDACTION_FAILED" };
    }
    return { allowed: true, reason: "ALLOWED" };
}
//# sourceMappingURL=mcp-contract.js.map