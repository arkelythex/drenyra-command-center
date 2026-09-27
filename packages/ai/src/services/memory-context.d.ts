import type { SessionStore } from "../session";
export interface MemoryContext {
    summary: string;
    recentRuns: number;
    companyId: string;
}
export interface MemoryConfig {
    maxRuns: number;
    maxSummaryLength: number;
}
export declare class MemoryContextProvider {
    private sessionStore;
    private config;
    constructor(sessionStore: SessionStore, config?: Partial<MemoryConfig>);
    getContext(companyId: string): Promise<MemoryContext | null>;
    private formatRunSummary;
}
//# sourceMappingURL=memory-context.d.ts.map