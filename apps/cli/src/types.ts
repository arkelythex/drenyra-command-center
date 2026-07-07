/**
 * Shared types for Drenyra CLI.
 */

export interface AgentStepDTO {
	id: string;
	label: string;
	status: "pending" | "running" | "completed" | "failed";
	duration?: number;
}

export interface AgentSession {
	id: string;
	agentId: string;
	agentName: string;
	clientName?: string;
	period?: string;
	status: "running" | "paused" | "completed" | "failed" | "awaiting_approval";
	phase?: string;
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

export interface WorkflowStatus {
	id: string;
	name: string;
	status: "pending" | "running" | "completed" | "failed";
	currentPhase?: string;
	progress: number;
	startedAt: string;
	updatedAt: string;
}

export interface ConfigEntry {
	key: string;
	value: string;
}
