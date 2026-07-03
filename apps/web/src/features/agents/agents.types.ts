/**
 * Agent session types (frontend)
 *
 * Mirrors the backend DTOs for agent session monitoring
 * while decoupling from backend shape.
 */

export interface AgentStepDTO {
	id: string;
	label: string;
	status: "pending" | "running" | "completed" | "failed";
	duration?: number;
}

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

export interface AgentFilters {
	client?: string;
	period?: string;
	status?: string;
	risk?: string;
	agentType?: string;
}

export type GridMode = "grid" | "tabs";

/** Alias for friendlier consumption */
export type AgentSessionStatus = AgentSessionStatusDTO;
export type AgentStep = AgentStepDTO;

export interface PaginatedAgentSessions {
	data: AgentSessionStatus[];
	total: number;
	offset: number;
	limit: number;
}

export interface SessionActionResponse {
	success: boolean;
	message?: string;
}
