// ─── AgentContext ──────────────────────────────────────────────────
// Snapshot from @arkelythex/agent-swarm/src/erp/types/agent-context.ts

export interface AgentContext {
	tenantId: string;
	userId: string;
	organizationId: string;
	companyId: string;
	ruc: string;
	sessionId?: string;
	traceId: string;
}
