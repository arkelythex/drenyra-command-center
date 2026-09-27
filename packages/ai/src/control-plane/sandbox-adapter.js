import { z } from "zod";
const SandboxCapabilitySchema = z.enum([
    "read-sdd-artifacts",
    "list-safe-checks",
    "review-redacted-fixtures",
    "draft-proposal-spec-tasks",
]);
const ForbiddenSandboxCategorySchema = z.enum([
    "production-data-access",
    "sunat-ose-credential-access",
    "fiscal-mutation",
    "db-mutation",
    "raw-shell-execution",
    "wildcard-permissions",
]);
const DataClassificationSchema = z.enum([
    "synthetic",
    "redacted",
    "production",
    "unknown",
]);
const ExecutionEnvironmentSchema = z.enum([
    "engineering-sandbox",
    "production",
    "staging",
]);
const nonEmpty = z.string().min(1);
const CodexSandboxOperationRequestSchema = z.object({
    operation: nonEmpty,
    dataClassification: DataClassificationSchema,
    environment: ExecutionEnvironmentSchema,
    capabilityScope: z.array(nonEmpty).min(1),
});
const ALLOWED_CAPABILITIES = SandboxCapabilitySchema.options;
const FORBIDDEN_CATEGORIES = ForbiddenSandboxCategorySchema.options;
const PRODUCTION_ONLY_DATA = [
    "production",
    "unknown",
];
const SAFE_DATA_CLASSIFICATIONS = [
    "synthetic",
    "redacted",
];
const advisoryMetadata = () => ({
    sandboxOnly: true,
    advisoryOnly: true,
    allowedCapabilities: ALLOWED_CAPABILITIES,
    forbiddenCategories: FORBIDDEN_CATEGORIES,
    executableCommand: null,
});
const hasWildcardPermissionPattern = (value) => value === "*" || value.includes("*");
const hasRawShellPattern = (value) => {
    const normalized = value.toLowerCase();
    return (normalized.includes("bash") ||
        normalized.includes("shell") ||
        normalized.includes("sh:") ||
        normalized.includes("cmd:"));
};
const hasCredentialOrSecretPattern = (value) => {
    const normalized = value.toLowerCase();
    return (normalized.includes("token") ||
        normalized.includes("secret") ||
        normalized.includes("api_key") ||
        normalized.includes("apikey") ||
        normalized.includes("credential"));
};
const hasProductionDataPattern = (value) => {
    const normalized = value.toLowerCase();
    return (normalized.includes("erp.production") ||
        normalized.startsWith("postgresql://") ||
        normalized.startsWith("postgres://") ||
        normalized.startsWith("mysql://") ||
        normalized.startsWith("mongodb://"));
};
const reasonFromCapabilityScope = (capabilityScope) => {
    for (const capability of capabilityScope) {
        if (hasRawShellPattern(capability)) {
            return "RAW_SHELL_EXECUTION_BLOCKED";
        }
        if (hasWildcardPermissionPattern(capability)) {
            return "WILDCARD_PERMISSION_FORBIDDEN";
        }
        if (hasProductionDataPattern(capability)) {
            return "PRODUCTION_DATA_ACCESS_BLOCKED";
        }
        if (hasCredentialOrSecretPattern(capability)) {
            return "SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED";
        }
    }
    return null;
};
const isUnsafeOperation = (operation) => {
    if (operation === "execute-safe-check") {
        return "RAW_SHELL_EXECUTION_BLOCKED";
    }
    if (operation.startsWith("sunat.") || operation.startsWith("ose.")) {
        return "SUNAT_OSE_CREDENTIAL_ACCESS_BLOCKED";
    }
    if (operation.startsWith("fiscal.")) {
        return "FISCAL_MUTATION_BLOCKED";
    }
    if (operation.startsWith("db.")) {
        return "DB_MUTATION_BLOCKED";
    }
    if (operation.startsWith("erp.production.")) {
        return "PRODUCTION_DATA_ACCESS_BLOCKED";
    }
    return null;
};
export const validateCodexSandboxOperation = (request) => {
    const metadata = advisoryMetadata();
    const parsed = CodexSandboxOperationRequestSchema.safeParse(request);
    if (!parsed.success) {
        return {
            allowed: false,
            reasonCode: "INVALID_REQUEST",
            metadata,
        };
    }
    const candidate = parsed.data;
    if (candidate.environment !== "engineering-sandbox") {
        return {
            allowed: false,
            reasonCode: "PRODUCTION_CONTEXT_FORBIDDEN",
            metadata,
        };
    }
    if (PRODUCTION_ONLY_DATA.includes(candidate.dataClassification)) {
        return {
            allowed: false,
            reasonCode: "DATA_CLASSIFICATION_NOT_ALLOWED",
            metadata,
        };
    }
    if (!SAFE_DATA_CLASSIFICATIONS.includes(candidate.dataClassification)) {
        return {
            allowed: false,
            reasonCode: "DATA_CLASSIFICATION_NOT_ALLOWED",
            metadata,
        };
    }
    const capabilityScopeReason = reasonFromCapabilityScope(candidate.capabilityScope);
    if (capabilityScopeReason) {
        return {
            allowed: false,
            reasonCode: capabilityScopeReason,
            metadata,
        };
    }
    if (!ALLOWED_CAPABILITIES.includes(candidate.operation)) {
        const unsafeReason = isUnsafeOperation(candidate.operation);
        if (unsafeReason) {
            return {
                allowed: false,
                reasonCode: unsafeReason,
                metadata,
            };
        }
        return {
            allowed: false,
            reasonCode: "CAPABILITY_NOT_ALLOWED",
            metadata,
        };
    }
    if (!candidate.capabilityScope.includes(candidate.operation)) {
        return {
            allowed: false,
            reasonCode: "CAPABILITY_NOT_ALLOWED",
            metadata,
        };
    }
    return {
        allowed: true,
        metadata,
    };
};
export const codexSandboxAdapter = {
    validate: validateCodexSandboxOperation,
};
//# sourceMappingURL=sandbox-adapter.js.map