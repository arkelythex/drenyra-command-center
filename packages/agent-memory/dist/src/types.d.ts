export declare const AGENT_MEMORY_TYPE: {
    readonly MESSAGE: "message";
    readonly FACT: "fact";
    readonly DECISION: "decision";
    readonly CORRECTION: "correction";
    readonly SUMMARY: "summary";
};
export type AgentMemoryType = (typeof AGENT_MEMORY_TYPE)[keyof typeof AGENT_MEMORY_TYPE];
export interface AgentMemoryScope {
    tenantId: string;
    organizationId?: string;
    companyId?: string;
    ruc?: string;
}
export interface AgentMemoryMetadata {
    confidence?: number;
    tags?: string[];
    source?: string;
    traceId?: string;
    [key: string]: unknown;
}
export interface AgentMemoryRecord {
    id: string;
    agentId: string;
    sessionId?: string;
    scope: AgentMemoryScope;
    type: AgentMemoryType;
    content: string;
    metadata: AgentMemoryMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export interface SaveAgentMemoryInput {
    agentId: string;
    sessionId?: string;
    scope: AgentMemoryScope;
    type: AgentMemoryType;
    content: string;
    metadata: AgentMemoryMetadata;
}
export interface AgentMemorySearchQuery {
    text: string;
    scope: AgentMemoryScope;
    agentId?: string;
    limit?: number;
}
export interface AgentMemorySearchResult {
    record: AgentMemoryRecord;
    score: number;
}
export interface AgentMemoryContextQuery {
    scope: AgentMemoryScope;
    sessionId?: string;
    text?: string;
    limit?: number;
}
export interface AgentMemoryContext {
    records: AgentMemoryRecord[];
    summary: string;
}
//# sourceMappingURL=types.d.ts.map