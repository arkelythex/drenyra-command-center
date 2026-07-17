import type { AgentMemoryStore } from "./agent-memory-store";
import { type SessionCondenser } from "./session-condenser";
import type { AgentMemoryContext, AgentMemoryContextQuery, AgentMemoryRecord, AgentMemoryScope, AgentMemorySearchQuery, AgentMemorySearchResult, SaveAgentMemoryInput } from "./types";
export declare class InMemoryAgentMemoryStore implements AgentMemoryStore {
    private readonly condenser;
    private readonly records;
    private sequence;
    constructor(condenser?: SessionCondenser);
    save(input: SaveAgentMemoryInput): Promise<AgentMemoryRecord>;
    search(query: AgentMemorySearchQuery): Promise<AgentMemorySearchResult[]>;
    context(query: AgentMemoryContextQuery): Promise<AgentMemoryContext>;
    getBySession(sessionId: string, scope: AgentMemoryScope): Promise<AgentMemoryRecord[]>;
}
//# sourceMappingURL=in-memory-agent-memory-store.d.ts.map