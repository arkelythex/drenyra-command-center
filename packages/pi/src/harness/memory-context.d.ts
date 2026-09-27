export type CliMemorySnapshot = {
    persistentMemory?: string;
    userContext?: string;
    memoryPct?: number;
    userPct?: number;
};
export declare function extractCliMemory(metadata?: Record<string, unknown>): CliMemorySnapshot | null;
export declare function memoryPromptBlock(snapshot: CliMemorySnapshot | null): string;
export declare function enrichSummary(base: string, snapshot: CliMemorySnapshot | null): string;
//# sourceMappingURL=memory-context.d.ts.map