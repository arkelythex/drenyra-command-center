/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { PostgresPlatformMcpAuditSink } from "@arkelythex/infrastructure";
import { createPlatformMcpModule } from "./mcp.routes";

export { InMemoryPlatformMcpAuditSink } from "./mcp.audit";
export type { PlatformMcpAuditEvent, PlatformMcpAuditSink } from "./mcp.audit";
export { createPlatformMcpHandlers } from "./mcp.handlers";
export { createPlatformMcpModule } from "./mcp.routes";

const platformMcpAuditStore = new PostgresPlatformMcpAuditSink();

export const platformMcpModule = createPlatformMcpModule({
	auditSink: platformMcpAuditStore,
	auditReader: platformMcpAuditStore,
});
