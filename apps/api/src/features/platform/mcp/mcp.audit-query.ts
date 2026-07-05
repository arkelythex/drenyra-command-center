/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type {
	DrenyraMcpAuditOutcome,
	DrenyraMcpAuditQuery,
	DrenyraMcpScope,
} from "@drenyra/agents";

const auditRoles = new Set(["admin", "auditor", "owner", "compliance"]);
const outcomes = new Set<DrenyraMcpAuditOutcome>(["allowed", "denied", "failed"]);

export function canReadPlatformMcpAudit(role: string): boolean {
	return auditRoles.has(role.trim().toLowerCase());
}

export function readAuditQuery(
	scope: DrenyraMcpScope,
	query: Record<string, string | undefined>,
): DrenyraMcpAuditQuery {
	const parsedLimit = Number.parseInt(query.limit ?? "50", 10);
	const limit = Number.isFinite(parsedLimit)
		? Math.min(Math.max(parsedLimit, 1), 100)
		: 50;
	const outcome = query.outcome && outcomes.has(query.outcome as DrenyraMcpAuditOutcome)
		? (query.outcome as DrenyraMcpAuditOutcome)
		: undefined;
	const toolName = query.toolName?.trim() || undefined;
	return { scope, limit, outcome, toolName };
}
