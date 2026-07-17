import type { AgentMemoryStore } from "./agent-memory-store";
import type { AgentMemoryContextQuery, AgentMemorySearchQuery, SaveAgentMemoryInput } from "./types";
export declare function createMemoryApi(store: AgentMemoryStore): {
    mem_save: (input: SaveAgentMemoryInput) => Promise<import("./types").AgentMemoryRecord>;
    mem_search: (query: AgentMemorySearchQuery) => Promise<import("./types").AgentMemorySearchResult[]>;
    mem_context: (query: AgentMemoryContextQuery) => Promise<import("./types").AgentMemoryContext>;
};
export type AgentMemoryApi = ReturnType<typeof createMemoryApi>;
//# sourceMappingURL=memory-api.d.ts.map