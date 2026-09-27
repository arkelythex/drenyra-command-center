import { z } from "zod";
declare const SandboxCapabilitySchema: z.ZodEnum<{
    "read-sdd-artifacts": "read-sdd-artifacts";
    "list-safe-checks": "list-safe-checks";
    "review-redacted-fixtures": "review-redacted-fixtures";
    "draft-proposal-spec-tasks": "draft-proposal-spec-tasks";
}>;
declare const ForbiddenSandboxCategorySchema: z.ZodEnum<{
    "production-data-access": "production-data-access";
    "sunat-ose-credential-access": "sunat-ose-credential-access";
    "fiscal-mutation": "fiscal-mutation";
    "db-mutation": "db-mutation";
    "raw-shell-execution": "raw-shell-execution";
    "wildcard-permissions": "wildcard-permissions";
}>;
declare const DataClassificationSchema: z.ZodEnum<{
    unknown: "unknown";
    synthetic: "synthetic";
    redacted: "redacted";
    production: "production";
}>;
declare const ExecutionEnvironmentSchema: z.ZodEnum<{
    production: "production";
    "engineering-sandbox": "engineering-sandbox";
    staging: "staging";
}>;
declare const CodexSandboxOperationRequestSchema: z.ZodObject<{
    operation: z.ZodString;
    dataClassification: z.ZodEnum<{
        unknown: "unknown";
        synthetic: "synthetic";
        redacted: "redacted";
        production: "production";
    }>;
    environment: z.ZodEnum<{
        production: "production";
        "engineering-sandbox": "engineering-sandbox";
        staging: "staging";
    }>;
    capabilityScope: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type SandboxCapabilityName = z.infer<typeof SandboxCapabilitySchema>;
export type ForbiddenSandboxCategory = z.infer<typeof ForbiddenSandboxCategorySchema>;
export type DataClassification = z.infer<typeof DataClassificationSchema>;
export type ExecutionEnvironment = z.infer<typeof ExecutionEnvironmentSchema>;
export type CodexSandboxOperationRequest = z.infer<typeof CodexSandboxOperationRequestSchema>;
export type SandboxDenyReasonCode = "INVALID_REQUEST" | "PRODUCTION_CONTEXT_FORBIDDEN" | "DATA_CLASSIFICATION_NOT_ALLOWED" | "CAPABILITY_NOT_ALLOWED" | "WILDCARD_PERMISSION_FORBIDDEN" | "RAW_SHELL_EXECUTION_BLOCKED" | "SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED" | "FISCAL_MUTATION_BLOCKED" | "DB_MUTATION_BLOCKED" | "PRODUCTION_DATA_ACCESS_BLOCKED";
export interface SandboxAdvisoryMetadata {
    sandboxOnly: true;
    advisoryOnly: true;
    allowedCapabilities: readonly SandboxCapabilityName[];
    forbiddenCategories: readonly ForbiddenSandboxCategory[];
    executableCommand: null;
}
export type SandboxValidationResult = {
    allowed: true;
    metadata: SandboxAdvisoryMetadata;
} | {
    allowed: false;
    reasonCode: SandboxDenyReasonCode;
    metadata: SandboxAdvisoryMetadata;
};
export declare const validateCodexSandboxOperation: (request: unknown) => SandboxValidationResult;
export declare const codexSandboxAdapter: {
    validate: (request: unknown) => SandboxValidationResult;
};
export {};
//# sourceMappingURL=sandbox-adapter.d.ts.map