export interface Conflict {
    between: string[];
    field: string;
    values: unknown[];
    resolvedBy: string;
}
export interface MergeResult {
    success: boolean;
    data: Record<string, unknown>;
    conflicts: Conflict[];
}
export declare class ResultMerger {
    merge(results: Array<{
        domainId: string;
        data: unknown;
        confidence: number;
    }>): MergeResult;
}
//# sourceMappingURL=result-merger.d.ts.map