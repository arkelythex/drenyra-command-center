/**
 * Agents Feature — DTOs for the Agents API
 *
 * Bridge between the orchestrator SessionManager and API responses.
 * These DTOs are what the frontend receives — they decouple the
 * internal session model from the wire format.
 *
 * @module features/agents/agents.types
 */

// ─── Step DTO ─────────────────────────────────────────────────────────

export interface AgentStepDTO {
	id: string;
	label: string;
	status: "pending" | "running" | "completed" | "failed";
	duration?: number;
}

// ─── Session Status DTO ───────────────────────────────────────────────

export interface AgentSessionStatusDTO {
	id: string;
	agentId: string;
	agentName: string;
	threadId?: string;
	clientName: string;
	period: string;
	status: "running" | "paused" | "completed" | "failed" | "awaiting_approval";
	phase: string;
	progress: number;
	changesProposed: number;
	evidenceCollected: number;
	elapsedMs: number;
	tokensUsed: number;
	risk: "low" | "medium" | "high" | "critical";
	requiresAction: boolean;
	lastActivity: string;
	steps: AgentStepDTO[];
}

// ─── Paginated Response ───────────────────────────────────────────────

export interface PaginatedAgentSessions {
	data: AgentSessionStatusDTO[];
	total: number;
}

// ─── Action Response ──────────────────────────────────────────────────

export interface SessionActionResponse {
	success: true;
	sessionId: string;
	status: AgentSessionStatusDTO["status"];
}
