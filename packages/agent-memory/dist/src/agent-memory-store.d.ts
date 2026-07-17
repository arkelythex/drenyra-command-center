import type { AgentMemoryContext, AgentMemoryContextQuery, AgentMemoryRecord, AgentMemoryScope, AgentMemorySearchQuery, AgentMemorySearchResult, SaveAgentMemoryInput } from "./types";
export interface AgentMemoryStore {
    save(input: SaveAgentMemoryInput): Promise<AgentMemoryRecord>;
    search(query: AgentMemorySearchQuery): Promise<AgentMemorySearchResult[]>;
    context(query: AgentMemoryContextQuery): Promise<AgentMemoryContext>;
    getBySession(sessionId: string, scope: AgentMemoryScope): Promise<AgentMemoryRecord[]>;
}
//# sourceMappingURL=agent-memory-store.d.ts.map