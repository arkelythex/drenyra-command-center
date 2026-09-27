import type { AgentContext } from "./agent-context";
import type { AgentTool } from "./agent-tool";
export type { AgentContext };
export type AgentId = "drenyra" | "operations" | "finance" | "compliance" | "system-admin";
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
    goal: string;
    context: AgentContext;
    activeAgent: AgentId;
    startedAt: Date;
    lastActivityAt: Date;
    status: "active" | "completed" | "failed" | "timeout";
    steps: Array<{
        id: string;
        domain: string;
        status: "pending" | "running" | "completed" | "failed";
        result?: unknown;
        error?: string;
        startedAt?: Date;
        completedAt?: Date;
    }>;
    metadata: Record<string, unknown>;
    history: Array<{
        role: "user" | "assistant" | "tool";
        content: string;
        toolName?: string;
        timestamp: Date;
    }>;
}
export type LatinModernoAgentId = "cerno" | "custos" | "necto" | "regula" | "lumen" | "fusio" | "scripta" | "capsa";
export type SwarmMode = "flat" | "hierarchy";
export interface DomainAgentConfig {
    id: LatinModernoAgentId;
    name: string;
    description: string;
    capabilities: string[];
    approvalRequired: boolean;
    maxRetries: number;
}
export declare const LATIN_AGENTS: Array<{
    id: LatinModernoAgentId;
    name: string;
    description: string;
    drenyraSubagent?: string;
}>;
export interface DrenyraOrchestratorOptions {
    memoryStore?: unknown;
    controlPlane?: unknown;
}
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
//# sourceMappingURL=erp-types.d.ts.map