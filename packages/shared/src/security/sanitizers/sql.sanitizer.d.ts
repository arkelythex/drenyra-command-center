export interface SqlSanitizerOptions {
    maxLength?: number;
    strictMode?: boolean;
    additionalEscapes?: string[];
}
export interface SqlSanitizeResult {
    value: string;
    wasModified: boolean;
    injectionDetected: boolean;
    originalLength: number;
}
export declare function sanitizeSqlInput(input: unknown, options?: SqlSanitizerOptions): SqlSanitizeResult;
export declare function createSafeLikePattern(searchTerm: unknown, options?: SqlSanitizerOptions & {
    patternType?: "prefix" | "suffix" | "contains";
}): {
    pattern: string;
    isValid: boolean;
    injectionDetected: boolean;
};
//# sourceMappingURL=sql.sanitizer.d.ts.map