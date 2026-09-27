export type WorkerScopeLevel = "organization" | "tenant" | "fiscal";
export declare function validateWorkerScope<T extends Record<string, unknown>>(scope: T, level: WorkerScopeLevel): T;
//# sourceMappingURL=scope-validator.d.ts.map