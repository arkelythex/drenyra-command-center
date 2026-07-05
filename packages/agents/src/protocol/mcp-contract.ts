/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { RUC } from "@drenyra/domain";

export const DRENYRA_MCP_CONTRACT_VERSION =
	"2026-05-26.mcp-surface.v1" as const;

export const DRENYRA_MCP_SCOPE_HEADERS = [
	"x-organization-id",
	"x-company-id",
	"x-company-ruc",
	"x-fiscal-period",
	"x-user-id",
] as const;

export type DrenyraMcpScopeHeader =
	(typeof DRENYRA_MCP_SCOPE_HEADERS)[number];

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
	allowedSurfaces: readonly (
		| "claude"
		| "chatgpt"
		| "cursor"
		| "codex"
		| "api"
	)[];
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
] as const satisfies readonly DrenyraMcpToolContract[];

export function buildDrenyraMcpManifest(): DrenyraMcpManifest {
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

export function isDrenyraMcpScope(scope: DrenyraMcpScope): boolean {
	return (
		scope.organizationId.trim().length > 0 &&
		scope.companyId.trim().length > 0 &&
		RUC.isValid(scope.companyRuc) &&
		/^\d{4}-(0[1-9]|1[0-2])$/.test(scope.period) &&
		scope.countryCode === "PE" &&
		scope.userId.trim().length > 0
	);
}

export function authorizeDrenyraMcpTool(
	input: DrenyraMcpAuthorizationInput,
): DrenyraMcpAuthorizationDecision {
	const tool = mcpTools.find((candidate) => candidate.name === input.toolName);
	if (!tool) return { allowed: false, reason: "TOOL_NOT_REGISTERED" };
	if (!isDrenyraMcpScope(input.scope))
		return { allowed: false, reason: "INVALID_SCOPE" };
	if (tool.mode !== "read_only")
		return { allowed: false, reason: "WRITE_TOOLS_NOT_EXPOSED" };
	if (tool.redactionRequired && input.redactionStatus !== "passed") {
		return { allowed: false, reason: "REDACTION_FAILED" };
	}
	return { allowed: true, reason: "ALLOWED" };
}

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
