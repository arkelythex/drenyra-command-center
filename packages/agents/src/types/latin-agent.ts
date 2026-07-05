// ─── Latin Moderno Agent ID + Swarm Types ──────────────────────────
// Snapshot from @drenyra/agent-swarm/src/erp/drenyra/swarm/types.ts

import type { AgentContext } from './agent-context';

export type LatinAgentId =
	| "cerno"
	| "custos"
	| "necto"
	| "regula"
	| "lumen"
	| "fusio"
	| "scripta"
	| "capsa";

export type TaskPlanType =
	| "evidence"
	| "risk"
	| "audit"
	| "compliance"
	| "insight"
	| "integration"
	| "report"
	| "retention";

export type SwarmMode = "flat" | "hierarchy";

export interface SwarmTask {
	taskId: string;
	sessionId: string;
	targetAgent: LatinAgentId;
	intent: string;
	plan: {
		type: TaskPlanType;
		priority: 1 | 2 | 3 | 4 | 5;
		dependsOn?: string[];
		deadline?: Date;
	};
	context: SwarmContext;
	expectedOutput: string;
	traceId: string;
}

export interface SwarmContext {
	sessionId: string;
	taskId: string;
	tenant: Pick<AgentContext, "tenantId" | "companyId" | "ruc">;
	domain: string;
	traceId: string;
	contextData?: Record<string, unknown>;
}

export interface SubSwarmContext {
	parentTaskId: string;
	parentAgent: LatinAgentId;
	instruction: string;
	inputData: unknown;
	traceId: string;
}

export interface SubSwarmTask {
	subTaskId: string;
	parentTaskId: string;
	parentAgent: LatinAgentId;
	instruction: string;
	context: SubSwarmContext;
	timeout: number;
}

export interface DomainResult {
	taskId: string;
	agentId: LatinAgentId;
	status: "completed" | "error" | "escalated";
	data: unknown;
	confidence: number;
	evidence: Array<{
		source: string;
		reference: string;
		timestamp: Date;
	}>;
	spawnedSubAgents: string[];
	metrics: {
		duration: number;
		subAgentCount: number;
		retryCount: number;
	};
}

export interface SubAgentResult {
	subTaskId: string;
	status: "completed" | "error" | "timeout";
	data: unknown;
	confidence: number;
	error?: {
		code: string;
		message: string;
		recoverable: boolean;
	};
}

export interface EscalationContext {
	fromLevel: 2 | 3;
	reason:
		| "low_confidence"
		| "error"
		| "approval_required"
		| "conflict"
		| "unknown_scenario";
	task: SwarmTask | SubSwarmTask;
	partialResult?: unknown;
	suggestion?: string;
}

export interface EscalationResolution {
	action: "retry" | "skip" | "override" | "reassign" | "return_error";
	newTarget?: LatinAgentId;
	overrideData?: unknown;
	message: string;
}

export interface TaskDecompositionResult {
	subTasks: SwarmTask[];
	dag: {
		parallelGroups: string[][];
		sequentialGroups: string[][];
	};
}
