import type { MemoryContext, MemoryContextQuery, MemoryRecord, MemoryScope, MemorySearchQuery, MemorySearchResult, SaveMemoryInput } from "./types.js";
export interface SessionStore {
    save(input: SaveMemoryInput): Promise<MemoryRecord>;
    search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
    context(query: MemoryContextQuery): Promise<MemoryContext>;
    getBySession(sessionId: string, scope: MemoryScope): Promise<MemoryRecord[]>;
}
//# sourceMappingURL=session-store.d.ts.map