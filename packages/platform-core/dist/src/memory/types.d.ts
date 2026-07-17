export interface SessionConfig {
    maxRecordsPerSession?: number;
    sessionTtlMs?: number;
    enableAutoCondense?: boolean;
}
export interface StoreConfig {
    backend: string;
    connectionString?: string;
    maxReadConnections?: number;
}
export interface MemoryScope {
    tenantId: string;
    metadata?: Record<string, unknown>;
}
export interface MemoryRecord {
    id: string;
    agentId: string;
    sessionId?: string;
    scope: MemoryScope;
    type: string;
    content: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface SaveMemoryInput {
    agentId: string;
    sessionId?: string;
    scope: MemoryScope;
    type: string;
    content: string;
    metadata: Record<string, unknown>;
}
export interface MemorySearchQuery {
    text: string;
    scope: MemoryScope;
    agentId?: string;
    limit?: number;
}
export interface MemorySearchResult {
    record: MemoryRecord;
    score: number;
}
export interface MemoryContextQuery {
    scope: MemoryScope;
    sessionId?: string;
    text?: string;
    limit?: number;
}
export interface MemoryContext {
    records: MemoryRecord[];
    summary: string;
}
//# sourceMappingURL=types.d.ts.map