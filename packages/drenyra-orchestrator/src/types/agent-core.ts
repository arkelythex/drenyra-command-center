// ─── Core Agent Types ──────────────────────────────────────────────
// Snapshots from @arkelythex/agent-swarm/src/agents/types.ts

export type AgentCapability = string;
export type AgentPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Task {
	id: string;
	type: string;
	description?: string;
	priority?: string | number;
	payload: {
		code?: string;
		content?: string;
		filePath?: string;
		files?: string[];
		description?: string;
		[key: string]: unknown;
	};
	metadata?: {
		userId?: string;
		companyId?: string;
		priority?: number;
		[key: string]: unknown;
	};
}

export interface AgentMetrics {
	duration: number;
	tokensUsed: number;
	cost: number;
}

export interface AgentResult<T = unknown> {
	success: boolean;
	data: T;
	metrics: AgentMetrics;
	agentId?: string;
	errors?: string[];
	warnings?: string[];
}

export interface AgentPort<
	TTask extends Task = Task,
	TOutput = unknown,
	TConfig = unknown,
> {
	id: string;
	name: string;
	description: string;
	capabilities: AgentCapability[];
	priority: AgentPriority;
	drenyraSubagent?: string | null;
	execute: (task: TTask, config?: TConfig) => Promise<AgentResult<TOutput>>;
}

/** @deprecated Use AgentPort for typed contracts */
export type Agent = AgentPort<Task, unknown, unknown>;

export interface AgentDefinition<
	TTask extends Task = Task,
	TOutput = unknown,
	TConfig = unknown,
> {
	id: string;
	name: string;
	description: string;
	drenyraSubagent?: string | null;
	capabilities?: AgentCapability[];
	priority?: AgentPriority;
	execute: (task: TTask, config?: TConfig) => Promise<AgentResult<TOutput>>;
}
