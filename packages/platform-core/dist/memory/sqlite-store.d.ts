import type { MemoryContext, MemoryContextQuery, MemoryRecord, MemoryScope, MemorySearchQuery, MemorySearchResult, SaveMemoryInput } from "./types.js";
import type { SessionStore } from "./session-store.js";
export interface SqliteSessionStoreOptions {
    path: string;
    condense?: (records: MemoryRecord[]) => string;
}
export declare class SqliteSessionStore implements SessionStore {
    private readonly path;
    private readonly condense;
    private readonly records;
    private sequence;
    private constructor();
    static create(options: SqliteSessionStoreOptions): Promise<SqliteSessionStore>;
    save(input: SaveMemoryInput): Promise<MemoryRecord>;
    search(query: MemorySearchQuery): Promise<MemorySearchResult[]>;
    context(query: MemoryContextQuery): Promise<MemoryContext>;
    getBySession(sessionId: string, scope: MemoryScope): Promise<MemoryRecord[]>;
    close(): void;
    private load;
    private flush;
}
//# sourceMappingURL=sqlite-store.d.ts.map