/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { RUC } from "../value-objects/RUC";

export const ARKELYTHEX_MCP_CONTRACT_VERSION = "2026-05-26.mcp-surface.v1" as const;

export const ARKELYTHEX_MCP_SCOPE_HEADERS = [
	"x-organization-id",
	"x-company-id",
	"x-company-ruc",
	"x-fiscal-period",
	"x-user-id",
] as const;

export type ArkelythexMcpScopeHeader = (typeof ARKELYTHEX_MCP_SCOPE_HEADERS)[number];

export interface ArkelythexMcpScope {
	organizationId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	countryCode: "PE";
	userId: string;
}

export interface ArkelythexMcpToolContract {
	name: string;
	description: string;
	mode: "read_only";
	requiredScopeHeaders: readonly ArkelythexMcpScopeHeader[];
	returnsSensitiveData: boolean;
	redactionRequired: boolean;
	allowedSurfaces: readonly ("claude" | "chatgpt" | "cursor" | "codex" | "api")[];
}

export interface ArkelythexMcpManifest {
	version: typeof ARKELYTHEX_MCP_CONTRACT_VERSION;
	positioning: "fiscal_intelligence_platform_mcp";
	defaultPolicy: "deny_by_default";
	requiredScopeHeaders: readonly ArkelythexMcpScopeHeader[];
	tools: readonly ArkelythexMcpToolContract[];
	invariants: readonly string[];
}

export interface ArkelythexMcpAuthorizationInput {
	toolName: string;
	scope: ArkelythexMcpScope;
	redactionStatus: "passed" | "failed" | "not_required";
}

export interface ArkelythexMcpAuthorizationDecision {
	allowed: boolean;
	reason:
		| "TOOL_NOT_REGISTERED"
		| "INVALID_SCOPE"
		| "WRITE_TOOLS_NOT_EXPOSED"
		| "REDACTION_FAILED"
		| "ALLOWED";
}

const mcpTools = [
	{
		name: "drenyra.contract.read",
		description: "Read the Drenyra dual-surface API/Web/CLI contract.",
		mode: "read_only",
		requiredScopeHeaders: ARKELYTHEX_MCP_SCOPE_HEADERS,
		returnsSensitiveData: false,
		redactionRequired: false,
		allowedSurfaces: ["claude", "chatgpt", "cursor", "codex", "api"],
	},
	{
		name: "drenyra.brain.list_threads",
		description: "List Drenyra Brain threads in the caller's fiscal scope.",
		mode: "read_only",
		requiredScopeHeaders: ARKELYTHEX_MCP_SCOPE_HEADERS,
		returnsSensitiveData: true,
		redactionRequired: true,
		allowedSurfaces: ["claude", "chatgpt", "cursor", "codex", "api"],
	},
	{
		name: "fiscal_truth.evidence.read_graph",
		description: "Read Fiscal Truth evidence graph metadata in scope.",
		mode: "read_only",
		requiredScopeHeaders: ARKELYTHEX_MCP_SCOPE_HEADERS,
		returnsSensitiveData: true,
		redactionRequired: true,
		allowedSurfaces: ["claude", "chatgpt", "cursor", "codex", "api"],
	},
] as const satisfies readonly ArkelythexMcpToolContract[];

export function buildArkelythexMcpManifest(): ArkelythexMcpManifest {
	return {
		version: ARKELYTHEX_MCP_CONTRACT_VERSION,
		positioning: "fiscal_intelligence_platform_mcp",
		defaultPolicy: "deny_by_default",
		requiredScopeHeaders: ARKELYTHEX_MCP_SCOPE_HEADERS,
		tools: mcpTools,
		invariants: [
			"Public MCP is read-only by default; material fiscal writes stay behind API governance and human approval.",
			"Every tool requires organization, company, SUNAT RUC, fiscal period and user scope.",
			"Sensitive fiscal data requires redaction before leaving ARKELYTHEX surfaces.",
			"AI clients receive evidence and explanations, never direct fiscal authority.",
		],
	};
}

export function isArkelythexMcpScope(scope: ArkelythexMcpScope): boolean {
	return (
		scope.organizationId.trim().length > 0 &&
		scope.companyId.trim().length > 0 &&
		RUC.isValid(scope.companyRuc) &&
		/^\d{4}-(0[1-9]|1[0-2])$/.test(scope.period) &&
		scope.countryCode === "PE" &&
		scope.userId.trim().length > 0
	);
}

export function authorizeArkelythexMcpTool(
	input: ArkelythexMcpAuthorizationInput,
): ArkelythexMcpAuthorizationDecision {
	const tool = mcpTools.find((candidate) => candidate.name === input.toolName);
	if (!tool) return { allowed: false, reason: "TOOL_NOT_REGISTERED" };
	if (!isArkelythexMcpScope(input.scope)) return { allowed: false, reason: "INVALID_SCOPE" };
	if (tool.mode !== "read_only") return { allowed: false, reason: "WRITE_TOOLS_NOT_EXPOSED" };
	if (tool.redactionRequired && input.redactionStatus !== "passed") {
		return { allowed: false, reason: "REDACTION_FAILED" };
	}
	return { allowed: true, reason: "ALLOWED" };
}

export type ArkelythexMcpAuditOperation = "authorize" | "invoke";
export type ArkelythexMcpAuditOutcome = "allowed" | "denied" | "failed";

export interface ArkelythexMcpAuditEvent {
	operation: ArkelythexMcpAuditOperation;
	outcome: ArkelythexMcpAuditOutcome;
	toolName: string;
	scope: ArkelythexMcpScope;
	actorId: string;
	redactionStatus: ArkelythexMcpAuthorizationInput["redactionStatus"];
	reason: ArkelythexMcpAuthorizationDecision["reason"] | "MCP_INVOKE_FAILED";
	occurredAt: string;
	metadata: Record<string, unknown>;
}

export interface ArkelythexMcpAuditSink {
	append(event: ArkelythexMcpAuditEvent): Promise<void>;
}

export interface ArkelythexMcpAuditQuery {
	scope: ArkelythexMcpScope;
	limit: number;
	outcome?: ArkelythexMcpAuditOutcome;
	toolName?: string;
}

export interface ArkelythexMcpAuditReader {
	list(query: ArkelythexMcpAuditQuery): Promise<ArkelythexMcpAuditEvent[]>;
}
