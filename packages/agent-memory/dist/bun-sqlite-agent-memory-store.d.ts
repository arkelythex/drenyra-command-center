import type { AgentMemoryStore } from "./agent-memory-store";
import { type SessionCondenser } from "./session-condenser";
import type { AgentMemoryContext, AgentMemoryContextQuery, AgentMemoryRecord, AgentMemoryScope, AgentMemorySearchQuery, AgentMemorySearchResult, SaveAgentMemoryInput } from "./types";
export interface BunSqliteAgentMemoryStoreOptions {
    path: string;
    condenser?: SessionCondenser;
}
export declare class BunSqliteAgentMemoryStore implements AgentMemoryStore {
    private readonly path;
    private readonly condenser;
    private readonly records;
    private constructor();
    static create(options: BunSqliteAgentMemoryStoreOptions): Promise<BunSqliteAgentMemoryStore>;
    save(input: SaveAgentMemoryInput): Promise<AgentMemoryRecord>;
    search(query: AgentMemorySearchQuery): Promise<AgentMemorySearchResult[]>;
    context(query: AgentMemoryContextQuery): Promise<AgentMemoryContext>;
    getBySession(sessionId: string, scope: AgentMemoryScope): Promise<AgentMemoryRecord[]>;
    close(): void;
    private load;
    private flush;
}
//# sourceMappingURL=bun-sqlite-agent-memory-store.d.ts.map