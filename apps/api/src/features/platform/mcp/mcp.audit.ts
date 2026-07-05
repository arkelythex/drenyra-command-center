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
	DrenyraMcpAuditEvent,
	DrenyraMcpAuditQuery,
	DrenyraMcpAuditReader,
	DrenyraMcpAuditSink,
} from "@drenyra/agents";

export type PlatformMcpAuditOperation = DrenyraMcpAuditEvent["operation"];
export type PlatformMcpAuditOutcome = DrenyraMcpAuditEvent["outcome"];
export type PlatformMcpAuditEvent = DrenyraMcpAuditEvent;

export type PlatformMcpAuditSink = DrenyraMcpAuditSink;
export type PlatformMcpAuditReader = DrenyraMcpAuditReader;

export class InMemoryPlatformMcpAuditSink
	implements PlatformMcpAuditSink, PlatformMcpAuditReader
{
	private readonly events: PlatformMcpAuditEvent[] = [];

	async append(event: PlatformMcpAuditEvent): Promise<void> {
		this.events.push(event);
	}

	async list(query?: DrenyraMcpAuditQuery): Promise<PlatformMcpAuditEvent[]> {
		const events = [...this.events].reverse();
		if (!query) return events;
		return events
			.filter(
				(event) => event.scope.organizationId === query.scope.organizationId,
			)
			.filter((event) => event.scope.companyId === query.scope.companyId)
			.filter((event) => event.scope.companyRuc === query.scope.companyRuc)
			.filter((event) => event.scope.period === query.scope.period)
			.filter((event) => event.scope.countryCode === query.scope.countryCode)
			.filter((event) => !query.outcome || event.outcome === query.outcome)
			.filter((event) => !query.toolName || event.toolName === query.toolName)
			.slice(0, query.limit);
	}
}
