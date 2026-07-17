import type { MemoryContext, MemoryContextQuery, MemoryRecord, MemoryScope, MemorySearchQuery, MemorySearchResult, SaveMemoryInput } from "./types.js";
import type { SessionStore } from "./session-store.js";
export interface MemoryStoreOptions {
    condense?: (records: MemoryRecord[]) => string;
}
export declare class MemoryStore implements SessionStore {
    private readonly records;
    private sequence;
    private readonly condense;
    constructor(options?: MemoryStoreOptions);
    save(input: SaveMemoryInput): Promise<MemoryRecord>;
    search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
    context(query: MemoryContextQuery): Promise<MemoryContext>;
    getBySession(sessionId: string, scope: MemoryScope): Promise<MemoryRecord[]>;
}
//# sourceMappingURL=memory-store.d.ts.map