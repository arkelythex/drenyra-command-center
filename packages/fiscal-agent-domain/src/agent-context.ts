/**
 * Agent context — scoped execution context for a fiscal agent.
 *
 * This is the Drenyra-specific context that wraps Pi sessions with
 * tenant/RUC/period information.
 */

/**
 * Scoped execution context for a fiscal agent.
 */
export interface AgentContext {
	/** Tenant (organization group) */
	tenantId: string;
	/** User requesting the action */
	userId: string;
	/** Organization within the tenant */
	organizationId: string;
	/** Company within the organization */
	companyId: string;
	/** Tax identifier (RUC for Peru) */
	ruc: string;
	/** Fiscal period, e.g. "2026-01" */
	periodo?: string;
	/** Correlation ID for tracing */
	traceId: string;
	/** Parent session ID if this is a child session */
	parentSessionId?: string;
}
