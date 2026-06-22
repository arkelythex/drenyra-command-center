// ─── ERP Drenyra Types ─────────────────────────────────────────────
// Snapshot from @arkelythex/agent-swarm/src/erp/drenyra/drenyra.types.ts

import type { AgentTool } from './agent-tool';
import type { AgentContext } from './agent-context';

export type AgentId =
	| "drenyra"
	| "operations"
	| "finance"
	| "compliance"
	| "system-admin";

export interface AgentDefinition {
	id: AgentId;
	name: string;
	description: string;
	systemPrompt: string;
	tools: AgentTool[];
	drenyraSubagent?: string;
}

export interface AgentIntent {
	agent: AgentId;
	tool: string;
	confidence: number;
	originalInput: string;
}

export interface AgentSession {
	id: string;
	context: AgentContext;
	activeAgent: AgentId;
	history: Array<{
		role: "user" | "assistant" | "tool";
		content: string;
		toolName?: string;
		timestamp: Date;
	}>;
}

export type LatinModernoAgentId =
	| "cerno"
	| "custos"
	| "necto"
	| "regula"
	| "lumen"
	| "fusio"
	| "scripta"
	| "capsa";

export type SwarmMode = "flat" | "hierarchy";

export interface DomainAgentConfig {
	id: LatinModernoAgentId;
	name: string;
	description: string;
	capabilities: string[];
	approvalRequired: boolean;
	maxRetries: number;
}

export const LATIN_AGENTS: Array<{
	id: LatinModernoAgentId;
	name: string;
	description: string;
	drenyraSubagent?: string;
}> = [
	{ id: "cerno", name: "Cerno", description: "Evidence discovery across fiscal sources" },
	{ id: "custos", name: "Custos", description: "Fiscal risk monitoring and detection" },
	{ id: "necto", name: "Necto", description: "Audit trail assembly and provenance" },
	{ id: "regula", name: "Regula", description: "LATAM regulatory compliance per country-pack" },
	{ id: "lumen", name: "Lumen", description: "Insights, forecasts, and executive summaries" },
	{ id: "fusio", name: "Fusio", description: "External integrations and data transfer" },
	{ id: "scripta", name: "Scripta", description: "Report generation and customer-facing narratives" },
	{ id: "capsa", name: "Capsa", description: "Evidence retention and immutable archival" },
];

export interface DrenyraOrchestratorOptions {
	memoryStore?: unknown;
	controlPlane?: unknown;
}

// SessionContext (L1 only)
export interface SessionContext {
	sessionId: string;
	conversationHistory: Array<{
		role: string;
		content: string;
		timestamp: Date;
	}>;
	tenant: AgentContext;
	traceId: string;
}
